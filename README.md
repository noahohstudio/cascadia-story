# Cascadia Story

A Playfic-style interactive-fiction web game. Instead of a fixed parser
(`n`, `x`, `look`) or a menu of options, the player types whatever they want
and an AI narrates the response — with guardrails that keep the story moving.
Vanilla HTML/CSS/JS, no build, no framework.

## Status — early, mid-pivot

The concept moved away from illustrated choice-fiction toward the freeform
text + AI model above. The design is being redone in Figma (desktop first,
then a title screen), and the AI/input layer is still being specced.

What's in the repo right now:

- `index.html` / `style.css` — cleared to documented skeletons, ready for the
  Figma design to drop in.
- `engine.js` — an **interim** engine that renders a choice-based scene graph.
  Kept so the page runs; will be reworked for the real input model.
- `story.js` — a 2-scene placeholder in a provisional format.

Next:
- [ ] Desktop UI + title screen → `index.html`, `style.css`
- [ ] AI + input model (accessibility, freeform input, progression guardrails)
- [ ] Rework `engine.js` and the `story.js` format to match
- [ ] Real story content

## Run it

```bash
cd ~/cascadia-story && python3 -m http.server 4177
```

Open <http://localhost:4177>, or just open `index.html` in a browser.

## The pieces

| File | What it is |
| --- | --- |
| `index.html` | Page shell. The top comment lists the `data-*` hooks `engine.js` needs — keep those, change everything else. |
| `style.css` | Reset + iOS safe-area vars + an empty design-token block + a map of the DOM `engine.js` produces. |
| `engine.js` | Interim: scene rendering, choices, `vars` / conditions / effects, `localStorage` save, `1`–`9` keyboard picks, graceful error handling. |
| `story.js` | The story, as one `STORY` object. Format is provisional — the header comment documents it. |

## Deploy

Static site. For GitHub Pages: **Settings → Pages → Deploy from a branch →
`main` / root**. `.nojekyll` is already in place.

## Design files

Mockups and working files live in
`~/Desktop/design/vibecoding/cascadia-story/`, not the repo.
