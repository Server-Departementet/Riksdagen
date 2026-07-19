import fs from "node:fs";
import path from "node:path";

export type Hole = {
  id: string;
  par: number;
};

export type Course = {
  name: string;
  aliases: string[];
  holes: Hole[];
};

/**
 * Course file format: first non-empty line is the course name, optionally
 * followed by comma separated aliases ("rosendal, rosen, dgb rosendal").
 * Every following line is "<hole id> <par>", e.g. "1 3" or "X1 3".
 */
export function parseCourseFile(content: string, sourceName: string): Course {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const [nameLine, ...holeLines] = lines;
  const [name, ...aliases] = (nameLine ?? "").split(",").map((part) => part.trim()).filter((part) => part.length > 0);
  if (!name || holeLines.length === 0) {
    throw new Error(`Course file "${sourceName}" must have a name line followed by at least one hole line`);
  }

  const holes: Hole[] = [];
  for (const line of holeLines) {
    const match = /^(\S+)\s+(\d+)$/.exec(line);
    const [, id, parString] = match ?? [];
    if (!id || !parString) throw new Error(`Invalid hole line "${line}" in course file "${sourceName}"`);
    if (holes.some((hole) => hole.id.toLowerCase() === id.toLowerCase())) {
      throw new Error(`Duplicate hole "${id}" in course file "${sourceName}"`);
    }
    holes.push({ id, par: parseInt(parString, 10) });
  }

  return { name, aliases, holes };
}

function courseNames(course: Course): string[] {
  return [course.name, ...course.aliases];
}

export function loadCourses(dir: string): Course[] {
  const courses: Course[] = [];
  for (const entry of fs.readdirSync(dir)) {
    const filePath = path.join(dir, entry);
    if (!fs.statSync(filePath).isFile()) continue;
    const course = parseCourseFile(fs.readFileSync(filePath, "utf8"), entry);
    for (const name of courseNames(course)) {
      if (findCourse(courses, name)) throw new Error(`Duplicate course name or alias "${name}" in course file "${entry}"`);
    }
    courses.push(course);
  }
  return courses;
}

export function findCourse(courses: Course[], name: string): Course | undefined {
  const normalized = name.trim().toLowerCase();
  return courses.find((course) => courseNames(course).some((courseName) => courseName.toLowerCase() === normalized));
}

function findHole(course: Course, holeId: string): Hole | undefined {
  return course.holes.find((hole) => hole.id.toLowerCase() === holeId.toLowerCase());
}

export function coursePar(course: Course): number {
  return course.holes.reduce((sum, hole) => sum + hole.par, 0);
}

/** Score relative to par, counting only the holes the player has recorded. */
export function relativeToPar(course: Course, score: Record<string, number>): number {
  let relative = 0;
  for (const [holeId, points] of Object.entries(score)) {
    const hole = findHole(course, holeId);
    if (!hole) continue;
    relative += points - hole.par;
  }
  return relative;
}

export function formatRelative(relative: number): string {
  if (relative > 0) return `+${relative}`;
  if (relative < 0) return `${relative}`;
  return "±0";
}

/**
 * Builds the per-hole summary table. Holes follow the course file order with
 * any recorded holes missing from the course file appended at the end.
 * The Par column is omitted when the course is unknown.
 */
export function buildScoreTable(course: Course | undefined, scores: Record<string, number>[]): string {
  const holeIds = course ? course.holes.map((hole) => hole.id) : [];
  const knownIds = new Set(holeIds.map((id) => id.toLowerCase()));
  const extraIds = new Set<string>();
  for (const score of scores) {
    for (const holeId of Object.keys(score)) {
      if (!knownIds.has(holeId.toLowerCase())) extraIds.add(holeId);
    }
  }
  holeIds.push(...[...extraIds].sort((a, b) => a.localeCompare(b, "sv-SE", { numeric: true })));

  const rows: { hole: string; par: string; average: string }[] = [];
  for (const holeId of holeIds) {
    const recorded = scores
      .map((score) => Object.entries(score).find(([id]) => id.toLowerCase() === holeId.toLowerCase())?.[1])
      .filter((points): points is number => points !== undefined);
    if (recorded.length === 0) continue;
    const average = recorded.reduce((sum, points) => sum + points, 0) / recorded.length;
    const hole = course ? findHole(course, holeId) : undefined;
    rows.push({ hole: holeId, par: hole ? String(hole.par) : "-", average: average.toFixed(1) });
  }

  const headers = course ? ["Hål", "Par", "Snitt"] : ["Hål", "Snitt"];
  const cells = rows.map((row) => course ? [row.hole, row.par, row.average] : [row.hole, row.average]);
  const widths = headers.map((header, column) => Math.max(header.length, ...cells.map((row) => row[column]?.length ?? 0)));
  const renderRow = (row: string[]) => row
    .map((cell, column) => column === 0 ? cell.padEnd(widths[column] ?? 0) : cell.padStart(widths[column] ?? 0))
    .join("  ")
    .trimEnd();

  const headerLine = renderRow(headers);
  return [headerLine, "-".repeat(headerLine.length), ...cells.map(renderRow)].join("\n");
}
