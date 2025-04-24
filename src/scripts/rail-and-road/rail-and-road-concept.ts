
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


const canvas: HTMLCanvasElement = document.querySelector("canvas") as HTMLCanvasElement;
const ctx: CanvasRenderingContext2D = canvas.getContext("2d") as CanvasRenderingContext2D;

canvas.width = 100;
canvas.height = 100;

for (let i = 0; i < 100; i++) {
  const l = i / 100;
  const A = 1;
  const xValue = x(l, A);
  const yValue = y(l, A);
  ctx.fillStyle = "black";
  ctx.fillRect(xValue + canvas.width / 2, -yValue + canvas.height / 2, 1, 1);
}