
export function timeInManyUnits(timeMS: number) {
  const timeInDifferentUnits = {
    s: { time: timeMS / 1000, unitLong: "sekunder", unitShort: "s" },
    min: { time: timeMS / 60000, unitLong: "minuter", unitShort: "min" },
    h: { time: timeMS / 3600000, unitLong: "timmar", unitShort: "h" },
    d: { time: timeMS / 86400000, unitLong: "dygn", unitShort: "d" },
    w: { time: timeMS / 604800000, unitLong: "veckor", unitShort: "v" },
    m: { time: timeMS / 2419200000, unitLong: "månader", unitShort: "m" },
    y: { time: timeMS / 29030400000, unitLong: "år", unitShort: "å" },
  };

  return timeInDifferentUnits;
}