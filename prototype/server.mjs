/* Tiny dev server for the prototype. Serves public/ and one endpoint:
 *   POST /api/turn  { state, history, playerInput }  ->  { narration, state, meta }
 *
 *   node server.mjs                 # needs ANTHROPIC_API_KEY in the env
 *   MOCK=1 node server.mjs          # no key; canned responses
 *
 * Meant to run locally. If you do deploy it with a real key attached, the
 * crude guards below (per-IP throttle + a hard per-process turn budget) keep
 * a runaway bill unlikely — but the real backstop is a monthly spend limit
 * set on the Anthropic workspace itself.
 */

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { scenario, initialState } from "./scenario.mjs";
import { runTurn, applyOutcome } from "./turn.mjs";

const ROOT = fileURLToPath(new URL("./public/", import.meta.url));
const PORT = Number(process.env.PORT) || 4180;

// --- abuse guards (see header) ------------------------------------------
const MAX_TURNS = Number(process.env.MAX_TURNS) || 300; // total live turns this process will serve
const IP_MIN_GAP_MS = Number(process.env.IP_MIN_GAP_MS) || 2500;
const IP_HOURLY_CAP = Number(process.env.IP_HOURLY_CAP) || 60;
let turnsUsed = 0;
const ipHits = new Map(); // ip -> recent request timestamps

const LOOPBACK = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);

function clientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  return (fwd ? String(fwd).split(",")[0] : req.socket.remoteAddress || "?").trim();
}

// The author running it on their own machine — no proxy, loopback socket.
function isLocalCaller(req) {
  return !req.headers["x-forwarded-for"] && LOOPBACK.has(clientIp(req));
}

function rateLimited(req) {
  const ip = clientIp(req);
  const now = Date.now();
  const hits = (ipHits.get(ip) || []).filter((t) => now - t < 3_600_000);
  if (hits.length && now - hits[hits.length - 1] < IP_MIN_GAP_MS) return "Slow down a moment.";
  if (hits.length >= IP_HOURLY_CAP) return "That's a lot of turns this hour — come back later.";
  hits.push(now);
  ipHits.set(ip, hits);
  return null;
}
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

      if (process.env.MOCK !== "1" && !isLocalCaller(req)) {
        const limited = rateLimited(req);
        if (limited) return send(res, 429, { error: limited });
        if (turnsUsed >= MAX_TURNS) {
          return send(res, 429, { error: "This demo has spent its turn budget for now." });
        }
      }

      const t0 = Date.now();
      const { output, usage } = await runTurn({
        state: state ?? initialState,
        history,
        playerInput: playerInput.trim(),
      });
      turnsUsed++;
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
    const status = Number.isInteger(err?.status) && err.status >= 400 ? err.status : 500;
    if (status >= 500) console.error(err);
    else console.warn(`  ${status} — ${err?.message || err}`);
    send(res, status, { error: String(err?.message || err) });
  }
});

server.listen(PORT, () => {
  const mode = process.env.MOCK === "1" ? "MOCK (no API calls)" : "live (Claude)";
  console.log(`\n  Cascadia Story prototype — ${mode}`);
  console.log(`  http://localhost:${PORT}`);
  if (process.env.MOCK !== "1") {
    console.log(`  guards: ${MAX_TURNS} turns / process, ${IP_HOURLY_CAP} per IP per hour`);
    if (!process.env.ANTHROPIC_API_KEY) {
      console.log("  ⚠  ANTHROPIC_API_KEY is not set — set it, or run with MOCK=1.");
    }
  }
  console.log("");
});
