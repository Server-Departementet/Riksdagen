import { MinisterPosts } from "@/components/minister-posts";
import { Metadata } from "next";
import { metadata as rootMetadata } from "@/app/layout";

export const metadata: Metadata = {
  ...rootMetadata,
  title: "Riksdagen - Ministrar",
}

export default function Page() {
  return (
    <main>
      <MinisterPosts />
    </main>
  )
}