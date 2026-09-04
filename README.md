# Scribble Story

A hyper-minimal engine for choice-based interactive fiction in the browser —
in the spirit of [Playfic](https://playfic.com). One reading column, one
illustration per scene, a short list of choices. No build step, no
dependencies, no framework.

The repo ships with a short sample story, **The Moss Door**, so there's
something to play immediately. Replace it with your own.

## Play it

Open `index.html` in a browser. That's it.

For local development, serve the folder so relative paths and the browser's
back/forward behave normally:

```bash
python3 -m http.server 4177
```

Then open <http://localhost:4177>.

## Write your story

Everything you write lives in [story.js](story.js) — one `STORY` object of
scenes. The file's header comment documents the full format; the short
version:

```js
const STORY = {
  title: "The Moss Door",
  start: "porch",
  scenes: {
    porch: {
      art: "assets/illustrations/porch.png",   // optional
      text: [
        "First paragraph.",
        "Second paragraph. Write {{name}} to drop in a saved value."
      ],
      choices: [
        { label: "Knock", to: "hall" },
        { label: "Try the handle", to: "hall", do: { triedHandle: true } }
      ]
    },
    // a scene with no choices is an ending
  }
};
```

- **`do`** and **`onEnter`** set values on a shared `vars` bag — either an
  object that's merged in (`{ hasKey: true }`) or a function
  (`(v) => { v.turns++ }`).
- **`when`** on a choice hides it until a condition is met —
  `when: (v) => v.hasKey`.
- **`to`** can be a function for computed branching —
  `to: (v) => v.hasKey ? "vault" : "locked"`.

Progress saves to the browser automatically. The **Start over** link (bottom
of the page) clears it.

## Illustrations

Drop one image per scene into [assets/illustrations/](assets/illustrations/)
and point the scene's `art` at it. Until the file exists, the page shows a
dashed box with the filename — a to-do list for the drawings. See
[assets/illustrations/README.md](assets/illustrations/README.md) for the
naming and sizing convention.

Working files (PSD, procreate, scans) live outside the repo, in
`~/Desktop/design/vibecoding/scribble-story/`. Only the exported web images
belong here.

## Structure

| File | What it is |
| --- | --- |
| [index.html](index.html) | The page shell — masthead, scene, footer |
| [style.css](style.css) | All styling. Tunable values (colors, column width, pacing) are the `:root` variables at the top |
| [engine.js](engine.js) | Renders scenes, handles choices, saves progress, keyboard (`1`–`9` pick a choice). You rarely need to touch this |
| [story.js](story.js) | **Your story.** |
| assets/illustrations/ | Exported web images, one per scene |

## Deploy

It's a static site, so almost anything works. For GitHub Pages: **Settings →
Pages → Build and deployment → Deploy from a branch → `main` / `root`**. The
`.nojekyll` file is already in place so every asset is served as-is.
