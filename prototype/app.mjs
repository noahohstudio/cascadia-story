/* Client — everything runs here. No server, no API. Load the embedding model,
 * then each turn: match what the player typed → resolve it → render. */

import * as content from "./content.mjs";
import { loadModel, indexContent, match } from "./match.mjs";
import { resolveTurn, initialState, MATCH_THRESHOLD } from "./engine.mjs";

const els = {
  transcript: document.querySelector("[data-transcript]"),
  form: document.querySelector("[data-form]"),
  input: document.querySelector("[data-input]"),
  who: document.querySelector("[data-who]"),
  progress: document.querySelector("[data-progress]"),
  debug: document.querySelector("[data-debug]"),
};

let state = initialState();

const inner = document.createElement("div");
inner.className = "transcript__inner";
els.transcript.append(inner);

function add(text, kind) {
  const p = document.createElement("p");
  p.className = "entry" + (kind ? ` entry--${kind}` : "");
  p.textContent = text;
  inner.append(p);
  els.transcript.scrollTop = els.transcript.scrollHeight;
  return p;
}

function renderStatus() {
  els.who.textContent = `${content.character} — ${state.mood}`;
  const total = Object.keys(content.gates).length;
  els.progress.textContent = state.disengaged
    ? "stepped away"
    : `${state.revealed.length} of ${total} drawn out`;
}

async function boot() {
  add(content.opening);
  renderStatus();
  els.transcript.scrollTop = 0;

  const status = add("Waking Del up… (one-time ~25 MB model download)", "wait");
  try {
    await loadModel((pct) => {
      status.textContent = `Waking Del up… ${pct}%`;
    });
    await indexContent(content);
    status.remove();
    add("Del's here. Type anything.", "note");
    els.input.disabled = false;
    els.input.focus();
  } catch (err) {
    console.error(err);
    status.textContent = "Couldn't load the matching model — check the console.";
  }
}

els.input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    els.form.requestSubmit();
  }
});

els.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const playerInput = els.input.value.trim();
  if (!playerInput || els.form.hasAttribute("data-busy")) return;

  add(playerInput, "say");
  els.input.value = "";
  els.form.setAttribute("data-busy", "");
  const waiting = add("…", "wait");

  try {
    const m = await match(playerInput);
    const before = state.revealed.slice();
    const { narration, state: nextState, debug } = resolveTurn(state, m);
    state = nextState;
    waiting.remove();

    if (els.debug.checked) {
      const r
        = `[${debug.path}]  "${m.cue}"  ${m.score.toFixed(2)}`
        + (m.score < MATCH_THRESHOLD ? "  (below threshold)" : "")
        + `\n   next: ${m.runnersUp.map((r) => `"${r.cue}" ${r.score.toFixed(2)}`).join(" · ")}`;
      add(r, "debug");
    }

    add(narration);
    for (const id of state.revealed) {
      if (!before.includes(id)) add(`— ${content.gates[id]} —`, "note");
    }
    renderStatus();

    if (state.disengaged) {
      add("Del's done talking for tonight. Reload to start over.", "note");
      els.form.setAttribute("data-done", "");
    }
  } catch (err) {
    console.error(err);
    waiting.remove();
    add("Something went wrong matching that — check the console.", "note");
  } finally {
    els.form.removeAttribute("data-busy");
    if (!els.form.hasAttribute("data-done")) els.input.focus();
  }
});

boot();
