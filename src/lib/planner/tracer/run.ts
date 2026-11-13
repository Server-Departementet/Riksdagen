import "server-only";
import Anthropic, { toFile } from "@anthropic-ai/sdk";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import type { PlanData } from "@/lib/planner/plan";
import { MAX_IMAGE_BYTES, cleanName, emptyPlan, sanitizePlan, sniffImageType, uid } from "@/lib/planner/plan";
import type { TraceStatus } from "@/lib/planner/tracer/config";
import { TOOLKIT_FILE, tracerIds, tracerLimits } from "@/lib/planner/tracer/config";

/*
 * Runs one floor plan trace: a Claude Managed Agents session whose agent (set up
 * by scripts/plan-tracer/setup.ts) measures the plan picture in its sandbox and
 * writes plan.json, which ends up in a FloorPlan.
 *
 * A trace takes minutes, so nothing here holds a request open. start() creates
 * the session and returns; a driver then polls the session's events from this
 * process until it finishes. Everything the driver needs is in the PlanTrace row
 * and the session itself, so after a restart the next status request simply
 * starts a new driver for a trace that is still running.
 */

const POLL_MS = 5000;
type Bytes = Uint8Array<ArrayBuffer>;
const EXTENSION = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" } as const;

// Starter rubric for the grader that checks each attempt before the session may finish. Tune the criteria.
const RUBRIC = `# Floor plan trace
- /mnt/session/outputs/plan.json exists, is valid JSON, and has "format": "riksdagen-planlosning", a "name" and a "data" object with walls, windows, fixtures, dims, labels and an empty items list.
- data.image has the picture's real pixel size as w and h, a positive cmPerPx, and calibrated true.
- If the listing or the drawing states the flat's total floor area, data.area is that number in m²; otherwise data.area is absent.
- Every wall line of the flat in the drawing is covered by a wall rectangle, and no wall rectangle lies across a door opening or on open floor.
- Every kitchen unit, fridge/freezer and wardrobe drawn in the plan is a fixture that sits against its wall.
- Every window in the drawing is a window rectangle lying in its wall.
- The scale was set from a scale bar or from standard 60 cm modules, and was cross-checked against at least two of: listed area, door openings, window modules. The numbers are in the report.
- All ids are unique within their list, and no rectangle has a width or height below 1.
- /mnt/session/outputs/report.md exists, is in Swedish, and states the main measurements, how the scale was set with its tolerance, and what was assumed or left out.
- If the job gave no picture, the drawing that was measured is saved as /mnt/session/outputs/plan-image.png, .jpg or .webp.
`;
// Added when the toolkit is mounted, so the grader reads its numbers instead of writing measuring code of its own.
const RUBRIC_TOOLKIT = `
To check the plan against the picture, run \`python3 /mnt/session/uploads/${TOOLKIT_FILE} check <picture> /mnt/session/outputs/plan.json\`: it prints the format rules that are broken, how much of each wall lies on ink, the drawn lines nothing covers, and the enclosed area. \`overlay <picture> /mnt/session/outputs/plan.json -o /tmp/overlay.png\` paints the plan over the picture for one look.
`;

export const toStatus = (t: { id: string; status: string; planId: string; step: number; note: string | null; costCents: number | null }): TraceStatus =>
  ({ id: t.id, status: t.status === "done" || t.status === "failed" ? t.status : "running", planId: t.planId, step: t.step, note: t.note ?? "", costCents: t.costCents });

/** Why a trace can't be started right now, in Swedish for the minister, or null when it can. */
export async function refusal(ownerId: string): Promise<string | null> {
  const limits = tracerLimits(), dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [mineRunning, running, mineToday, today] = await Promise.all([
    prisma.planTrace.count({ where: { ownerId, status: "running" } }),
    prisma.planTrace.count({ where: { status: "running" } }),
    prisma.planTrace.count({ where: { ownerId, createdAt: { gt: dayAgo } } }),
    prisma.planTrace.count({ where: { createdAt: { gt: dayAgo } } }),
  ]);
  if (mineRunning) return "Du har redan en ritning som ritas av. Vänta tills den är klar.";
  if (running >= limits.concurrent) return "För många ritningar ritas av just nu. Försök igen om några minuter.";
  if (mineToday >= limits.perMinisterPerDay) return `Du har använt dina ${limits.perMinisterPerDay} AI-ritningar för det här dygnet.`;
  if (today >= limits.totalPerDay) return "Dygnets gemensamma kvot av AI-ritningar är slut. Försök igen i morgon.";
  return null;
}

export async function usedToday(ownerId: string): Promise<number> {
  return prisma.planTrace.count({ where: { ownerId, createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } });
}

export type TraceInput = {
  ownerId: string;
  /** The plan picture, already checked to be a PNG, JPEG or WebP within the size limit */
  image: { bytes: Bytes; type: keyof typeof EXTENSION } | null;
  listingUrl: string | null;
  /** Anything the minister wants the agent to know */
  note: string;
};

/**
 * Start a trace. The plan it fills in exists from the start, holding the uploaded
 * picture: if the trace fails, the minister still has it to trace by hand.
 * Throws the SDK's errors when the session can't be created.
 */
export async function start(input: TraceInput): Promise<TraceStatus> {
  const client = new Anthropic();
  const { agentId, environmentId, toolkitFileId } = tracerIds(), limits = tracerLimits();
  const planId = uid(), traceId = uid();

  let picture = "No picture was given: get the drawing from the listing and save it as plan-image.";
  const resources: { type: "file"; file_id: string; mount_path: string }[] = [];
  if (input.image) {
    const name = `plan.${EXTENSION[input.image.type]}`;
    const meta = await sharp(input.image.bytes).metadata();
    const file = await client.beta.files.upload({ file: await toFile(input.image.bytes, name, { type: input.image.type }) });
    resources.push({ type: "file", file_id: file.id, mount_path: `/${name}` });
    picture = `Picture: /mnt/session/uploads/${name} (${meta.width} × ${meta.height} px). Trace this picture; do not write plan-image.`;
  }
  const describe = (toolkit: boolean) => [
    "Trace this floor plan for the flat planner and write plan.json and report.md to /mnt/session/outputs/.",
    picture,
    input.listingUrl ? `Listing: ${input.listingUrl}` : "No listing link was given.",
    toolkit ? `Toolkit: /mnt/session/uploads/${TOOLKIT_FILE}` : "No toolkit is mounted: measure with your own code.",
    input.note ? `Note from the person who asked: ${input.note}` : "",
  ].filter(Boolean).join("\n");
  const create = (toolkit: boolean) => client.beta.sessions.create({
    agent: agentId,
    environment_id: environmentId,
    title: `Planlösning ${traceId}`,
    resources: toolkit ? [...resources, { type: "file", file_id: toolkitFileId, mount_path: `/${TOOLKIT_FILE}` }] : resources,
    // The platform stops issuing model requests once the session has cost this much at list prices.
    budget: { type: "limit", max_list_cost: { amount: String(limits.maxCostCents), currency: "USD" } },
    initial_events: [limits.graderIterations > 0
      // One deliverable, so the session is an outcome: a grader checks each attempt against the rubric.
      ? { type: "user.define_outcome", description: describe(toolkit), rubric: { type: "text", content: RUBRIC + (toolkit ? RUBRIC_TOOLKIT : "") }, max_iterations: limits.graderIterations }
      // No grader: the agent works until it considers the job done.
      : { type: "user.message", content: [{ type: "text", text: describe(toolkit) }] }],
  });

  await prisma.floorPlan.create({
    data: {
      id: planId, ownerId: input.ownerId, name: "Ritas av med AI…", data: emptyPlan(), editedAt: new Date(),
      ...(input.image ? { image: input.image.bytes, imageType: input.image.type } : {}),
    },
  });
  try {
    const session = await create(!!toolkitFileId).catch((err: unknown) => {
      // A toolkit file that has expired or been deleted must not take the tracer down with it: the agent can measure without.
      if (!toolkitFileId || !(err instanceof Anthropic.BadRequestError || err instanceof Anthropic.NotFoundError)) throw err;
      console.error(`plan trace ${traceId}: could not start with the toolkit file ${toolkitFileId}, starting without it:`, err.message);
      return create(false);
    });
    const trace = await prisma.planTrace.create({
      data: { id: traceId, ownerId: input.ownerId, status: "running", planId, sessionId: session.id, listingUrl: input.listingUrl, note: "Startar…" },
    });
    ensureDriver(traceId);
    return toStatus(trace);
  }
  catch (err) {
    await prisma.floorPlan.deleteMany({ where: { id: planId, ownerId: input.ownerId } });
    throw err;
  }
}

// One driver per running trace in this process. Kept on globalThis so a dev-server reload doesn't start a second one.
const drivers = ((globalThis as { planTraceDrivers?: Set<string> }).planTraceDrivers ??= new Set<string>());

/** Make sure a running trace is being followed. Called on every status request, which is what revives traces after a restart. */
export function ensureDriver(traceId: string): void {
  if (drivers.has(traceId)) return;
  drivers.add(traceId);
  void drive(traceId)
    .catch((err: unknown) => {
      console.error(`plan trace ${traceId}:`, err);
      // Anything unexpected is not worth retrying forever: the minister gets told and keeps the picture.
      return finish(traceId, "failed", "Något gick fel när ritningen skulle ritas av.").catch(() => undefined);
    })
    .finally(() => drivers.delete(traceId));
}

async function finish(traceId: string, status: "done" | "failed", note: string, costCents?: number | null): Promise<void> {
  const trace = await prisma.planTrace.findUnique({ where: { id: traceId } });
  if (trace?.status !== "running") return;
  await prisma.planTrace.update({ where: { id: traceId }, data: { status, note: note.slice(0, 20_000), finishedAt: new Date(), ...(costCents != null ? { costCents } : {}) } });
  if (status === "failed") {
    // A placeholder plan with no picture is of no use to anyone.
    await prisma.floorPlan.deleteMany({ where: { id: trace.planId, ownerId: trace.ownerId, image: null, name: "Ritas av med AI…" } });
  }
}

const sleep = (ms: number) => new Promise((ok) => setTimeout(ok, ms));

async function drive(traceId: string): Promise<void> {
  const client = new Anthropic(), limits = tracerLimits();
  const seen = new Set<string>();
  let since: string | undefined, steps = 0, said = "";

  for (;;) {
    const trace = await prisma.planTrace.findUnique({ where: { id: traceId } });
    if (trace?.status !== "running" || !trace.sessionId) return;
    const sessionId = trace.sessionId;

    if (Date.now() - trace.createdAt.getTime() > limits.maxMinutes * 60_000) {
      await client.beta.sessions.events.send(sessionId, { events: [{ type: "user.interrupt" }] }).catch(() => undefined);
      await finish(traceId, "failed", `Avbröts efter ${limits.maxMinutes} minuter utan att bli klar.`, await cost(client, sessionId));
      return;
    }

    // The newest state of the session: null while it works, else why it stopped.
    let stopped: { type: string; eventIds: string[] } | null = null;
    try {
      // "At or after" plus the seen set, so events sharing a timestamp with the last one read aren't skipped.
      for await (const event of client.beta.sessions.events.list(sessionId, { order: "asc", ...(since ? { "created_at[gte]": since } : {}) })) {
        if (seen.has(event.id)) continue;
        seen.add(event.id);
        if ("processed_at" in event && event.processed_at) since = event.processed_at;
        if (event.type === "agent.tool_use") steps++;
        else if (event.type === "agent.message") {
          const text = event.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
          if (text) said = text;
        }
        else if (event.type === "session.status_running") stopped = null;
        else if (event.type === "session.status_idle") {
          stopped = { type: event.stop_reason.type, eventIds: event.stop_reason.type === "requires_action" ? event.stop_reason.event_ids : [] };
        }
        else if (event.type === "session.status_terminated") stopped = { type: "terminated", eventIds: [] };
      }
    }
    catch (err) {
      // A blip talking to the API is not the trace failing; a rejected key or a vanished session is.
      if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.NotFoundError) throw err;
      if (!(err instanceof Anthropic.APIError)) throw err;
      await sleep(POLL_MS);
      continue;
    }

    await prisma.planTrace.updateMany({ where: { id: traceId, status: "running" }, data: { step: steps, note: (said || "Arbetar…").slice(0, 600) } });

    if (stopped?.type === "requires_action") {
      // The server couldn't decide whether a tool call was safe. Nobody is here to review it, so it is refused and the agent finds another way.
      await client.beta.sessions.events.send(sessionId, {
        events: stopped.eventIds.map((id) => ({ type: "user.tool_confirmation" as const, tool_use_id: id, result: "deny" as const, deny_message: "Nobody is available to approve this. Do it another way." })),
      }).catch(() => undefined); // already answered, when a restarted driver replays old events
    }
    else if (stopped) {
      const spent = await cost(client, sessionId);
      if (stopped.type === "budget_reached") {
        await finish(traceId, "failed", `Avbröts: ritningen nådde kostnadstaket på ${(limits.maxCostCents / 100).toFixed(2)} USD innan den blev klar.`, spent);
      }
      else {
        // end_turn, terminated, retries_exhausted, refusal: whatever the reason, take the plan if one was written.
        const done = await collect(client, sessionId, trace.planId, trace.ownerId);
        await finish(traceId, done.ok ? "done" : "failed", done.note, spent);
      }
      return;
    }
    await sleep(POLL_MS);
  }
}

async function cost(client: Anthropic, sessionId: string): Promise<number | null> {
  try {
    const amount = Number((await client.beta.sessions.retrieve(sessionId)).usage?.list_cost?.amount);
    return Number.isFinite(amount) ? Math.round(amount) : null;
  }
  catch {
    return null;
  }
}

/** Read what the agent wrote to /mnt/session/outputs/ and put it in the plan. */
async function collect(client: Anthropic, sessionId: string, planId: string, ownerId: string): Promise<{ ok: boolean; note: string }> {
  const outputs = new Map<string, string>(); // file name -> file id
  // Output files take a moment to show up after the session goes idle.
  for (let attempt = 0; attempt < 5 && !outputs.has("plan.json"); attempt++) {
    if (attempt) await sleep(2000);
    for await (const f of client.beta.files.list({ scope_id: sessionId, betas: ["managed-agents-2026-04-01"] })) {
      outputs.set(f.filename.split("/").pop() ?? f.filename, f.id);
    }
  }
  const download = async (name: string) => {
    const id = outputs.get(name);
    return id ? new Uint8Array(await (await client.beta.files.download(id)).arrayBuffer()) : null;
  };
  const text = async (name: string) => {
    const bytes = await download(name);
    return bytes ? new TextDecoder().decode(bytes) : "";
  };

  let parsed: unknown = null;
  try { parsed = JSON.parse(await text("plan.json")); }
  catch { /* missing or not JSON */ }
  const file = typeof parsed === "object" && parsed !== null ? parsed as { name?: unknown; data?: unknown } : {};
  if (typeof file.data !== "object" || file.data === null) {
    return { ok: false, note: "Agenten blev klar utan att lämna någon ritning. Bilden finns kvar om du vill rita av den för hand." };
  }
  const rawData = file.data as Record<string, unknown>;
  const data: PlanData = sanitizePlan(rawData);
  const dropped = (["walls", "windows", "fixtures", "dims", "labels"] as const)
    .map((k) => (Array.isArray(rawData[k]) ? rawData[k].length : 0) - data[k].length).reduce((a, b) => a + b, 0);
  data.items = [];

  const plan = await prisma.floorPlan.findFirst({ where: { id: planId, ownerId }, select: { image: true } });
  if (!plan) return { ok: false, note: "Planlösningen togs bort medan den ritades av." };

  // The picture under the plan: the one the minister uploaded, else the one the agent fetched from the listing.
  let picture: { bytes: Bytes; type: string } | null = null;
  let existing: Bytes | null = plan.image ? new Uint8Array(plan.image) : null;
  if (!existing) {
    for (const name of ["plan-image.png", "plan-image.jpg", "plan-image.jpeg", "plan-image.webp"]) {
      const bytes = await download(name);
      if (!bytes) continue;
      const type = sniffImageType(bytes);
      // Anything we don't store as is gets re-encoded as PNG at the same pixel size, so the agent's measurements still fit.
      picture = type && bytes.length <= MAX_IMAGE_BYTES ? { bytes, type } : { bytes: new Uint8Array(await sharp(bytes).png().toBuffer()), type: "image/png" };
      if (picture.bytes.length > MAX_IMAGE_BYTES) picture = null;
      existing = picture?.bytes ?? null;
      break;
    }
  }
  if (existing && data.image) {
    // The placement is the agent's; the pixel size is taken from the picture itself.
    const meta = await sharp(existing).metadata();
    data.image = { ...data.image, w: meta.width, h: meta.height, rev: Date.now(), calibrated: true };
  }
  else data.image = null;

  await prisma.floorPlan.update({
    where: { id: planId },
    data: { name: cleanName(file.name), data, editedAt: new Date(), ...(picture ? { image: picture.bytes, imageType: picture.type } : {}) },
  });

  const report = (await text("report.md")).trim();
  const notes = [
    report || "Ritningen är klar, men agenten lämnade ingen rapport.",
    dropped ? `\n${dropped} delar i agentens ritning följde inte formatet och togs inte med.` : "",
    data.image ? "" : "\nIngen bild kunde läggas under ritningen.",
  ];
  return { ok: true, note: notes.join("") };
}
