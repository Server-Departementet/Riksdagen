import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getTimestampFromDiscordLink,
  splitCustomQuoteMeta,
  stripCustomQuoteMeta,
} from "./quote-utils.ts";

await test("splitCustomQuoteMeta parses leading metadata", () => {
  const content = `[[{"authorId":"123","link":"https://discord.com/channels/1/2/175928847299117063"}]]\n"Hi" - Vena`;
  const result = splitCustomQuoteMeta(content);

  assert.deepEqual(result.meta, {
    authorId: "123",
    link: "https://discord.com/channels/1/2/175928847299117063",
  });
  assert.equal(result.content, "\"Hi\" - Vena");
});

await test("stripCustomQuoteMeta removes metadata prefix only", () => {
  const content = `[[{"authorId":"123"}]]\n"Hej" - Axel`;
  assert.equal(stripCustomQuoteMeta(content), "\"Hej\" - Axel");
});

await test("getTimestampFromDiscordLink returns null for invalid link", () => {
  assert.equal(getTimestampFromDiscordLink("https://discord.com/channels/1/2/not-a-snowflake"), null);
});

await test("getTimestampFromDiscordLink derives timestamp from snowflake", () => {
  const link = "https://discord.com/channels/1/2/175928847299117063";
  const expected = Number((BigInt("175928847299117063") >> 22n) + 1420070400000n);
  assert.equal(getTimestampFromDiscordLink(link), expected);
});
