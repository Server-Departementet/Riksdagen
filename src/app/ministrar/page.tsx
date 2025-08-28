import { MinistersList } from "@/components/minister-posts";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ministrar"
};

export default function Page() {
  return (
    <main>
      <MinistersList />
    </main>
  );
}