#!/usr/bin/env python3
"""planmeasure: measure a floor plan picture and build a /planlosning plan file.

One file, Pillow only, Python 3.10+. Shipped into the plan tracer's sandbox (see
setup.ts and run.ts) so the agent reads numbers from tested code instead of writing
its own measuring scripts every run. Also usable as a library: every command below
is a thin printer around a function of the same name.

    python3 planmeasure.py survey   IMG [-o DIR]            what is on the sheet + overview.png
    python3 planmeasure.py lines    IMG [x0 y0 x1 y1]       long straight dark runs: wall candidates
    python3 planmeasure.py edges    IMG x0 y0 x1 y1         stable dark bands across a box, with gaps
    python3 planmeasure.py scan     IMG --rows 700,720 --cols 300   raw dark runs along single lines
    python3 planmeasure.py scalebar IMG x0 y0 x1 y1 [--cm 500]      a scale bar's length and ticks
    python3 planmeasure.py modules  IMG x0 y0 x1 y1 --axis y [--cm 60]   equal repeated units
    python3 planmeasure.py crop     IMG x0 y0 x1 y1 [-o FILE]       enlarged crop with a pixel grid
    python3 planmeasure.py build    SPEC.json [-o plan.json]        spec -> plan.json + checks + overlay
    python3 planmeasure.py check    IMG plan.json                   the numeric checks alone
    python3 planmeasure.py overlay  IMG plan.json [-o FILE]         the overlay alone
    python3 planmeasure.py selftest                                 draws a plan and measures it back

Pixel convention, everywhere: coordinates are pixel indices in the full picture and
ranges are inclusive, "x=195-207" is 13 dark columns. A rectangle in pixels is
[x0, y0, x1, y1] with all four inclusive, exactly as the tables print them. The
origin is the first pixel inside the room: the column after the left wall's last
dark column and the row after the top wall's last dark row. `build` turns a pixel
rectangle into centimetres as x = (x0 - ox) * k, w = (x1 + 1 - x0) * k, rounding
the two edges (not the width), so rectangles that touch in pixels touch in cm.

Pictures written for looking at are at most 1000 px on the long side. A model is
billed roughly width * height / 750 tokens per picture, so that is about 1300
tokens at most, and less for the usual portrait crop; a full-size sheet costs
several times that.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from statistics import median

from PIL import Image, ImageDraw, ImageFilter, ImageFont

LOOK_PX = 1000  # long side of every picture written for a model to look at

# ---------------------------------------------------------------- the picture


def otsu(hist: list[int]) -> int | None:
    """Otsu's threshold of a 256-bin histogram, or None when there is only one level."""
    total = sum(hist)
    sum_all = sum(i * h for i, h in enumerate(hist))
    best, best_t, w0, sum0 = -1.0, None, 0, 0
    for t in range(256):
        w0 += hist[t]
        if w0 == 0:
            continue
        w1 = total - w0
        if w1 == 0:
            break
        sum0 += t * hist[t]
        between = w0 * w1 * (sum0 / w0 - (sum_all - sum0) / w1) ** 2
        if between > best:
            best, best_t = between, t
    return best_t


class Plan:
    """A picture as a dark/light mask, with fast row and column access."""

    def __init__(self, path: str, threshold: int | None = None):
        im = Image.open(path)
        im.load()
        if im.mode in ("RGBA", "LA", "P", "PA"):  # transparent means paper
            rgba = im.convert("RGBA")
            white = Image.new("RGBA", rgba.size, (255, 255, 255, 255))
            im = Image.alpha_composite(white, rgba)
        self.path = path
        self.rgb = im.convert("RGB")
        self.grey = self.rgb.convert("L")
        self.w, self.h = self.grey.size
        self.hist = self.grey.histogram()
        auto = otsu(self.hist)
        # Otsu splits ink from paper also when the walls are grey; the fixed fallback covers blank or odd pictures.
        auto = 128 if auto is None or not 40 <= auto <= 235 else auto
        # Halfway from there to the paper, so that thin anti-aliased lines (often mid-grey) still count as ink,
        # unless what that adds comes in patches rather than lines: then it is a grey floor fill, which is not ink.
        paper = max(range(auto + 1, 256), key=lambda v: self.hist[v])
        wide = (auto + paper) // 2
        added = self.grey.point([255 if auto < v <= wide else 0 for v in range(256)])
        patches = added.filter(ImageFilter.MinFilter(3)).histogram()[255] / max(1, added.histogram()[255])
        self.auto = auto if patches > 0.15 else wide
        self.threshold = self.auto if threshold is None else threshold
        lut = [1 if v <= self.threshold else 0 for v in range(256)]
        mask = self.grey.point(lut)
        data = mask.tobytes()
        self.rows = [data[y * self.w:(y + 1) * self.w] for y in range(self.h)]
        tdata = mask.transpose(Image.Transpose.TRANSPOSE).tobytes()
        self.cols = [tdata[x * self.h:(x + 1) * self.h] for x in range(self.w)]

    def box(self, box) -> tuple[int, int, int, int]:
        """A box clipped to the picture, corners in order. None is the whole picture."""
        if not box:
            return 0, 0, self.w - 1, self.h - 1
        x0, y0, x1, y1 = (int(round(v)) for v in box)
        x0, x1 = sorted((x0, x1))
        y0, y1 = sorted((y0, y1))
        x0, y0 = max(0, x0), max(0, y0)
        x1, y1 = min(self.w - 1, x1), min(self.h - 1, y1)
        if x1 < x0 or y1 < y0:
            raise SystemExit(f"error: box {box} lies outside the {self.w}x{self.h} picture")
        return x0, y0, x1, y1

    def levels(self, n: int = 4) -> list[tuple[int, float]]:
        """The picture's main grey levels as (level, share), merged over +-8."""
        total, out, used = self.w * self.h, [], [False] * 256
        for v in sorted(range(256), key=lambda i: -self.hist[i]):
            if used[v]:
                continue
            lo, hi = max(0, v - 8), min(255, v + 8)
            share = sum(self.hist[i] for i in range(lo, hi + 1) if not used[i]) / total
            for i in range(lo, hi + 1):
                used[i] = True
            if share < 0.002:
                break
            out.append((v, share))
            if len(out) == n:
                break
        return out


_RUN = re.compile(b"\x01+")


def runs(line: bytes, lo: int, hi: int, min_run: int = 1) -> list[tuple[int, int]]:
    """Dark runs (first, last) inside line[lo..hi], inclusive."""
    pat = _RUN if min_run <= 1 else re.compile(b"\x01{%d,}" % min_run)
    return [(m.start(), m.end() - 1) for m in pat.finditer(line, lo, hi + 1)]


def scan(plan: Plan, rows=(), cols=(), box=None, min_run: int = 1) -> dict:
    x0, y0, x1, y1 = plan.box(box)
    return {
        "rows": {y: runs(plan.rows[y], x0, x1, min_run) for y in rows if 0 <= y < plan.h},
        "cols": {x: runs(plan.cols[x], y0, y1, min_run) for x in cols if 0 <= x < plan.w},
    }


# ---------------------------------------------------------------- lines


def _segments(lines: list[bytes], lo: int, hi: int, a0: int, a1: int, min_len: int, tol: int) -> list[dict]:
    """
    Group dark runs of at least min_len on neighbouring scan lines into bars. `lines` are scan
    lines (rows for horizontal bars), a0..a1 the scan lines to use, lo..hi the range along them.
    A bar is {a0, a1 (scan lines, its thickness), b0, b1 (median ends along the line)}.

    A bar keeps going through a scan line whose run is longer than the bar (a window's line
    crossing a wall piece), and a long run that splits into shorter ones hands its start to
    them (a wall's outer face line running on over a window), so a filled wall piece comes
    out as one bar with its full thickness.
    """
    pat = re.compile(b"\x01{%d,}" % max(1, min_len))
    open_: list[dict] = []
    done: list[dict] = []
    for a in range(a0, a1 + 2):
        found = [(m.start(), m.end() - 1) for m in pat.finditer(lines[a], lo, hi + 1)] if a <= a1 else []
        nxt: list[dict] = []
        for seg in open_:
            seg["hit"], seg["kids"] = False, 0
        for s, e in found:
            same = next((g for g in open_ if not g["hit"] and abs(g["s"][-1] - s) <= tol and abs(g["e"][-1] - e) <= tol), None)
            if same:
                same["hit"] = True
                same["s"].append(s)
                same["e"].append(e)
            inside = [g for g in open_ if not g["hit"] and s <= g["s"][-1] + tol and g["e"][-1] - tol <= e]
            if same:
                for g in inside:
                    g["hit"] = True
                continue
            if inside:
                for g in inside:
                    g["hit"] = True
                if sum(g["e"][-1] - g["s"][-1] + 1 for g in inside) < 0.9 * (e - s + 1):
                    nxt.append({"a0": a, "s": [s], "e": [e]})
                continue
            parent = next((g for g in open_ if not g["hit"] and g["s"][-1] - tol <= s and e <= g["e"][-1] + tol), None)
            if parent:
                parent["kids"] += e - s + 1
            nxt.append({"a0": parent["a0"] if parent else a, "s": [s], "e": [e]})
        for seg in open_:
            if seg["hit"]:
                nxt.append(seg)
            elif seg["kids"] < 0.9 * (seg["e"][-1] - seg["s"][-1] + 1):
                seg["a1"] = a - 1
                done.append(seg)
        open_ = nxt
    return [{"a0": g["a0"], "a1": g["a1"], "b0": int(median(g["s"])), "b1": int(median(g["e"]))} for g in done]


def lines(plan: Plan, box=None, min_len: int | None = None, tol: int = 2, max_gap: int | None = None) -> dict:
    """
    Long straight dark runs as bars, horizontal ("H") and vertical ("V"), and pairs of thin
    parallel bars ("pairs": walls drawn as two outlines).
    Every bar is {x0, y0, x1, y1, t (thickness), len}, inclusive pixels.
    """
    x0, y0, x1, y1 = plan.box(box)
    if min_len is None:
        min_len = max(12, round(0.03 * max(x1 - x0, y1 - y0)))
    out = {"H": [], "V": [], "min_len": min_len, "box": (x0, y0, x1, y1)}
    for s in _segments(plan.rows, x0, x1, y0, y1, min_len, tol):
        out["H"].append({"x0": s["b0"], "x1": s["b1"], "y0": s["a0"], "y1": s["a1"], "t": s["a1"] - s["a0"] + 1, "len": s["b1"] - s["b0"] + 1})
    for s in _segments(plan.cols, y0, y1, x0, x1, min_len, tol):
        out["V"].append({"y0": s["b0"], "y1": s["b1"], "x0": s["a0"], "x1": s["a1"], "t": s["a1"] - s["a0"] + 1, "len": s["b1"] - s["b0"] + 1})
    # A bar thicker than it is long is the same ink as a bar of the other direction.
    for k in ("H", "V"):
        out[k] = sorted((b for b in out[k] if b["len"] >= b["t"]), key=lambda b: (b["y0"], b["x0"]) if k == "H" else (b["x0"], b["y0"]))
    out["thin"] = _thin_limit(plan, (x0, y0, x1, y1))
    if max_gap is None:
        max_gap = max(20, round(0.12 * min(x1 - x0, y1 - y0)))
    out["pairs"] = _pairs(out["H"], "H", out["thin"], max_gap) + _pairs(out["V"], "V", out["thin"], max_gap)
    return out


def _thin_limit(plan: Plan, box) -> int:
    """Bars up to this thick are drawn lines; thicker ones are filled walls. From the commonest run length, which is the pen width."""
    x0, y0, x1, y1 = box
    count: dict[int, int] = {}
    for y in range(y0, y1 + 1):
        for m in _RUN.finditer(plan.rows[y], x0, x1 + 1):
            count[m.end() - m.start()] = count.get(m.end() - m.start(), 0) + 1
    for x in range(x0, x1 + 1):
        for m in _RUN.finditer(plan.cols[x], y0, y1 + 1):
            count[m.end() - m.start()] = count.get(m.end() - m.start(), 0) + 1
    pen = max(count, key=lambda n: count[n]) if count else 1
    return min(9, max(3, 2 * pen + 1))


def _pairs(bars: list[dict], kind: str, thin: int, max_gap: int) -> list[dict]:
    """Neighbouring thin parallel bars with mostly the same extent: an outlined wall."""
    a, b0, b1 = ("y0", "x0", "x1") if kind == "H" else ("x0", "y0", "y1")
    a_end = "y1" if kind == "H" else "x1"
    thin_bars = sorted((s for s in bars if s["t"] <= thin), key=lambda s: s[a])
    out = []
    for i, p in enumerate(thin_bars):
        for q in thin_bars[i + 1:]:
            gap = q[a] - p[a_end] - 1
            if gap > max_gap:
                break
            if gap < 2:
                continue
            lo, hi = max(p[b0], q[b0]), min(p[b1], q[b1])
            if hi - lo + 1 < 0.6 * min(p["len"], q["len"]) or hi - lo + 1 < 2 * (gap + 2):
                continue
            rect = {a: p[a], a_end: q[a_end], b0: lo, b1: hi, "t": q[a_end] - p[a] + 1, "len": hi - lo + 1, "kind": kind}
            out.append(rect)
            break  # nearest partner only
    return out


# ---------------------------------------------------------------- edges


def profile(plan: Plan, box, axis: str) -> list[float]:
    """Dark share of every column (axis "x") or row (axis "y") of the box."""
    x0, y0, x1, y1 = plan.box(box)
    if axis == "x":
        n = y1 - y0 + 1
        return [plan.cols[x].count(1, y0, y1 + 1) / n for x in range(x0, x1 + 1)]
    n = x1 - x0 + 1
    return [plan.rows[y].count(1, x0, x1 + 1) / n for y in range(y0, y1 + 1)]


def edges(plan: Plan, box, axis: str = "x", share: float = 0.5) -> list[dict]:
    """
    Stable dark bands across a box: positions along `axis` where at least `share` of the box's
    depth is dark. Text and dashes never reach the share, so they drop out; the ends are what
    most of the scan lines agree on. Each band is {a, b (inclusive), size, share, gap (light
    pixels to the next band, None for the last)}.
    """
    x0, y0, x1, y1 = plan.box(box)
    prof, start = profile(plan, (x0, y0, x1, y1), axis), x0 if axis == "x" else y0
    out, i = [], 0
    while i < len(prof):
        if prof[i] >= share:
            j = i
            while j + 1 < len(prof) and prof[j + 1] >= share:
                j += 1
            out.append({"a": start + i, "b": start + j, "size": j - i + 1, "share": sum(prof[i:j + 1]) / (j - i + 1)})
            i = j + 1
        else:
            i += 1
    for k, band in enumerate(out):
        band["gap"] = out[k + 1]["a"] - band["b"] - 1 if k + 1 < len(out) else None
    return out


def modules(plan: Plan, box, axis: str, cm: float = 60.0, share: float = 0.7) -> dict:
    """
    Repeated equal units along `axis` inside a box laid over a row of kitchen units or
    wardrobes: the dividing lines are bands across the box, the units the spacings between
    them. Returns the spacings and the largest group of equal ones (within 4 % or 1.5 px).
    """
    bands = edges(plan, box, axis, share)
    centres = [(b["a"] + b["b"]) / 2 for b in bands]
    gaps = [centres[i + 1] - centres[i] for i in range(len(centres) - 1)]
    best: list[float] = []
    for g in gaps:
        group = [h for h in gaps if abs(h - g) <= max(1.5, 0.04 * g)]
        if len(group) > len(best) or (len(group) == len(best) and group and sum(group) > sum(best)):
            best = group
    unit = sum(best) / len(best) if best else None
    return {"centres": centres, "gaps": gaps, "unit": unit, "count": len(best), "cm_per_px": cm / unit if unit else None}


# ---------------------------------------------------------------- scale bar


def _ticks(plan: Plan, bar: dict, reach: int) -> list[tuple[int, int]]:
    """Columns of a horizontal bar that stick out above or below it: tick marks as (first, last)."""
    x0, x1, y0, y1 = bar["x0"], bar["x1"], bar["y0"], bar["y1"]
    need = max(2, reach // 3)
    cols = []
    for x in range(max(0, x0 - 2), min(plan.w - 1, x1 + 2) + 1):
        up = plan.cols[x].count(1, max(0, y0 - reach), y0)
        down = plan.cols[x].count(1, y1 + 1, min(plan.h, y1 + 1 + reach))
        if up >= need or down >= need:
            cols.append(x)
    out = []
    for x in cols:
        if out and x - out[-1][1] <= 1:
            out[-1] = (out[-1][0], x)
        else:
            out.append((x, x))
    return out


def scalebar(plan: Plan, box, cm: float | None = None) -> dict | None:
    """
    The scale bar inside a rough box: the longest horizontal dark run and its tick marks.
    `length` is the distance between the centres of the outermost ticks when it has ticks,
    else the bar's own length. Give `cm` (what that length stands for) to get cm_per_px.
    """
    x0, y0, x1, y1 = plan.box(box)
    found = lines(plan, (x0, y0, x1, y1), min_len=max(12, (x1 - x0) // 8))["H"]
    if not found:
        return None
    bar = max(found, key=lambda b: (b["len"], -b["t"]))
    ticks = _ticks(plan, bar, max(4, min(12, bar["len"] // 20)))
    centres = [(a + b) / 2 for a, b in ticks]
    length = centres[-1] - centres[0] if len(centres) >= 2 else float(bar["len"])
    return {
        "bar": bar, "ticks": centres, "tick_gaps": [centres[i + 1] - centres[i] for i in range(len(centres) - 1)],
        "length": length, "from_ticks": len(centres) >= 2, "cm_per_px": cm / length if cm and length else None,
    }


# ---------------------------------------------------------------- survey


def _clusters(bars: list[dict], reach: int) -> list[dict]:
    """Bars that lie within `reach` pixels of each other, as groups with a bounding box."""
    parent = list(range(len(bars)))

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    for i, p in enumerate(bars):
        for j in range(i + 1, len(bars)):
            q = bars[j]
            if p["x0"] - reach <= q["x1"] and q["x0"] - reach <= p["x1"] and p["y0"] - reach <= q["y1"] and q["y0"] - reach <= p["y1"]:
                parent[find(i)] = find(j)
    groups: dict[int, list[dict]] = {}
    for i, b in enumerate(bars):
        groups.setdefault(find(i), []).append(b)
    out = []
    for g in groups.values():
        out.append({
            "x0": min(b["x0"] for b in g), "y0": min(b["y0"] for b in g), "x1": max(b["x1"] for b in g), "y1": max(b["y1"] for b in g),
            "bars": len(g), "ink": sum(b["len"] * b["t"] for b in g), "thick": max(b["t"] for b in g),
        })
    # Groups whose boxes overlap are one drawing (a plan's halves joined only by thin or broken lines).
    # A group of a few lines is left alone: the sheet's frame overlaps everything.
    merged = True
    while merged:
        merged = False
        for i, p in enumerate(out):
            for q in out[i + 1:]:
                if min(p["bars"], q["bars"]) >= 5 and p["x0"] <= q["x1"] and q["x0"] <= p["x1"] and p["y0"] <= q["y1"] and q["y0"] <= p["y1"]:
                    p.update(x0=min(p["x0"], q["x0"]), y0=min(p["y0"], q["y0"]), x1=max(p["x1"], q["x1"]), y1=max(p["y1"], q["y1"]),
                             bars=p["bars"] + q["bars"], ink=p["ink"] + q["ink"], thick=max(p["thick"], q["thick"]))
                    out.remove(q)
                    merged = True
                    break
            if merged:
                break
    return sorted(out, key=lambda c: -c["ink"])


def survey(plan: Plan) -> dict:
    """What is on the sheet: ink levels, blocks of line work (the plan is normally the heaviest), scale bar candidates."""
    found = lines(plan, None, min_len=max(20, round(0.04 * max(plan.w, plan.h))))
    bars = found["H"] + found["V"]
    blocks = _clusters(bars, max(6, round(0.012 * max(plan.w, plan.h))))
    plan_box = blocks[0] if blocks else None
    bars_out = []
    for b in found["H"]:
        if b["t"] > 8 or b["len"] < 0.08 * plan.w or b["len"] > 0.7 * plan.w:  # not a stub, not the sheet's frame
            continue
        if plan_box and plan_box["x0"] <= b["x0"] and b["x1"] <= plan_box["x1"] and plan_box["y0"] <= b["y0"] and b["y1"] <= plan_box["y1"]:
            continue
        ticks = _ticks(plan, b, max(4, min(12, b["len"] // 20)))
        centres = [(a + c) / 2 for a, c in ticks]
        # A scale bar has a tick at each end and at least one between.
        if len(ticks) < 3 or centres[0] - b["x0"] > 2 or b["x1"] - centres[-1] > 2:
            continue
        bars_out.append({"bar": b, "ticks": centres, "length": centres[-1] - centres[0]})
    dark = sum(plan.hist[: plan.threshold + 1]) / (plan.w * plan.h)
    return {"size": (plan.w, plan.h), "threshold": plan.threshold, "dark": dark, "levels": plan.levels(), "blocks": blocks[:6], "scalebars": sorted(bars_out, key=lambda c: -c["length"])[:3]}


# ---------------------------------------------------------------- pictures to look at


def _font(size: int):
    try:
        return ImageFont.load_default(size=size)
    except TypeError:  # Pillow before 10.1
        return ImageFont.load_default()


def _step(span_px: float, target: int = 10) -> int:
    """A round grid step giving about `target` lines over span_px picture pixels."""
    raw = max(1.0, span_px / target)
    for s in (1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000):
        if s >= raw:
            return s
    return 5000


def render(plan: Plan, box=None, grid: bool = True, max_px: int = LOOK_PX, max_zoom: float = 12.0) -> tuple[Image.Image, float, tuple[int, int]]:
    """
    The box of the picture scaled to at most max_px on the long side, with a pixel grid labelled
    in full-picture coordinates. Returns (image, zoom, (x0, y0)).
    """
    x0, y0, x1, y1 = plan.box(box)
    w, h = x1 - x0 + 1, y1 - y0 + 1
    zoom = min(max_zoom, max_px / max(w, h))
    size = (max(1, round(w * zoom)), max(1, round(h * zoom)))
    out = plan.rgb.crop((x0, y0, x1 + 1, y1 + 1)).resize(size, Image.Resampling.NEAREST if zoom > 1 else Image.Resampling.LANCZOS)
    if grid:
        layer = Image.new("RGBA", size, (0, 0, 0, 0))
        d = ImageDraw.Draw(layer)
        step, font = _step(max(w, h)), _font(11)
        for x in range((x0 // step + 1) * step, x1 + 1, step):
            px = (x - x0) * zoom
            d.line([(px, 0), (px, size[1])], fill=(0, 110, 255, 110), width=1)
            d.text((px + 2, 1), str(x), fill=(0, 60, 220, 255), font=font)
        for y in range((y0 // step + 1) * step, y1 + 1, step):
            py = (y - y0) * zoom
            d.line([(0, py), (size[0], py)], fill=(0, 110, 255, 110), width=1)
            d.text((1, py + 1), str(y), fill=(0, 60, 220, 255), font=font)
        out = Image.alpha_composite(out.convert("RGBA"), layer).convert("RGB")
    return out, zoom, (x0, y0)


# ---------------------------------------------------------------- build

ID_RE = re.compile(r"^[A-Za-z0-9_-]{1,40}$")
LIMITS = {"walls": 300, "windows": 60, "fixtures": 100, "dims": 100, "labels": 100}
PREFIX = {"walls": "w", "windows": "f", "fixtures": "x", "dims": "d", "labels": "l"}


class SpecError(Exception):
    pass


def _num(v, what: str) -> float:
    if isinstance(v, bool) or not isinstance(v, (int, float)) or v != v or abs(v) == float("inf"):
        raise SpecError(f"{what}: {v!r} is not a number")
    return float(v)


def build(spec: dict, image_size: tuple[int, int] | None = None) -> dict:
    """
    A compact spec -> the plan file as a dict. Raises SpecError naming the entry and the rule.

    spec = {
      "image": path, "name": str, "area": m2 or absent,
      "origin": [ox, oy],        first pixel inside the main room at the left end of its top wall
      "cm_per_px": k,
      "units": "px" | "cm"       or per list: {"walls": "px", "dims": "cm"}; default "px"
      "walls":    [[x0, y0, x1, y1], ...]                 px: inclusive pixel corners
      "windows":  [[x0, y0, x1, y1, sill?, head?], ...]   (defaults 90, 210)
      "fixtures": [[x0, y0, x1, y1, "label", height, lift?], ...]
      "dims":     [[x1, y1, x2, y2, "text"?, flip?], ...] points; horizontal or vertical
      "labels":   [[x, y, "text"], ...]
      "extra":    {...}          anything else for `data`, in plan cm; copied as is, unchecked
    }
    In "cm" a rectangle is [x, y, w, h, ...] in plan centimetres and points are plan centimetres.
    """
    if not isinstance(spec, dict):
        raise SpecError("the spec must be a JSON object")
    k = _num(spec.get("cm_per_px"), "cm_per_px")
    if not 0.001 <= k <= 1000:
        raise SpecError(f"cm_per_px {k} is outside 0.001-1000")
    origin = spec.get("origin")
    if not isinstance(origin, list) or len(origin) != 2:
        raise SpecError("origin must be [ox, oy] in pixels")
    ox, oy = _num(origin[0], "origin x"), _num(origin[1], "origin y")
    units = spec.get("units", "px")

    def unit(name: str) -> str:
        u = units.get(name, "px") if isinstance(units, dict) else units
        if u not in ("px", "cm"):
            raise SpecError(f'units for {name} must be "px" or "cm", not {u!r}')
        return u

    def coord(v: float, what: str) -> int:
        r = round(v)
        if abs(r) > 20000:
            raise SpecError(f"{what}: {r} cm is outside +-20000")
        return r

    def rect(name: str, i: int, e: list) -> dict:
        what = f"{name}[{i}]"
        if not isinstance(e, list) or len(e) < 4:
            raise SpecError(f"{what}: needs at least four numbers, got {e!r}")
        a, b, c, d = (_num(v, what) for v in e[:4])
        if unit(name) == "px":
            if c < a or d < b:
                raise SpecError(f"{what}: [x0, y0, x1, y1] needs x1 >= x0 and y1 >= y0, got {e[:4]}")
            ex0, ey0, ex1, ey1 = (a - ox) * k, (b - oy) * k, (c + 1 - ox) * k, (d + 1 - oy) * k
        else:
            ex0, ey0, ex1, ey1 = a, b, a + c, b + d
        x, y, x2, y2 = coord(ex0, what), coord(ey0, what), coord(ex1, what), coord(ey1, what)
        w, h = x2 - x, y2 - y
        if w < 1 or h < 1:
            raise SpecError(f"{what}: comes out {w} x {h} cm; width and height must be at least 1")
        if w > 5000 or h > 5000:
            raise SpecError(f"{what}: comes out {w} x {h} cm; at most 5000")
        return {"x": x, "y": y, "w": w, "h": h}

    def point(name: str, what: str, px: float, py: float) -> tuple[int, int]:
        if unit(name) == "px":
            px, py = (px - ox) * k, (py - oy) * k
        return coord(px, what), coord(py, what)

    def text(v, limit: int, what: str) -> str:
        if not isinstance(v, str):
            raise SpecError(f"{what}: {v!r} is not text")
        if len(v) > limit:
            raise SpecError(f"{what}: {v!r} is {len(v)} characters; at most {limit}")
        return v

    def entries(name: str) -> list:
        v = spec.get(name, [])
        if not isinstance(v, list):
            raise SpecError(f"{name} must be a list")
        if len(v) > LIMITS[name]:
            raise SpecError(f"{name}: {len(v)} entries; at most {LIMITS[name]}")
        return v

    data: dict = {"v": 1}
    area = spec.get("area")
    if area is not None:
        area = _num(area, "area")
        if not 1 <= area <= 2000:
            raise SpecError(f"area {area} is outside 1-2000 m2 (leave it out when no total is stated)")
        data["area"] = round(area, 1)
    name = spec.get("name")
    if not isinstance(name, str) or not name.strip():
        raise SpecError("name is missing")
    if len(name.strip()) > 60:
        raise SpecError(f"name is {len(name.strip())} characters; at most 60")

    if image_size is None:
        if not spec.get("image"):
            raise SpecError("image (the path of the picture that was measured) is missing")
        with Image.open(spec["image"]) as im:
            image_size = im.size
    if max(image_size) > 10000:
        raise SpecError(f"the picture is {image_size[0]} x {image_size[1]} px; the planner takes at most 10000")
    ix, iy = -ox * k, -oy * k
    if abs(ix) > 20000 or abs(iy) > 20000:
        raise SpecError("the picture's placement is outside +-20000 cm: check origin and cm_per_px")
    data["image"] = {"w": image_size[0], "h": image_size[1], "cmPerPx": round(k, 5), "x": round(ix, 1), "y": round(iy, 1), "rev": 1, "calibrated": True}

    n = 0

    def next_id(name: str) -> str:
        nonlocal n
        n += 1
        return f"{PREFIX[name]}{n}"

    data["walls"] = [{"id": next_id("walls"), **rect("walls", i, e)} for i, e in enumerate(entries("walls"))]
    data["windows"] = []
    for i, e in enumerate(entries("windows")):
        r, what = rect("windows", i, e), f"windows[{i}]"
        sill = round(_num(e[4], what)) if len(e) > 4 else 90
        head = round(_num(e[5], what)) if len(e) > 5 else 210
        if not 0 <= sill <= 300 or head > 400 or head <= sill:
            raise SpecError(f"{what}: sill {sill} must be 0-300 and head {head} above it, at most 400")
        data["windows"].append({"id": next_id("windows"), **r, "sill": sill, "head": head})
    data["fixtures"] = []
    for i, e in enumerate(entries("fixtures")):
        r, what = rect("fixtures", i, e), f"fixtures[{i}]"
        if len(e) < 6:
            raise SpecError(f'{what}: needs [.., "label", height]')
        height = round(_num(e[5], what))
        if not 1 <= height <= 400:
            raise SpecError(f"{what}: height {height} is outside 1-400")
        fixture = {"id": next_id("fixtures"), **r, "label": text(e[4], 30, what), "height": height}
        if len(e) > 6 and e[6]:
            lift = round(_num(e[6], what))
            if not 0 < lift <= 300:
                raise SpecError(f"{what}: lift {lift} is outside 1-300")
            fixture["lift"] = lift
        data["fixtures"].append(fixture)
    data["dims"] = []
    for i, e in enumerate(entries("dims")):
        what = f"dims[{i}]"
        if not isinstance(e, list) or len(e) < 4:
            raise SpecError(f"{what}: needs [x1, y1, x2, y2]")
        x1, y1 = point("dims", what, _num(e[0], what), _num(e[1], what))
        x2, y2 = point("dims", what, _num(e[2], what), _num(e[3], what))
        if x1 != x2 and y1 != y2:
            raise SpecError(f"{what}: ({x1},{y1})-({x2},{y2}) cm is neither horizontal nor vertical")
        if x1 == x2 and y1 == y2:
            raise SpecError(f"{what}: has no length")
        data["dims"].append({"id": next_id("dims"), "x1": x1, "y1": y1, "x2": x2, "y2": y2, "text": text(e[4], 40, what) if len(e) > 4 else "", "flip": bool(e[5]) if len(e) > 5 else False})
    data["labels"] = []
    for i, e in enumerate(entries("labels")):
        what = f"labels[{i}]"
        if not isinstance(e, list) or len(e) < 3:
            raise SpecError(f'{what}: needs [x, y, "text"]')
        x, y = point("labels", what, _num(e[0], what), _num(e[1], what))
        data["labels"].append({"id": next_id("labels"), "x": x, "y": y, "text": text(e[2], 40, what)})
    data["items"] = []
    extra = spec.get("extra", {})
    if not isinstance(extra, dict):
        raise SpecError("extra must be an object")
    clash = sorted(set(extra) & (set(data) | {"area"}))
    if clash:
        raise SpecError(f"extra may not replace {', '.join(clash)}")
    ordered = {"v": 1, **({"area": data["area"]} if "area" in data else {}), **{key: data[key] for key in ("image", "walls", "windows", "fixtures", "dims", "labels", "items")}, **extra}
    return {"format": "riksdagen-planlosning", "name": name.strip(), "data": ordered}


def rule_errors(doc) -> list[str]:
    """Everything in a plan file the planner's parser (sanitizePlan in plan.ts) would drop or alter."""
    out: list[str] = []
    if not isinstance(doc, dict) or doc.get("format") != "riksdagen-planlosning" or not isinstance(doc.get("data"), dict):
        return ['not a plan file: needs "format": "riksdagen-planlosning" and a "data" object']
    data = doc["data"]
    name = doc.get("name")
    if not isinstance(name, str) or not name.strip() or len(name.strip()) > 60:
        out.append("name: missing or over 60 characters")
    if "image" in doc:
        out.append("the picture is embedded in the file: remove the top-level image")
    num = lambda v: isinstance(v, (int, float)) and not isinstance(v, bool) and v == v and abs(v) != float("inf")
    if "area" in data and not (num(data["area"]) and 1 <= data["area"] <= 2000):
        out.append(f"area: {data['area']!r} is not a number from 1 to 2000")
    im = data.get("image")
    if not isinstance(im, dict) or not all(num(im.get(key)) for key in ("w", "h", "cmPerPx", "x", "y")):
        out.append("image: needs numeric w, h, cmPerPx, x, y")
    else:
        if not (1 <= im["w"] <= 10000 and 1 <= im["h"] <= 10000 and 0.001 <= im["cmPerPx"] <= 1000):
            out.append("image: w/h must be 1-10000 and cmPerPx 0.001-1000")
        if im.get("calibrated") is not True:
            out.append("image: calibrated must be true")
    if data.get("items"):
        out.append("items: must be empty")
    for key, limit in LIMITS.items():
        entries = data.get(key)
        if not isinstance(entries, list):
            out.append(f"{key}: missing")
            continue
        if len(entries) > limit:
            out.append(f"{key}: {len(entries)} entries; at most {limit}")
        seen = set()
        for i, e in enumerate(entries):
            what = f"{key}[{i}]"
            if not isinstance(e, dict):
                out.append(f"{what}: not an object")
                continue
            if not isinstance(e.get("id"), str) or not ID_RE.match(e["id"]):
                out.append(f"{what}: bad id {e.get('id')!r}")
            elif e["id"] in seen:
                out.append(f"{what}: id {e['id']} is used twice")
            seen.add(e.get("id") if isinstance(e.get("id"), str) else None)
            fields = ("x1", "y1", "x2", "y2") if key == "dims" else ("x", "y") if key == "labels" else ("x", "y", "w", "h")
            if not all(num(e.get(f)) and abs(e[f]) <= 20000 for f in fields):
                out.append(f"{what}: {'/'.join(fields)} must be numbers within +-20000")
                continue
            if key in ("walls", "windows", "fixtures") and not (1 <= e["w"] <= 5000 and 1 <= e["h"] <= 5000):
                out.append(f"{what}: w and h must be 1-5000")
            if key == "windows":
                sill, head = e.get("sill"), e.get("head")
                if not (num(sill) and num(head) and 0 <= sill <= 300 and sill < head <= 400):
                    out.append(f"{what}: needs sill 0-300 and head above it, at most 400")
            if key == "fixtures":
                if not (num(e.get("height")) and 1 <= e["height"] <= 400):
                    out.append(f"{what}: height must be 1-400")
                if not isinstance(e.get("label"), str) or len(e["label"]) > 30:
                    out.append(f"{what}: label must be text of at most 30 characters")
                if "lift" in e and not (num(e["lift"]) and 0 <= e["lift"] <= 300):
                    out.append(f"{what}: lift must be 0-300")
            if key in ("dims", "labels") and (not isinstance(e.get("text"), str) or len(e["text"]) > 40):
                out.append(f"{what}: text must be at most 40 characters")
    return out


# ---------------------------------------------------------------- checking a plan against the picture


def _to_px(doc: dict) -> tuple[float, float, float]:
    im = doc["data"]["image"]
    k = im["cmPerPx"]
    return k, -im["x"] / k, -im["y"] / k


def _px_rect(r: dict, k: float, ox: float, oy: float) -> tuple[int, int, int, int]:
    """A plan rectangle as inclusive pixel corners."""
    x0, y0 = round(r["x"] / k + ox), round(r["y"] / k + oy)
    x1, y1 = round((r["x"] + r["w"]) / k + ox) - 1, round((r["y"] + r["h"]) / k + oy) - 1
    return x0, y0, max(x0, x1), max(y0, y1)


def _touch(a: dict, b: dict, slack: float = 0) -> bool:
    return a["x"] - slack <= b["x"] + b["w"] and b["x"] - slack <= a["x"] + a["w"] and a["y"] - slack <= b["y"] + b["h"] and b["y"] - slack <= a["y"] + a["h"]


def _overlap(a: dict, b: dict) -> tuple[float, float]:
    return (min(a["x"] + a["w"], b["x"] + b["w"]) - max(a["x"], b["x"]), min(a["y"] + a["h"], b["y"] + b["h"]) - max(a["y"], b["y"]))


def floor_area(doc: dict) -> dict | None:
    """
    The floor area the walls enclose, in m2. Door openings (gaps of up to 130 cm between wall
    ends in line) are closed first, then everything the outside cannot reach is floor.
    Returns {floor, with_inner_walls}, or None when the outline is not closed.
    """
    data = doc["data"]
    solid = [r for r in data["walls"] + data["windows"]]
    if not solid:
        return None
    seals = []
    for i, a in enumerate(solid):
        for b in solid[i + 1:]:
            ox, oy = _overlap(a, b)
            if oy > 0 and oy <= 60 and -130 <= ox < 0:  # side by side, a gap in x
                x = min(a["x"] + a["w"], b["x"] + b["w"])
                seals.append({"x": x, "y": max(a["y"], b["y"]), "w": -ox, "h": oy})
            if ox > 0 and ox <= 60 and -130 <= oy < 0:
                y = min(a["y"] + a["h"], b["y"] + b["h"])
                seals.append({"x": max(a["x"], b["x"]), "y": y, "w": ox, "h": -oy})
    x0 = min(r["x"] for r in solid)
    y0 = min(r["y"] for r in solid)
    x1 = max(r["x"] + r["w"] for r in solid)
    y1 = max(r["y"] + r["h"] for r in solid)
    cell = 2 if max(x1 - x0, y1 - y0) <= 2400 else 5
    gw, gh = int((x1 - x0) // cell) + 3, int((y1 - y0) // cell) + 3
    grid = bytearray(gw * gh)  # 0 free, 1 wall, 2 door seal, 3 outside, then 10 + wall index

    def paint(r: dict, value: int):
        cx0, cy0 = int((r["x"] - x0) // cell) + 1, int((r["y"] - y0) // cell) + 1
        cx1, cy1 = max(cx0, int(-(-(r["x"] + r["w"] - x0) // cell))), max(cy0, int(-(-(r["y"] + r["h"] - y0) // cell)))
        for cy in range(cy0, min(gh - 1, cy1 + 1)):
            start = cy * gw + cx0
            grid[start:start + max(0, min(gw - 1, cx1 + 1) - cx0)] = bytes([value]) * max(0, min(gw - 1, cx1 + 1) - cx0)

    for s in seals:
        paint(s, 2)
    for r in solid:
        paint(r, 1)
    stack = [0]
    grid[0] = 3
    while stack:
        p = stack.pop()
        for q in (p - 1, p + 1, p - gw, p + gw):
            if 0 <= q < gw * gh and grid[q] == 0 and abs(q % gw - p % gw) <= 1:
                grid[q] = 3
                stack.append(q)
    free = grid.count(0) + grid.count(2)
    if free * cell * cell < 0.2 * (x1 - x0) * (y1 - y0):
        return None
    # A wall is an outer wall when the outside reaches it; the others stand on the flat's own floor.
    inner = 0.0
    for r in data["walls"]:
        cx0, cy0 = int((r["x"] - x0) // cell) + 1, int((r["y"] - y0) // cell) + 1
        cx1, cy1 = max(cx0, int(-(-(r["x"] + r["w"] - x0) // cell))), max(cy0, int(-(-(r["y"] + r["h"] - y0) // cell)))
        outside = False
        for cy in range(cy0 - 1, cy1 + 2):
            row = grid[max(0, cy) * gw + max(0, cx0 - 1): max(0, cy) * gw + cx1 + 2]
            if 3 in row:
                outside = True
                break
        if not outside:
            inner += r["w"] * r["h"]
    floor = free * cell * cell / 10000
    return {"floor": floor, "with_inner_walls": floor + inner / 10000, "doors_closed": len(seals)}


def check(plan: Plan, doc: dict) -> dict:
    """
    Numeric checks of a plan file against the picture, none of which needs looking:
    rules        what the planner's parser would drop
    walls        per wall: `fill` (share of its area that is dark), `edge` (share of its two long
                 sides lying on dark, for outlined walls), `clear` (longest stretch along it with
                 no ink at all across its thickness, in cm: a wall laid over a doorway)
    bad_walls    walls that are neither filled nor edged, or have a clear stretch of 50 cm or more
    uncovered    long straight dark runs in the plan with no wall, window or fixture on them
    fixtures     fixtures inside a wall or touching nothing
    windows      windows without a wall at both ends
    area         enclosed floor area against the stated one
    """
    data = doc["data"]
    k, ox, oy = _to_px(doc)
    res: dict = {"rules": rule_errors(doc), "walls": [], "bad_walls": [], "fixtures": [], "windows": [], "uncovered": []}

    def dark_share(x0, y0, x1, y1) -> float:
        x0, y0, x1, y1 = max(0, x0), max(0, y0), min(plan.w - 1, x1), min(plan.h - 1, y1)
        if x1 < x0 or y1 < y0:
            return 0.0
        return sum(plan.rows[y].count(1, x0, x1 + 1) for y in range(y0, y1 + 1)) / ((x1 - x0 + 1) * (y1 - y0 + 1))

    for w in data["walls"]:
        x0, y0, x1, y1 = _px_rect(w, k, ox, oy)
        if x1 < 0 or y1 < 0 or x0 >= plan.w or y0 >= plan.h:
            res["walls"].append({"id": w["id"], "fill": 0.0, "edge": 0.0, "clear": 0, "px": (x0, y0, x1, y1)})
            res["bad_walls"].append(f"{w['id']}: lies outside the picture")
            continue
        horizontal = (x1 - x0) >= (y1 - y0)
        fill = dark_share(x0, y0, x1, y1)
        # The long sides: is there a drawn line within a pixel of each?
        if horizontal:
            prof_a = profile(plan, (x0, y0 - 1, x1, y0 + 1), "x")
            prof_b = profile(plan, (x0, y1 - 1, x1, y1 + 1), "x")
            across = profile(plan, (x0, y0 - 1, x1, y1 + 1), "x")
        else:
            prof_a = profile(plan, (x0 - 1, y0, x0 + 1, y1), "y")
            prof_b = profile(plan, (x1 - 1, y0, x1 + 1, y1), "y")
            across = profile(plan, (x0 - 1, y0, x1 + 1, y1), "y")
        edge = (sum(1 for v in prof_a if v > 0) + sum(1 for v in prof_b if v > 0)) / max(1, len(prof_a) + len(prof_b))
        clear = best = 0
        for v in across:
            best = best + 1 if v == 0 else 0
            clear = max(clear, best)
        entry = {"id": w["id"], "fill": fill, "edge": edge, "clear": round(clear * k), "px": (x0, y0, x1, y1)}
        res["walls"].append(entry)
        if fill < 0.25 and edge < 0.7:
            res["bad_walls"].append(f"{w['id']}: little ink under it (fill {fill:.2f}, edge {edge:.2f})")
        elif entry["clear"] >= 50:
            res["bad_walls"].append(f"{w['id']}: {entry['clear']} cm of it has no ink at all: across an opening?")
    fills = [w["fill"] for w in res["walls"]]
    res["wall_fill"] = sum(fills) / len(fills) if fills else 0.0
    res["style"] = "solid" if res["wall_fill"] >= 0.5 else "outlined"

    for f in data["fixtures"]:
        deep = 0.0
        for w in data["walls"]:
            a, b = _overlap(f, w)
            if a > 0 and b > 0:
                deep = max(deep, min(a, b))
        if deep > 3:
            res["fixtures"].append(f"{f['id']} {f.get('label', '')!r}: {round(deep)} cm inside a wall")
        elif not f.get("lift") and not any(_touch(f, o, 3) for o in data["walls"] + [g for g in data["fixtures"] if g is not f]):
            res["fixtures"].append(f"{f['id']} {f.get('label', '')!r}: touches no wall or other fixture")
    for win in data["windows"]:
        horizontal = win["w"] >= win["h"]
        ends = 0
        for w in data["walls"]:
            a, b = _overlap(win, w)
            if horizontal and b > 0 and -2 <= a <= 2:
                ends += 1
            if not horizontal and a > 0 and -2 <= b <= 2:
                ends += 1
        on_wall = sum(max(0, a) * max(0, b) for a, b in (_overlap(win, w) for w in data["walls"])) >= 0.8 * win["w"] * win["h"]
        if ends < 2 and not on_wall:
            res["windows"].append(f"{win['id']}: lies neither on a wall nor between two wall pieces")

    # Long straight ink inside the plan that nothing covers.
    shapes = [_px_rect(r, k, ox, oy) for r in data["walls"] + data["windows"] + data["fixtures"]]
    if shapes:
        bx0, by0 = min(s[0] for s in shapes) - 4, min(s[1] for s in shapes) - 4
        bx1, by1 = max(s[2] for s in shapes) + 4, max(s[3] for s in shapes) + 4
        long_px = max(12, round(50 / k))
        found = lines(plan, (bx0, by0, bx1, by1), min_len=long_px)
        total = bare = 0
        for kind in ("H", "V"):
            for b in found[kind]:
                mid = (b["y0"] + b["y1"]) // 2 if kind == "H" else (b["x0"] + b["x1"]) // 2
                lo, hi = (b["x0"], b["x1"]) if kind == "H" else (b["y0"], b["y1"])
                covered = bytearray(hi - lo + 1)
                for sx0, sy0, sx1, sy1 in shapes:
                    a0, a1, c0, c1 = (sy0, sy1, sx0, sx1) if kind == "H" else (sx0, sx1, sy0, sy1)
                    if a0 - 2 <= mid <= a1 + 2:
                        s, e = max(lo, c0 - 2), min(hi, c1 + 2)
                        if e >= s:
                            covered[s - lo:e - lo + 1] = b"\x01" * (e - s + 1)
                total += len(covered) * b["t"]
                for m in re.finditer(b"\x00+", bytes(covered)):
                    n = m.end() - m.start()
                    bare += n * b["t"]
                    if n >= long_px:
                        s, e = lo + m.start(), lo + m.end() - 1
                        res["uncovered"].append({"kind": kind, "t": b["t"], "len": n, "cm": round(n * k), "x0": s if kind == "H" else b["x0"], "x1": e if kind == "H" else b["x1"], "y0": b["y0"] if kind == "H" else s, "y1": b["y1"] if kind == "H" else e})
        res["uncovered_share"] = bare / total if total else 0.0
        res["uncovered"].sort(key=lambda u: -(u["t"] * u["len"]))
        res["thin"] = found["thin"]
    area = floor_area(doc)
    res["area"] = area
    res["stated_area"] = data.get("area")
    return res


def overlay(plan: Plan, doc: dict, max_px: int = LOOK_PX) -> Image.Image:
    """The plan painted half-transparent over its part of the picture: walls red, windows blue, fixtures green, dims orange."""
    data = doc["data"]
    k, ox, oy = _to_px(doc)
    shapes = [(_px_rect(r, k, ox, oy), kind) for kind in ("walls", "windows", "fixtures") for r in data[kind]]
    if shapes:
        pad = max(12, round(40 / k))
        box = (min(s[0][0] for s in shapes) - pad, min(s[0][1] for s in shapes) - pad, max(s[0][2] for s in shapes) + pad, max(s[0][3] for s in shapes) + pad)
    else:
        box = None
    base, zoom, (bx, by) = render(plan, box, grid=True, max_px=max_px, max_zoom=4.0)
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    colour = {"walls": (230, 30, 30), "windows": (30, 90, 240), "fixtures": (20, 160, 60)}
    for (x0, y0, x1, y1), kind in shapes:
        xy = [(x0 - bx) * zoom, (y0 - by) * zoom, (x1 + 1 - bx) * zoom - 1, (y1 + 1 - by) * zoom - 1]
        d.rectangle(xy, fill=colour[kind] + (105,), outline=colour[kind] + (255,), width=1)
    for dim in data["dims"]:
        p = [((dim[a] / k + ox - bx) * zoom, (dim[b] / k + oy - by) * zoom) for a, b in (("x1", "y1"), ("x2", "y2"))]
        d.line(p, fill=(240, 140, 0, 230), width=2)
    cx, cy = (ox - bx) * zoom, (oy - by) * zoom
    d.line([(cx - 8, cy), (cx + 8, cy)], fill=(160, 0, 200, 255), width=2)
    d.line([(cx, cy - 8), (cx, cy + 8)], fill=(160, 0, 200, 255), width=2)
    return Image.alpha_composite(base.convert("RGBA"), layer).convert("RGB")


# ---------------------------------------------------------------- printing


def _f(v: float) -> str:
    return f"{v:.1f}".rstrip("0").rstrip(".")


def _bar_rows(bars: list[dict], kind: str, limit: int) -> list[str]:
    out = []
    for b in bars[:limit]:
        if kind == "H":
            out.append(f"  y={b['y0']}-{b['y1']} t={b['t']:<3} x={b['x0']}-{b['x1']} len={b['len']}")
        else:
            out.append(f"  x={b['x0']}-{b['x1']} t={b['t']:<3} y={b['y0']}-{b['y1']} len={b['len']}")
    if len(bars) > limit:
        out.append(f"  ... {len(bars) - limit} more (raise --max or narrow the box)")
    return out


def print_lines(found: dict, limit: int = 40) -> None:
    thin = found["thin"]
    x0, y0, x1, y1 = found["box"]
    print(f"lines in x={x0}-{x1} y={y0}-{y1}, runs >= {found['min_len']} px; thick means t > {thin} (filled wall), thin is a drawn line")
    for kind, title in (("H", "horizontal"), ("V", "vertical")):
        thick = [b for b in found[kind] if b["t"] > thin]
        slim = sorted((b for b in found[kind] if b["t"] <= thin), key=lambda b: -b["len"])
        print(f"{kind} thick ({title}): {len(thick)}")
        print("\n".join(_bar_rows(thick, kind, limit)) or "  none")
        print(f"{kind} thin, longest first: {len(slim)}")
        print("\n".join(_bar_rows(slim, kind, limit)) or "  none")
    pairs = found["pairs"]
    print(f"pairs of thin parallel lines (outlined walls; t is outer to outer): {len(pairs)}")
    for p in sorted(pairs, key=lambda p: -p["len"])[:limit]:
        print(f"  {p['kind']} x={p['x0']}-{p['x1']} y={p['y0']}-{p['y1']} t={p['t']} len={p['len']}")


def print_check(res: dict, k: float) -> bool:
    """Prints the check and returns whether everything passed."""
    ok, look = True, 0
    if res["rules"]:
        ok = False
        print(f"RULES: {len(res['rules'])} broken")
        for r in res["rules"]:
            print(f"  {r}")
    else:
        print("rules: ok")
    print(f"walls: {len(res['walls'])}, drawing style {res['style']} (mean fill {res['wall_fill']:.2f})")
    print("  id    px x0,y0,x1,y1        fill edge clear_cm")
    for w in res["walls"]:
        print(f"  {w['id']:<5} {','.join(str(v) for v in w['px']):<21} {w['fill']:.2f} {w['edge']:.2f} {w['clear']}")
    for name, title in (("bad_walls", "WALLS TO FIX"), ("fixtures", "FIXTURES TO FIX"), ("windows", "WINDOWS TO FIX")):
        if res[name]:
            ok = False
            print(f"{title}: {len(res[name])}")
            for line in res[name]:
                print(f"  {line}")
    if "uncovered_share" in res:
        thick = [u for u in res["uncovered"] if u["t"] > res["thin"]]
        slim = [u for u in res["uncovered"] if u["t"] <= res["thin"]]
        print(f"uncovered long ink: {res['uncovered_share']:.0%} of the straight runs of 50 cm or more inside the plan have nothing on them")
        if thick:
            look += 1
            print(f"  LOOK, thick: a missing wall unless it is outside the flat or furniture: {len(thick)}")
            for u in thick[:12]:
                print(f"    {u['kind']} x={u['x0']}-{u['x1']} y={u['y0']}-{u['y1']} t={u['t']} {u['cm']} cm")
        if slim:
            print(f"  thin (a missing outlined wall, window or fixture; or fittings, stairs, door leaves, which is fine): {len(slim)}")
            for u in slim[:12]:
                print(f"    {u['kind']} x={u['x0']}-{u['x1']} y={u['y0']}-{u['y1']} t={u['t']} {u['cm']} cm")
    area, stated = res["area"], res["stated_area"]
    if area is None:
        print("area: the walls do not close around the flat (an opening wider than 130 cm, or a wall missing), so no floor area")
    else:
        line = f"area: floor {area['floor']:.1f} m2, with inner walls {area['with_inner_walls']:.1f} m2 ({area['doors_closed']} openings closed)"
        if stated:
            ratio = area["with_inner_walls"] / stated
            line += f"; stated {stated} m2, ratio {ratio:.2f}"
            if abs(ratio - 1) > 0.1:
                look += 1
                line += f" -> LOOK, off by more than 10 %: for the stated area the scale would be {k / ratio ** 0.5:.4f} cm/px, or rooms are missing"
        print(line)
    if ok:
        print("CHECK PASSED" + (f", with {look} thing(s) marked LOOK to settle in the overlay" if look else ""))
    else:
        print("CHECK FOUND PROBLEMS: fix what is listed under the headings in capitals and build again")
    return ok


# ---------------------------------------------------------------- command line


def _ints(text: str | None) -> list[int]:
    return [int(v) for v in text.replace(",", " ").split()] if text else []


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(prog="planmeasure", description="Measure a floor plan picture and build a plan file. Pixel ranges are inclusive.")
    sub = ap.add_subparsers(dest="cmd", required=True)

    def cmd(name: str, help_: str, image: bool = True, box: str | None = None):
        p = sub.add_parser(name, help=help_)
        if image:
            p.add_argument("image")
            p.add_argument("--threshold", type=int, help="grey level at or below which a pixel is dark (default: automatic, see survey)")
        if box:
            p.add_argument("box", nargs=box, type=int, metavar="N", help="x0 y0 x1 y1")
        return p

    p = cmd("survey", "what is on the sheet, and overview.png")
    p.add_argument("-o", "--out", default=".", help="folder for overview.png")
    p = cmd("lines", "long straight dark runs (wall candidates) as tables", box="*")
    p.add_argument("--min-len", type=int)
    p.add_argument("--max", type=int, default=40, help="rows per table")
    p = cmd("edges", "stable dark bands across a box, and the gaps between them", box=4)
    p.add_argument("--axis", choices=["x", "y", "both"], default="both")
    p.add_argument("--share", type=float, default=0.5, help="how much of the box's depth must be dark")
    p = cmd("scan", "raw dark runs along single rows and columns", box="*")
    p.add_argument("--rows")
    p.add_argument("--cols")
    p.add_argument("--min-run", type=int, default=1)
    p = cmd("scalebar", "the scale bar in a rough box", box=4)
    p.add_argument("--cm", type=float, help="what the bar's length stands for, in cm")
    p = cmd("modules", "equal repeated units (60 cm kitchen units, wardrobes) in a box", box=4)
    p.add_argument("--axis", choices=["x", "y"], required=True, help="the direction the row of units runs in")
    p.add_argument("--cm", type=float, default=60.0)
    p.add_argument("--share", type=float, default=0.7)
    p = cmd("crop", "an enlarged crop with a labelled pixel grid, to look at", box=4)
    p.add_argument("-o", "--out", default="crop.png")
    p = cmd("build", "spec.json -> plan.json, then the checks and overlay.png", image=False)
    p.add_argument("spec")
    p.add_argument("-o", "--out", default="/mnt/session/outputs/plan.json")
    p.add_argument("--overlay", default="overlay.png", help="where to write the overlay ('' for none)")
    p.add_argument("--threshold", type=int)
    p = cmd("check", "the numeric checks of a plan.json against the picture")
    p.add_argument("plan")
    p = cmd("overlay", "the plan painted over the picture, to look at")
    p.add_argument("plan")
    p.add_argument("-o", "--out", default="overlay.png")
    sub.add_parser("selftest", help="draw a small plan, measure it back, build and check it")

    a = ap.parse_args(argv)
    if a.cmd == "selftest":
        return selftest()
    if a.cmd == "build":
        try:
            with open(a.spec, encoding="utf-8") as fh:
                spec = json.load(fh)
            doc = build(spec)
        except (SpecError, json.JSONDecodeError, OSError) as err:
            print(f"BUILD FAILED, nothing written: {err}")
            return 2
        with open(a.out, "w", encoding="utf-8") as fh:
            json.dump(doc, fh, ensure_ascii=False, indent=1)
        data = doc["data"]
        if spec.get("extra"):
            print(f"copied into data unchecked: {', '.join(spec['extra'])}")
        print(f"wrote {a.out}: {len(data['walls'])} walls, {len(data['windows'])} windows, {len(data['fixtures'])} fixtures, {len(data['dims'])} dims, {len(data['labels'])} labels; {data['image']['cmPerPx']} cm/px")
        plan = Plan(spec["image"], a.threshold)
        ok = print_check(check(plan, doc), data["image"]["cmPerPx"])
        if a.overlay:
            pic = overlay(plan, doc)
            pic.save(a.overlay)
            print(f"overlay: {a.overlay} ({pic.size[0]}x{pic.size[1]}); walls red, windows blue, fixtures green, dims orange, origin purple cross")
        return 0 if ok else 1

    plan = Plan(a.image, a.threshold)
    box = getattr(a, "box", None) or None
    if box is not None and len(box) != 4:
        ap.error("a box is four numbers: x0 y0 x1 y1")

    if a.cmd == "survey":
        s = survey(plan)
        print(f"picture {s['size'][0]}x{s['size'][1]} px; dark means grey <= {s['threshold']} ({s['dark']:.1%} of the picture)")
        print("grey levels: " + ", ".join(f"{v} ({share:.1%})" for v, share in s["levels"]))
        print("blocks of line work, heaviest first (the plan is normally the first; x0 y0 x1 y1):")
        for b in s["blocks"]:
            print(f"  {b['x0']} {b['y0']} {b['x1']} {b['y1']}  {b['x1'] - b['x0'] + 1}x{b['y1'] - b['y0'] + 1} px, {b['bars']} lines, thickest {b['thick']}")
        if s["scalebars"]:
            print("scale bar candidates (a thin horizontal line with ticks, outside the first block):")
            for c in s["scalebars"]:
                b = c["bar"]
                print(f"  line x={b['x0']}-{b['x1']} y={b['y0']}-{b['y1']}; {len(c['ticks'])} ticks at x={' '.join(_f(t) for t in c['ticks'])}; first to last tick {_f(c['length'])} px")
        else:
            print("scale bar candidates: none found (look for one in the overview; a block-style bar needs `edges`)")
        pic, zoom, _ = render(plan, None, grid=True)
        path = f"{a.out.rstrip('/')}/overview.png"
        pic.save(path)
        print(f"overview: {path} ({pic.size[0]}x{pic.size[1]}, {zoom:.2f}x; grid labels are full-picture pixels)")
    elif a.cmd == "lines":
        print_lines(lines(plan, box, a.min_len), a.max)
    elif a.cmd == "edges":
        x0, y0, x1, y1 = plan.box(box)
        for axis in (["x", "y"] if a.axis == "both" else [a.axis]):
            depth = (y1 - y0 + 1) if axis == "x" else (x1 - x0 + 1)
            bands = edges(plan, box, axis, a.share)
            print(f"bands along {axis} (dark in >= {a.share:.0%} of the {depth} {'rows' if axis == 'x' else 'columns'}): {len(bands)}")
            for b in bands:
                gap = "" if b["gap"] is None else f"  then {b['gap']} light"
                print(f"  {axis}={b['a']}-{b['b']} size={b['size']} share={b['share']:.2f}{gap}")
    elif a.cmd == "scan":
        res = scan(plan, _ints(a.rows), _ints(a.cols), box, a.min_run)
        for name, key in (("row", "rows"), ("col", "cols")):
            for pos, found in res[key].items():
                print(f"{name} {pos}: " + (" ".join(f"{s}-{e}" for s, e in found) or "nothing dark"))
    elif a.cmd == "scalebar":
        s = scalebar(plan, box, a.cm)
        if not s:
            print("no horizontal line found in the box: widen it, or use `edges` for a block-style bar")
            return 1
        b = s["bar"]
        print(f"bar line x={b['x0']}-{b['x1']} y={b['y0']}-{b['y1']} (outer length {b['len']} px, {b['t']} thick)")
        if s["from_ticks"]:
            print(f"ticks at x={' '.join(_f(t) for t in s['ticks'])}")
            print(f"tick spacing: {' '.join(_f(g) for g in s['tick_gaps'])}")
            print(f"length, first to last tick centre: {_f(s['length'])} px")
        else:
            print(f"no ticks found; length is the line itself: {_f(s['length'])} px")
        if s["cm_per_px"]:
            print(f"scale: {a.cm:g} cm / {_f(s['length'])} px = {s['cm_per_px']:.4f} cm/px")
        else:
            print("give --cm N (what that length stands for) to get cm/px")
    elif a.cmd == "modules":
        m = modules(plan, box, a.axis, a.cm, a.share)
        print(f"dividing lines along {a.axis} at {' '.join(_f(c) for c in m['centres']) or 'none'}")
        print(f"spacings: {' '.join(_f(g) for g in m['gaps']) or 'none'}")
        if m["count"] >= 2:
            print(f"{m['count']} equal units of {_f(m['unit'])} px; at {a.cm:g} cm each: {m['cm_per_px']:.4f} cm/px")
        else:
            print("no two equal units here: move or widen the box, or lower --share")
    elif a.cmd == "crop":
        pic, zoom, _ = render(plan, box, grid=True)
        pic.save(a.out)
        print(f"crop: {a.out} ({pic.size[0]}x{pic.size[1]}, {zoom:.2f}x; grid labels are full-picture pixels)")
    elif a.cmd in ("check", "overlay"):
        with open(a.plan, encoding="utf-8") as fh:
            doc = json.load(fh)
        errors = rule_errors(doc)
        if errors and (not isinstance(doc, dict) or not isinstance(doc.get("data"), dict) or not isinstance(doc["data"].get("image"), dict)):
            print("RULES: " + "; ".join(errors))
            return 2
        if a.cmd == "check":
            return 0 if print_check(check(plan, doc), doc["data"]["image"]["cmPerPx"]) else 1
        pic = overlay(plan, doc)
        pic.save(a.out)
        print(f"overlay: {a.out} ({pic.size[0]}x{pic.size[1]})")
    return 0


def selftest() -> int:
    """Draws a 4 x 3 m room with a doorway, a window and a wardrobe, and checks every step finds it again."""
    import os
    import tempfile

    k = 2.0  # cm per px
    im = Image.new("RGB", (400, 320), "white")
    d = ImageDraw.Draw(im)
    for box in ((50, 40, 269, 49), (50, 40, 59, 209), (260, 40, 269, 209), (50, 200, 119, 209), (165, 200, 269, 209)):
        d.rectangle(box, fill="black")
    d.rectangle((120, 40, 179, 49), fill="white", outline="black")  # window
    d.rectangle((60, 50, 89, 79), outline="black")  # wardrobe, 60 x 60 cm
    d.line((60, 290, 259, 290), fill="black")  # 4 m scale bar
    for x in (60, 110, 160, 210, 259):
        d.line((x, 284, x, 290), fill="black")
    tmp = tempfile.mkdtemp(prefix="planmeasure-")
    path = os.path.join(tmp, "plan.png")
    im.save(path)
    plan = Plan(path)
    failures = []

    def expect(what: str, got, want):
        if got != want:
            failures.append(f"{what}: got {got}, expected {want}")

    found = lines(plan, (40, 30, 280, 220))
    thick = {(b["x0"], b["y0"], b["x1"], b["y1"]) for b in found["H"] + found["V"] if b["t"] > found["thin"]}
    for wall in ((50, 40, 59, 209), (260, 40, 269, 209), (50, 200, 119, 209), (165, 200, 269, 209)):
        expect(f"lines finds wall {wall}", wall in thick, True)
    bands = edges(plan, (50, 200, 269, 209), "x")
    expect("edges finds the doorway", [(b["a"], b["b"], b["gap"]) for b in bands], [(50, 119, 45), (165, 269, None)])
    bar = scalebar(plan, (40, 270, 280, 300), 400)
    expect("scalebar length", bar and round(bar["length"]), 199)
    spec = {
        "image": path, "name": "Självtest", "area": 12, "origin": [60, 50], "cm_per_px": k,
        "walls": [[50, 40, 119, 49], [180, 40, 269, 49], [50, 50, 59, 209], [260, 50, 269, 209], [60, 200, 119, 209], [165, 200, 259, 209]],
        "windows": [[120, 40, 179, 49]], "fixtures": [[60, 50, 89, 79, "G", 210]],
        "dims": [[60, 190, 260, 190]], "labels": [[160, 120, "RUM"]],
    }
    doc = build(spec)
    expect("build converts the wardrobe", {key: doc["data"]["fixtures"][0][key] for key in "xywh"}, {"x": 0, "y": 0, "w": 60, "h": 60})
    expect("build numbers ids", [doc["data"][key][0]["id"] for key in LIMITS], ["w1", "f7", "x8", "d9", "l10"])
    res = check(plan, doc)
    expect("check rules", res["rules"], [])
    expect("check walls", res["bad_walls"], [])
    expect("check area", res["area"] and round(res["area"]["floor"]), 12)
    blocked = build({**spec, "walls": spec["walls"][:4] + [[60, 200, 259, 209]]})
    expect("check sees a wall across the doorway", len(check(plan, blocked)["bad_walls"]), 1)
    try:
        build({**spec, "fixtures": [[60, 50, 89, 79, "G", 900]]})
        failures.append("build accepted a 900 cm high fixture")
    except SpecError:
        pass
    overlay(plan, doc).save(os.path.join(tmp, "overlay.png"))
    print(f"Pillow {Image.__version__}, Python {sys.version.split()[0]}")
    for f in failures:
        print(f"FAILED {f}")
    print("selftest ok" if not failures else f"selftest: {len(failures)} failed")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
