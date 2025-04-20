import { timeInManyUnits } from "@/lib/time-formats"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import React from "react";

export function TimeUnitsBar({ timeMS }: { timeMS: number }) {
  const units = timeInManyUnits(timeMS);

  return (
    <div className="flex flex-row gap-x-2 justify-center whitespace-nowrap overflow-x-auto">
      <TooltipProvider>
        {Object.entries(units).map(([unit, values], i) =>
          <React.Fragment key={unit + "-" + i}>
            <Tooltip>
              <TooltipTrigger>{Math.floor(values.time)} {values.unitShort}</TooltipTrigger>
              <TooltipContent>{values.time.toString() + " " + values.unitLong}</TooltipContent>
            </Tooltip>

            {/* Separator */}
            {i < Object.entries(units).length - 1 && <span className="cursor-default">{"="}</span>}
          </React.Fragment>
        )}
      </TooltipProvider>
    </div>
  )
}