
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

export function convertSecondsToTimeUnits(seconds: number): (string | null)[] {
  if (!Number.isFinite(seconds) || seconds <= 0) return [];

  let remaining = Math.floor(seconds);

  const units: { name: string; sec: number }[] = [
    { name: "year", sec: 31536000, },
    { name: "month", sec: 2592000, },
    { name: "week", sec: 604800, },
    { name: "day", sec: 86400, },
    { name: "hour", sec: 3600, },
    { name: "minute", sec: 60, },
    { name: "second", sec: 1, },
  ];

  const output: ({ name: string; value: number; } | null)[] = [];

  for (const unit of units) {
    const value = Math.floor(remaining / unit.sec);
    if (value > 0) {
      output.push({ name: unit.name, value });
      remaining %= unit.sec;
    }
    else {
      output.push(null);
    }
  }

  return output.map((unit) =>
    unit === null ? null :
      new Intl.NumberFormat("sv", {
        style: "unit",
        unit: unit?.name,
        unitDisplay: "short",
      }).format(unit.value)
  );
}