
const truncationTable = {
  1e3: "t", // Tusen
  1e6: "mn", // Miljon
  1e9: "md", // Miljard
};

export function truncateNumber(num: number): string {
  for (const [value, suffix] of Object.entries(truncationTable).reverse()) {
    const numericValue = Number(value);
    if (num >= numericValue) {
      const truncated = (num / numericValue).toFixed(2).replace(/\.0$/, "");
      return `${truncated}${suffix}`;
    }
  }
  return num.toString();
}

type TimeUnitName = "år" | "månader" | "veckor" | "dagar" | "timmar" | "minuter" | "sekunder";
type TimeUnit = { name: TimeUnitName, value: number };
export function convertSecondsToTimeUnits(seconds: number): TimeUnit[] {
  if (!Number.isFinite(seconds) || seconds <= 0) return [];

  let remaining = Math.floor(seconds);

  const units: { name: TimeUnitName; sec: number }[] = [
    { name: "år", sec: 31536000 },
    { name: "månader", sec: 2592000 },
    { name: "veckor", sec: 604800 },
    { name: "dagar", sec: 86400 },
    { name: "timmar", sec: 3600 },
    { name: "minuter", sec: 60 },
    { name: "sekunder", sec: 1 },
  ];

  const output: TimeUnit[] = [];

  for (const unit of units) {
    const value = Math.floor(remaining / unit.sec);
    if (value > 0) {
      output.push({ name: unit.name, value });
      remaining %= unit.sec;
    }
  }

  return output;
}