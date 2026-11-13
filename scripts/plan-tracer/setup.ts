import "dotenv/config";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { env } from "node:process";
import { fileURLToPath } from "node:url";
import Anthropic, { toFile } from "@anthropic-ai/sdk";
import { LISTING_HOSTS, TOOLKIT_FILE } from "@/lib/planner/tracer/config";

/*
 * One-time (and after every prompt or host-list change) setup of the AI floor
 * plan tracer: creates or updates the Claude Managed Agents agent and the
 * sandbox environment its sessions run in, from system-prompt.md and
 * LISTING_HOSTS. The web app only ever starts sessions on the ids printed here.
 *
 *   ./node_modules/.bin/tsx scripts/plan-tracer/setup.ts
 *
 * Needs ANTHROPIC_API_KEY. With PLAN_TRACER_AGENT_ID / PLAN_TRACER_ENVIRONMENT_ID
 * already in .env it updates those in place (the agent gets a new version; running
 * sessions keep theirs); without them it creates new ones and prints the lines to add.
 *
 * It also uploads the measuring toolkit (planmeasure.py) the prompt tells the agent to
 * use, and prints its file id for PLAN_TRACER_TOOLKIT_FILE_ID; the web app mounts that
 * file into every session. The upload is named after the file's contents, so a rerun
 * with an unchanged toolkit keeps the id in .env and a changed one prints a new id.
 */

const MODEL = env.PLAN_TRACER_MODEL ?? "claude-opus-5-5";
const EFFORT = env.PLAN_TRACER_EFFORT ?? "high";
const here = dirname(fileURLToPath(import.meta.url));

const client = new Anthropic();

const environmentParams = {
  name: "planlosning-tracer",
  description: "Sandbox for the Riksdagen floor plan tracer: Python with Pillow, reaching only the listing sites.",
  config: {
    type: "cloud" as const,
    // Deny by default: only the package registries (for Pillow) and the listing sites.
    networking: { type: "limited" as const, allow_package_managers: true, allowed_hosts: LISTING_HOSTS },
  },
};

const agentParams = {
  name: "Planlösning tracer",
  description: "Turns a floor plan picture or a listing link into a plan file for riksdagen's /planlosning.",
  model: { id: MODEL, effort: EFFORT as "low" | "medium" | "high" | "xhigh" | "max" },
  system: readFileSync(join(here, "system-prompt.md"), "utf8"),
  tools: [
    {
      type: "agent_toolset_20260401" as const,
      // Nobody watches a trace, so the server evaluates each call; the web app denies any it pauses on.
      default_config: { enabled: true, permission_policy: { type: "auto" as const } },
      configs: [
        { name: "web_search" as const, enabled: false },
        { name: "web_fetch" as const, enabled: true, allowed_domains: LISTING_HOSTS },
      ],
    },
  ],
};

/** The id of the uploaded toolkit: the one in .env when it still holds this very file, else a fresh upload. */
async function toolkit(): Promise<{ id: string; fresh: boolean }> {
  const bytes = readFileSync(join(here, TOOLKIT_FILE));
  const name = `planmeasure-${createHash("sha256").update(bytes).digest("hex").slice(0, 12)}.py`;
  if (env.PLAN_TRACER_TOOLKIT_FILE_ID) {
    try {
      const current = await client.beta.files.retrieveMetadata(env.PLAN_TRACER_TOOLKIT_FILE_ID);
      if (current.filename === name) return { id: current.id, fresh: false };
    }
    catch (err) {
      if (!(err instanceof Anthropic.NotFoundError)) throw err; // gone: upload it again
    }
  }
  const file = await client.beta.files.upload({ file: await toFile(bytes, name, { type: "text/plain" }) });
  return { id: file.id, fresh: true };
}

async function main() {
  const tool = await toolkit();
  const environment = env.PLAN_TRACER_ENVIRONMENT_ID
    ? await client.beta.environments.update(env.PLAN_TRACER_ENVIRONMENT_ID, environmentParams)
    : await client.beta.environments.create(environmentParams);
  const agent = env.PLAN_TRACER_AGENT_ID
    ? await client.beta.agents.update(env.PLAN_TRACER_AGENT_ID, agentParams)
    : await client.beta.agents.create(agentParams);

  console.log(`Environment ${environment.id} and agent ${agent.id} (version ${agent.version}, ${MODEL} at ${EFFORT} effort) are up to date.`);
  console.log(`Listing sites the sandbox can reach: ${LISTING_HOSTS.join(", ")}`);
  if (!env.PLAN_TRACER_AGENT_ID || !env.PLAN_TRACER_ENVIRONMENT_ID) {
    console.log("\nAdd these to .env on every server that should offer the tracer:\n");
    console.log(`PLAN_TRACER_AGENT_ID="${agent.id}"`);
    console.log(`PLAN_TRACER_ENVIRONMENT_ID="${environment.id}"`);
  }
  if (tool.fresh) {
    console.log(`\nThe measuring toolkit was uploaded. ${env.PLAN_TRACER_TOOLKIT_FILE_ID ? "Replace the old id in .env with" : "Add to .env on every server"}:\n`);
    console.log(`PLAN_TRACER_TOOLKIT_FILE_ID="${tool.id}"`);
    console.log("\nUntil the web app is restarted with it, traces run with the previous toolkit, or with none (the agent then writes its own measuring code, which costs more).");
  }
  else console.log(`The measuring toolkit ${tool.id} is unchanged.`);
}

main().catch((err: unknown) => {
  if (err instanceof Anthropic.AuthenticationError) console.error("ANTHROPIC_API_KEY is missing or not accepted.");
  else if (err instanceof Anthropic.APIError) console.error(`The API refused the setup (${err.status}): ${err.message}`);
  else console.error(err);
  process.exitCode = 1;
});
