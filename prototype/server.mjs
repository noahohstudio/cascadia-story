/* Tiny dev server for the prototype. Serves public/ and one endpoint:
 *   POST /api/turn  { state, history, playerInput }  ->  { narration, state, meta }
 *
 *   node server.mjs                 # needs ANTHROPIC_API_KEY in the env
 *   MOCK=1 node server.mjs          # no key; canned responses
 */

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { scenario, initialState } from "./scenario.mjs";
import { runTurn, applyOutcome } from "./turn.mjs";

const ROOT = fileURLToPath(new URL("./public/", import.meta.url));
const PORT = Number(process.env.PORT) || 4180;
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
};

function send(res, status, body, type = "application/json") {
  res.writeHead(status, { "content-type": type });
  if (Buffer.isBuffer(body) || typeof body === "string") return res.end(body);
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/api/scenario") {
      return send(res, 200, {
        title: scenario.title,
        character: scenario.character,
        opening: scenario.opening,
        gates: Object.fromEntries(
          Object.entries(scenario.gates).map(([id, g]) => [id, g.label]),
        ),
        state: initialState,
        mock: process.env.MOCK === "1",
      });
    }

    if (req.method === "POST" && req.url === "/api/turn") {
      const { state, history = [], playerInput } = await readJson(req);
      if (!playerInput || !playerInput.trim()) {
        return send(res, 400, { error: "empty input" });
      }
      if (state?.disengaged) {
        return send(res, 409, { error: "Del has stepped away. Restart to try again." });
      }

      const t0 = Date.now();
      const { output, usage } = await runTurn({
        state: state ?? initialState,
        history,
        playerInput: playerInput.trim(),
      });
      const nextState = applyOutcome(state ?? initialState, output);

      return send(res, 200, {
        narration: output.narration,
        state: nextState,
        meta: {
          ms: Date.now() - t0,
          player_pushed: !!output.player_pushed,
          model_wanted_reveal: output.newly_revealed ?? [],
          actually_revealed: nextState.revealed,
          usage,
        },
      });
    }

    // static files
    if (req.method === "GET") {
      const rel = normalize(req.url === "/" ? "/index.html" : req.url).replace(/^(\.\.[/\\])+/, "");
      const path = join(ROOT, rel);
      if (!path.startsWith(ROOT)) return send(res, 403, "forbidden", "text/plain");
      try {
        const buf = await readFile(path);
        return send(res, 200, buf, TYPES[extname(path)] || "application/octet-stream");
      } catch {
        return send(res, 404, "not found", "text/plain");
      }
    }

    send(res, 405, "method not allowed", "text/plain");
  } catch (err) {
    console.error(err);
    const status = Number.isInteger(err?.status) && err.status >= 400 ? err.status : 500;
    send(res, status, { error: String(err?.message || err) });
  }
});

server.listen(PORT, () => {
  const mode = process.env.MOCK === "1" ? "MOCK (no API calls)" : "live (Claude)";
  console.log(`\n  Cascadia Story prototype — ${mode}`);
  console.log(`  http://localhost:${PORT}\n`);
  if (process.env.MOCK !== "1" && !process.env.ANTHROPIC_API_KEY) {
    console.log("  ⚠  ANTHROPIC_API_KEY is not set. Either export it, or run with MOCK=1.\n");
  }
});
