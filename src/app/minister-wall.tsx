import Link from "next/link";
import ministersDB from "@/db/ministers.json";

const ministerWall = (
    <section className="flex flex-col items-center mt-10" >
        <Link href="/ministrar" className="no-underline">
            <h2 className="w-full text-center mb-1">Ministerposterna</h2>
        </Link>

        <div className="flex flex-row gap-x-5 flex-wrap w-4/5 justify-center">
            {Object.entries(ministersDB).map(([ministerID, minister]) => {
                return <Link key={ministerID} href={`/ministrar/${ministerID}`}>{minister.title}</Link>
            })}
        </div>
    </section>
)

export default ministerWall;