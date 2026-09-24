/* Semantic matcher — the only "AI" in the $0 build.
 *
 * Loads a ~25 MB sentence-embedding model in the browser (once, then cached),
 * embeds every `cue` from content.mjs, and at each turn embeds what the player
 * typed and returns the closest cue by cosine similarity. No network calls
 * after the model is cached; no server; no API key.
 */

import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2";

env.allowLocalModels = false; // fetch from the HF hub / jsDelivr, don't look for local files

const MODEL = "Xenova/all-MiniLM-L6-v2";
const BATCH = 32;

let extractor = null;
let ready = null;

// entries: [{ kind: "action"|"move"|"topic", id, cue, vec: Float32Array }]
let entries = [];

export function loadModel(onProgress) {
  if (ready) return ready;
  ready = pipeline("feature-extraction", MODEL, {
    progress_callback: (p) => {
      if (onProgress && p.status === "progress" && p.file?.endsWith(".onnx")) {
        onProgress(Math.round(p.progress || 0));
      }
    },
  }).then((e) => {
    extractor = e;
  });
  return ready;
}

// Embed a list of texts, BATCH at a time. Returns one Float32Array per text,
// already L2-normalised (so a dot product is the cosine similarity).
async function embedAll(texts) {
  const vecs = [];
  for (let i = 0; i < texts.length; i += BATCH) {
    const out = await extractor(texts.slice(i, i + BATCH), { pooling: "mean", normalize: true });
    const [n, dim] = out.dims;
    for (let j = 0; j < n; j++) vecs.push(out.data.slice(j * dim, (j + 1) * dim));
  }
  return vecs;
}

function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

/** Embed every cue in the content. Call once after loadModel(). */
export async function indexContent({ actions, moves, topics }) {
  const pending = [];
  const add = (kind, group) => {
    for (const [id, item] of Object.entries(group)) {
      for (const cue of item.cues) pending.push({ kind, id, cue });
    }
  };
  add("action", actions);
  add("move", moves);
  add("topic", topics);

  const vecs = await embedAll(pending.map((p) => p.cue));
  entries = pending.map((p, i) => ({ ...p, vec: vecs[i] }));
  return entries.length;
}

/**
 * @returns {{kind, id, cue, score, runnersUp}}  best match, plus the next
 *          best *different* things (for the debug view)
 */
export async function match(playerInput) {
  const [q] = await embedAll([playerInput]);
  const scored = entries
    .map((e) => ({ kind: e.kind, id: e.id, cue: e.cue, score: dot(q, e.vec) }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  const seen = new Set([best.kind + best.id]);
  const runnersUp = [];
  for (const r of scored) {
    if (runnersUp.length === 3) break;
    if (seen.has(r.kind + r.id)) continue;
    seen.add(r.kind + r.id);
    runnersUp.push(r);
  }
  return { ...best, runnersUp };
}
