import { Quote } from "@/app/citat/types";
import fs from "node:fs";

export default function QuoteStatsPage() {
  const quotes: Quote[] = JSON.parse(fs.readFileSync("scripts/discord/quotes.json", "utf-8"));

  return <main>
    <h1 className="mt-4">Citatstatistik</h1>
    <ul>
      {quotes.map(q => (
        <li key={q.id}>
          {q.body} - {q.quotee}
        </li>
      ))}
    </ul>

  </main>;
}