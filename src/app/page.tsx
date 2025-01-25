import Link from "next/link";
import ministersDB from "@/db/ministers.json";

export const ministersWall: React.ReactElement = (
    <section className="flex flex-col items-center mt-10">
        <Link href="/ministrar">
            <h2 className="w-full text-center mb-1">Ministerposterna</h2>
        </Link>

        <div className="flex flex-row gap-x-5 flex-wrap w-4/5 justify-center">
            {Object.entries(ministersDB).map(([ministerID, minister]) => {
                return <Link key={ministerID} href={`/ministrar/${ministerID}`}>{minister.title}</Link>
            })}
        </div>
    </section>
);

export default function Page() {
    return (
        <main>
            <h1 className="mt-14">Välkommen till Riksdagen</h1>
            <p className="mt-2 text-xl text-center">Det här är den så kallade <span className="italic">Regeringens</span> samlingswebbsida för allt möjligt</p>

            {ministersWall}
        </main>
    )
}