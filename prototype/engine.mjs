/* Turn resolution. Given the state and what the player typed, decide what
 * happens and how the state changes. Deterministic: the "guardrails" are
 * just these rules plus the gates in content.mjs.
 *
 * A turn runs in two stages:
 *   quickTurn(state, input)       plain-word handling that needs no model:
 *                                 answers to Del's questions (name, yes/no),
 *                                 classic commands (look, wait, help,
 *                                 inventory), and "why?" / "go on".
 *                                 Returns null if it didn't handle the input.
 *   resolveTurn(state, input, m)  everything else, using the matcher's best
 *                                 guess `m`.
 * Both return { lines, state, debug }. `lines` are what the UI renders:
 *   { kind: "text" | "place" | "thread" | "note" | "ending", text, title? }
 */

import * as C from "./content.mjs";

// Below MATCH_THRESHOLD the input "wasn't really about anything we know".
// Between NEAR_MISS and the threshold, Del half-hears a topic and checks.
export const MATCH_THRESHOLD = 0.46;
export const NEAR_MISS = 0.38;

// Del's own moments (asking your name, mistaking you for Wes…) need at
// least this many turns between them, so they land one at a time.
const BEAT_GAP = 3;

export function initialState() {
  return {
    place: C.start.place,
    agitation: C.start.agitation,
    trust: 0,
    flags: {},
    revealed: [],
    rung: {},      // topicId -> ladder rung reached
    counts: {},    // rotation counters for lines
    gains: {},     // moveId -> times it has earned trust
    name: null,
    pending: null, // a question Del is waiting on
    lastTopic: null,
    turn: 0,
    boothTurns: 0,
    ending: null,
  };
}

export const moodFor = (agitation) =>
  (C.moods.find((m) => agitation <= m.upTo) ?? C.moods.at(-1)).id;

/* What the status bar and the backdrop need. */
export function hud(s) {
  const minutes = C.meta.startMinutes + s.turn * C.meta.minutesPerTurn;
  return {
    mood: moodFor(s.agitation),
    location: C.places[s.place].heading,
    choices: s.turn,
    clock: clock(minutes),
    bridge: s.ending === "lowered" ? "lowered" : "raised",
    dusk: Math.min(s.turn / 22, 1), // 0 = dusk, 1 = full night
    threads: s.revealed.length,
    totalThreads: Object.keys(C.threads).length,
  };
}

export function openingLines(s) {
  const p = C.places[s.place];
  s.flags["seen_" + s.place] = true;
  return [
    { kind: "place", title: C.opening.title, text: C.opening.text },
    { kind: "place", title: p.heading, text: p.first },
  ];
}

/* ---------------------------------------------------------------------
 * Stage 1: no model needed
 * ------------------------------------------------------------------ */

const YES = /^(yes|yeah|yep|yup|ya|sure|ok|okay|uh huh|i do|i am|it's me|its me|that's me|of course|y)\b/;
const NO = /^(no|nope|nah|n|not really|i'm not|im not|i am not|sorry,? no)\b/;
const HARSH = /(old man|crazy|senile|obviously|idiot|stupid|what's wrong with you|hurry|come on|just (lower|open|do)|ridiculous)/;
const GENTLE = /(it's ok|its ok|it's okay|that's ok|no rush|take your time|it's fine|you were|you're okay|it's alright|easy)/;
const FOLLOW_UP = /^(why|how come|huh|what do you mean|go on|and|and then|then what|tell me more|keep going|really|what happened|what else|more|continue)\??!?$/;

export function quickTurn(state, raw) {
  if (state.ending) return null;
  const s = structuredClone(state);
  const out = [];
  const input = norm(raw);

  // 1. Del asked something, and this answers it
  if (s.pending) {
    const path = answerPending(s, raw, input, out);
    if (path) return finish(s, out, { path });
  }

  // 2. classic IF commands
  if (/^(l|look|look around|where am i\??)$/.test(input)) {
    const p = C.places[s.place];
    out.push({ kind: "place", title: p.heading, text: p.again });
    return finish(s, out, { path: "cmd:look" }, { passive: true });
  }
  if (/^(i|inv|inventory|what do i have\??|check my pockets)$/.test(input)) {
    out.push({ kind: "text", text: C.inventory });
    return finish(s, out, { path: "cmd:inventory" }, { passive: true });
  }
  if (/^(help|hint|hints|\?|what do i do\??|what now\??|i'?m stuck)$/.test(input)) {
    const h = C.hints.find((h) => needMet(h.need, s));
    out.push({ kind: "note", text: h.text });
    return finish(s, out, { path: "cmd:hint" }, { passive: true });
  }
  if (/^(z|wait|\.\.\.|…)$/.test(input)) {
    doMove(s, C.moves.wait, "wait", out);
    return finish(s, out, { path: "cmd:wait" });
  }

  // 3. "why?" / "go on": ask the last topic again, which climbs its ladder
  if (FOLLOW_UP.test(input) && s.lastTopic && s.place === "booth") {
    doTopic(s, C.topics[s.lastTopic], s.lastTopic, out);
    return finish(s, out, { path: `follow-up:${s.lastTopic}` });
  }

  // 4. volunteering a name at any time
  const volunteered = raw.match(/\b(?:my name is|my name's|name's|call me)\s+([a-z][a-z'-]*)/i);
  if (volunteered && s.place === "booth") {
    setName(s, volunteered[1], out, C.answers.name_volunteered);
    return finish(s, out, { path: "name:volunteered" });
  }

  return null;
}

function answerPending(s, raw, input, out) {
  const p = s.pending;

  if (p.type === "name") {
    if (/(already told|told you|i said|again\?|seriously|you forgot|forgot already)/.test(input)) {
      s.agitation = clamp(s.agitation + 1);
      out.push({ kind: "text", text: fill(C.answers.name_annoyed, s) });
      return "name:annoyed"; // pending stays: he still wants it
    }
    if (/(not telling|doesn't matter|none of your business|rather not|no name|skip|don't want to say)/.test(input)) {
      s.pending = null;
      s.flags.no_name = true;
      out.push({ kind: "text", text: fill(C.answers.name_refused, s) });
      return "name:refused";
    }
    const name = extractName(raw);
    if (name) {
      s.pending = null;
      if (p.again && s.name) {
        if (name.toLowerCase() === s.name.toLowerCase()) {
          // re-answering without a sigh: that's the patience the game is about
          s.trust = clamp(s.trust + 1);
          s.agitation = clamp(s.agitation - 1);
          out.push({ kind: "text", text: fill(C.answers.name_again_same, s) });
        } else {
          const old = s.name;
          s.name = name;
          out.push({ kind: "text", text: fill(C.answers.name_again_diff, s).replace("{old}", old) });
        }
        return "name:again";
      }
      setName(s, name, out, C.answers.name_first);
      s.trust = clamp(s.trust + 1);
      return "name:first";
    }
    s.pending = null; // they said something else; let it through
    return null;
  }

  if (p.type === "yesno") {
    const yes = YES.test(input) && !NO.test(input);
    const no = NO.test(input);
    if (!yes && !no) {
      s.pending = null;
      return null;
    }
    s.pending = null;

    if (p.id === "son") {
      if (yes) {
        applyFx(s, { agitation: +3, trust: -1, set: { lied: true } }, out);
        out.push({ kind: "text", text: C.answers.son_yes });
        return "son:yes";
      }
      if (HARSH.test(input)) {
        applyFx(s, { agitation: +2 }, out);
        out.push({ kind: "text", text: C.answers.son_no_harsh });
        return "son:no-harsh";
      }
      out.push({ kind: "text", text: C.answers.son_no });
      applyFx(s, { agitation: -1, trust: +2, reveal: "wes", set: { gentle_no: true } }, out);
      return "son:no";
    }

    if (p.id === "turn_around") {
      if (yes) {
        s.ending = "turned";
        return "leave:yes";
      }
      out.push({ kind: "text", text: C.answers.leave_no });
      return "leave:no";
    }

    if (p.id === "mishear") {
      if (yes) {
        doTopic(s, C.topics[p.topic], p.topic, out);
        return `mishear:yes:${p.topic}`;
      }
      out.push({ kind: "text", text: C.answers.mishear_no });
      return "mishear:no";
    }
  }

  if (p.type === "remind") {
    // any reply resolves the false lowering; how he takes it depends on tone
    s.pending = null;
    if (HARSH.test(input)) {
      s.agitation = clamp(s.agitation + 2);
      out.push({ kind: "text", text: C.answers.remind_harsh });
      return "remind:harsh";
    }
    if (GENTLE.test(input) || /(bridge|lower|across|cross|let me)/.test(input)) {
      s.trust = clamp(s.trust + 1);
      out.push({ kind: "text", text: C.answers.remind_gentle });
      return "remind:gentle";
    }
    out.push({ kind: "text", text: C.answers.remind_other });
    return "remind:other";
  }

  s.pending = null;
  return null;
}

const NOT_NAMES = new Set(
  ("why what who how no yes nope yeah hi hello hey um uh well i it the a an you your bridge please sure " +
   "okay ok nobody nothing someone just lost tired sorry wes dad son here there fine good from not " +
   "going trying heading driving cold wet late new only still so really sir del go on and tell look " +
   "ask get me my can thanks thank wait help").split(" "),
);

function extractName(raw) {
  const text = raw.trim();
  if (text.includes("?") || FOLLOW_UP.test(norm(raw))) return null;
  const m = text.match(/\b(?:my name is|my name's|name's|i'm|im|i am|it's|its|call me|it is)\s+([a-z][a-z'-]*)/i);
  let word = m ? m[1] : null;
  if (!word) {
    const words = text.replace(/[.,!]/g, "").split(/\s+/);
    if (words.length > 3) return null;
    word = words[0];
  }
  if (!word || NOT_NAMES.has(word.toLowerCase()) || word.length > 20) return null;
  return word[0].toUpperCase() + word.slice(1).toLowerCase();
}

function setName(s, name, out, line) {
  s.name = name[0].toUpperCase() + name.slice(1).toLowerCase();
  s.flags.name_given = s.turn;
  if (s.pending?.type === "name") s.pending = null;
  out.push({ kind: "text", text: fill(line, s) });
}

/* Classic IF shorthand, rewritten so the matcher understands it. */
export function forMatching(raw) {
  return raw.trim().replace(/^(x|examine|inspect|l at|look)\s+(?!at\b|around\b)/i, "look at ");
}

/* ---------------------------------------------------------------------
 * Stage 2: with a match from the model
 * ------------------------------------------------------------------ */

export function resolveTurn(state, raw, m) {
  if (state.ending) return { lines: [], state, debug: { path: "ended" } };
  const s = structuredClone(state);
  const out = [];
  s.pending = null; // quickTurn already had its chance to answer it

  const score = m?.score ?? 0;

  if (score < MATCH_THRESHOLD) {
    // Del half-hears a topic: ask, and let a yes/no settle it
    if (score >= NEAR_MISS && m.kind === "topic" && s.place === "booth") {
      const label = C.topics[m.id].label;
      out.push({ kind: "text", text: C.answers.mishear.replace("{label}", label) });
      s.pending = { type: "yesno", id: "mishear", topic: m.id };
      return finish(s, out, { path: `mishear:${m.id}`, match: m });
    }
    out.push({ kind: "text", text: fallbackLine(s) });
    return finish(s, out, { path: "fallback", match: m });
  }

  // high-stakes things (leaving, lying, grabbing the lever) need a confident match
  const item = { action: C.actions, move: C.moves, topic: C.topics }[m.kind][m.id];
  if (item.minScore && score < item.minScore) {
    out.push({ kind: "text", text: fallbackLine(s) });
    return finish(s, out, { path: `guarded:${m.kind}:${m.id}`, match: m });
  }

  if (m.kind === "action") doAction(s, C.actions[m.id], m.id, out);
  else if (m.kind === "move") doMove(s, C.moves[m.id], m.id, out);
  else doTopic(s, C.topics[m.id], m.id, out);

  return finish(s, out, { path: `${m.kind}:${m.id}`, match: m });
}

function doAction(s, a, id, out) {
  if (a.where && a.where !== "any" && s.place !== a.where) {
    out.push({ kind: "text", text: fill(a.elsewhere, s) });
    return;
  }
  const n = s.counts["a:" + id] ?? 0;
  s.counts["a:" + id] = n + 1;
  const line = a.lines[Math.min(n, a.lines.length - 1)];
  if (line) out.push({ kind: "text", text: fill(line, s) });
  applyFx(s, a.fx, out);
}

function doMove(s, mv, id, out) {
  if (mv.special === "turn_around") {
    out.push({ kind: "text", text: fill(pick(s, "m:" + id, mv.lines), s) });
    out.push({ kind: "note", text: C.answers.leave_prompt, choices: ["yes", "no"] });
    s.pending = { type: "yesno", id: "turn_around" };
    return;
  }

  if (s.place !== "booth") {
    if (mv.inCar) out.push({ kind: "text", text: fill(pick(s, "car:" + id, mv.inCar), s) });
    else if (mv.anywhere) out.push({ kind: "text", text: fill(pick(s, "m:" + id, moodLines(mv.lines, s)), s) });
    else out.push({ kind: "text", text: pick(s, "carDeaf", C.carDeaf) });
    // pushing from inside the car still frays you, but Del can't hear it
    return;
  }

  const cap = mv.trustCap ?? 2;
  const earnsTrust = (mv.fx?.trust ?? 0) > 0;
  const used = s.gains[id] ?? 0;
  const tired = earnsTrust && used >= cap;

  if (tired && mv.tired) {
    out.push({ kind: "text", text: fill(pick(s, "t:" + id, mv.tired), s) });
    // still calming, no longer building trust
    applyFx(s, { ...mv.fx, trust: 0 }, out);
    return;
  }

  out.push({ kind: "text", text: fill(pick(s, "m:" + id, moodLines(mv.lines, s)), s) });
  if (earnsTrust) s.gains[id] = used + 1;
  applyFx(s, tired ? { ...mv.fx, trust: 0 } : mv.fx, out);
}

function doTopic(s, t, id, out) {
  if (s.place !== "booth") {
    out.push({ kind: "text", text: pick(s, "carDeaf", C.carDeaf) });
    return;
  }
  s.lastTopic = id;

  const asked = id in s.rung;
  let r = s.rung[id] ?? 0;
  let climbed = !asked;

  if (t.climb === "highest") {
    // requests, not stories: answer at the highest rung that's open now
    let top = r;
    t.responses.forEach((e, i) => { if (i > top && needMet(needOf(e), s)) top = i; });
    if (top > r) { r = top; climbed = true; }
  } else if (asked) {
    const next = t.responses[r + 1];
    if (next && needMet(needOf(next), s)) {
      r += 1;
      climbed = true;
    }
  }

  const entry = t.responses[r];

  // rung 0 itself is gated: serve `locked` and don't count it as asked
  if (!asked && !needMet(needOf(entry), s) && t.locked) {
    out.push({ kind: "text", text: fill(lockedText(t.locked, s), s) });
    return;
  }

  // asked again but couldn't climb: `again`, if there's one that fits
  if (!climbed && t.again) {
    const fits = t.again.filter((a) => typeof a === "string" || needMet(a.need, s));
    if (fits.length) {
      const a = pick(s, "again:" + id, fits);
      out.push({ kind: "text", text: fill(typeof a === "string" ? a : a.text, s) });
      if (typeof a === "object") applyFx(s, a.fx, out);
      return;
    }
  }

  s.rung[id] = r;
  out.push({ kind: "text", text: fill(textOf(entry), s) });
  if (climbed && typeof entry === "object") {
    if (entry.reveal) reveal(s, entry.reveal, out);
    applyFx(s, entry.fx, out);
  }
}

/* ---------------------------------------------------------------------
 * End of every turn: time passes, Del acts on his own, endings
 * ------------------------------------------------------------------ */

function finish(s, out, debug, opts = {}) {
  if (!opts.passive) {
    s.turn += 1;
    if (s.place === "booth") s.boothTurns += 1;
  }

  // one warning before he shuts the window for good
  let happened = false;
  if (!s.ending && s.agitation >= 9 && !s.flags.warned) {
    s.flags.warned = true;
    s.agitation = 9;
    out.push({ kind: "text", text: C.answers.warning });
    happened = true;
  } else if (!s.ending && s.agitation >= 10) {
    s.ending = "shut";
  }

  const spaced = s.turn - (s.flags.last_beat ?? -99) >= BEAT_GAP;
  if (!s.ending && !s.pending && !opts.passive && !happened && spaced) {
    const beat = C.beats.find((b) => !s.flags["beat_" + b.id] && needMet(b.need, s));
    if (beat) {
      s.flags["beat_" + beat.id] = true;
      s.flags.last_beat = s.turn;
      out.push({ kind: "text", text: fill(beat.text, s) });
      applyFx(s, beat.fx, out);
      happened = true;
      debug.beat = beat.id;
    }
  }

  if (!s.ending && !happened && !opts.passive && s.turn % 3 === 0) {
    out.push({ kind: "ambient", text: pick(s, "amb", C.ambience[phase(s)]) });
  }

  if (s.ending) {
    const e = C.endings[s.ending];
    out.push({ kind: "ending", title: e.title, text: e.text, id: s.ending });
  }

  debug.agitation = s.agitation;
  debug.trust = s.trust;
  debug.mood = moodFor(s.agitation);
  return { lines: out, state: s, debug };
}

/* When the player hasn't typed for a while. Doesn't advance the turn. */
export function idleLine(state) {
  if (state.ending || state.pending) return null;
  const s = structuredClone(state);
  const text = pick(s, "idle:" + s.place, C.idle[s.place]);
  return { text, state: s };
}

/* ---------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------ */

function applyFx(s, fx, out) {
  if (!fx) return;
  if (fx.agitation) s.agitation = clamp(s.agitation + fx.agitation);
  if (fx.trust) s.trust = clamp(s.trust + fx.trust);
  for (const [k, v] of Object.entries(fx.set ?? {})) s.flags[k] = v;
  if (fx.reveal) reveal(s, fx.reveal, out);
  if (fx.pending) s.pending = fx.pending;
  if (fx.place) enterPlace(s, fx.place, out);
  if (fx.ending) s.ending = fx.ending;
}

function reveal(s, id, out) {
  if (s.revealed.includes(id)) return;
  s.revealed.push(id);
  out.push({ kind: "thread", text: C.threads[id] });
}

function enterPlace(s, id, out) {
  s.place = id;
  const p = C.places[id];
  const first = !s.flags["seen_" + id];
  s.flags["seen_" + id] = true;
  out.push({ kind: "place", title: p.heading, text: first ? p.first : p.again });
}

const has = (s, f) => s.flags[f] != null && s.flags[f] !== false;

export function needMet(need, s) {
  if (!need) return true;
  if (need.anyOf && !need.anyOf.some((n) => needMet(n, s))) return false;
  if (need.mood && ![].concat(need.mood).includes(moodFor(s.agitation))) return false;
  if (need.trust != null && s.trust < need.trust) return false;
  if (need.reveal && ![].concat(need.reveal).every((r) => s.revealed.includes(r))) return false;
  if (need.flag && ![].concat(need.flag).every((f) => has(s, f))) return false;
  if (need.notFlag && [].concat(need.notFlag).some((f) => has(s, f))) return false;
  if (need.place && s.place !== need.place) return false;
  if (need.boothTurns && s.boothTurns < need.boothTurns) return false;
  if (need.hasName && !s.name) return false;
  if (need.since) {
    const t = s.flags[need.since.flag];
    if (typeof t !== "number" || s.turn - t < need.since.turns) return false;
  }
  return true;
}

const needOf = (entry) => (entry && typeof entry === "object" ? entry.need : null);
const textOf = (entry) => (typeof entry === "string" ? entry : entry.text);

function lockedText(locked, s) {
  if (typeof locked === "string") return locked;
  return (locked.find((l) => needMet(l.need, s)) ?? locked.at(-1)).text;
}

function moodLines(lines, s) {
  if (Array.isArray(lines)) return lines;
  return lines[moodFor(s.agitation)] ?? lines.any;
}

// Rotate through a list so the same line doesn't come up twice in a row.
function pick(s, key, list) {
  const n = s.counts[key] ?? 0;
  s.counts[key] = n + 1;
  return list[n % list.length];
}

function fallbackLine(s) {
  if (s.place !== "booth") return pick(s, "fb:car", C.fallback.car);
  const mood = moodFor(s.agitation);
  return pick(s, "fb:" + mood, C.fallback[mood]);
}

function phase(s) {
  if (s.turn < 8) return "dusk";
  if (s.turn < 16) return "rain";
  return "night";
}

function fill(text, s) {
  const minutes = C.meta.startMinutes + s.turn * C.meta.minutesPerTurn;
  return String(text)
    .replaceAll("{name}", s.name ?? C.meta.noName)
    .replaceAll("{son}", C.meta.son)
    .replaceAll("{clock}", clock(minutes));
}

function clock(minutes) {
  const h24 = Math.floor(minutes / 60) % 24;
  const mm = String(minutes % 60).padStart(2, "0");
  const h = h24 % 12 || 12;
  return `${h}:${mm} ${h24 < 12 ? "am" : "pm"}`;
}

function norm(raw) {
  return raw.toLowerCase().trim().replace(/[“”]/g, '"').replace(/\s+/g, " ").replace(/[.!]+$/, "");
}

const clamp = (n) => Math.max(0, Math.min(10, n));
