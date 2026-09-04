# Illustrations

One image per scene. The scene's `art` field in [../../story.js](../../story.js)
points here.

## Convention

- **Filename = scene id.** Scene `porch` → `porch.png`. Endings in the sample
  use `ending-stay.png`, `ending-room.png`, `ending-leave.png`.
- **Format:** PNG (transparent, or on the paper color `#faf8f2`). Line art
  reads well either way. Use WebP/JPEG instead only for dense, painterly art.
- **Size:** ~1600&nbsp;px wide. The reading column is 33&nbsp;rem (~530&nbsp;px),
  and the image is displayed at container width, so 1600&nbsp;px covers retina
  screens with room to spare. Keep each file under ~400&nbsp;KB.
- **Aspect ratio:** whatever suits the drawing — the layout adapts. Consistent
  proportions across scenes make the story feel more even.

## Missing files

If `story.js` names an image that isn't here yet, the page renders a dashed
placeholder box showing the path. That's the intended to-do list while you
draw — nothing breaks.

## Working files

Source files (PSD, Procreate, scans) do **not** go in the repo — the root
`.gitignore` blocks common formats. Keep them in
`~/Desktop/design/vibecoding/scribble-story/illustrations/` and export the
flattened web image here.
