import { Quote } from "@/app/citat/types";
import fs from "node:fs";

const {
  QUOTE_DIR,
} = process.env;

if (!QUOTE_DIR) {
  throw new Error("QUOTE_DIR environment variable is not set");
}

export default function QuoteStatsPage() {
  const quotes: Quote[] = JSON.parse(fs.readFileSync(`${QUOTE_DIR}/quotes.json`, "utf-8"));

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