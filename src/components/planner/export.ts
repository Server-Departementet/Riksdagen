import type { PlanData, PlanFile } from "@/lib/planner/plan";
import { PLAN_FILE_FORMAT } from "@/lib/planner/plan";
import { drawingBox } from "@/lib/planner/geometry";
import { imageUrl } from "@/lib/planner/client-store";
import { PALETTE } from "@/components/planner/stage";

const FONT = "Open Sans, system-ui, -apple-system, Segoe UI, sans-serif";

export type Picture = { svg: string; w: number; h: number };

/**
 * A standalone SVG of the stage that is showing. In 2D it is the flat only: parked
 * pieces, selection outlines and the image overlay (everything marked data-noexport)
 * are left out, and the frame is the drawing rather than the current zoom.
 */
export function picture(stage: SVGSVGElement, plan: PlanData, is3d: boolean): Picture {
  const copy = stage.cloneNode(true) as SVGSVGElement;
  for (const el of copy.querySelectorAll("[data-noexport]")) el.remove();
  copy.querySelector("[data-furniture]")?.removeAttribute("style"); // dimmed while the plan is being drawn
  let box = stage.viewBox.baseVal as { x: number; y: number; width: number; height: number };
  if (!is3d) {
    const b = drawingBox(plan, false), m = 25;
    box = { x: b.x - m, y: b.y - m, width: b.w + 2 * m, height: b.h + 2 * m };
  }
  copy.setAttribute("viewBox", `${box.x} ${box.y} ${box.width} ${box.height}`);
  copy.setAttribute("width", String(box.width));
  copy.setAttribute("height", String(box.height));
  copy.setAttribute("font-family", FONT);
  copy.removeAttribute("class");
  copy.removeAttribute("style");
  const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  for (const [k, v] of Object.entries({ x: box.x, y: box.y, width: box.width, height: box.height, fill: PALETTE.bg })) bg.setAttribute(k, String(v));
  copy.prepend(bg);
  return { svg: new XMLSerializer().serializeToString(copy), w: box.width, h: box.height };
}

export function download(name: string, blob: Blob): void {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
}

export async function toPng({ svg, w, h }: Picture): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    await new Promise<void>((ok, fail) => {
      img.onload = () => ok();
      img.onerror = () => fail(new Error("kunde inte rita planen"));
      img.src = url;
    });
    const k = Math.min(3, 3600 / Math.max(w, h)); // about 3× for a crisp image, capped for very large views
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w * k);
    canvas.height = Math.round(h * k);
    canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/png"));
    if (!blob) throw new Error("kunde inte koda bilden");
    return blob;
  }
  finally {
    URL.revokeObjectURL(url);
  }
}

const toDataUrl = (blob: Blob) => new Promise<string>((ok, fail) => {
  const reader = new FileReader();
  reader.onload = () => ok(typeof reader.result === "string" ? reader.result : "");
  reader.onerror = () => fail(new Error("kunde inte läsa bilden"));
  reader.readAsDataURL(blob);
});

/** The whole plan as one file, image included, for the import button. */
export async function planFile(id: string, name: string, data: PlanData): Promise<PlanFile> {
  const file: PlanFile = { format: PLAN_FILE_FORMAT, name, data };
  if (data.image) {
    const res = await fetch(imageUrl(id, data.image.rev));
    if (res.ok) file.image = await toDataUrl(await res.blob());
  }
  return file;
}

export const fileSlug = (name: string) =>
  name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "planlosning";
