import Minister from "@/types/minister";
import ministersDB from "@/db/ministers.json";
import { notFound } from "next/navigation";

export default async function Page({ params, }: {
    params: Promise<{ minister: string }>
}) {
    const ministerID = (await params).minister;
    console.log(ministerID);
    if (!ministersDB.hasOwnProperty(ministerID)) {
        // 404
        notFound();
    }

    const minister = (ministersDB as { [key: string]: Minister })[ministerID];

    return (
        <main>
            <h1 className="mt-14">{minister.title || "Saknar titel"}</h1>
            <h3 className="my-4">Hålls av {minister.name || "någon"}</h3>
            <p>{minister.description}</p>
        </main>
    )
}