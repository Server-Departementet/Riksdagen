import assert from "node:assert/strict";
import { test } from "node:test";
import { filterNearDuplicatePlays, PLAY_DEDUPE_TOLERANCE_MS } from "./play-dedupe";

const at = (ms: number) => new Date(ms);
const base = 1_700_000_000_000;

await test("drops a candidate whose stored play drifted a few seconds", () => {
  // The typical case: the recently-played job stored the play, the takeout
  // records the same listen with a timestamp a few seconds off
  const candidates = [{ trackId: "a", playedAt: at(base + 4_000) }];
  const existing = [{ trackId: "a", playedAt: at(base) }];

  assert.deepEqual(filterNearDuplicatePlays(candidates, existing), []);
});

await test("keeps a candidate outside the tolerance", () => {
  const candidates = [{ trackId: "a", playedAt: at(base + PLAY_DEDUPE_TOLERANCE_MS + 1) }];
  const existing = [{ trackId: "a", playedAt: at(base) }];

  assert.deepEqual(filterNearDuplicatePlays(candidates, existing), candidates);
});

await test("a drift of exactly the tolerance still counts as a duplicate", () => {
  const candidates = [{ trackId: "a", playedAt: at(base + PLAY_DEDUPE_TOLERANCE_MS) }];
  const existing = [{ trackId: "a", playedAt: at(base) }];

  assert.deepEqual(filterNearDuplicatePlays(candidates, existing), []);
});

await test("the tolerance applies in both directions", () => {
  const candidates = [{ trackId: "a", playedAt: at(base - 4_000) }];
  const existing = [{ trackId: "a", playedAt: at(base) }];

  assert.deepEqual(filterNearDuplicatePlays(candidates, existing), []);
});

await test("a nearby play of a different track is not a duplicate", () => {
  const candidates = [{ trackId: "a", playedAt: at(base) }];
  const existing = [{ trackId: "b", playedAt: at(base) }];

  assert.deepEqual(filterNearDuplicatePlays(candidates, existing), candidates);
});

await test("nothing is dropped when there are no stored plays", () => {
  const candidates = [
    { trackId: "a", playedAt: at(base) },
    { trackId: "b", playedAt: at(base + 1_000) },
  ];

  assert.deepEqual(filterNearDuplicatePlays(candidates, []), candidates);
});

await test("filters each candidate independently against all stored plays", () => {
  const candidates = [
    { trackId: "a", playedAt: at(base + 2_000) }, // dupe of stored a
    { trackId: "a", playedAt: at(base + 60_000) }, // genuine repeat listen later
    { trackId: "b", playedAt: at(base + 3_000) }, // dupe of stored b
    { trackId: "c", playedAt: at(base) }, // never stored
  ];
  const existing = [
    { trackId: "a", playedAt: at(base) },
    { trackId: "b", playedAt: at(base) },
  ];

  assert.deepEqual(filterNearDuplicatePlays(candidates, existing), [
    { trackId: "a", playedAt: at(base + 60_000) },
    { trackId: "c", playedAt: at(base) },
  ]);
});

await test("keeps extra candidate fields on the survivors", () => {
  // The import route passes full TrackPlayCreateManyInput rows through
  const candidates = [{ trackId: "a", playedAt: at(base), userId: "u1", imported: true }];

  assert.deepEqual(filterNearDuplicatePlays(candidates, []), candidates);
});

await test("a custom tolerance overrides the default", () => {
  const candidates = [{ trackId: "a", playedAt: at(base + 2_000) }];
  const existing = [{ trackId: "a", playedAt: at(base) }];

  assert.deepEqual(filterNearDuplicatePlays(candidates, existing, 1_000), candidates);
  assert.deepEqual(filterNearDuplicatePlays(candidates, existing, 2_000), []);
});
