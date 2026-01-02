
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

type TimeUnitNames = "year" | "month" | "week" | "day" | "hour" | "minute" | "second";
export function convertSecondsToTimeUnits(seconds: number): Record<TimeUnitNames, string | null> {
  if (!Number.isFinite(seconds) || seconds <= 0) return {
    year: null,
    month: null,
    week: null,
    day: null,
    hour: null,
    minute: null,
    second: null,
  };

  let remaining = Math.floor(seconds);

  const units: { name: TimeUnitNames; sec: number }[] = [
    { name: "year", sec: 31536000, },
    { name: "month", sec: 2592000, },
    { name: "week", sec: 604800, },
    { name: "day", sec: 86400, },
    { name: "hour", sec: 3600, },
    { name: "minute", sec: 60, },
    { name: "second", sec: 1, },
  ];

  const output: { name: TimeUnitNames; value: number | null; }[] = [];

  for (const unit of units) {
    const value = Math.floor(remaining / unit.sec);
    if (value > 0) {
      output.push({ name: unit.name, value, });
      remaining %= unit.sec;
    }
    else {
      output.push({ name: unit.name, value: null, });
    }
  }

  return Object.fromEntries(output.map((unit) =>
    [
      unit.name,
      unit.value === null ? null :
        new Intl.NumberFormat("sv", {
          style: "unit",
          unit: unit.name,
          unitDisplay: "short",
        }).format(unit.value),
    ]
  )) as Record<TimeUnitNames, string | null>;
}