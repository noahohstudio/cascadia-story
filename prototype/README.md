# Prototype — the $0 path

Does semantic matching against **author-written** lines feel good enough to
carry the game, with no API and no per-play cost?

Every word Del says is written in [content.mjs](content.mjs). A ~25 MB
sentence-embedding model runs in the browser (once, then cached), embeds what
the player types, and returns the closest-matching line. The AI *understands*
input; it doesn't *write*. No server, no key, works offline after first load.

## Run it

```bash
cd prototype
python3 -m http.server 4180
```

Open <http://localhost:4180>. First load downloads the model (~25 MB) —
"Waking Del up…". After that it's instant and offline.

Tick **show matches** (top right) to see what each input matched and how
confidently.

## What works, what to poke at

- **Matching** — try lots of phrasings for the same idea ("why nights",
  "don't you sleep", "who works these hours"). It's parser-IF quality: right
  most of the time, occasionally picks an adjacent line. Nonsense and
  off-topic input fall back to Del deflecting.
- **The arc** — share something real, be patient (watch the mood in the
  status bar go wary → thawing → open), then ask a topic *more than once* to
  draw the deeper answer out. Both secrets should surface in ~8–12 turns.
- **Guardrails** — push him ("just tell me", "answer the question") and the
  mood tightens; push again from "shut" and he ends the conversation.

## How it's wired

| File | Role |
| --- | --- |
| `content.mjs` | **Everything Del says.** `moves` (how the player is behaving) and `topics` (subjects, each a ladder of responses gated by mood / flags / reveals). This becomes the real character. |
| `match.mjs` | Loads the embedding model (`Xenova/all-MiniLM-L6-v2` via transformers.js CDN), embeds every cue, returns the best match by cosine similarity. |
| `engine.mjs` | Deterministic turn resolution: pick a response, walk the ladder, apply mood/flag/reveal changes. `MATCH_THRESHOLD` is the "did they actually say anything" cutoff. |
| `app.mjs` / `index.html` / `style.css` | nav A layout, transcript, one pinned input. |

## Known rough edges (prototype content, not the engine)

- The placeholder ladders can repeat a line when you ask again but haven't
  earned the next rung — real content wants a variant or a "you've asked
  before" beat.
- ~25 MB first-load download is the one real cost of this path. Cached after,
  but worth knowing for mobile.
- Cue authoring is the work: more phrasings per topic = fewer misfires.
