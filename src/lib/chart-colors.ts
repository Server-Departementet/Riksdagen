// Categorical slots of the validated chart palette (light surface), assigned in this
// fixed order and never cycled into new hues. Colors follow the entity, never its rank.
export const SERIES_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"];

/*
 * Line colours from people's mean avatar colours. Those are often muddy, so each keeps its
 * hue but its OKLab lightness is clamped to a range that reads on white (≥ 3:1 contrast at
 * the top end), and colours too close to each other get their lightness spread apart.
 */
const L_MIN = 0.35;
const L_MAX = 0.66;
/** OKLab distance below which two lines are hard to tell apart. */
const MIN_DISTANCE = 0.12;

/** Display colours for people charted together, in input order; null falls back to the palette. */
export function lineColors(avatarColors: (string | null)[]): string[] {
  const labs: Lab[] = avatarColors.map((hex, i): Lab => {
    const lab = hex ? hexToOklab(hex) : null;
    return lab ?? hexToOklab(SERIES_COLORS[i % SERIES_COLORS.length] ?? "#2a78d6") ?? { l: 0.5, a: 0, b: 0 };
  });
  for (const lab of labs) lab.l = clamp(lab.l, L_MIN, L_MAX);

  for (let pass = 0; pass < 50; pass++) {
    let moved = false;
    for (let i = 0; i < labs.length; i++) {
      for (let j = i + 1; j < labs.length; j++) {
        const a = labs[i], b = labs[j];
        if (!a || !b || distance(a, b) >= MIN_DISTANCE) continue;
        // Push the lighter one lighter and the darker one darker, sliding along at the bounds
        const [light, dark] = a.l >= b.l ? [a, b] : [b, a];
        const step = 0.01;
        if (light.l + step <= L_MAX) light.l += step;
        else dark.l = Math.max(L_MIN, dark.l - step);
        if (dark.l - step >= L_MIN) dark.l -= step;
        else light.l = Math.min(L_MAX, light.l + step);
        moved = true;
      }
    }
    if (!moved) break;
  }
  return labs.map(oklabToHex);
}

type Lab = { l: number; a: number; b: number };

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function distance(a: Lab, b: Lab) {
  return Math.hypot(a.l - b.l, a.a - b.a, a.b - b.b);
}

function hexToOklab(hex: string): Lab | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!match?.[1]) return null;
  const n = parseInt(match[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(c => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return {
    l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

function oklabToHex({ l: L, a: A, b: B }: Lab): string {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return "#" + linear.map(v => {
    const c = clamp(v, 0, 1);
    const srgb = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
    return Math.round(srgb * 255).toString(16).padStart(2, "0");
  }).join("");
}
