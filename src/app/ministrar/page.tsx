import { MinistersList } from "@/components/minister-posts";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ministrar",
  description: "Lista över ministrarna i 'Regeringen'.",
};

export default function Page() {
  return (
    <main>
      <MinistersList />
    </main>
  );
}