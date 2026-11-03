# Capricorn Project eye intro

Startup displays the supplied user-eyes.webp reference without an eye frame,
with the transparent cyan title `CAPRICORN PROJECT // By Kwang` for 1.5 seconds.
The title uses local Segoe UI Light at weight 100 with a restrained neon glow.

4,416 small image fragments burst rapidly and travel through one curved particle
stream over 1.2 seconds, converging at the companion area. Independent hashed
scatter keeps the fragments separate rather than drawing a solid ribbon. Initial
shrink finishes in about 180 ms. A local CRT flash then reveals the existing
full-body companion after 0.5 seconds.

Canvas rendering is capped at 30 fps and 1600 x 1000 pixels, without WebGL or
font downloads. The overlay passes mouse input through and takes no keyboard
focus. The main process validates intro completion and supplies the destination;
a 5.5-second fallback reveals the companion if necessary. Digital effects off or
OS reduced motion displays static eyes/title without fragmentation or flash.

Validation: actual Electron startup with effects enabled and disabled passed via
`node tools/check-arrival.js`. Checks include the title, transparent backing,
light font weight, single stream, CRT, and hidden-then-visible full-body pet.
No renderer errors. Screenshots: `.cache/eyes-intro-PIfZcA/`.

Changes are in source; no new production installer was built.
