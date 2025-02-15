import ministerWall from "@/components/minister-wall";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Riksdagen - Ministrar",
}

export default function Page() {
    return (
        <main>
            {ministerWall}
        </main>
    )
}