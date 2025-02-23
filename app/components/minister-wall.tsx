import Link from "next/link";
import ministersDB from "@root/db/ministers.json";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, } from "@/components/ui/accordion";
import md from "@/lib/markdown";

const ministerAccordionItems = Object.entries(ministersDB).map(([ministerID, minister]) => {
    return (
        <AccordionItem key={ministerID} value={ministerID}>
            <AccordionTrigger>
                <span dangerouslySetInnerHTML={md(minister.title)}></span>
            </AccordionTrigger>
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
        <Link href="/ministrar" className="no-underline">
            <h2 className="w-full text-center mb-1">Ministerposterna</h2>
        </Link>

        <Accordion className="w-10/12 max-w-prose" type="multiple">
            {ministerAccordionItems}
        </Accordion>
    </section>
)

export default ministerWall;