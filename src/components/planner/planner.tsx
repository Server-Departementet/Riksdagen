"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { Fixture, Item, ItemModel, PlanData, PlanDoc, PlanMeta, PlanResponse, PlanWindow, Rect, StackMode } from "@/lib/planner/plan";
import { COLORS, ITEM_MODELS, MAX_AREA, MAX_NAME_LENGTH, MIN_AREA, STACK_MODES, areaText, cleanName, emptyPlan, parsePlanFile, uid } from "@/lib/planner/plan";
import { dimLength, enclosedArea, isHit, parkItems, rescale, stacking, unionArea } from "@/lib/planner/geometry";
import type { StaticRef } from "@/lib/planner/edit";
import {
  addItem, duplicateItems, unpackFurniture, unpacked, findStatic, groupItems, nudgeItems, nudgeStatic, patchItems, patchStatic, removeItems, removeStatic,
  rotateItems, ungroupItems,
} from "@/lib/planner/edit";
import { copyPlan, deletePlan, fetchPlan, fetchPlans, listLocal, readLocal, removeLocal, savePlan, uploadImage, writeLocal } from "@/lib/planner/client-store";
import type { View3d } from "@/lib/planner/scene3d";
import type { Editor, Line, Mode, Tool, ViewOptions } from "@/components/planner/stage";
import { Stage } from "@/components/planner/stage";
import { Stage3d } from "@/components/planner/stage-3d";
import type { CroppedImage } from "@/components/planner/crop-dialog";
import { CropDialog } from "@/components/planner/crop-dialog";
import { TraceDialog } from "@/components/planner/trace-dialog";
import { FurnitureDialog } from "@/components/planner/furniture-dialog";
import type { FurnitureResponse } from "@/app/api/planlosning/furniture/route";
import { PlanPresence } from "@/components/planner/presence";
import type { TraceOverview, TraceStatus } from "@/lib/planner/tracer/config";
import { download, fileSlug, picture, planFile, toPng } from "@/components/planner/export";
import { Card, Check, NumField, Segments, TextField, buttonClass, inputClass, primaryClass } from "@/components/planner/controls";

/*
 * The flat planner. Every minister can open every plan; only the owner's are
 * editable.
 *
 * Saving: each edit stamps the plan with the time and writes it to this
 * browser's localStorage at once, then to the server shortly after. Whichever
 * side holds the later stamp wins, both when a plan is opened and when a save
 * reaches the server (see the API route). So an edit made offline survives a
 * reload, and a stale tab can't overwrite newer work from another device.
 */

type Sync = "loading" | "saved" | "saving" | "offline" | "error";
const SYNC_TEXT: Record<Sync, string> = {
  loading: "Hämtar…", saved: "Sparat", saving: "Sparar…",
  offline: "Ingen kontakt med servern – sparat i den här webbläsaren", error: "Kunde inte hämta planlösningen",
};

const TOOLS: readonly (readonly [Tool, string])[] = [["select", "Markera"], ["wall", "Vägg"], ["window", "Fönster"], ["fixture", "Fast inredning"], ["dim", "Mått"], ["label", "Text"]];
const TOOL_HELP: Record<Tool, string> = {
  select: "Klicka på något för att markera det. Dra för att flytta, dra i hörnen för att ändra storlek.",
  wall: "Dra ut en rektangel över varje väggbit på ritningen.",
  window: "Dra över väggen där fönstret sitter. Fönstret läggs in i väggen.",
  fixture: "Dra ut det som sitter fast: köksbänk, garderober, kyl och frys. Möbler kan inte ställas där.",
  dim: "Dra mellan två punkter för att sätta ut ett mått.",
  label: "Klicka där texten ska stå, till exempel rummets namn.",
  area: "Dra rektanglar över hela golvytan, så många som behövs. Överlapp räknas bara en gång.",
  scale: "Dra en linje längs en sträcka du vet längden på, till exempel skalstocken eller en vägg med angivet mått.",
};
const MODEL_NAMES: Record<ItemModel, string> = { "block": "Block", "table": "Bord", "chair": "Matstol", "office-chair": "Kontorsstol", "cylinder": "Cylinder" };
const STACK_NAMES: Record<StackMode, string> = { floor: "Alltid på golvet", top: "Ovanpå", under: "Under" };
// Name, own height, and height above the floor for what hangs on the wall.
const FIXTURE_PRESETS: readonly (readonly [string, number, number])[] = [["Kök", 90, 0], ["Garderob", 210, 0], ["Kyl/frys", 195, 0], ["Städskåp", 210, 0], ["Överskåp", 70, 140], ["Hatthylla", 30, 170]];

export function Planner({ me, plans, initialPlanId }: { me: { id: string; name: string }; plans: PlanMeta[]; initialPlanId: string | null }) {
  const [metas, setMetaState] = useState(plans);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [doc, setDocState] = useState<PlanDoc | null>(null);
  const [sync, setSync] = useState<Sync>("saved");
  const [undoable, setUndoable] = useState(0);

  const [mode, setMode] = useState<Mode>("furnish");
  const [tool, setTool] = useState<Tool>("select");
  const [selIds, setSelIds] = useState<string[]>([]);
  const [staticSel, setStaticSel] = useState<StaticRef | null>(null);
  const [scaleLine, setScaleLine] = useState<Line | null>(null);
  const [scaleAreas, setScaleAreas] = useState<Rect[]>([]);
  const [is3d, setIs3d] = useState(false);
  const [view3, setView3] = useState<View3d>({ yaw: -35, pitch: 48, zoom: 1, px: 0, py: 0, wallH: 130 });
  const [opts, setOpts] = useState<ViewOptions>({ snap: true, dims: true, gaps: true, overlay: false, overlayOpacity: 55, multi: false });
  const [cropFile, setCropFile] = useState<File | null>(null);
  // The AI tracer: what the server offers, the trace being followed, and the report of the last finished one.
  const [tracer, setTracer] = useState<TraceOverview | null>(null);
  const [trace, setTrace] = useState<TraceStatus | null>(null);
  const [traceDialog, setTraceDialog] = useState(false);
  const [traceReport, setTraceReport] = useState("");
  // "Mina möbler": the minister's own furniture, unpacked into their plans.
  const [furniture, setFurniture] = useState<Item[]>([]);
  const [furnitureDialog, setFurnitureDialog] = useState(false);
  const [copying, setCopying] = useState(false);

  // The latest values, for timers and for handlers that run several times between renders.
  const docRef = useRef<PlanDoc | null>(null);
  const idRef = useRef<string | null>(null);
  const metasRef = useRef(plans);
  const dirty = useRef(false);
  const history = useRef<PlanData[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const stage2d = useRef<SVGSVGElement>(null), stage3d = useRef<SVGSVGElement>(null);
  const imageInput = useRef<HTMLInputElement>(null), fileInput = useRef<HTMLInputElement>(null);

  const setDoc = (d: PlanDoc | null) => { docRef.current = d; setDocState(d); };
  const setMetas = (next: PlanMeta[]) => { metasRef.current = next; setMetaState(next); };
  const isMine = (id: string | null) => metasRef.current.find((m) => m.id === id)?.ownerId === me.id;
  const touchMeta = (id: string, name: string, editedAt: number) =>
    setMetas(metasRef.current.map((m) => (m.id === id ? { ...m, name, editedAt } : m)));
  const clearEditing = () => {
    history.current = []; setUndoable(0);
    setSelIds([]); setStaticSel(null); setScaleLine(null); setScaleAreas([]);
  };

  // ---------- saving

  const schedule = (ms: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { if (idRef.current) void push(idRef.current); }, ms);
  };

  /** Take the server's version of the open plan. */
  function adopt(remote: PlanResponse) {
    const d = { name: remote.name, data: remote.data, editedAt: remote.editedAt };
    setDoc(d);
    dirty.current = false;
    history.current = []; setUndoable(0);
    if (remote.ownerId === me.id) writeLocal(remote.id, { ...d, ownerId: me.id, dirty: false });
    touchMeta(remote.id, remote.name, remote.editedAt);
    setSync("saved");
  }

  /** Send a plan's unsaved edits to the server. False when the server couldn't be reached. */
  async function pushOnce(id: string): Promise<boolean> {
    const open = () => idRef.current === id;
    const local = open() ? null : readLocal(id);
    const d = open() ? (dirty.current ? docRef.current : null) : (local?.dirty ? local : null);
    if (!d) return true;
    let res: Awaited<ReturnType<typeof savePlan>>;
    try {
      res = await savePlan(id, { name: d.name, data: d.data, editedAt: d.editedAt });
    }
    catch {
      if (open()) { setSync("offline"); schedule(10_000); }
      return false;
    }
    const latest = open() ? docRef.current : null;
    if (res.status === "conflict") {
      // The server holds a later edit from another device. It wins, unless this browser has edited again since.
      if (latest && latest.editedAt > res.plan.editedAt) schedule(300);
      else if (latest) { adopt(res.plan); clearEditing(); toast.info("En nyare version från en annan enhet har hämtats."); }
      else writeLocal(id, { name: res.plan.name, data: res.plan.data, editedAt: res.plan.editedAt, ownerId: me.id, dirty: false });
      return true;
    }
    if (!latest) writeLocal(id, { name: d.name, data: d.data, editedAt: d.editedAt, ownerId: me.id, dirty: false });
    else if (latest.editedAt === d.editedAt) {
      dirty.current = false;
      writeLocal(id, { ...latest, ownerId: me.id, dirty: false });
      setSync("saved");
    }
    else schedule(300); // edited again while the save was on its way
    return true;
  }
  // One save at a time, so they reach the server in the order they were made.
  const push = (id: string): Promise<boolean> => {
    const run = queue.current.then(() => pushOnce(id));
    queue.current = run.catch(() => undefined);
    return run;
  };

  /** Keep an edited plan: in this browser now, on the server in a moment. */
  function persist(d: PlanDoc) {
    const id = idRef.current;
    if (!id) return;
    dirty.current = true;
    writeLocal(id, { ...d, ownerId: me.id, dirty: true });
    touchMeta(id, d.name, d.editedAt);
    setSync("saving");
    schedule(700);
  }
  // Never earlier than the version being edited, even if this device's clock runs slow.
  const stamp = (d: PlanDoc) => Math.max(Date.now(), d.editedAt + 1);

  const editor: Editor = {
    checkpoint() {
      const d = docRef.current;
      if (!d) return;
      history.current.push(d.data);
      if (history.current.length > 100) history.current.shift();
      setUndoable(history.current.length);
    },
    setPlan(next, save) {
      const d = docRef.current;
      if (!d || !isMine(idRef.current)) return;
      const edited = { ...d, data: next, editedAt: save ? stamp(d) : d.editedAt };
      setDoc(edited);
      if (save) persist(edited);
    },
    save() {
      const d = docRef.current;
      if (!d || !isMine(idRef.current)) return;
      const edited = { ...d, editedAt: stamp(d) };
      setDoc(edited);
      persist(edited);
    },
  };
  /** One undoable change to the plan. */
  const change = (fn: (plan: PlanData) => PlanData) => {
    const d = docRef.current;
    if (!d) return;
    editor.checkpoint();
    editor.setPlan(fn(d.data), true);
  };
  function undo() {
    const prev = history.current.pop();
    if (!prev) return;
    setUndoable(history.current.length);
    editor.setPlan(prev, true);
  }

  // ---------- opening plans

  function show(id: string | null) {
    const before = idRef.current;
    if (before && before !== id && dirty.current) { clearTimeout(timer.current); void push(before); }
    idRef.current = id;
    setCurrentId(id);
    clearEditing();
    setMode("furnish"); setTool("select");
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("plan", id); else url.searchParams.delete("plan");
    window.history.replaceState(null, "", url);
  }

  /** The open plan no longer exists on the server: forget it and show another. */
  function gone(id: string) {
    removeLocal(id);
    const rest = metasRef.current.filter((m) => m.id !== id);
    setMetas(rest);
    const next = rest.find((m) => m.ownerId === me.id) ?? rest[0];
    if (next) void open(next.id);
    else { show(null); setDoc(null); }
  }

  async function open(id: string) {
    show(id);
    // Our own plans open at once from this browser's copy while the server is asked.
    const local = isMine(id) ? readLocal(id) : null;
    setDoc(local);
    dirty.current = !!local?.dirty;
    setSync("loading");
    let remote: PlanResponse | null;
    try {
      remote = await fetchPlan(id);
    }
    catch {
      if (idRef.current === id) setSync(docRef.current ? "offline" : "error");
      return;
    }
    if (idRef.current !== id) return;
    const mine = docRef.current;
    if (!remote) {
      if (mine && dirty.current) { setSync("saving"); schedule(0); } // made here, not on the server yet
      else { gone(id); toast.info("Planlösningen finns inte längre."); }
      return;
    }
    if (mine && dirty.current && mine.editedAt > remote.editedAt) { setSync("saving"); schedule(0); }
    else adopt(remote);
  }

  /** Coming back to the tab: pick up plans and edits made elsewhere in the meantime. */
  /** What the AI tracer offers this minister, and any trace of theirs that is still running. */
  async function loadTracer() {
    try {
      const res = await fetch("/api/planlosning/trace", { cache: "no-store" });
      if (!res.ok) return;
      const overview = await res.json() as TraceOverview;
      setTracer(overview);
      if (overview.active) setTrace(overview.active);
    }
    catch { /* offline: the button just stays hidden */ }
  }

  // Follow a running trace. It takes minutes, so the server is asked every few seconds until it is over.
  const followingId = trace?.status === "running" ? trace.id : null;
  useEffect(() => {
    if (!followingId) return;
    const timer = setInterval(() => {
      void (async () => {
        try {
          const res = await fetch(`/api/planlosning/trace/${followingId}`, { cache: "no-store" });
          if (!res.ok) return;
          const next = await res.json() as TraceStatus;
          setTrace(next);
          if (next.status === "running") return;
          void loadTracer();
          await refresh();
          if (next.status === "done") {
            setTraceReport(next.note);
            if (metasRef.current.some((m) => m.id === next.planId)) void open(next.planId);
          }
          else toast.error(next.note || "Ritningen kunde inte ritas av.", { duration: 15_000 });
        }
        catch { /* a missed poll; the next one will do */ }
      })();
    }, 4000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restarts only when another trace is followed; the rest reads refs
  }, [followingId]);

  async function refresh() {
    try {
      const list = await fetchPlans();
      const unsynced = metasRef.current.filter((m) => m.ownerId === me.id && !list.some((l) => l.id === m.id) && readLocal(m.id)?.dirty);
      setMetas([...unsynced, ...list]);
      const id = idRef.current;
      if (!id || dirty.current) return;
      const remote = await fetchPlan(id);
      if (idRef.current !== id || dirty.current) return;
      if (!remote) { gone(id); return; }
      if (remote.editedAt > (docRef.current?.editedAt ?? 0)) { adopt(remote); clearEditing(); }
    }
    catch { /* offline: keep what we have */ }
  }

  useEffect(() => {
    // Plans made in this browser that never reached the server join the list; local copies of deleted plans go.
    let list = plans;
    for (const { id, plan } of listLocal()) {
      if (plan.ownerId !== me.id || list.some((m) => m.id === id)) continue;
      if (plan.dirty) list = [{ id, name: plan.name, ownerId: me.id, ownerName: me.name, editedAt: plan.editedAt }, ...list];
      else removeLocal(id);
    }
    setMetas(list);
    const first = list.find((m) => m.id === initialPlanId) ?? list.find((m) => m.ownerId === me.id) ?? list[0];
    if (first) void open(first.id);
    void loadTracer();
    void fetch("/api/planlosning/furniture", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() as Promise<FurnitureResponse> : null))
      .then((body) => { if (body) setFurniture(body.items); })
      .catch(() => undefined); // offline: the unpack button just stays away

    const onVisibility = () => {
      if (document.visibilityState === "visible") void refresh();
      else if (idRef.current && dirty.current) { clearTimeout(timer.current); void push(idRef.current); }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { document.removeEventListener("visibilitychange", onVisibility); clearTimeout(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once; everything used reads refs
  }, []);

  // ---------- plans as a whole

  function create(name: string, data: PlanData): string {
    const id = uid();
    setMetas([{ id, name, ownerId: me.id, ownerName: me.name, editedAt: Date.now() }, ...metasRef.current]);
    show(id);
    const d = { name, data, editedAt: Date.now() };
    setDoc(d);
    persist(d);
    return id;
  }

  /** Replace "Mina möbler". Shown at once; the server copy follows. */
  function saveFurniture(next: Item[]) {
    const before = furniture;
    setFurniture(next);
    fetch("/api/planlosning/furniture", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ items: next }) })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setFurniture(((await res.json()) as FurnitureResponse).items);
      })
      .catch(() => { setFurniture(before); toast.error("Kunde inte spara Mina möbler. Försök igen."); });
  }

  /** Put the pieces of "Mina möbler" that the open plan lacks into its parking box. */
  function unpack() {
    const d = docRef.current;
    if (!d || !isMine(idRef.current)) return;
    const result = unpackFurniture(d.data, furniture);
    if (!result.ids.length) return;
    editor.checkpoint();
    editor.setPlan(result.plan, true);
    setSelIds(result.ids);
    setMode("furnish"); setIs3d(false);
  }

  function createEmpty() {
    // Start with the furniture you already have, unplaced: "Mina möbler" when there is such a list, else whatever an earlier plan holds.
    const donor = furniture.length ? { items: furniture } : docRef.current && isMine(idRef.current)
      ? docRef.current.data
      : metasRef.current.filter((m) => m.ownerId === me.id).map((m) => readLocal(m.id)?.data).find((d) => d?.items.length);
    const data = emptyPlan();
    data.items = (donor?.items ?? []).map(({ g: _g, ...it }) => ({ ...it }));
    parkItems(data, data.items);
    create("Ny planlösning", data);
    setMode("draw");
  }

  async function remove() {
    const id = idRef.current, d = docRef.current;
    if (!id || !d || !isMine(id) || !confirm(`Ta bort "${d.name}"? Det går inte att ångra.`)) return;
    clearTimeout(timer.current);
    dirty.current = false;
    try {
      await queue.current;
      await deletePlan(id);
    }
    catch {
      toast.error("Kunde inte ta bort planlösningen. Försök igen när servern går att nå.");
      return;
    }
    gone(id);
  }

  /** Upload a plan image for the open plan. The plan itself has to be on the server first. */
  async function sendImage(id: string, blob: Blob): Promise<boolean> {
    try {
      if (!await push(id)) return false;
      await uploadImage(id, blob);
      return true;
    }
    catch {
      return false;
    }
  }

  async function acceptCropped(img: CroppedImage) {
    setCropFile(null);
    const id = idRef.current;
    if (!id) return;
    const sending = toast.loading("Laddar upp bilden…");
    const ok = await sendImage(id, img.blob);
    toast.dismiss(sending);
    if (!ok) { toast.error("Kunde inte ladda upp bilden. Försök igen."); return; }
    if (idRef.current !== id) return;
    change((plan) => {
      const old = plan.image;
      // A replacement keeps the old picture's place and real-world width; a first picture is assumed to be 10 m wide until the scale is set.
      const cmPerPx = old ? (old.w * old.cmPerPx) / img.w : 1000 / img.w;
      return { ...plan, image: { w: img.w, h: img.h, cmPerPx, x: old?.x ?? 0, y: old?.y ?? 0, rev: Date.now(), calibrated: false } };
    });
    setMode("draw"); setTool("scale"); setIs3d(false);
    toast.success("Bilden är uppladdad. Sätt skalan härnäst.");
  }

  /** Copy the open plan, whoever owns it, into a new plan of this minister's own, and open that. */
  async function copy() {
    const id = idRef.current;
    if (!id || copying) return;
    const own = isMine(id), owner = metasRef.current.find((m) => m.id === id)?.ownerName;
    setCopying(true);
    try {
      // The server copies what it has stored, so our own unsaved edits have to get there first.
      if (own) {
        clearTimeout(timer.current);
        if (!await push(id)) throw new Error("offline");
      }
      const res = await copyPlan(id);
      if (res.status === "full") { toast.error("Du har redan så många planlösningar som får plats. Ta bort någon först."); return; }
      if (res.status === "missing") { toast.error("Planlösningen finns inte längre."); void refresh(); return; }
      const made = res.plan;
      // Listed before it is opened: open() goes by the list to tell that the copy is ours to edit.
      setMetas([{ id: made.id, name: made.name, ownerId: me.id, ownerName: me.name, editedAt: made.editedAt }, ...metasRef.current.filter((m) => m.id !== made.id)]);
      void open(made.id);
      toast.success(own ? "Kopian är skapad." : `Kopian är din. ${owner ?? "Ägaren"}s möbler följde inte med – ställ in dina egna med Packa upp mina möbler.`);
    }
    catch {
      toast.error("Kunde inte kopiera planlösningen. Försök igen.");
    }
    finally {
      setCopying(false);
    }
  }

  async function importFile(file: File) {
    let parsed: ReturnType<typeof parsePlanFile> = null;
    try { parsed = parsePlanFile(JSON.parse(await file.text())); }
    catch { /* not JSON */ }
    if (!parsed) { toast.error("Filen är inte en exporterad planlösning."); return; }
    const image = parsed.data.image;
    const id = create(parsed.name, { ...parsed.data, image: null });
    if (!parsed.image || !image) return;
    const blob = await fetch(parsed.image).then((r) => r.blob()).catch(() => null);
    if (!blob || !await sendImage(id, blob)) { toast.error("Planlösningen importerades, men bilden kunde inte laddas upp."); return; }
    if (idRef.current !== id || !docRef.current) return;
    editor.setPlan({ ...docRef.current.data, image: { ...image, rev: Date.now() } }, true);
  }

  async function exportFile() {
    const id = idRef.current, d = docRef.current;
    if (!id || !d) return;
    try {
      download(`${fileSlug(d.name)}.json`, new Blob([JSON.stringify(await planFile(id, d.name, d.data))], { type: "application/json" }));
    }
    catch {
      toast.error("Kunde inte exportera planlösningen.");
    }
  }

  async function exportPicture(format: "png" | "svg") {
    const svg = (is3d ? stage3d : stage2d).current, d = docRef.current;
    if (!svg || !d) return;
    const pic = picture(svg, d.data, is3d), name = `${fileSlug(d.name)}-${is3d ? "3d" : "2d"}.${format}`;
    try {
      download(name, format === "svg" ? new Blob([pic.svg], { type: "image/svg+xml" }) : await toPng(pic));
    }
    catch (err) {
      toast.error(`Exporten misslyckades: ${err instanceof Error ? err.message : "okänt fel"}`);
    }
  }

  // ---------- derived

  const plan = doc?.data ?? null;
  const meta = metas.find((m) => m.id === currentId) ?? null;
  const mine = meta?.ownerId === me.id;
  const sel = useMemo(() => new Set(selIds), [selIds]);
  const chosen = plan ? plan.items.filter((i) => sel.has(i.id)) : [];
  const one = chosen.length === 1 ? chosen[0] : undefined;
  const picked = plan ? findStatic(plan, staticSel) : null;
  const drawing = mine && mode === "draw";

  useEffect(() => {
    const onKey = (evt: KeyboardEvent) => {
      if (!plan || !mine || cropFile) return;
      if ((evt.ctrlKey || evt.metaKey) && evt.key.toLowerCase() === "z") { evt.preventDefault(); undo(); return; }
      if ((evt.target as Element | null)?.matches?.("input, textarea, select") || evt.ctrlKey || evt.metaKey) return;
      const step = evt.shiftKey ? 10 : 1, k = evt.key.length === 1 ? evt.key.toLowerCase() : evt.key;
      const arrows: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      const arrow = arrows[k];
      if (drawing) {
        if (k === "Escape") { setStaticSel(null); setScaleLine(null); setScaleAreas([]); setTool("select"); }
        else if (!staticSel || !picked) return;
        else if (k === "Delete" || k === "Backspace") { change((p) => removeStatic(p, staticSel)); setStaticSel(null); }
        else if (arrow) change((p) => nudgeStatic(p, staticSel, arrow[0], arrow[1]));
        else return;
      }
      else {
        if (!chosen.length) return;
        if (k === "r") change((p) => rotateItems(p, sel));
        else if (k === "d") duplicate();
        else if (k === "g") change((p) => groupItems(p, sel));
        else if (k === "u") change((p) => ungroupItems(p, sel));
        else if (k === "Delete" || k === "Backspace") { change((p) => removeItems(p, sel)); setSelIds([]); }
        else if (arrow) change((p) => nudgeItems(p, sel, arrow[0], arrow[1]));
        else if (k === "Escape") setSelIds([]);
        else return;
      }
      evt.preventDefault();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  function duplicate() {
    const d = docRef.current;
    if (!d) return;
    const copy = duplicateItems(d.data, sel);
    editor.checkpoint();
    editor.setPlan(copy.plan, true);
    setSelIds(copy.ids);
  }

  function applyScale(realCm: number) {
    if (!scaleLine || !plan) return;
    const drawn = Math.hypot(scaleLine.x2 - scaleLine.x1, scaleLine.y2 - scaleLine.y1);
    if (drawn < 1) return;
    change((p) => rescale(p, realCm / drawn, p.image?.x ?? 0, p.image?.y ?? 0));
    setScaleLine(null);
    setTool("wall");
    toast.success("Skalan är satt. Tryck på Visa allt om ritningen hamnade utanför bild.");
  }

  /** The same, from the floor area: for plans that state the flat's size but have no scale bar or measurements. */
  function applyAreaScale(realM2: number) {
    const drawn = unionArea(scaleAreas);
    if (drawn < 1) return;
    // Area grows with the square of the scale. What was marked is the whole floor, so its size is the flat's stated area too.
    change((p) => ({ ...rescale(p, Math.sqrt((realM2 * 10_000) / drawn), p.image?.x ?? 0, p.image?.y ?? 0), area: Math.round(realM2 * 10) / 10 }));
    setScaleAreas([]);
    setTool("wall");
    toast.success("Skalan är satt. Tryck på Visa allt om ritningen hamnade utanför bild.");
  }

  // ---------- panel

  const groups = [
    { label: "Mina", list: metas.filter((m) => m.ownerId === me.id) },
    ...[...new Set(metas.filter((m) => m.ownerId !== me.id).map((m) => m.ownerId))].map((owner) => {
      const list = metas.filter((m) => m.ownerId === owner);
      return { label: list[0]?.ownerName ?? "Okänd minister", list };
    }),
  ].filter((g) => g.list.length);

  const oneGroup = chosen.length > 1 && chosen.every((i) => i.g && i.g === chosen[0]?.g);
  const stack = plan ? stacking(plan) : null;
  const hits = plan && stack ? chosen.some((i) => isHit(plan, i, stack)) : false;
  // Beside the stated area, what the drawing itself comes to: far apart means the scale is off.
  const walls = plan?.walls, windows = plan?.windows;
  const drawnArea = useMemo(() => (walls && windows ? enclosedArea({ ...emptyPlan(), walls, windows }) : null), [walls, windows]);
  const drawnText = drawnArea === null ? "" : `Ritad golvyta ca ${areaText(drawnArea / 10_000)}`;
  const drawnHelp = "Golvet innanför ytterväggarna med nuvarande skala, innerväggar oräknade. Skiljer det sig mycket från boarean stämmer inte skalan.";
  /** Pieces of "Mina möbler" that the open plan, if it is the minister's own, doesn't have yet. */
  const missing = mine && plan ? unpacked(plan, furniture).length : 0;
  /** How far above the floor the single selected piece stands. */
  const standing = (one && stack?.z.get(one.id)) ?? 0;

  return (
    <div className="grid w-full h-(--screen-height) grid-cols-[320px_1fr] max-md:grid-cols-1 max-md:grid-rows-[56%_1fr] text-gray-900">
      <aside className="overflow-y-auto border-r border-gray-200 bg-gray-50 p-3 flex flex-col gap-3 *:shrink-0 max-md:order-2 max-md:border-r-0 max-md:border-t">
        {/* Which plan */}
        <div className="flex flex-col gap-2">
          <p className="text-xl font-semibold title-font">Planlösningar</p>
          {groups.length > 0 && (
            <select aria-label="Planlösning" className={inputClass} value={currentId ?? ""} onChange={(e) => void open(e.target.value)}>
              {groups.map((g) => (
                <optgroup key={g.label} label={g.label}>
                  {g.list.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </optgroup>
              ))}
            </select>
          )}
          <PlanPresence me={me} planId={currentId} metas={metas} onOpen={(id) => void open(id)} />
          <div className="flex flex-wrap gap-2">
            <button type="button" className={primaryClass} onClick={createEmpty}>Ny planlösning</button>
            <button type="button" className={buttonClass} onClick={() => fileInput.current?.click()}>Importera</button>
            {tracer?.configured && <button type="button" className={buttonClass} disabled={trace?.status === "running"} onClick={() => setTraceDialog(true)}>Rita av med AI</button>}
            {tracer?.configured && <a href="/planlosning/ai" className="self-center text-sm font-normal text-gray-600 underline">AI-historik</a>}
            {doc && <button type="button" className={buttonClass} onClick={() => void exportFile()}>Exportera</button>}
            {doc && meta && mine && <button type="button" className={buttonClass} disabled={copying} title="Ny planlösning med samma ritning, bild och möbler" onClick={() => void copy()}>{copying ? "Kopierar…" : "Skapa en kopia"}</button>}
          </div>
          <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void importFile(f); }} />
          {meta && (mine
            ? <p className="text-sm text-gray-600 font-normal" role="status">{SYNC_TEXT[sync]}</p>
            : <>
              <p className="text-sm text-gray-600 font-normal">{meta.ownerName}s planlösning. Du kan titta men inte ändra. Kopiera den för att få en egen att möblera: ritningen och bilden följer med, {meta.ownerName}s möbler gör det inte.</p>
              {doc && <button type="button" className={`${primaryClass} self-start`} disabled={copying} title="Ny planlösning hos dig med samma ritning och bild, utan möbler" onClick={() => void copy()}>{copying ? "Kopierar…" : "Kopiera till mina"}</button>}
            </>)}
          {trace?.status === "running" && (
            <p className="text-sm font-normal border border-orange-200 bg-orange-50 rounded-md px-2 py-1.5" role="status">
              <span className="font-semibold">AI:n ritar av en planlösning</span> · steg {trace.step}
              {trace.note && <span className="block text-gray-600 truncate">{trace.note}</span>}
            </p>
          )}
          {!meta && <p className="text-sm text-gray-600 font-normal">Ingen har ritat någon planlösning än. Skapa en ny, ladda upp planritningen som bild och rita av väggarna.</p>}
        </div>

        {plan?.area !== undefined && !mine && (
          <p className="text-sm font-normal">Boarea {areaText(plan.area)}{drawnText && <span className="text-gray-600" title={drawnHelp}> · {drawnText.toLowerCase()}</span>}</p>
        )}

        {doc && plan && mine && <>
          <div className="flex gap-2 items-end">
            <div className="flex-1 min-w-0">
              <TextField label="Namn" value={doc.name} maxLength={MAX_NAME_LENGTH} onStart={() => undefined}
                onChange={(name) => { const d = docRef.current; if (!d) return; const edited = { ...d, name: cleanName(name), editedAt: stamp(d) }; setDoc({ ...edited, name }); persist(edited); }} />
            </div>
            <button type="button" className={`${buttonClass} text-red-700`} onClick={() => void remove()}>Ta bort</button>
          </div>
          <div className="flex gap-2 items-end">
            <div className="w-28 flex-none">
              <AreaField value={plan.area} onStart={editor.checkpoint}
                onChange={(area) => { const { area: _old, ...rest } = plan; editor.setPlan(area === undefined ? rest : { ...rest, area }, true); }} />
            </div>
            {plan.area !== undefined && drawnText && <p className="text-sm text-gray-600 font-normal pb-1.5" title={drawnHelp}>{drawnText}</p>}
          </div>
          <Segments value={mode} options={[["furnish", "Möblera"], ["draw", "Rita planlösning"]]}
            onChange={(m) => { setMode(m); setTool("select"); setStaticSel(null); setScaleLine(null); setScaleAreas([]); if (m === "draw") setIs3d(false); }} />
        </>}

        {/* Drawing the flat itself */}
        {plan && drawing && <>
          <Card title="Planritning">
            <p className="text-sm text-gray-600 font-normal">
              {plan.image
                ? (plan.image.calibrated ? "Bilden ligger under ritningen. Rita av den med verktygen nedan." : "Sätt skalan så att måtten stämmer med verkligheten.")
                : "Ladda upp planritningen som bild (PNG eller JPEG), beskär den och rita sedan av väggarna ovanpå."}
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={plan.image ? buttonClass : primaryClass} onClick={() => imageInput.current?.click()}>{plan.image ? "Byt bild" : "Ladda upp bild"}</button>
              {plan.image && <button type="button" className={tool === "scale" || tool === "area" ? primaryClass : buttonClass} onClick={() => { setTool("scale"); setScaleLine(null); setScaleAreas([]); }}>Sätt skala</button>}
              {plan.image && <button type="button" className={buttonClass} onClick={() => change((p) => ({ ...p, image: null }))}>Ta bort bild</button>}
            </div>
            <input ref={imageInput} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) setCropFile(f); }} />
            {(tool === "scale" || tool === "area") && <div className="border-t border-gray-200 pt-2">
              <Segments value={tool} options={[["scale", "Känd sträcka"], ["area", "Känd golvyta"]]} onChange={(t) => { setTool(t); setScaleLine(null); setScaleAreas([]); }} />
            </div>}
            {tool === "area" && <AreaForm marked={unionArea(scaleAreas)} count={scaleAreas.length} known={plan.area}
              onUndo={() => setScaleAreas(scaleAreas.slice(0, -1))} onApply={applyAreaScale} />}
            {tool === "scale" && <ScaleForm key={scaleLine ? `${scaleLine.x1},${scaleLine.y1},${scaleLine.x2},${scaleLine.y2}` : "none"} ready={!!scaleLine} onApply={applyScale} />}
            {plan.image && <OpacitySlider value={opts.overlayOpacity} onChange={(v) => setOpts({ ...opts, overlayOpacity: v })} />}
          </Card>

          <Card title="Rita">
            <Segments value={tool} options={TOOLS} onChange={(t) => { setTool(t); setScaleLine(null); setScaleAreas([]); if (t !== "select") setStaticSel(null); }} />
            <p className="text-sm text-gray-600 font-normal">{TOOL_HELP[tool]}</p>
            <p className="text-xs text-gray-500 font-normal">Flytta vyn utan att byta verktyg: dra med mitten- eller högerknappen, eller håll Mellanslag och dra.</p>
          </Card>

          {picked && staticSel && <Card title="Markerat">
            {"w" in picked && staticSel.kind !== "windows" && <div className="grid grid-cols-2 gap-2">
              <NumField label="Bredd (cm)" value={picked.w} min={1} max={5000} onStart={editor.checkpoint} onChange={(w) => editor.setPlan(patchStatic(plan, staticSel, { w }), true)} />
              <NumField label="Djup (cm)" value={picked.h} min={1} max={5000} onStart={editor.checkpoint} onChange={(h) => editor.setPlan(patchStatic(plan, staticSel, { h }), true)} />
            </div>}
            {staticSel.kind === "windows" && (() => {
              // A window's own measures, whichever way its wall runs: how long it is along the wall, how tall
              // the glass is and how far above the floor it starts. Moving the sill keeps the height.
              const win = picked as PlanWindow, along = win.w >= win.h, height = win.head - win.sill;
              return <div className="grid grid-cols-2 gap-2">
                <NumField label="Bredd (cm)" value={along ? win.w : win.h} min={1} max={5000} onStart={editor.checkpoint}
                  onChange={(v) => editor.setPlan(patchStatic(plan, staticSel, along ? { w: v } : { h: v }), true)} />
                <NumField label="Höjd (cm)" value={height} min={1} max={400 - win.sill} onStart={editor.checkpoint}
                  onChange={(v) => editor.setPlan(patchStatic(plan, staticSel, { head: win.sill + v }), true)} />
                <NumField label="Bröstning, över golv (cm)" value={win.sill} min={0} max={Math.min(300, 400 - height)} onStart={editor.checkpoint}
                  onChange={(sill) => editor.setPlan(patchStatic(plan, staticSel, { sill, head: sill + height }), true)} />
                <NumField label="Väggtjocklek (cm)" value={along ? win.h : win.w} min={1} max={200} onStart={editor.checkpoint}
                  onChange={(v) => editor.setPlan(patchStatic(plan, staticSel, along ? { h: v } : { w: v }), true)} />
              </div>;
            })()}
            {staticSel.kind === "fixtures" && <>
              <div className="grid grid-cols-2 gap-2">
                <TextField label="Namn" value={(picked as Fixture).label} maxLength={30} onStart={editor.checkpoint} onChange={(label) => editor.setPlan(patchStatic(plan, staticSel, { label }), true)} />
                <NumField label="Höjd (cm)" value={(picked as Fixture).height} min={1} max={400} onStart={editor.checkpoint} onChange={(height) => editor.setPlan(patchStatic(plan, staticSel, { height }), true)} />
                <NumField label="Höjd över golvet (cm)" value={(picked as Fixture).lift ?? 0} min={0} max={300} onStart={editor.checkpoint} onChange={(lift) => editor.setPlan(patchStatic(plan, staticSel, { lift }), true)} />
              </div>
              {((picked as Fixture).lift ?? 0) > 0 && <p className="text-xs text-gray-500 font-normal">Sitter på väggen: möbler som får plats under kan stå där.</p>}
              <div className="flex flex-wrap gap-1.5">
                {FIXTURE_PRESETS.map(([label, height, lift]) => (
                  <button key={label} type="button" className={buttonClass} onClick={() => change((p) => patchStatic(p, staticSel, { label, height, lift }))}>{label}</button>
                ))}
              </div>
            </>}
            {"x1" in picked && <>
              <TextField label={`Text (tomt visar längden, ${dimLength(picked)} cm)`} value={picked.text} maxLength={40} onStart={editor.checkpoint} onChange={(text) => editor.setPlan(patchStatic(plan, staticSel, { text }), true)} />
              <Check label="Texten på andra sidan linjen" checked={picked.flip} onChange={(flip) => change((p) => patchStatic(p, staticSel, { flip }))} />
            </>}
            {staticSel.kind === "labels" && "text" in picked && (
              <TextField label="Text" value={picked.text} maxLength={40} onStart={editor.checkpoint} onChange={(text) => editor.setPlan(patchStatic(plan, staticSel, { text }), true)} />
            )}
            <button type="button" className={`${buttonClass} text-red-700 self-start`} onClick={() => { change((p) => removeStatic(p, staticSel)); setStaticSel(null); }}>Ta bort</button>
          </Card>}
        </>}

        {/* Furniture */}
        {plan && !drawing && <>
          <Card title="Markerat">
            {!chosen.length && <p className="text-sm text-gray-600 font-normal">{mine
              ? "Klicka på en möbel för att ändra den. Shift-klicka för att välja flera och gruppera dem."
              : "Klicka på en möbel för att se dess mått och avstånd."}</p>}
            {one && mine && <>
              <TextField label="Namn" value={one.name} maxLength={30} onStart={editor.checkpoint} onChange={(name) => editor.setPlan(patchItems(plan, sel, { name }), true)} />
              <div className="grid grid-cols-3 gap-2">
                <NumField label="Bredd" value={one.w} min={5} max={600} onStart={editor.checkpoint} onChange={(w) => editor.setPlan(patchItems(plan, sel, { w }), true)} />
                <NumField label="Djup" value={one.d} min={5} max={600} onStart={editor.checkpoint} onChange={(d) => editor.setPlan(patchItems(plan, sel, { d }), true)} />
                <NumField label="Höjd" value={one.h} min={1} max={300} onStart={editor.checkpoint} onChange={(h) => editor.setPlan(patchItems(plan, sel, { h }), true)} />
              </div>
              <label className="flex flex-col gap-0.5 text-xs text-gray-600 font-normal">Modell i 3D-vyn
                <select className={inputClass} value={one.model} onChange={(e) => { const model = ITEM_MODELS.find((m) => m === e.target.value); if (model) change((p) => patchItems(p, sel, { model })); }}>
                  {ITEM_MODELS.map((m) => <option key={m} value={m}>{MODEL_NAMES[m]}</option>)}
                </select>
              </label>
              {/* A fixed height decides where the piece stands on its own, so the stacking choice has nothing to say then. */}
              <label className="flex flex-col gap-0.5 text-xs text-gray-600 font-normal">Stapling
                <select className={inputClass} value={one.stack ?? ""} disabled={one.lift !== undefined}
                  onChange={(e) => { const mode = STACK_MODES.find((m) => m === e.target.value); change((p) => patchItems(p, sel, { stack: mode })); }}>
                  <option value="">Automatiskt</option>
                  {STACK_MODES.map((m) => <option key={m} value={m}>{STACK_NAMES[m]}</option>)}
                </select>
              </label>
              {/* Starts from where the piece stands now, so ticking the box doesn't move it. */}
              <Check label="Egen höjd över golvet" checked={one.lift !== undefined}
                onChange={(on) => change((p) => patchItems(p, sel, { lift: on ? Math.min(300, Math.round(standing)) : undefined }))} />
              {one.lift !== undefined
                ? <NumField label="Höjd över golvet (cm)" value={one.lift} min={0} max={300} onStart={editor.checkpoint} onChange={(lift) => editor.setPlan(patchItems(plan, sel, { lift }), true)} />
                : standing > 0 && <p className="text-sm text-gray-600 font-normal">Står {Math.round(standing)} cm över golvet.</p>}
            </>}
            {one && !mine && <p className="text-sm font-normal">{one.name}: {one.w} × {one.d} cm, {one.h} cm hög{standing > 0 && `, ${Math.round(standing)} cm över golvet`}</p>}
            {chosen.length > 1 && <p className="text-sm text-gray-600 font-normal">{chosen.length} möbler: {chosen.map((i) => i.name).join(", ")}</p>}
            {chosen.length > 0 && mine && <>
              <div className="flex gap-1.5 flex-wrap">
                {COLORS.map((c) => (
                  <button key={c} type="button" aria-label={`Färg ${c}`} aria-pressed={chosen.every((i) => i.color === c)} onClick={() => change((p) => patchItems(p, sel, { color: c }))}
                    className="size-6 rounded-full border-2 border-transparent aria-pressed:border-gray-900" style={{ background: c }} />
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={buttonClass} title="Vrid 90° (R)" onClick={() => change((p) => rotateItems(p, sel))}>⟳ Vrid</button>
                <button type="button" className={buttonClass} title="Kopiera (D)" onClick={duplicate}>Kopiera</button>
                <button type="button" className={`${buttonClass} text-red-700`} title="Ta bort (Del)" onClick={() => { change((p) => removeItems(p, sel)); setSelIds([]); }}>Ta bort</button>
                {chosen.length > 1 && !oneGroup && <button type="button" className={buttonClass} title="Gruppera (G)" onClick={() => change((p) => groupItems(p, sel))}>Gruppera</button>}
                {chosen.some((i) => i.g) && <button type="button" className={buttonClass} title="Dela upp (U)" onClick={() => change((p) => ungroupItems(p, sel))}>Dela upp</button>}
              </div>
            </>}
            {hits && <p className="text-sm text-red-700 font-semibold">Överlappar en vägg, fast inredning eller en annan möbel</p>}
            <Check label="Välj flera (tryck lägger till eller tar bort)" checked={opts.multi} onChange={(multi) => setOpts({ ...opts, multi })} />
          </Card>

          <Card title="Möbler">
            {plan.items.length === 0 && <p className="text-sm text-gray-600 font-normal">Inga möbler än.</p>}
            <ul className="flex flex-col gap-0.5">
              {plan.items.map((i) => (
                <li key={i.id}>
                  {/* The list always picks single pieces, so one member of a group can still be edited on its own. */}
                  <button type="button" aria-current={sel.has(i.id)}
                    onClick={(e) => setSelIds(e.shiftKey || e.ctrlKey || e.metaKey || opts.multi ? (sel.has(i.id) ? selIds.filter((s) => s !== i.id) : [...selIds, i.id]) : [i.id])}
                    className="w-full flex items-center gap-2 text-left rounded-md px-2 py-1 text-sm font-normal hover:bg-gray-100 aria-[current=true]:bg-gray-200 aria-[current=true]:font-semibold">
                    <span className="size-3 rounded-xs flex-none" style={{ background: i.color }} />
                    <span className="truncate">{i.name}</span>
                    {i.g && <span className="text-xs text-gray-500 border border-gray-300 rounded-full px-1.5 font-normal">grupp</span>}
                    {(stack?.z.get(i.id) ?? 0) > 0 && <span className="text-xs text-gray-500 border border-gray-300 rounded-full px-1.5 font-normal whitespace-nowrap" title={`${Math.round(stack?.z.get(i.id) ?? 0)} cm över golvet`}>
                      {i.lift === undefined ? "staplad" : `${i.lift} cm upp`}
                    </span>}
                    {isHit(plan, i, stack ?? undefined) && <span className="text-xs text-red-700 font-normal">överlappar</span>}
                    <span className="ml-auto text-gray-500 tabular-nums font-normal whitespace-nowrap">{i.w} × {i.d}</span>
                  </button>
                </li>
              ))}
            </ul>
            {mine && <button type="button" className={`${buttonClass} self-start`} onClick={() => setFurnitureDialog(true)}>Mina möbler ({furniture.length})</button>}
            {mine && <AddForm onAdd={(piece) => {
              const d = docRef.current;
              if (!d) return;
              const added = addItem(d.data, piece);
              editor.checkpoint();
              editor.setPlan(added.plan, true);
              setSelIds([added.id]);
            }} />}
          </Card>
        </>}

        {plan && <Card title="Visa">
          <Segments value={is3d ? "3d" : "2d"} options={[["2d", "2D-plan"], ["3d", "3D-vy"]]} onChange={(v) => { setIs3d(v === "3d"); if (v === "3d") { setMode("furnish"); setTool("select"); } }} />
          {is3d && <label className="flex flex-col gap-0.5 text-xs text-gray-600 font-normal">Vägghöjd i 3D: {view3.wallH} cm
            <input type="range" min={10} max={250} step={10} value={view3.wallH} className="accent-orange-700" onChange={(e) => setView3({ ...view3, wallH: Number(e.target.value) })} />
          </label>}
          {mine && <Check label="Fäst mot väggar och möbler" checked={opts.snap} onChange={(snap) => setOpts({ ...opts, snap })} />}
          <Check label="Visa mått" checked={opts.dims} onChange={(dims) => setOpts({ ...opts, dims })} />
          <Check label="Visa avstånd runt markerad möbel" checked={opts.gaps} onChange={(gaps) => setOpts({ ...opts, gaps })} />
          {plan.image && !drawing && <>
            <Check label="Visa planritningen ovanpå" checked={opts.overlay} onChange={(overlay) => setOpts({ ...opts, overlay })} />
            {opts.overlay && <OpacitySlider value={opts.overlayOpacity} onChange={(v) => setOpts({ ...opts, overlayOpacity: v })} />}
          </>}
          <div className="flex flex-wrap gap-2">
            {mine && <button type="button" className={buttonClass} title="Ångra (Ctrl+Z)" disabled={!undoable} onClick={undo}>↶ Ångra</button>}
            <button type="button" className={buttonClass} onClick={() => void exportPicture("png")}>Spara PNG</button>
            <button type="button" className={buttonClass} onClick={() => void exportPicture("svg")}>Spara SVG</button>
          </div>
        </Card>}

        {plan && mine && <p className="text-xs text-gray-500 font-normal leading-relaxed max-md:hidden">
          Dra möbler för att flytta · dra i tom yta, eller med mitten-/högerknappen, för att panorera · scrolla eller nyp för att zooma<br />
          Shift-klick väljer flera · G grupperar · U delar upp<br />
          R vrider · D kopierar · Del tar bort · piltangenter flyttar 1 cm (Shift 10)<br />
          Alt medan du drar: fäster inte · Ctrl+Z ångrar<br />
          Röd streckad ram = överlappar en vägg, fast inredning eller en annan möbel.<br />
          Mattor (högst 3 cm höga) står allt annat ovanpå. Möbler som överlappar till minst hälften staplas: den mindre hamnar ovanpå, eller under ett bord om den är en stol eller nästan lika hög som bordet.
          Stämmer det inte går det att ställa in för varje möbel under Markerat, liksom en egen höjd över golvet för sådant som sitter på väggen.
        </p>}
      </aside>

      <div className="relative min-w-0 min-h-0 max-md:order-1">
        {plan && currentId
          ? <>
            <Stage key={currentId} planId={currentId} plan={plan} readOnly={!mine} mode={mode} tool={tool} hidden={is3d}
              sel={sel} onSelect={setSelIds} staticSel={staticSel} onSelectStatic={setStaticSel} opts={opts} editor={editor}
              scaleLine={scaleLine} onScaleLine={setScaleLine} scaleAreas={scaleAreas} onScaleAreas={setScaleAreas} unpackable={missing} onUnpack={unpack} svgRef={stage2d} />
            {is3d && <Stage3d plan={plan} view={view3} setView={setView3} sel={sel} svgRef={stage3d} />}
          </>
          : <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-600 font-normal p-6 text-center">
            {currentId ? SYNC_TEXT[sync] : "Välj eller skapa en planlösning."}
          </div>}
      </div>

      {traceDialog && tracer && <TraceDialog overview={tracer} onClose={() => setTraceDialog(false)} onStarted={(started) => {
        setTraceDialog(false);
        setTrace(started);
        void refresh();
        toast.info("AI:n har börjat rita av planlösningen. Det tar en stund.");
      }} />}
      {furnitureDialog && <FurnitureDialog furniture={furniture} planItems={mine && plan ? plan.items : null} selected={sel} modelNames={MODEL_NAMES} missing={missing}
        onSave={saveFurniture} onUnpack={() => { unpack(); setFurnitureDialog(false); }} onClose={() => setFurnitureDialog(false)} />}
      {traceReport && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3" role="dialog" aria-modal="true" aria-label="AI-ritningen är klar">
          <div className="bg-white rounded-xl p-4 flex flex-col gap-3 w-full max-w-2xl max-h-full">
            <p className="text-lg font-semibold">AI-ritningen är klar</p>
            <p className="text-sm text-gray-600 font-normal">Slå på &quot;Visa planritningen ovanpå&quot; och jämför med bilden innan du litar på måtten.</p>
            <pre className="overflow-y-auto whitespace-pre-wrap text-sm font-normal bg-gray-50 border border-gray-200 rounded-md p-3">{traceReport}</pre>
            <button type="button" className={`${primaryClass} self-end`} onClick={() => setTraceReport("")}>Stäng</button>
          </div>
        </div>
      )}
      {cropFile && <CropDialog file={cropFile} onCancel={() => setCropFile(null)} onDone={(img) => void acceptCropped(img)} />}
    </div>
  );
}

function OpacitySlider({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return <label className="flex flex-col gap-0.5 text-xs text-gray-600 font-normal">Bildens synlighet
    <input type="range" min={10} max={100} step={5} value={value} className="accent-orange-700" onChange={(e) => onChange(Number(e.target.value))} />
  </label>;
}

/** The real length of the line just drawn with the scale tool. */
function ScaleForm({ ready, onApply }: { ready: boolean; onApply: (cm: number) => void }) {
  const [text, setText] = useState("");
  const cm = Number(text.replace(",", "."));
  const valid = ready && Number.isFinite(cm) && cm >= 10 && cm <= 10_000;
  return <form className="flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); if (valid) onApply(cm); }}>
    <p className="text-sm text-gray-600 font-normal">{ready ? "Hur lång är sträckan i verkligheten?" : TOOL_HELP.scale}</p>
    {ready && <div className="flex gap-2 items-end">
      <label className="flex-1 flex flex-col gap-0.5 text-xs text-gray-600 font-normal">Längd (cm)
        <input type="text" inputMode="decimal" autoFocus className={inputClass} value={text} placeholder="t.ex. 500" onChange={(e) => setText(e.target.value)} />
      </label>
      <button className={primaryClass} disabled={!valid}>Sätt skala</button>
    </div>}
  </form>;
}

/** The real size of the floor just marked out with the area tool. */
function AreaForm({ marked, count, known, onUndo, onApply }: { marked: number; count: number; known: number | undefined; onUndo: () => void; onApply: (m2: number) => void }) {
  // Starts from the plan's stated area when there is one, which is usually the very number to type here.
  const [text, setText] = useState(known === undefined ? "" : String(known).replace(".", ","));
  const m2 = Number(text.replace(",", "."));
  const valid = marked >= 1 && Number.isFinite(m2) && m2 >= MIN_AREA && m2 <= MAX_AREA;
  return <form className="flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); if (valid) onApply(m2); }}>
    <p className="text-sm text-gray-600 font-normal">{TOOL_HELP.area}</p>
    {count > 0 && <>
      <p className="text-sm text-gray-600 font-normal">
        {count} {count === 1 ? "rektangel" : "rektanglar"} markerade. Med nuvarande skala är det {(marked / 10_000).toLocaleString("sv-SE", { maximumFractionDigits: 1 })} m².
      </p>
      <div className="flex gap-2 items-end">
        <label className="flex-1 flex flex-col gap-0.5 text-xs text-gray-600 font-normal">Verklig golvyta (m²)
          <input type="text" inputMode="decimal" className={inputClass} value={text} placeholder="t.ex. 24" onChange={(e) => setText(e.target.value)} />
        </label>
        <button className={primaryClass} disabled={!valid}>Sätt skala</button>
      </div>
      <button type="button" className={`${buttonClass} self-start`} onClick={onUndo}>Ta bort senaste rektangeln</button>
    </>}
  </form>;
}

/**
 * The flat's stated floor area. Unlike NumField it takes a decimal comma and can be emptied, which removes the area
 * from the plan. Half-typed and out-of-range values never reach the plan.
 */
function AreaField({ value, onChange, onStart }: { value: number | undefined; onChange: (m2: number | undefined) => void; onStart: () => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const armed = useRef(false);
  const shown = value === undefined ? "" : String(value).replace(".", ",");
  return <label className="flex flex-col gap-0.5 text-xs text-gray-600 font-normal min-w-0">Boarea (m²)
    <input type="text" inputMode="decimal" maxLength={7} placeholder="okänd" className={inputClass} value={draft ?? shown}
      onFocus={() => { setDraft(shown); armed.current = true; }}
      onBlur={() => setDraft(null)}
      onChange={(e) => {
        setDraft(e.target.value);
        const text = e.target.value.trim(), m2 = Number(text.replace(",", "."));
        if (text !== "" && !(m2 >= MIN_AREA && m2 <= MAX_AREA)) return;
        if (armed.current) { onStart(); armed.current = false; }
        onChange(text === "" ? undefined : Math.round(m2 * 10) / 10);
      }} />
  </label>;
}

function AddForm({ onAdd }: { onAdd: (piece: { name: string; w: number; d: number; h: number }) => void }) {
  const [name, setName] = useState(""), [w, setW] = useState(""), [d, setD] = useState(""), [h, setH] = useState("");
  const size = (v: string) => { const n = Math.round(Number(v)); return n >= 5 && n <= 600 ? n : null; };
  const box = (label: string, value: string, set: (v: string) => void, placeholder: string, required: boolean) => (
    <label className="flex flex-col gap-0.5 text-xs text-gray-600 font-normal min-w-0">{label}
      <input type="number" inputMode="numeric" min={required ? 5 : 1} max={required ? 600 : 300} step={1} required={required} placeholder={placeholder}
        className={inputClass} value={value} onChange={(e) => set(e.target.value)} />
    </label>
  );
  return <form className="flex flex-col gap-2 border-t border-gray-200 pt-2.5" onSubmit={(e) => {
    e.preventDefault();
    const width = size(w), depth = size(d);
    if (!name.trim() || width === null || depth === null) return;
    onAdd({ name: name.trim(), w: width, d: depth, h: Math.round(Number(h)) || 75 });
    setName(""); setW(""); setD(""); setH("");
  }}>
    <label className="flex flex-col gap-0.5 text-xs text-gray-600 font-normal">Ny möbel
      <input type="text" required maxLength={30} placeholder="t.ex. Bokhylla" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
    </label>
    <div className="grid grid-cols-3 gap-2">
      {box("Bredd", w, setW, "80", true)}
      {box("Djup", d, setD, "40", true)}
      {box("Höjd", h, setH, "75", false)}
    </div>
    <button className={primaryClass}>Lägg till</button>
  </form>;
}
