import { Quote } from "@/app/citat/types";
import fs from "node:fs";

export default function RawQuotePage() {
  const quotes: Quote[] = JSON.parse(fs.readFileSync("scripts/discord/quotes.json", "utf-8"));

  return <main>
    <h2 className="mt-2 mb-1">Råa citat</h2>
    <ul>
      {quotes.map(q => (
        <li key={q.id} className="*:ms-3">
          <a href={q.link} className="global">Länk</a>
          <span>{new Date(q.createdTimestamp).toLocaleString()}</span>
          <span>
            {q.body} - {q.quotee}
          </span>
        </li>
      ))}
    </ul>

  </main>;
}