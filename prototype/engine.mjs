/* Turn resolution. Given the current state and what the matcher found,
 * decide what Del says and how the state changes. All deterministic — the
 * "guardrails" are just these rules. */

import * as content from "./content.mjs";

const { moves, topics, fallback, moodFor } = content;

// Below this cosine score we treat the input as "not really about anything"
// and fall back. Tune against real play — higher = more "Del just grunts",
// lower = more confident (and occasionally wrong) matches.
export const MATCH_THRESHOLD = 0.46;

export const initialState = () => ({
  guardedness: content.startGuardedness,
  mood: moodFor(content.startGuardedness),
  flags: {},
  revealed: [],
  rung: {}, // topicId -> how deep the ladder has been walked
  disengaged: false,
});

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function needMet(need, state) {
  if (!need) return true;
  if (need.mood) {
    const ok = Array.isArray(need.mood) ? need.mood : [need.mood];
    if (!ok.includes(state.mood)) return false;
  }
  if (need.flag && !state.flags[need.flag]) return false;
  if (need.reveal && !state.revealed.includes(need.reveal)) return false;
  return true;
}

function needOf(entry) {
  return entry && typeof entry === "object" ? entry.need : null;
}

function resolveTopic(id, state) {
  const topic = topics[id];
  const askedBefore = id in state.rung;
  let rung = state.rung[id] ?? 0;

  // the first ask always gives the shallow line; asking AGAIN advances one
  // rung, if the next rung's gate now passes
  if (askedBefore) {
    const next = topic.responses[rung + 1];
    if (next && needMet(needOf(next), state)) rung += 1;
  }

  const entry = topic.responses[rung];

  // rung 0 itself may be gated (e.g. "who says I've got a kid?" until you
  // already know why Del works nights) — `locked` covers that, and doesn't
  // count as having asked (so the real rung 0 still plays once it opens)
  if (topic.locked && !needMet(needOf(entry), state)) {
    return { text: topic.locked };
  }

  return {
    text: typeof entry === "string" ? entry : entry.text,
    reveal: typeof entry === "object" ? entry.reveal : null,
    nextRung: rung,
  };
}

export function resolveTurn(state, m) {
  const next = structuredClone(state);
  const debug = { match: m, path: null };

  const low = !m || m.score < MATCH_THRESHOLD;

  if (low) {
    debug.path = "fallback";
    return { narration: pick(fallback.lines), state: next, debug };
  }

  if (m.kind === "move") {
    const move = moves[m.id];
    debug.path = `move:${m.id}`;
    if (typeof move.guardedness === "number") {
      next.guardedness = clamp(next.guardedness + move.guardedness);
    }
    for (const [k, v] of Object.entries(move.sets ?? {})) next.flags[k] = v;
    next.mood = moodFor(next.guardedness);
    // one hard push gets Del to "shut"; pushing again from there ends it
    if (next.guardedness >= 10) {
      next.disengaged = true;
      return { narration: content.disengageLine, state: next, debug };
    }
    return { narration: pick(move.lines), state: next, debug };
  }

  // topic
  debug.path = `topic:${m.id}`;
  const r = resolveTopic(m.id, next);
  if (r.reveal && !next.revealed.includes(r.reveal)) next.revealed.push(r.reveal);
  if (typeof r.nextRung === "number") next.rung[m.id] = r.nextRung;
  return { narration: r.text, state: next, debug };
}

function clamp(n) {
  return Math.max(0, Math.min(10, n));
}
