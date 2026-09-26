/* Client — everything runs here. No server, no API.
 * The model loads behind the title screen. Each turn: try the plain-word
 * handling (quickTurn); if that passes, match what the player typed and
 * resolve it (resolveTurn); then render and update the status bar. */

import * as content from "./content.mjs";
import { loadModel, indexContent, match } from "./match.mjs";
import {
  initialState, openingLines, quickTurn, resolveTurn, forMatching,
  idleLine, hud, MATCH_THRESHOLD,
} from "./engine.mjs";

const $ = (sel) => document.querySelector(sel);
const els = {
  root: document.documentElement,
  title: $("[data-title-screen]"),
  start: $("[data-start]"),
  startLabel: $("[data-start-label]"),
  transcript: $("[data-transcript]"),
  log: $("[data-log]"),
  form: $("[data-form]"),
  input: $("[data-input]"),
  location: $("[data-location]"),
  choices: $("[data-choices]"),
  debug: $("[data-debug]"),
  home: $("[data-home]"),
  restart: $("[data-restart]"),
  about: $("[data-about]"),
  aboutDialog: $("[data-about-dialog]"),
  mode: $("[data-mode]"),
  rain: $("[data-rain]"),
};

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
// Text arrives slowly, one paragraph after another, like it's being told.
const STAGGER = reduceMotion ? 0 : 600;      // ms between paragraphs starting
const REPLY_PAUSE = reduceMotion ? 0 : 350;  // ms of quiet after you press Enter
const IDLE_AFTER = 45_000;              // ms of silence before the world stirs

let state = initialState();
let modelReady = false;

/* ── Rendering ───────────────────────────────────────────────────────── */

// Wrap “quoted speech” in a span so Del's words sit brighter than narration.
function paragraph(text) {
  const p = document.createElement("p");
  for (const part of text.split(/(“[^”]*”)/)) {
    if (!part) continue;
    if (part.startsWith("“")) {
      const span = document.createElement("span");
      span.className = "speech";
      span.textContent = part;
      p.append(span);
    } else {
      p.append(part);
    }
  }
  return p;
}

const paragraphs = (text) => String(text).split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean);

let delay = 0;
function arrive(node) {
  node.classList.add("is-new");
  node.style.setProperty("--delay", `${delay}ms`);
  delay += STAGGER;
}

function renderLine(line) {
  const div = document.createElement("div");
  div.className = `entry entry--${line.kind}`;

  if (line.kind === "place") {
    const h = document.createElement("h2");
    h.className = "entry__heading";
    h.textContent = line.title;
    div.append(h);
    arrive(h);
    for (const t of paragraphs(line.text)) {
      const p = paragraph(t);
      arrive(p);
      div.append(p);
    }
  } else if (line.kind === "thread") {
    div.append(paragraph(`— ${line.text} —`));
    arrive(div);
  } else if (line.kind === "ending") {
    const h = document.createElement("h2");
    h.className = "ending__title";
    h.textContent = `Ending: ${line.title}`;
    div.append(h);
    arrive(h);
    for (const t of paragraphs(line.text)) {
      const p = paragraph(t);
      arrive(p);
      div.append(p);
    }
    const again = document.createElement("button");
    again.type = "button";
    again.className = "ending__again";
    again.textContent = "Begin again";
    again.addEventListener("click", restart);
    arrive(again);
    div.append(again);
  } else {
    for (const t of paragraphs(line.text)) {
      const p = paragraph(t);
      arrive(p);
      div.append(p);
    }
    if (line.choices) {
      const row = document.createElement("div");
      row.className = "choices";
      arrive(row);
      for (const c of line.choices) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "choice";
        b.textContent = c;
        b.addEventListener("click", () => submit(c));
        row.append(b);
      }
      div.append(row);
    }
  }

  els.log.append(div);
  return div;
}

// startAt: how long to wait before the first line (a beat after your input)
function renderLines(lines, startAt = 0) {
  delay = startAt;
  return lines.filter((l) => l.text !== "").map(renderLine);
}

// The ">user input" line sits right under the newest text, like Playfic.
function showPrompt(on) {
  els.form.hidden = !on;
  if (on) {
    els.form.classList.remove("is-new");
    void els.form.offsetWidth; // restart the fade, not just keep the old one
    arrive(els.form);
    els.input.focus({ preventScroll: true });
  }
}

// A one-off line that appears right away (your own words, debug, idle).
// Pass { queue: true } to line it up after whatever is already fading in.
function note(text, kind = "note", { queue = false } = {}) {
  if (!queue) delay = 0;
  return renderLine({ kind, text });
}

function scrollToLatest(anchor) {
  const top = anchor ? anchor.offsetTop - 28 : els.transcript.scrollHeight;
  els.transcript.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
}

function renderHud() {
  const h = hud(state);
  els.root.dataset.mood = h.mood;
  els.root.style.setProperty("--dusk", h.dusk.toFixed(3));
  els.location.textContent = h.location;
  els.choices.textContent = `${h.choices} ${h.choices === 1 ? "choice" : "choices"} made`;
  document.body.classList.toggle("is-ended", !!state.ending);
}

/* ── Turns ───────────────────────────────────────────────────────────── */

async function submit(text) {
  const playerInput = text.trim();
  if (!playerInput || !modelReady || state.ending || els.form.hasAttribute("data-busy")) return;

  resetIdle();
  const say = note(playerInput, "say");
  els.input.value = "";
  els.form.setAttribute("data-busy", "");
  els.form.hidden = true;

  try {
    let result = quickTurn(state, playerInput);
    let m = null;
    if (!result) {
      m = await match(forMatching(playerInput));
      result = resolveTurn(state, playerInput, m);
    }
    state = result.state;

    if (els.debug.checked) {
      const d = result.debug;
      let r = `[${d.path}]${d.beat ? `  +beat:${d.beat}` : ""}  agitation ${d.agitation} · trust ${d.trust} · ${d.mood}`;
      if (m) {
        r += `\n   "${m.cue}"  ${m.score.toFixed(2)}${m.score < MATCH_THRESHOLD ? "  (below threshold)" : ""}`;
        r += `\n   next: ${m.runnersUp.map((x) => `${x.id} ${x.score.toFixed(2)}`).join(" · ")}`;
      }
      note(r, "debug");
    }

    renderLines(result.lines, REPLY_PAUSE);
    renderHud();
    scrollToLatest(say);
  } catch (err) {
    console.error(err);
    note("Something went wrong with that one. Check the console.");
  } finally {
    els.form.removeAttribute("data-busy");
    showPrompt(!state.ending);
  }
}

els.form.addEventListener("submit", (e) => {
  e.preventDefault();
  submit(els.input.value);
});

/* ── Idle: the world keeps going if you stop typing ──────────────────── */

let idleTimer = null;
let idleCount = 0;

function resetIdle() {
  clearTimeout(idleTimer);
  idleCount = 0;
  scheduleIdle();
}

function scheduleIdle() {
  clearTimeout(idleTimer);
  if (idleCount >= 2) return; // twice per silence is enough
  idleTimer = setTimeout(() => {
    if (!modelReady || state.ending || document.hidden) return scheduleIdle();
    const r = idleLine(state, idleCount);
    if (r) {
      state = r.state;
      const node = note(r.text, r.kind);
      showPrompt(true);
      scrollToLatest(node);
      idleCount += 1;
    }
    scheduleIdle();
  }, IDLE_AFTER);
}

/* ── Start, restart, home ────────────────────────────────────────────── */

function begin() {
  els.log.replaceChildren();
  state = initialState();
  const opening = openingLines(state);
  renderLines(opening);
  note("Type anything: what you'd do, or what you'd say.", "note", { queue: true });
  renderHud();
  els.transcript.scrollTop = 0;
  showPrompt(true);
  resetIdle();
}

function restart() {
  disarm();
  begin();
}

let armTimer = null;
function disarm() {
  clearTimeout(armTimer);
  els.restart.removeAttribute("data-armed");
  els.restart.textContent = "Restart";
}

els.restart.addEventListener("click", () => {
  if (!modelReady) return;
  if (!els.restart.hasAttribute("data-armed")) {
    els.restart.setAttribute("data-armed", "");
    els.restart.textContent = "Restart?";
    armTimer = setTimeout(disarm, 3000);
    return;
  }
  restart();
});

els.home.addEventListener("click", () => {
  clearTimeout(idleTimer);
  els.title.classList.remove("is-gone");
  els.start.focus();
});

els.start.addEventListener("click", () => {
  els.title.classList.add("is-gone");
  if (!els.log.childElementCount || state.ending) begin();
  else els.input.focus();
});

els.about.addEventListener("click", () => els.aboutDialog.showModal());

// clicking anywhere in the transcript puts you back on the input line
els.transcript.addEventListener("click", (e) => {
  if (!els.form.hidden && !e.target.closest("button") && !getSelection().toString()) {
    els.input.focus({ preventScroll: true });
  }
});

// "show matches" is for testing: open the page with ?debug to see it
if (new URLSearchParams(location.search).has("debug")) {
  document.querySelector(".nav__debug").hidden = false;
}

/* ── Mode: night / paper ─────────────────────────────────────────────── */

function setTheme(theme) {
  els.root.dataset.theme = theme;
  try { localStorage.setItem("dels-bridge:theme", theme); } catch {}
}
try {
  const saved = localStorage.getItem("dels-bridge:theme");
  if (saved === "night" || saved === "paper") els.root.dataset.theme = saved;
} catch {}
els.mode.addEventListener("click", () => {
  setTheme(els.root.dataset.theme === "night" ? "paper" : "night");
});

/* ── Rain on the portrait rail ───────────────────────────────────────── */

function startRain(canvas) {
  const ctx = canvas.getContext("2d");
  let w = 0, h = 0, drops = [];

  function resize() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drops = Array.from({ length: Math.round((w * h) / 2600) }, () => newDrop(true));
  }

  function newDrop(anywhere) {
    return {
      x: Math.random() * (w + 60) - 30,
      y: anywhere ? Math.random() * h : -20,
      len: 8 + Math.random() * 16,
      speed: 5 + Math.random() * 6,
      alpha: 0.05 + Math.random() * 0.14,
    };
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    // rain gets heavier as dusk becomes night
    const dusk = parseFloat(getComputedStyle(els.root).getPropertyValue("--dusk")) || 0;
    const count = Math.round(drops.length * (0.35 + 0.65 * dusk));
    const ink = els.root.dataset.theme === "paper" ? "20,20,20" : "200,210,225";
    ctx.lineWidth = 1;
    for (let i = 0; i < count; i++) {
      const d = drops[i];
      ctx.strokeStyle = `rgba(${ink},${d.alpha})`;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - d.len * 0.18, d.y + d.len);
      ctx.stroke();
      if (!reduceMotion) {
        d.y += d.speed;
        d.x -= d.speed * 0.18;
        if (d.y > h) drops[i] = newDrop(false);
      }
    }
    if (!reduceMotion) requestAnimationFrame(draw);
  }

  new ResizeObserver(() => { resize(); if (reduceMotion) draw(); }).observe(canvas);
  resize();
  draw();
}

/* ── Boot: load the model behind the title screen ────────────────────── */

async function boot() {
  renderHud();
  startRain(els.rain);
  try {
    await loadModel((pct) => {
      els.startLabel.textContent = `Loading ${pct}%`;
    });
    els.startLabel.textContent = "Loading…";
    await indexContent(content);
    modelReady = true;
    els.start.disabled = false;
    els.startLabel.textContent = "Start";
    els.start.focus();
  } catch (err) {
    console.error(err);
    els.startLabel.textContent = "Couldn't load";
  }
}

boot();
