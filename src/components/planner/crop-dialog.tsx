"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { MAX_IMAGE_BYTES, clamp } from "@/lib/planner/plan";

export type CroppedImage = { blob: Blob; w: number; h: number };
type Crop = { x: number; y: number; w: number; h: number };
type Grip = "move" | "nw" | "ne" | "sw" | "se";

const MAX_SIDE = 2400;

/**
 * Pick the part of an uploaded picture that is the floor plan: turn it upright,
 * drag the frame around the plan. The result is cropped and shrunk here in the
 * browser, so only the small final PNG is uploaded.
 */
export function CropDialog({ file, onDone, onCancel }: { file: File; onDone: (image: CroppedImage) => void; onCancel: () => void }) {
  // The picture, already turned: cropping then happens in plain pixel coordinates.
  const [source, setSource] = useState<HTMLCanvasElement | null>(null);
  const [preview, setPreview] = useState("");
  const [crop, setCrop] = useState<Crop>({ x: 0, y: 0, w: 1, h: 1 });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const grip = useRef<{ grip: Grip; x: number; y: number; start: Crop } | null>(null);

  const show = (canvas: HTMLCanvasElement) => {
    setSource(canvas);
    setPreview(canvas.toDataURL("image/png"));
    setCrop({ x: 0, y: 0, w: canvas.width, h: canvas.height });
  };

  useEffect(() => {
    let stale = false;
    createImageBitmap(file).then((bitmap) => {
      if (stale) return;
      // Phone photos are far larger than a plan needs; working on a smaller copy keeps the dialog quick.
      const k = Math.min(1, (MAX_SIDE * 1.5) / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * k);
      canvas.height = Math.round(bitmap.height * k);
      canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      show(canvas);
    }).catch(() => { if (!stale) setError("Filen gick inte att läsa som en bild."); });
    return () => { stale = true; };
  }, [file]);

  function turn() {
    if (!source) return;
    const canvas = document.createElement("canvas");
    canvas.width = source.height;
    canvas.height = source.width;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.translate(canvas.width, 0);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(source, 0, 0);
    show(canvas);
  }

  function onPointerDown(evt: ReactPointerEvent<HTMLElement>, which: Grip) {
    evt.stopPropagation();
    evt.currentTarget.setPointerCapture(evt.pointerId);
    grip.current = { grip: which, x: evt.clientX, y: evt.clientY, start: crop };
  }
  function onPointerMove(evt: ReactPointerEvent<HTMLElement>) {
    const g = grip.current, frame = frameRef.current;
    if (!g || !source || !frame) return;
    const k = source.width / frame.getBoundingClientRect().width; // image pixels per screen pixel
    const dx = (evt.clientX - g.x) * k, dy = (evt.clientY - g.y) * k, s = g.start, min = 20;
    if (g.grip === "move") {
      setCrop({ ...s, x: clamp(s.x + dx, 0, source.width - s.w), y: clamp(s.y + dy, 0, source.height - s.h) });
      return;
    }
    let { x, y } = s, right = s.x + s.w, bottom = s.y + s.h;
    if (g.grip === "nw" || g.grip === "sw") x = clamp(s.x + dx, 0, right - min); else right = clamp(right + dx, x + min, source.width);
    if (g.grip === "nw" || g.grip === "ne") y = clamp(s.y + dy, 0, bottom - min); else bottom = clamp(bottom + dy, y + min, source.height);
    setCrop({ x, y, w: right - x, h: bottom - y });
  }

  async function finish() {
    if (!source) return;
    setBusy(true);
    try {
      // Shrink until the PNG fits the upload limit; a plan drawing is usually far below it at full size.
      for (let side = MAX_SIDE; side >= 600; side = Math.round(side * 0.75)) {
        const k = Math.min(1, side / Math.max(crop.w, crop.h));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(crop.w * k));
        canvas.height = Math.max(1, Math.round(crop.h * k));
        canvas.getContext("2d")?.drawImage(source, crop.x, crop.y, crop.w, crop.h, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/png"));
        if (blob && blob.size <= MAX_IMAGE_BYTES) {
          onDone({ blob, w: canvas.width, h: canvas.height });
          return;
        }
      }
      setError("Bilden blev för stor även efter förminskning.");
    }
    finally {
      setBusy(false);
    }
  }

  const pct = (v: number, of: number) => `${(v / of) * 100}%`;
  const corners: [Grip, string][] = [["nw", "left-0 top-0 cursor-nwse-resize"], ["ne", "left-full top-0 cursor-nesw-resize"], ["sw", "left-0 top-full cursor-nesw-resize"], ["se", "left-full top-full cursor-nwse-resize"]];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3" role="dialog" aria-modal="true" aria-label="Beskär planritningen">
      <div className="bg-white rounded-xl p-4 flex flex-col gap-3 max-w-full max-h-full">
        <div>
          <p className="text-lg font-semibold">Beskär planritningen</p>
          <p className="text-sm text-gray-600 font-normal">Vrid bilden rätt och dra ramen så att bara planlösningen är kvar. Väggarna bör ligga vågrätt och lodrätt.</p>
        </div>
        {error && <p className="text-sm text-red-700 font-normal">{error}</p>}
        {source && preview && (
          <div ref={frameRef} className="relative self-center select-none touch-none" style={{ aspectRatio: `${source.width} / ${source.height}`, width: `min(100%, calc((100dvh - 15rem) * ${source.width / source.height}))` }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- a local data URL, nothing for next/image to optimise */}
            <img src={preview} alt="" className="block size-full" draggable={false} />
            <div
              className="absolute border-2 border-white cursor-move shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"
              style={{ left: pct(crop.x, source.width), top: pct(crop.y, source.height), width: pct(crop.w, source.width), height: pct(crop.h, source.height) }}
              onPointerDown={(e) => onPointerDown(e, "move")} onPointerMove={onPointerMove} onPointerUp={() => { grip.current = null; }}
            >
              {corners.map(([which, cls]) => (
                <span key={which} className={`absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white border-2 border-orange-700 ${cls}`}
                  onPointerDown={(e) => onPointerDown(e, which)} onPointerMove={onPointerMove} onPointerUp={() => { grip.current = null; }} />
              ))}
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-2 justify-end">
          <button type="button" className="px-3 py-1.5 rounded-md border border-gray-300 bg-gray-100 font-normal mr-auto" onClick={turn} disabled={!source || busy}>⟳ Vrid 90°</button>
          <button type="button" className="px-3 py-1.5 rounded-md border border-gray-300 bg-gray-100 font-normal" onClick={onCancel} disabled={busy}>Avbryt</button>
          <button type="button" className="px-3 py-1.5 rounded-md border border-orange-700 bg-orange-700 text-white font-semibold disabled:opacity-50" onClick={() => void finish()} disabled={!source || busy}>
            {busy ? "Laddar upp…" : "Använd bilden"}
          </button>
        </div>
      </div>
    </div>
  );
}
