"use client";

import type { Door } from "@/lib/planner/plan";
import { doorAlong } from "@/lib/planner/doors";
import { NumField, Segments } from "@/components/planner/controls";

/**
 * The "Markerat" fields of a door. Hinge and swing are stored relative to the wall's direction, but asked
 * for in the words of the drawing: left/right in a wall running left–right, up/down in one running up–down.
 */
export function DoorFields({ door, onStart, onChange }: {
  door: Door;
  /** Called before a change, to make it one undo step */
  onStart: () => void;
  onChange: (patch: Partial<Omit<Door, "id">>) => void;
}) {
  const along = doorAlong(door);
  const set = (patch: Partial<Omit<Door, "id">>) => { onStart(); onChange(patch); };
  return <>
    <div className="grid grid-cols-2 gap-2">
      <NumField label="Bredd (cm)" value={along ? door.w : door.h} min={1} max={5000} onStart={onStart} onChange={(v) => onChange(along ? { w: v } : { h: v })} />
      <NumField label="Väggtjocklek (cm)" value={along ? door.h : door.w} min={1} max={200} onStart={onStart} onChange={(v) => onChange(along ? { h: v } : { w: v })} />
    </div>
    <div className="flex flex-col gap-0.5 text-xs text-gray-600 font-normal">Slår upp
      <Segments value={door.swing} onChange={(swing) => set({ swing })}
        options={[["neg", along ? "Uppåt" : "Åt vänster"], ["pos", along ? "Nedåt" : "Åt höger"], ["none", "Skjutdörr/öppning"]]} />
    </div>
    {door.swing !== "none" && <div className="flex flex-col gap-0.5 text-xs text-gray-600 font-normal">Gångjärn
      <Segments value={door.hinge} onChange={(hinge) => set({ hinge })} options={[["start", along ? "Till vänster" : "Upptill"], ["end", along ? "Till höger" : "Nedtill"]]} />
    </div>}
    <p className="text-xs text-gray-500 font-normal">
      {door.swing === "none" ? "Slår inte upp: bara själva öppningen behöver vara fri från möbler." : "Möbler i öppningen eller där dörrbladet slår upp får en varning."}
    </p>
  </>;
}
