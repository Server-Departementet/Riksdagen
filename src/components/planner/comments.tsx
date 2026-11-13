"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { CommentsResponse, PlanCommentView, ReactionKey } from "@/lib/planner/comments";
import { MAX_COMMENT_LENGTH, REACTIONS } from "@/lib/planner/comments";
import { Card, inputClass, primaryClass } from "@/components/planner/controls";

/** Slow on purpose: comments are not a chat, and the answer to every own change already carries the fresh list. */
const POLL_MS = 30_000;
/** How many comments show before "Visa alla": the side panel is narrow and already long. */
const COLLAPSED_COUNT = 3;

const dayText = new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "short" });
const dayYearText = new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "short", year: "numeric" });
const fullText = new Intl.DateTimeFormat("sv-SE", { dateStyle: "long", timeStyle: "short" });

/** "nyss", "5 min sedan", "3 tim sedan", then the date. `now` is the server's clock from the same answer, so a browser clock that is off doesn't matter. */
function whenText(createdAt: number, now: number): string {
  const minutes = Math.floor((now - createdAt) / 60_000);
  if (minutes < 1) return "nyss";
  if (minutes < 60) return `${minutes} min sedan`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)} tim sedan`;
  return (new Date(createdAt).getFullYear() === new Date(now).getFullYear() ? dayText : dayYearText).format(createdAt);
}

/** What to tell the minister when their own action failed. Background refreshes fail without a word. */
function failureText(status: number): string {
  if (status === 0) return "Ingen kontakt med servern. Försök igen om en stund.";
  if (status === 404) return "Planlösningen finns inte på servern än. Försök igen när den har sparats.";
  if (status === 429) return "Det gick lite fort. Vänta en minut och försök igen.";
  return "Det gick inte. Försök igen.";
}

function Face({ comment }: { comment: PlanCommentView }) {
  // Discord avatar URLs die when someone changes picture; fall back to the initial then too.
  const [broken, setBroken] = useState(false);
  return comment.authorAvatar && !broken
    ? <Image width={20} height={20} src={comment.authorAvatar} className="size-5 flex-none rounded-full bg-gray-200" alt="" onError={() => setBroken(true)} />
    : (
      <span aria-hidden className="size-5 flex-none rounded-full bg-gray-400 text-white text-xs font-semibold flex items-center justify-center select-none"
        style={comment.authorColor ? { background: comment.authorColor } : undefined}>
        {(comment.authorName.trim()[0] ?? "?").toUpperCase()}
      </span>
    );
}

/** The card for one plan. Mounted anew for every plan (keyed by its id), so nothing of the previous plan lingers. */
function Comments({ planId }: { planId: string }) {
  const [data, setData] = useState<CommentsResponse | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Requests are numbered so that only the answer to the newest one is shown: a slow poll must not undo a newer post.
  const latest = useRef(0);
  const writing = useRef(false);
  const base = `/api/planlosning/${planId}/comments`;

  useEffect(() => {
    let stopped = false;
    const load = async () => {
      // A hidden tab doesn't poll, and a poll never races the minister's own change, whose answer is fresher anyway.
      if (document.hidden || writing.current) return;
      const turn = ++latest.current;
      try {
        const res = await fetch(`/api/planlosning/${planId}/comments`, { cache: "no-store" });
        if (!res.ok) return;
        const next = await res.json() as CommentsResponse;
        if (!stopped && turn === latest.current) setData(next);
      }
      catch {
        // Offline: keep showing what we have.
      }
    };
    const onVisibility = () => { if (!document.hidden) void load(); };

    void load();
    const timer = setInterval(() => void load(), POLL_MS);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [planId]);

  /** Post, delete or react. Every such call answers with the fresh list. Returns whether it worked. */
  async function write(path: string, method: "POST" | "PUT" | "DELETE", body?: unknown): Promise<boolean> {
    if (writing.current) return false;
    writing.current = true;
    setBusy(true);
    setError("");
    const turn = ++latest.current;
    let status = 0;
    try {
      const res = await fetch(base + path, {
        method,
        cache: "no-store",
        ...(body === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
      });
      status = res.status;
      if (res.ok) {
        const next = await res.json() as CommentsResponse;
        if (turn === latest.current) setData(next);
      }
    }
    catch {
      // Offline: status stays 0.
    }
    writing.current = false;
    setBusy(false);
    const ok = status >= 200 && status < 300;
    if (!ok) setError(failureText(status));
    return ok;
  }

  async function post() {
    const body = draft.trim();
    if (!body || busy) return;
    // The draft is only cleared once the comment is in, so nothing typed is lost to a bad connection.
    if (await write("", "POST", { body })) setDraft("");
  }

  const comments = data?.comments ?? [];
  const hidden = Math.max(0, comments.length - COLLAPSED_COUNT);
  const shown = showAll ? comments : comments.slice(hidden);

  return (
    <Card title={comments.length ? `Kommentarer (${comments.length})` : "Kommentarer"}>
      <div className="flex gap-1" role="group" aria-label="Reagera på planlösningen">
        {REACTIONS.map(([key, emoji, name]) => {
          const reaction = data?.reactions.find((r) => r.key === key);
          const count = reaction?.count ?? 0;
          const mine = data?.mine === key;
          const next: ReactionKey | null = mine ? null : key;
          return (
            <button key={key} type="button" aria-pressed={mine} disabled={busy}
              aria-label={`${name}, ${count} st${mine ? ", din reaktion" : ""}`}
              title={count ? `${name}: ${reaction?.names.join(", ")}` : name}
              className="flex-1 flex items-center justify-center gap-1 border border-gray-300 bg-gray-100 rounded-md px-1 py-1 text-sm font-semibold hover:border-gray-500 aria-pressed:border-orange-700 aria-pressed:bg-orange-50 disabled:cursor-not-allowed"
              onClick={() => void write("/reaction", "PUT", { emoji: next })}>
              <span aria-hidden>{emoji}</span>
              {count > 0 && <span className="text-xs tabular-nums">{count}</span>}
            </button>
          );
        })}
      </div>

      {data && comments.length === 0 && <p className="text-sm text-gray-600 font-normal">Inga kommentarer än.</p>}
      {hidden > 0 && (
        <button type="button" className="self-start text-sm text-orange-800 font-semibold hover:underline" aria-expanded={showAll} onClick={() => setShowAll(!showAll)}>
          {showAll ? "Visa bara de senaste" : `Visa alla (${hidden} äldre)`}
        </button>
      )}
      {shown.length > 0 && (
        <ul className={`flex flex-col gap-2 ${showAll ? "max-h-96 overflow-y-auto pr-1" : ""}`}>
          {shown.map((c) => (
            <li key={c.id} className="flex gap-2 items-start">
              <Face comment={c} />
              <div className="min-w-0 flex-1">
                <p className="flex items-baseline gap-1.5 text-xs text-gray-500 font-normal">
                  <span className="font-semibold text-gray-900 truncate">{c.authorName}</span>
                  <time className="flex-none" dateTime={new Date(c.createdAt).toISOString()} title={fullText.format(c.createdAt)}>{whenText(c.createdAt, data?.now ?? c.createdAt)}</time>
                  {c.canDelete && (
                    <button type="button" className="ml-auto flex-none px-1 text-sm leading-none text-gray-500 hover:text-red-700 disabled:opacity-45" disabled={busy}
                      title="Ta bort kommentaren" aria-label={`Ta bort kommentaren från ${c.authorName}`}
                      onClick={() => { if (confirm("Ta bort kommentaren? Det går inte att ångra.")) void write(`/${c.id}`, "DELETE"); }}>
                      ×
                    </button>
                  )}
                </p>
                {/* Always rendered as text; the line breaks are the only formatting a comment has. */}
                <p className="text-sm font-normal whitespace-pre-wrap wrap-anywhere">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form className="flex flex-col gap-1.5" onSubmit={(e) => { e.preventDefault(); void post(); }}>
        <textarea aria-label="Ny kommentar" placeholder="Skriv en kommentar" rows={2} maxLength={MAX_COMMENT_LENGTH} className={`${inputClass} text-sm resize-y min-h-10 max-h-40`}
          value={draft} onChange={(e) => setDraft(e.target.value)}
          // Enter makes a new line, as it would in any text box; Ctrl/Cmd+Enter sends.
          onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void post(); } }} />
        <div className="flex items-center gap-2">
          <button type="submit" className={primaryClass} disabled={busy || !draft.trim()} title="Skicka (Ctrl+Enter)">Skicka</button>
          {draft.length > MAX_COMMENT_LENGTH - 100 && <span className="text-xs text-gray-500 font-normal tabular-nums">{draft.length}/{MAX_COMMENT_LENGTH}</span>}
        </div>
        {error && <p className="text-sm text-red-700 font-normal" role="alert">{error}</p>}
      </form>
    </Card>
  );
}

/**
 * Comments and emoji reactions on the open plan, for owner and visitors alike.
 * Refreshes when the plan is opened, after every own change, and every half
 * minute while the tab is visible. Renders nothing without a plan.
 */
export function PlanComments({ planId }: { planId: string | null }) {
  return planId ? <Comments key={planId} planId={planId} /> : null;
}
