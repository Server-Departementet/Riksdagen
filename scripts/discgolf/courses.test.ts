import assert from "node:assert/strict";
import { test } from "node:test";
import path from "node:path";
import {
  buildScoreTable,
  coursePar,
  findCourse,
  formatRelative,
  loadCourses,
  parseCourseFile,
  relativeToPar,
} from "./courses";

await test("parseCourseFile parses name and holes", () => {
  const course = parseCourseFile("ultuna\n1 3\n2 4\nX1 3\n", "ultuna");

  assert.equal(course.name, "ultuna");
  assert.deepEqual(course.aliases, []);
  assert.deepEqual(course.holes, [
    { id: "1", par: 3 },
    { id: "2", par: 4 },
    { id: "X1", par: 3 },
  ]);
});

await test("parseCourseFile parses comma separated aliases in the name line", () => {
  const course = parseCourseFile("rosendal, rosen, dgb rosendal\n1 3\n", "rosendal");

  assert.equal(course.name, "rosendal");
  assert.deepEqual(course.aliases, ["rosen", "dgb rosendal"]);
});

await test("findCourse matches aliases case-insensitively", () => {
  const courses = [parseCourseFile("rosendal, rosen, dgb rosendal\n1 3\n", "rosendal")];

  assert.equal(findCourse(courses, "Rosen")?.name, "rosendal");
  assert.equal(findCourse(courses, "DGB Rosendal")?.name, "rosendal");
  assert.equal(findCourse(courses, "rosendalen"), undefined);
});

await test("parseCourseFile rejects malformed files", () => {
  assert.throws(() => parseCourseFile("bara-ett-namn\n", "trasig"), /at least one hole line/);
  assert.throws(() => parseCourseFile("bana\n1 tre\n", "trasig"), /Invalid hole line/);
  assert.throws(() => parseCourseFile("bana\n1 3\n1 4\n", "trasig"), /Duplicate hole/);
});

await test("loadCourses reads every checked-in course file", () => {
  const courses = loadCourses(path.join(import.meta.dirname, "courses"));

  const kristallen = findCourse(courses, "Kristallen");
  assert.ok(kristallen);
  assert.equal(kristallen.holes.length, 9);
  assert.equal(coursePar(kristallen), 29);

  const ultuna = findCourse(courses, "ULTUNA");
  assert.ok(ultuna);
  assert.equal(ultuna.holes.length, 20);
  assert.ok(ultuna.holes.some((hole) => hole.id === "X1"));

  assert.equal(findCourse(courses, "finnsinte"), undefined);
});

await test("formatRelative formats over, under, and even par", () => {
  assert.equal(formatRelative(3), "+3");
  assert.equal(formatRelative(-2), "-2");
  assert.equal(formatRelative(0), "±0");
});

// Scores from the round in message-demo (Kristallen, 6 juli 2026)
const liljemark = { "1": 4, "2": 5, "3": 5, "4": 3, "5": 11, "6": 5, "7": 3, "8": 8, "9": 5 };
const axel = { "1": 6, "2": 7, "3": 4, "4": 6, "5": 7, "6": 6, "7": 4, "8": 6, "9": 6 };
const winroth = { "1": 5, "2": 4, "3": 5, "4": 6, "5": 20, "6": 5, "7": 4, "8": 5, "9": 7 };

await test("relativeToPar matches the demo round", () => {
  const kristallen = parseCourseFile("kristallen\n1 3\n2 3\n3 3\n4 3\n5 4\n6 3\n7 3\n8 3\n9 4", "kristallen");

  assert.equal(relativeToPar(kristallen, liljemark), 49 - 29);
  assert.equal(relativeToPar(kristallen, axel), 52 - 29);
  assert.equal(relativeToPar(kristallen, winroth), 61 - 29);
});

await test("relativeToPar only counts recorded holes", () => {
  const course = parseCourseFile("bana\n1 3\n2 3\n3 3", "bana");

  assert.equal(relativeToPar(course, { "1": 4 }), 1);
  assert.equal(relativeToPar(course, { "1": 4, "okänt": 10 }), 1);
});

await test("buildScoreTable renders pars and averages for the demo round", () => {
  const kristallen = parseCourseFile("kristallen\n1 3\n2 3\n3 3\n4 3\n5 4\n6 3\n7 3\n8 3\n9 4", "kristallen");
  const table = buildScoreTable(kristallen, [liljemark, axel, winroth]);

  assert.equal(table, [
    "Hål  Par  Snitt",
    "---------------",
    "1      3    5.0",
    "2      3    5.3",
    "3      3    4.7",
    "4      3    5.0",
    "5      4   12.7",
    "6      3    5.3",
    "7      3    3.7",
    "8      3    6.3",
    "9      4    6.0",
  ].join("\n"));
});

await test("buildScoreTable without a course matches the old format", () => {
  const table = buildScoreTable(undefined, [{ "1": 5 }, { "1": 6, "2": 4 }]);

  assert.equal(table, [
    "Hål  Snitt",
    "----------",
    "1      5.5",
    "2      4.0",
  ].join("\n"));
});

await test("buildScoreTable skips unplayed holes and appends unknown ones", () => {
  const course = parseCourseFile("bana\n1 3\n2 3\n3 3", "bana");
  const table = buildScoreTable(course, [{ "1": 4, "10": 6 }]);

  assert.equal(table, [
    "Hål  Par  Snitt",
    "---------------",
    "1      3    4.0",
    "10     -    6.0",
  ].join("\n"));
});
