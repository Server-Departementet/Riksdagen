"use client";

import { useState } from "react";
import type { ItemModel } from "@/lib/planner/plan";
import type { IkeaCategory, IkeaProduct } from "@/lib/planner/ikea";
import { IKEA, IKEA_CATEGORIES } from "@/lib/planner/ikea";
import { buttonClass, inputClass, primaryClass } from "@/components/planner/controls";

/** Fold case and accents, so "malm sang" finds "MALM säng". */
const plain = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Pick furniture from the built-in IKEA catalogue. Stays open, so several pieces can be added in one go. */
export function IkeaDialog({ modelNames, onAdd, onClose }: {
  modelNames: Record<ItemModel, string>;
  onAdd: (product: IkeaProduct) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<IkeaCategory | "">("");
  const [added, setAdded] = useState<string[]>([]);

  const words = plain(query).split(/\s+/).filter(Boolean);
  const found = IKEA.filter((p) => (!category || p.category === category) && words.every((w) => plain(p.name).includes(w)));

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3" role="dialog" aria-modal="true" aria-label="Möbler från IKEA">
      <div className="bg-white rounded-xl p-4 flex flex-col gap-3 w-full max-w-lg h-[min(100%,40rem)]">
        <div>
          <p className="text-lg font-semibold">Möbler från IKEA</p>
          <p className="text-sm text-gray-600 font-normal">Vanliga IKEA-möbler med ungefärliga yttermått (bredd × djup × höjd i cm). Kontrollera måtten mot ikea.se innan du litar på dem: du kan ändra dem på möbeln efteråt.</p>
        </div>
        <div className="flex gap-2">
          <input type="search" autoFocus className={inputClass} value={query} placeholder="Sök, t.ex. malm byrå" aria-label="Sök möbel" onChange={(e) => setQuery(e.target.value)} />
          <select className={`${inputClass} w-auto!`} aria-label="Kategori" value={category} onChange={(e) => setCategory(IKEA_CATEGORIES.find((c) => c === e.target.value) ?? "")}>
            <option value="">Alla</option>
            {IKEA_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <ul className="flex-1 min-h-0 overflow-y-auto flex flex-col border border-gray-200 rounded-md">
          {found.length === 0 && <li className="p-3 text-sm text-gray-600 font-normal">Ingen möbel matchar. Lägg till den för hand med egna mått.</li>}
          {found.map((p) => (
            <li key={p.name} className="flex items-center gap-2 px-2.5 py-1.5 text-sm font-normal border-b border-gray-100 last:border-b-0">
              <span className="truncate">{p.name}</span>
              <span className="ml-auto text-gray-500 tabular-nums whitespace-nowrap">{p.w} × {p.d} × {p.h} · {modelNames[p.model]}</span>
              <button type="button" className={buttonClass} onClick={() => { onAdd(p); setAdded([...added, p.name]); }}>Lägg till</button>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-600 font-normal truncate" role="status">{added.length ? `Tillagda: ${added.join(", ")}` : `${found.length} möbler`}</p>
          <button type="button" className={`${primaryClass} ml-auto`} onClick={onClose}>Klar</button>
        </div>
      </div>
    </div>
  );
}
