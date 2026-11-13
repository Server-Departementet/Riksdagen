import { env } from "node:process";

/*
 * Settings for the AI floor plan tracer. Read by the API routes and by
 * scripts/plan-tracer/setup.ts, which builds the agent and its sandbox from them.
 */

/**
 * Listing sites the agent's sandbox may reach, and so the only sites a listing
 * link may point to. After changing this list, run scripts/plan-tracer/setup.ts
 * again: the sandbox's network rules are part of the environment it creates.
 */
export const LISTING_HOSTS = ["www.bostad.uppsala.se", "bostad.uppsala.se"];

const int = (value: string | undefined, fallback: number) => {
  const n = Number(value);
  return value && Number.isInteger(n) && n >= 0 ? n : fallback;
};

/** Every limit can be changed in .env without a deploy of new code. */
export const tracerLimits = () => ({
  /** Traces one minister may start per 24 hours, failed ones included (they cost money too) */
  perMinisterPerDay: int(env.PLAN_TRACER_PER_MINISTER_PER_DAY, 3),
  /** Traces all ministers together may start per 24 hours */
  totalPerDay: int(env.PLAN_TRACER_TOTAL_PER_DAY, 10),
  /** Traces running at the same time, over all ministers. Each minister runs one at a time. */
  concurrent: int(env.PLAN_TRACER_CONCURRENT, 2),
  /** Hard spend ceiling for one trace, in US cents at list prices. The platform pauses the session there. */
  maxCostCents: Math.max(1, int(env.PLAN_TRACER_MAX_COST_CENTS, 500)),
  /** Give up on a trace after this long */
  maxMinutes: Math.max(1, int(env.PLAN_TRACER_MAX_MINUTES, 30)),
  /**
   * How many times a separate grader may check the result against the rubric (each check is a second
   * model reading the files, and a failed one sends the agent back to revise). 0 starts the trace with a
   * plain message and no grader: cheaper, and then only the agent's own checks stand behind the plan.
   */
  graderIterations: Math.min(20, int(env.PLAN_TRACER_GRADER_ITERATIONS, 2)),
});

/** The measuring toolkit's name in the sandbox: mounted files land under /mnt/session/uploads/. */
export const TOOLKIT_FILE = "planmeasure.py";

export const tracerIds = () => ({
  agentId: env.PLAN_TRACER_AGENT_ID ?? "",
  environmentId: env.PLAN_TRACER_ENVIRONMENT_ID ?? "",
  /** The uploaded scripts/plan-tracer/planmeasure.py, printed by setup.ts. Empty: the agent measures with its own code. */
  toolkitFileId: env.PLAN_TRACER_TOOLKIT_FILE_ID ?? "",
});

/** Whether the server has what it needs to start a trace: an API key and the ids setup.ts printed. */
export const tracerConfigured = () => !!(env.ANTHROPIC_API_KEY && env.PLAN_TRACER_AGENT_ID && env.PLAN_TRACER_ENVIRONMENT_ID);

/** The listing link as a URL when it is one the sandbox can reach, else null. */
export function listingUrl(value: string): URL | null {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" && LISTING_HOSTS.includes(url.hostname) ? url : null;
  }
  catch {
    return null;
  }
}

/** What the planner page shows about a trace */
export type TraceStatus = {
  id: string;
  status: "running" | "done" | "failed";
  planId: string;
  step: number;
  note: string;
  costCents: number | null;
};

/** GET /api/planlosning/trace */
export type TraceOverview = {
  configured: boolean;
  hosts: string[];
  perDay: number;
  usedToday: number;
  /** The minister's trace that is still running, if any */
  active: TraceStatus | null;
};
