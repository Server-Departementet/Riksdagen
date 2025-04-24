"use strict";
import { colors } from "./lib/colors";
const cols = process.stdout.columns;
const divider = () => console.log(`\n${"░".repeat(cols)}\n`);

divider();

const topGray: [number, number, number] = [153, 153, 153];
const bottomGray: [number, number, number] = [100, 100, 100];

const fullBlock = {
  n: colors.rgbBG(...bottomGray, colors.rgb(...topGray, "██")),
  e: colors.rgbBG(...bottomGray, colors.rgb(...topGray, "██")),
  s: colors.rgbBG(...bottomGray, colors.rgb(...topGray, "██")),
  w: colors.rgbBG(...bottomGray, colors.rgb(...topGray, "██")),
};
const cornerBlock = {
  nw: colors.rgbBG(...bottomGray, colors.rgb(...topGray, "█▀")),
  ne: colors.rgbBG(...bottomGray, colors.rgb(...topGray, "▀█")),
  se: colors.rgbBG(...bottomGray, colors.rgb(...topGray, "▄█")),
  sw: colors.rgbBG(...bottomGray, colors.rgb(...topGray, "█▄")),
};
const halfBlock = {
  n: colors.rgbBG(...bottomGray, colors.rgb(...topGray, "▀▀")),
  e: colors.rgbBG(...bottomGray, colors.rgb(...topGray, " █")),
  s: colors.rgbBG(...bottomGray, colors.rgb(...topGray, "▄▄")),
  w: colors.rgbBG(...bottomGray, colors.rgb(...topGray, "█ ")),
};
const quarterBlock = {
  nw: colors.rgbBG(...bottomGray, colors.rgb(...topGray, "▀ ")),
  ne: colors.rgbBG(...bottomGray, colors.rgb(...topGray, " ▀")),
  se: colors.rgbBG(...bottomGray, colors.rgb(...topGray, " ▄")),
  sw: colors.rgbBG(...bottomGray, colors.rgb(...topGray, "▄ ")),
};

console.log("Full:");
console.log(Object.values(fullBlock).join(" "));
console.log("Corner:");
console.log(Object.values(cornerBlock).join(" "));
console.log("Half:");
console.log(Object.values(halfBlock).join(" "));
console.log("Quarter:");
console.log(Object.values(quarterBlock).join(" "));


const gridSize = { h: 30, w: 30 };
const grid = new Array(gridSize.h)
  .fill([])
  .map(() => new Array(gridSize.w * 2)
    .fill(" ")
    .map((_, i) => i % 2 ? "]" : "[")
    .map((s => colors.rgb(...bottomGray, s)))
  );

const x = (l: number, A: number): number => {
  // Numerical integration using Simpson's rule
  const numSteps = 100;
  const dt = l / numSteps;
  let result = 0;

  for (let i = 0; i <= numSteps; i++) {
    const t = i * dt;
    const weight = (i === 0 || i === numSteps) ? 1 : (i % 2 === 0 ? 2 : 4);
    result += weight * Math.cos(Math.PI * t * t / (2 * A));
  }

  return result * dt / 3;
};
const y = (l: number, A: number): number => {
  // Numerical integration using Simpson's rule
  const numSteps = 100;
  const dt = l / numSteps;
  let result = 0;

  for (let i = 0; i <= numSteps; i++) {
    const t = i * dt;
    const weight = (i === 0 || i === numSteps) ? 1 : (i % 2 === 0 ? 2 : 4);
    result += weight * Math.sin(Math.PI * t * t / (2 * A));
  }

  return result * dt / 3;
};

const I = new Array(30).fill(0).map((_, i) => i / 50);

I.forEach((i) => {
  const xVal = x(i, 1);
  const yVal = y(i, 1);

  const xPos = Math.floor((xVal + 1) * (gridSize.w / 2));
  const yPos = Math.floor((yVal + 1) * (gridSize.h / 2));

  // Replace the two grid x spaces for the full block
});

grid.forEach((row, i) => {
  console.log(i + "\t" + row.join(""));
});

divider();