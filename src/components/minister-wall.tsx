import Link from "next/link";
import ministersDB from "@root/ministers.json";
import md from "@/lib/markdown";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const ministerAccordionItems = Object.entries(ministersDB).map(([ministerID, minister]) => {
  return (
    <AccordionItem key={ministerID} value={ministerID}>
      {/* Minister Title */}
      <AccordionTrigger className="cursor-pointer">
        <span dangerouslySetInnerHTML={md(minister.title)}></span>
      </AccordionTrigger>

      {/* Expanded Content */}
      <AccordionContent>
        <h4 className="mb-1" dangerouslySetInnerHTML={md(minister.name)}></h4>
        <p>
          <span dangerouslySetInnerHTML={md(minister.description)}></span>
          {" "}
          <Link href={`/ministrar/${ministerID}`}>Läs mer</Link>
          .
        </p>
      </AccordionContent>
    </AccordionItem>
  );
});

const ministerWall = (
  <section className="flex flex-col items-center mt-10" >
    {/* Title */}
    <Link href="/ministrar" className="no-underline">
      <h2 className="w-full text-center mb-1">Ministerposterna</h2>
    </Link>

    {/* Entries */}
    <Accordion className="w-10/12 max-w-prose" type="multiple">
      {ministerAccordionItems}
    </Accordion>
  </section>
)

export default ministerWall;