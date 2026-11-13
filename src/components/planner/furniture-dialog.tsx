"use client";

import type { Item, ItemModel } from "@/lib/planner/plan";
import { MAX_FURNITURE } from "@/lib/planner/plan";
import { buttonClass, primaryClass } from "@/components/planner/controls";

/**
 * "Mina möbler": the minister's own furniture, kept apart from any plan. Pieces
 * get in from a plan (so a piece is measured and styled once, on the plan) and
 * are unpacked into other plans from here or from the button under the parking box.
 */
export function FurnitureDialog({ furniture, planItems, selected, modelNames, missing, onSave, onUnpack, onClose }: {
  furniture: Item[];
  /** The open plan's furniture when it is the minister's own plan, else null */
  planItems: Item[] | null;
  selected: ReadonlySet<string>;
  modelNames: Record<ItemModel, string>;
  /** How many of the pieces the open plan doesn't have yet */
  missing: number;
  onSave: (furniture: Item[]) => void;
  onUnpack: () => void;
  onClose: () => void;
}) {
  // A piece from a plan keeps its id, so the plan it came from already counts as having it. Same id again = updated measures.
  const add = (pieces: Item[]) => {
    const ids = new Set(pieces.map((p) => p.id));
    onSave([...furniture.filter((f) => !ids.has(f.id)), ...pieces].slice(0, MAX_FURNITURE));
  };
  const chosen = planItems?.filter((i) => selected.has(i.id)) ?? [];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3" role="dialog" aria-modal="true" aria-label="Mina möbler">
      <div className="bg-white rounded-xl p-4 flex flex-col gap-3 w-full max-w-lg max-h-full">
        <div>
          <p className="text-lg font-semibold">Mina möbler</p>
          <p className="text-sm text-gray-600 font-normal">
            Möblerna du äger. Nya planlösningar börjar med dem, och i en planlösning du redan har kan du packa upp dem som saknas.
            Bara du ser listan.
          </p>
        </div>

        {furniture.length === 0
          ? <p className="text-sm text-gray-600 font-normal">Listan är tom. Lägg till möbler från en av dina planlösningar med knapparna nedan.</p>
          : <ul className="overflow-y-auto flex flex-col gap-0.5 border border-gray-200 rounded-md p-1.5">
            {furniture.map((f) => (
              <li key={f.id} className="flex items-center gap-2 px-1.5 py-1 text-sm font-normal">
                <span className="size-3 rounded-xs flex-none" style={{ background: f.color }} />
                <span className="truncate">{f.name || "Namnlös"}</span>
                <span className="ml-auto text-gray-500 tabular-nums whitespace-nowrap">{f.w} × {f.d} × {f.h} · {modelNames[f.model]}</span>
                <button type="button" aria-label={`Ta bort ${f.name}`} className="px-1.5 text-red-700 font-semibold hover:bg-gray-100 rounded-sm" onClick={() => onSave(furniture.filter((o) => o.id !== f.id))}>✕</button>
              </li>
            ))}
          </ul>}

        {planItems && <div className="flex flex-wrap gap-2">
          {chosen.length > 0 && <button type="button" className={buttonClass} onClick={() => add(chosen)}>Lägg till {chosen.length === 1 ? "markerad möbel" : `${chosen.length} markerade`}</button>}
          <button type="button" className={buttonClass} disabled={!planItems.length} onClick={() => add(planItems)}>Lägg till alla i den här planlösningen</button>
        </div>}
        {!planItems && <p className="text-sm text-gray-600 font-normal">Öppna en av dina egna planlösningar för att lägga till möbler härifrån eller packa upp dem.</p>}

        <div className="flex flex-wrap gap-2 justify-end">
          {planItems && missing > 0 && <button type="button" className={buttonClass} onClick={onUnpack}>Packa upp {missing} som saknas här</button>}
          <button type="button" className={primaryClass} onClick={onClose}>Klar</button>
        </div>
      </div>
    </div>
  );
}
