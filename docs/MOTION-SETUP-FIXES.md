# Motion, new references and setup safety — 2026-11-03

Source changes; no new production installer has been built for these changes.

## Character

- Idle full-body artwork translates rigidly by at most 1 px horizontally and
  2 px vertically, quantized at 8 fps. No rotation, joint animation or body
  stretching. Still/reduced-motion mode and disabled idle activities stop it.
- Canvas dimensions now match the character frame. Square expressions use a
  square frame; the wide thinking reference uses a shorter frame. Images are
  contained with padding, preserving proportions and removing the old 1.08x
  overscale and intro crop. Chat window height follows these changes.
- Three user-provided references were copied from E:/Capri_data without editing:
  Capri_thinking-1.webp, Capri_eyes_blink_1.webp and 1Capri_eyes_.webp. Their hashes
  and original paths are in public/assets/mochi/USER-SOURCE.json. All 27 images
  are available in Settings; new references participate in relevant context pools.

## Setup

- Removed Later from the first-run preparation window. Open remains disabled
  until the selected model, voice resources and recognition files are present.
- Desktop IPC independently verifies authenticated backend readiness; passing
  the former Later argument cannot bypass it. A window closed during the check
  cannot create the companion afterward.
- Native close during first-run setup offers Continue setup or Quit Capricorn.
  Quitting exits without a companion. Verified model layers can resume later.
- An installed old model does not make setup ready while preparing a new one.
- NSIS disables Cancel and system-menu Close during file copying, writes an
  incomplete-install marker, and removes it only after successful copying and
  setup-choice persistence. Packaged startup refuses an incomplete install.

## Verification

- 35 Node tests passed.
- Real Electron UI verified hover, Still mode, all 27 options and contained
  square/wide references. Screenshots: .cache/model-layout-ln3xd2/.
- First-run Electron checks verified no Later bypass, backend readiness,
  Continue setup and Quit paths. Model availability was controlled by a local
  test HTTP server; no model was downloaded in those checks.
- Compiled a standalone NSIS harness using the actual installer include. Its
  copy stage rejected Cancel and WM_CLOSE, retained the marker during copying,
  and cleared it after success. Evidence: .cache/nsis-guard-CKyrPL/.
- This is not a fresh full production-installer installation test.

## Cleanup

Deleted obsolete 0.3.1/0.3.2 installer executables, blockmaps and checksums in
dist, the root 0.3.2 copy, and release/v0.3.2. Total removed: 2,858,333,842 bytes.
No source assets, active model resources or external Capri_data files were
deleted. Old unpacked build output remains a build intermediate, not a release.
