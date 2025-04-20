import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import React from "react";

function timeInManyUnits(timeMS: number) {
  const timeInDifferentUnits = {
    s: { number: timeMS / 1000, long: "sekunder", short: "s", longSingular: "sekund" },
    min: { number: timeMS / 60000, long: "minuter", short: "min", longSingular: "minut" },
    h: { number: timeMS / 3600000, long: "timmar", short: "h", longSingular: "timme" },
    d: { number: timeMS / 86400000, long: "dygn", short: "d", longSingular: "dygn" },
    w: { number: timeMS / 604800000, long: "veckor", short: "v", longSingular: "vecka" },
    m: { number: timeMS / 2419200000, long: "månader", short: "m", longSingular: "månad" },
    y: { number: timeMS / 29030400000, long: "år", short: "å", longSingular: "år" },
  };

  return timeInDifferentUnits;
}

async function TimeUnitsBar({ timeMS, className = "" }: { timeMS: number, className?: string }) {
  "use cache";

  const units = timeInManyUnits(timeMS);

  return (
    <div className={`flex flex-row gap-x-2 justify-start items-center whitespace-nowrap overflow-x-auto ${className}`}>
      <TooltipProvider>
        {Object.entries(units).map(([key, unit], i) =>
          <React.Fragment key={key + "-" + i}>
            <Tooltip>
              <TooltipTrigger>{Math.floor(unit.number)} {unit.short}</TooltipTrigger>
              <TooltipContent>
                {/* Unrounded time */}
                {unit.number.toString() + " " + unit.long}

                {/* Percent of a whole unit e.g. `0.01% av 1 vecka` as long as the percentage is below 100% */}
                {unit.number < 1 && <><br />{(unit.number * 100).toFixed(3)}% av {unit.longSingular}</>}
              </TooltipContent>
            </Tooltip>

            {/* Separator */}
            {i < Object.entries(units).length - 1 && <span className="cursor-default h-min">{"="}</span>}
          </React.Fragment>
        )}
      </TooltipProvider>
    </div>
  )
}

export async function TimeAndPlayCountBar(
  {
    timeMS,
    playCount,
    className = "",
  }: {
    timeMS: number,
    playCount: number,
    className?: string
  }
) {
  "use cache";
  return (
    <div className={`w-full *:w-full flex flex-col justify-start items-center gap-y-2 pt-2 *:flex *:lg:flex-row *:flex-col *:justify-center *:gap-x-2 *:overflow-x-auto ${className}`}>
      {/* Time */}
      <div>
        <span className="whitespace-pre">Total lyssningstid:</span>
        <TimeUnitsBar timeMS={timeMS} />
      </div>

      {/* Count */}
      <div>
        <span className="whitespace-pre">Totala lyssningar:</span>
        <span>{playCount}</span>
      </div>
    </div>
  );
}