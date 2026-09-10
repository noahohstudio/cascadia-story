/* Client: hold the transcript + Del's state, send each turn, re-render. */

const els = {
  transcript: document.querySelector("[data-transcript]"),
  form: document.querySelector("[data-form]"),
  input: document.querySelector("[data-input]"),
  who: document.querySelector("[data-who]"),
  progress: document.querySelector("[data-progress]"),
  mock: document.querySelector("[data-mock]"),
};

let scenario = null;
let state = null;
const history = []; // [{ player, narration }]
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
  els.who.textContent = `${scenario.character} — ${state.mood}`;
  const total = Object.keys(scenario.gates).length;
  els.progress.textContent = state.disengaged
    ? "stepped away"
    : `${state.revealed.length} of ${total} drawn out`;
}

async function boot() {
  const r = await fetch("/api/scenario");
  const data = await r.json();
  scenario = data;
  state = data.state;
  if (data.mock) els.mock.hidden = false;
  add(data.opening);
  renderStatus();
  els.input.focus();
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
    const r = await fetch("/api/turn", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ state, history, playerInput }),
    });
    const data = await r.json();
    waiting.remove();

    if (!r.ok) {
      add(data.error || "Something went wrong.", "note");
      return;
    }

    const before = state.revealed.slice();
    state = data.state;
    history.push({ player: playerInput, narration: data.narration });

    add(data.narration);
    for (const id of state.revealed) {
      if (!before.includes(id)) add(`— ${scenario.gates[id]} —`, "note");
    }
    renderStatus();

    if (state.disengaged) {
      add("Del's done talking for tonight. Reload to start over.", "note");
      els.form.setAttribute("data-done", "");
    }
  } catch (err) {
    waiting.remove();
    add("Couldn't reach the desk. Is the server running?", "note");
  } finally {
    els.form.removeAttribute("data-busy");
    els.input.focus();
  }
});

boot();
