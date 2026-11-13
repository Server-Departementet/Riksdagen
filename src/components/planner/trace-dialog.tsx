"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TraceOverview, TraceStatus } from "@/lib/planner/tracer/config";
import type { CroppedImage } from "@/components/planner/crop-dialog";
import { CropDialog } from "@/components/planner/crop-dialog";
import { buttonClass, inputClass, primaryClass } from "@/components/planner/controls";

/**
 * Hand a plan picture and/or a listing link to the AI tracer. Starting returns at
 * once; the planner then follows the trace, which takes several minutes.
 */
export function TraceDialog({ overview, onStarted, onClose }: { overview: TraceOverview; onStarted: (trace: TraceStatus) => void; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [image, setImage] = useState<CroppedImage | null>(null);
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  // An object URL for the chosen picture, released when the picture changes or the dialog closes.
  const preview = useMemo(() => (image ? URL.createObjectURL(image.blob) : ""), [image]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const left = Math.max(0, overview.perDay - overview.usedToday);
  const ready = (!!image || url.trim() !== "") && left > 0 && !busy;

  async function submit() {
    setBusy(true);
    setError("");
    const form = new FormData();
    if (image) form.set("image", image.blob, "plan.png");
    form.set("url", url.trim());
    form.set("note", note.trim());
    try {
      const res = await fetch("/api/planlosning/trace", { method: "POST", body: form });
      const body = await res.json() as TraceStatus | { error?: string };
      if (!res.ok || !("id" in body)) {
        setError(("error" in body && body.error) || "Kunde inte starta ritningen.");
        return;
      }
      onStarted(body);
    }
    catch {
      setError("Servern gick inte att nå.");
    }
    finally {
      setBusy(false);
    }
  }

  if (file) return <CropDialog file={file} onCancel={() => setFile(null)} onDone={(img) => { setImage(img); setFile(null); }} />;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3" role="dialog" aria-modal="true" aria-label="Rita av med AI">
      <form className="bg-white rounded-xl p-4 flex flex-col gap-3 w-full max-w-lg max-h-full overflow-y-auto" onSubmit={(e) => { e.preventDefault(); if (ready) void submit(); }}>
        <div>
          <p className="text-lg font-semibold">Rita av med AI</p>
          <p className="text-sm text-gray-600 font-normal">
            En AI mäter upp planritningen och ritar väggar, fönster och fast inredning åt dig. Det tar ungefär 5–15 minuter
            och du kan fortsätta använda sidan under tiden. Resultatet är en bra början, inte ett facit: jämför med bilden efteråt.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-gray-600 font-normal">Planritning (bild)</p>
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- a local object URL, nothing for next/image to optimise */}
            {preview && image && <img src={preview} alt="" className="h-20 rounded-sm border border-gray-200" />}
            <button type="button" className={buttonClass} onClick={() => input.current?.click()}>{image ? "Byt bild" : "Välj bild"}</button>
            {image && <button type="button" className={buttonClass} onClick={() => setImage(null)}>Ta bort</button>}
          </div>
          <p className="text-xs text-gray-500 font-normal">Vrid bilden så att fönsterväggen hamnar uppåt när du beskär den.</p>
          <input ref={input} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) setFile(f); }} />
        </div>

        <label className="flex flex-col gap-0.5 text-xs text-gray-600 font-normal">Länk till annonsen (valfritt om du har en bild)
          <input type="url" className={inputClass} value={url} placeholder={`https://${overview.hosts[0] ?? ""}/…`} onChange={(e) => setUrl(e.target.value)} />
          <span className="text-gray-500">Fungerar för: {overview.hosts.join(", ")}. Därifrån hämtas yta och andra uppgifter, och ritningen om du inte har någon bild.</span>
        </label>

        <label className="flex flex-col gap-0.5 text-xs text-gray-600 font-normal">Något AI:n bör veta (valfritt)
          <input type="text" className={inputClass} value={note} maxLength={500} placeholder="t.ex. Lägenheten är 38 m²" onChange={(e) => setNote(e.target.value)} />
        </label>

        {error && <p className="text-sm text-red-700 font-normal" role="alert">{error}</p>}
        <p className="text-sm text-gray-600 font-normal">
          {left > 0 ? `Du har ${left} av ${overview.perDay} AI-ritningar kvar det här dygnet.` : `Du har använt dina ${overview.perDay} AI-ritningar för det här dygnet.`}
        </p>

        <div className="flex flex-wrap gap-2 justify-end">
          <button type="button" className={buttonClass} onClick={onClose} disabled={busy}>Avbryt</button>
          <button className={primaryClass} disabled={!ready}>{busy ? "Startar…" : "Rita av"}</button>
        </div>
      </form>
    </div>
  );
}
