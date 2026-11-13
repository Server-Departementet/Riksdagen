"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { PlanData } from "@/lib/planner/plan";
import { MAX_VARIANTS, MAX_VARIANT_NAME_LENGTH, variantName } from "@/lib/planner/plan";
import { addVariant, deleteVariant, listVariants, renameVariant, switchVariant } from "@/lib/planner/variants";
import { TextField, buttonClass, inputClass, primaryClass } from "@/components/planner/controls";

/**
 * The furnishing variants of the open plan: which one is shown, and for the owner making, renaming and removing
 * them. `onShow` takes a plan whose shown furniture is another arrangement (the caller decides whether that is an
 * edit to save or, for a visitor, only something to look at); `onRename` one where only a name changed.
 */
export function VariantPicker({ plan, editable, onShow, onStart, onRename }: {
  plan: PlanData; editable: boolean; onShow: (next: PlanData) => void; onStart: () => void; onRename: (next: PlanData) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const all = listVariants(plan), shown = all.find((v) => v.shown);
  // A visitor has nothing to do here until there is something to switch between.
  if (!editable && all.length < 2) return null;
  const full = all.length >= MAX_VARIANTS;

  const add = (from: "copy" | "empty") => {
    const next = addVariant(plan, from, name);
    if (next === plan) { toast.error("Planlösningen blir för stor för att sparas med en variant till."); return; }
    onShow(next);
    setAdding(false); setName("");
  };

  return <div className="flex flex-col gap-2 border-b border-gray-200 pb-2.5">
    <div className="flex gap-2 items-end">
      {all.length > 1
        ? <label className="flex-1 min-w-0 flex flex-col gap-0.5 text-xs text-gray-600 font-normal">Variant
          <select className={inputClass} value={shown?.id ?? ""} onChange={(e) => onShow(switchVariant(plan, e.target.value))}>
            {all.map((v) => <option key={v.id} value={v.id}>{variantName(v.name)}</option>)}
          </select>
        </label>
        : <p className="flex-1 min-w-0 text-sm text-gray-600 font-normal pb-1.5">{shown ? `Variant: ${variantName(shown.name)}` : "En möblering. Gör en variant för att prova en till i samma lägenhet."}</p>}
      {editable && !adding && <button type="button" className={buttonClass} disabled={full} title={full ? `Högst ${MAX_VARIANTS} varianter` : "Ännu en möblering av samma lägenhet"} onClick={() => setAdding(true)}>Ny variant</button>}
    </div>
    {editable && adding && <div className="flex flex-col gap-2">
      <label className="flex flex-col gap-0.5 text-xs text-gray-600 font-normal">Den nya variantens namn
        <input type="text" autoFocus maxLength={MAX_VARIANT_NAME_LENGTH} placeholder="t.ex. Säng vid fönstret" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={primaryClass} title="Börja från möbleringen som visas nu" onClick={() => add("copy")}>Kopia av den här</button>
        <button type="button" className={buttonClass} title="Samma möbler, alla i rutan för oplacerade" onClick={() => add("empty")}>Alla möbler oplacerade</button>
        <button type="button" className={buttonClass} onClick={() => { setAdding(false); setName(""); }}>Avbryt</button>
      </div>
    </div>}
    {editable && shown && !adding && <div className="flex gap-2 items-end">
      <div className="flex-1 min-w-0">
        <TextField label="Variantens namn" value={shown.name} maxLength={MAX_VARIANT_NAME_LENGTH} onStart={onStart} onChange={(n) => onRename(renameVariant(plan, n))} />
      </div>
      {all.length > 1 && <button type="button" className={`${buttonClass} text-red-700`} title="Ta bort den här varianten"
        onClick={() => { if (confirm(`Ta bort varianten "${variantName(shown.name)}" och dess möblering? De andra varianterna finns kvar.`)) onShow(deleteVariant(plan, shown.id)); }}>Ta bort</button>}
    </div>}
  </div>;
}
