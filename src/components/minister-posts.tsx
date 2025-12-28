import Link from "next/link";
import ministersDB from "@root/ministers.json" with { type: "json"};
import md from "@/lib/markdown";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Minister } from "@/types";
import { InfoIcon } from "lucide-react";

export async function MinistersList({ className = "" }: { className?: string }) {
  return (
    <section className={`flex flex-col items-center mt-10 mb-5 w-full ${className}`} >
      {/* Title */}
      <Link href="/ministrar" className="no-underline">
        <h2 className="w-full text-center mb-1">Ministerposter</h2>
      </Link>

      {/* Entries */}
      <Accordion className="w-10/12 max-w-prose" type="multiple">
        {Object.entries(ministersDB).map(([ministerId, minister]) =>
          <MinisterItem key={ministerId} ministerId={ministerId} minister={minister as Minister} />
        )}
      </Accordion>
    </section>
  );
}

function MinisterItem({
  ministerId,
  minister,
}: {
  ministerId: string,
  minister: Minister
}) {
  const formattedTitle = md(minister.title);
  return (
    <AccordionItem key={ministerId} value={ministerId}>
      {/* Minister Title */}
      <AccordionTrigger className="cursor-pointer flex flex-row justify-start items-center gap-x-3">
        {/* Color dot */}
        <div className="rounded-full size-4" style={{
          backgroundColor: minister.color,
          ...(isLightColor(minister.color) ? { border: "1px solid #ccc" } : {}),
        }}></div>

        {/* Minister Title */}
        <p className="flex-1" dangerouslySetInnerHTML={formattedTitle}></p>
      </AccordionTrigger>

      {/* Expanded Content */}
      <AccordionContent>
        {/* Title and holder */}
        <div className="flex flex-row items-center gap-x-2">
          <h4 className="w-fit" dangerouslySetInnerHTML={formattedTitle}></h4>
          {"-"}
          <p className="text-base">{minister.holder}</p>
        </div>

        {/* Time */}
        <p className="text-gray-500 flex flex-row items-center gap-x-1 mb-3">
          <InfoIcon className="text-gray-400" size={"14"} strokeWidth={"2"} />
          Sedan {new Date(minister.createdAt).toLocaleDateString("sv-SE", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        {/* Description */}
        <p dangerouslySetInnerHTML={md(minister.description)} className="mb-3"></p>
      </AccordionContent>
    </AccordionItem>
  );
}

function isLightColor(hexColor: string) {
  const color = hexColor.replace("#", "");

  // Convert to RGB
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);

  // Calculate brightness (using the YIQ formula) results is 0-255
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 200;
}