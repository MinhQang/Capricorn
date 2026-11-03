# Capri motion reference — mochiiwuff/capri-desktop

Reviewed 2026-10-31. This was the research snapshot following the user's rollback. The user subsequently authorized implementation of the upstream approach; see the implementation update below. Upstream main can change; imported source is pinned in `public/vendor/capri-desktop/SOURCE.json`.

## Architecture observed

### Acting: held poses and timed cues

[`acting.js`](https://github.com/mochiiwuff/capri-desktop/blob/main/src/renderer/js/acting.js) contains exposure sheets. Each entry specifies a hold duration in frames, pose fields and an optional effect cue. `Player.sample` selects a held drawing rather than continuously interpolating pose values. The default sheet rate is 12 fps; selected acts use 24 fps. Loops and one-shot acts differ, and acts have priorities. Examples include curious head movement, sitting leg cycles, pointing and victory. Timing includes anticipation, brief exaggerated drawings, holds and recovery.

### Character controller: position, stance and action layering

[`capri.js`](https://github.com/mochiiwuff/capri-desktop/blob/main/src/renderer/js/capri.js) separates activity mode, physical stance and a current act. Drawing combines neutral defaults, the base stance and action overrides. Position/physics are distinct from the pose. Window-ledges provide landing targets; gravity advances falls with a capped timestep. Dragging and throws use pointer motion. Rendering cadence changes with activity and skips a hidden character. Events at drawing transitions trigger effects. These fan-authored desktop behaviors should not automatically be treated as anime canon.

### Renderer: source-specific deformation

[`sprite.js`](https://github.com/mochiiwuff/capri-desktop/blob/main/src/renderer/js/sprite.js) uses a WebGL fragment shader and a prepared 240×420 image. Its landmarks and masks are source-specific. It bends the head, changes the mane, independently rotates/reaches the arms, foreshortens thighs for sitting and swings lower legs. The arms can appear in front of the mane while shoulder regions cover their junctions. Color grading, speckles, afterimages and glitch contribute to the appearance.

### Asset preparation

[`build-sprite.py`](https://github.com/mochiiwuff/capri-desktop/blob/main/tools/build-sprite.py) removes the original hanging arm and widens the canvas. The shader synthesizes the opposite arm by mirroring the reaching one. Preparation masks must agree with the renderer. The README illustrations already downloaded into Capri_data are not this prepared runtime asset.

### Desktop coordinates

[`windows.js`](https://github.com/mochiiwuff/capri-desktop/blob/main/src/main/windows.js) receives window geometry from a PowerShell helper and converts screen rectangles into overlay coordinates. This supports interactions with real window edges. It introduces platform and display-scaling considerations beyond moving a small standalone character window.

## Implications for this project

These are design conclusions, not upstream guarantees:

1. Verify the prepared sprite, alpha, dimensions and anatomical landmarks before defining gestures. Our existing 420×420 reference cannot directly use their coordinate constants.
2. Specify the timing and held drawings from user-provided scenes. A nominal 12 fps limit alone does not reproduce cel timing; continuous interpolation also changes the result.
3. Keep pose playback independent of desktop navigation, voice, effects and AI. Start with a few approved gestures instead of inventing a large action catalog.
4. Build a small visual comparison page before changing the normal desktop companion. Review strong bends and silhouette continuity.
5. Test renderer support and cost under the app's software-rendering default. Do not re-enable acceleration automatically: the earlier Electron access violation remains unexplained. Provide a lightweight fallback if necessary.
6. Measure CPU and combined RAM with chat and speech active on the target laptop. The upstream rendering approach is a candidate, not proof of performance here.

## Reuse boundary

[`LICENSE`](https://github.com/mochiiwuff/capri-desktop/blob/main/LICENSE) currently states PolyForm Noncommercial for the code, with older MIT-covered versions noted separately; artwork is excluded. Preserve required notices and establish the exact version and asset provenance before any reuse. No upstream implementation code was copied in this review.

## Status

The earlier continuous joint prototype remains removed. Following explicit user approval, the current implementation uses the upstream prepared sprite, renderer and held exposure sheets at build time to bake 65 cels. Runtime Canvas 2D playback preserves the sheet holds, with stepped digital cuts on expression changes and an emote fallback. Normal playback does not use the upstream WebGL shader continuously. See README and THIRD_PARTY_NOTICES.md. Direct file-by-file reuse is now recorded; the earlier research-only statement about not copying code describes that prior review stage.
