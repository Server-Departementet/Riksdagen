import { Quote } from "@/app/citat/types";
import { ExternalLinkIcon } from "lucide-react";
import fs from "node:fs";

function isMultiSpeakerQuote(content: string): boolean {
  const isMultiLine =
    content.includes("\n")
    && content.split("\n").every(line => line.trim().startsWith("\"") && line.trim().includes("-"));
  return isMultiLine;
}

export default function RawQuotePage() {
  const quotes: Quote[] = JSON.parse(fs.readFileSync("scripts/discord/quotes.json", "utf-8"));

  return <main>
    <h2 className="mt-2 mb-1">Råa citat</h2>

    <ul>
      {quotes.map(q => (
        <li
          key={q.id}
          className="*:ms-3 not-first:border-t-2 py-1 flex flex-row "
        >
          <a
            href={q.link}
            className="global min-w-fit"
            target="_blank"
            rel="noreferrer"
          >
            discord&nbsp;
            <ExternalLinkIcon className="size-3 inline mb-0.5" />
          </a>
          <span className="min-w-fit">{new Date(q.createdTimestamp).toLocaleString()}</span>
          {isMultiSpeakerQuote(q.body)
            ? <p className="whitespace-pre-wrap">
              {q.body}
            </p>
            : <span>
              {q.body} - {q.quotee}
            </span>
          }
        </li>
      ))}
    </ul>
  </main>;
}