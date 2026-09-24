# Prototype — Hollis Creek Bridge

A short, complete playthrough built on the $0 path: no API, no server, no
key. Every word the game says is written in [content.mjs](content.mjs). A
~25 MB sentence-embedding model runs in the browser (once, then cached),
works out what the player *meant*, and the engine serves the matching line.

## Run it

```bash
cd prototype
python3 -m http.server 4180
```

Open <http://localhost:4180>. The model loads behind the title screen, and
**Begin** lights up when it's ready.

Tick **show matches** (top right) to see what each input matched, how
confidently, and Del's agitation / trust after each turn.

## The story in one breath

You're lost on a detour. The only way on is a drawbridge, raised, kept by
Del, an old man who thinks it's still October 14, 1987: the night his son
Wes drove east across this bridge after a fight and was told not to come
back. Del raises the bridge every night so anyone coming west has to stop
at his window. The bridge comes down when you help him say what he never
said. What became of Wes is never answered.

**Endings:** the bridge comes down (patience) · you turn around (you quit)
· the window closes (you pushed too hard).

## How a turn works

1. **Plain words first** (`quickTurn` in `engine.mjs`): answers to Del's own
   questions (your name, yes/no), `look`, `wait`, `help`, `inventory`, and
   follow-ups like `why?` / `go on`, which ask the last topic again.
2. **Otherwise the model** (`match.mjs`) finds the closest *cue* among
   actions, moves and topics, and `resolveTurn` applies it.
3. **Guardrails:** high-stakes cues (turning around, lying, grabbing the
   lever) need a confident match. Near-misses make Del ask *"You asking
   about the bridge?"*. Patient moves only earn trust a couple of times each.
   He warns you once before shutting the window.
4. **Then time passes:** the clock ticks, dusk becomes night, and Del has
   his own moments (asks your name, mistakes you for Wes, forgets your name)
   spaced at least three turns apart.

## Files

| File | Role |
| --- | --- |
| `content.mjs` | **The whole story.** Places, actions, moves, topics (ladders of answers gated by trust / threads / flags), Del's own beats, filler, hints, endings. The header explains the format. |
| `engine.mjs` | Turn rules. Deterministic; no story text lives here. |
| `match.mjs` | Loads the model, embeds every cue, returns the closest match. |
| `app.mjs` / `index.html` / `style.css` | Title screen, nav A, transcript, rain, night/paper modes. |
| `del.png` | Del: a photo turned into Cascadia Code ASCII art, rasterised (charcoal on white). |

## Tuning

- **A phrase lands in the wrong place?** Add it (or something close) to the
  `cues` of the place it should go. More cues = fewer misfires.
- `MATCH_THRESHOLD` (0.46) / `NEAR_MISS` (0.38) in `engine.mjs`: the "did
  that mean anything" cutoff, and the "Eh? You asking about…" band.
- `minScore` on a cue group: how sure the model must be before a
  high-stakes move fires.
