import ministerWall from "@/components/minister-wall";
import { Metadata } from "next";
import { metadata as rootMetadata } from "@/app/layout";

export const metadata: Metadata = {
  ...rootMetadata,
  title: "Riksdagen - Ministrar",
}

export default function Page() {
  return (
    <main>
      {ministerWall}
    </main>
  )
}