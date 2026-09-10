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

let extractor = null;
let ready = null;

// entries: [{ kind: "move"|"topic", id, cue, vec: Float32Array }]
let entries = [];

export function loadModel(onProgress) {
  if (ready) return ready;
  ready = pipeline("feature-extraction", MODEL, {
    progress_callback: (p) => {
      if (onProgress && p.status === "progress" && p.file?.endsWith(".onnx")) {
        onProgress(Math.round((p.progress || 0)));
      }
    },
  }).then((e) => {
    extractor = e;
  });
  return ready;
}

async function embed(text) {
  const out = await extractor(text, { pooling: "mean", normalize: true });
  return out.data; // Float32Array, already L2-normalised
}

function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

/** Embed every cue in the content. Call once after loadModel(). */
export async function indexContent({ moves, topics }) {
  const pending = [];
  for (const [id, m] of Object.entries(moves)) {
    for (const cue of m.cues) pending.push({ kind: "move", id, cue });
  }
  for (const [id, t] of Object.entries(topics)) {
    for (const cue of t.cues) pending.push({ kind: "topic", id, cue });
  }
  const vecs = await Promise.all(pending.map((p) => embed(p.cue)));
  entries = pending.map((p, i) => ({ ...p, vec: vecs[i] }));
}

/**
 * @returns {{kind, id, cue, score}}  best match, plus `runnersUp` for debugging
 */
export async function match(playerInput) {
  const q = await embed(playerInput);
  let best = null;
  const scored = entries.map((e) => {
    const score = dot(q, e.vec);
    if (!best || score > best.score) best = { kind: e.kind, id: e.id, cue: e.cue, score };
    return { kind: e.kind, id: e.id, cue: e.cue, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return { ...best, runnersUp: scored.slice(1, 4) };
}
