import Link from "next/link";
import ministersDB from "@root/ministers.json" with { type: "json"};
import md from "@/lib/markdown";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Minister } from "@/types";


function MinisterPost(ministerID: string, minister: Minister) {
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
          <Link className="global" href={`/ministrar/${ministerID}`}>Läs mer</Link>
          .
        </p>
      </AccordionContent>
    </AccordionItem>
  );
}

export function MinisterPosts(
  { className = "" }: { className?: string } = {}
) {
  return (
    <section className={`flex flex-col items-center mt-10 mb-5 w-full ${className}`} >
      {/* Title */}
      <Link href="/ministrar" className="no-underline">
        <h2 className="w-full text-center mb-1">Ministerposter</h2>
      </Link>

      {/* Entries */}
      <Accordion className="w-10/12 max-w-prose" type="multiple">
        {Object.entries(ministersDB).map(([ministerID, minister]) => MinisterPost(ministerID, minister))}
      </Accordion>
    </section>
  );
}