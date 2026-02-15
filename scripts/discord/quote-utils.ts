import { Quote } from "./types.ts";

export type CustomQuoteMeta = Partial<Pick<Quote, "authorId" | "link" | "sender" | "createdTimestamp">>;

export function isCustomQuoteMeta(obj: unknown): obj is CustomQuoteMeta {
  if (typeof obj !== "object" || obj === null) return false;

  if (
    !("authorId" in obj)
    && !("link" in obj)
    && !("sender" in obj)
    && !("createdTimestamp" in obj)
  ) return false;

  if ("authorId" in obj && typeof obj.authorId !== "string") return false;
  if ("link" in obj && typeof obj.link !== "string") return false;
  if ("sender" in obj && typeof obj.sender !== "string") return false;
  if ("createdTimestamp" in obj && typeof obj.createdTimestamp !== "number") return false;

  return true;
}

export function splitCustomQuoteMeta(content: string): { meta?: CustomQuoteMeta; content: string } {
  const match = /^\s*\[\[\s*([\s\S]*?)\s*\]\]\s*\n?/.exec(content);
  if (!match) return { content };

  const metaJson = match[1];
  let meta: CustomQuoteMeta | undefined = undefined;

  try {
    const metaObject = JSON.parse(metaJson) as unknown;
    if (!isCustomQuoteMeta(metaObject)) {
      throw new Error("Parsed meta does not have the required structure: " + metaJson);
    }
    if (metaObject && typeof metaObject === "object") {
      const maybeAuthorId = typeof metaObject.authorId === "string" ? metaObject.authorId : undefined;
      const maybeSender = typeof metaObject.sender === "string" ? metaObject.sender : undefined;
      const maybeLink = typeof metaObject.link === "string" ? metaObject.link : undefined;

      meta = {
        ...(typeof maybeAuthorId === "string" ? { authorId: maybeAuthorId } : {}),
        ...(typeof maybeSender === "string" ? { sender: maybeSender } : {}),
        ...(typeof maybeLink === "string" ? {
          link: maybeLink,
          createdTimestamp: getTimestampFromDiscordLink(maybeLink) ?? undefined,
        } : {}),
      };
    }
  }
  catch (error) {
    console.warn("Failed to parse custom quote metadata:", error);
  }

  return {
    meta,
    content: content.slice(match[0].length).trimStart(),
  };
}

export function stripCustomQuoteMeta(content: string): string {
  return splitCustomQuoteMeta(content).content;
}

export function getTimestampFromDiscordLink(link: string): number | null {
  const snowflake = link.split("/").at(-1)?.trim();
  if (!snowflake || !/^\d+$/.test(snowflake)) return null;

  return Number((BigInt(snowflake) >> 22n) + 1420070400000n);
}

export function isMultiSpeakerQuote(content: string): boolean {
  const isMultiLine =
    content.includes("\n")
    && content.split("\n").every(line => line.trim().startsWith("\"") && line.trim().includes("-"));
  return isMultiLine;
}