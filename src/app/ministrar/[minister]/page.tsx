import { Minister } from "@/types";
import ministersDB from "@root/ministers.json";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { metadata as rootMetadata } from "@/app/layout";

export const metadata: Metadata = {
  ...rootMetadata,
  title: "Riksdagen - Minister",
}

export default async function Page({ params, }: {
  params: Promise<{ minister: string }>
}) {
  const ministerID = (await params).minister;

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