# Upstream motion code and character artwork

Required Notice: Copyright (c) 2026 mochiiwuff (https://github.com/mochiiwuff/capri-desktop)

The retained pointing pose derives from upstream acting.js and sprite.js at the revision recorded in public/vendor/capri-desktop/SOURCE.json. The unused local copies of those source files were removed. The complete upstream license is retained in `public/vendor/capri-desktop/LICENSE`. Its current code license is PolyForm Noncommercial 1.0.0, with earlier MIT-covered code identified in that file. Preserve these notices and the license with any redistribution of the imported or derived parts.

The old joint/shader baker and generated atlas were removed during cleanup. Current playback holds existing body poses and swaps original bitmap emotes with Canvas 2D; no joint renderer is loaded. Required notices remain with the retained derived pointing pose.

`public/assets/mochi/` contains all 24 original PNG/WebP images under upstream `assets/capri/` at revision `3e6f529e6875856869789265786ab3e3df14a293`: eight portrait faces (including `capri-face.png`), five cut-ins, nine introductory mouth/wave drawings and two body references. Source paths and SHA-256 hashes are retained in `public/assets/mochi/SOURCE.json`; `tools/import-mochi-emotes.js` verifies the upstream Git blob hashes when importing. `public/emote-catalog.js` adapts expression contexts from upstream `panel.js` FACES/KIND_FACE, `chat.js` mood/MOOD_FACE, `capri.js` cut-in cues and `fx.js` GRAB_FRAMES. The artwork exclusions and Required Notice above apply to these assets too.

Character images, including public/assets/mochi/capri-full.png and the expression strip, are excluded from the upstream code license. Upstream credits Capri / Cyberpunk to CD PROJEKT RED, Studio Trigger and Netflix, and also uses fan artwork. This project does not claim ownership of the character or grant additional artwork rights. Use is for the user's local fan prototype; commercial use is not authorized by these notices.

See `public/assets/ATTRIBUTION.md` for the other supplied references.

# Lachy's Capri sprite artwork and animation timing

Required Notice: Copyright 2026 Lachy (https://github.com/lachydotmcg)
Required Notice: Anyone who uses Capri's code, art, animations or any of its other assets must credit the Capri project (https://github.com/lachydotmcg/capri-desktop). Capri's art and animations are by her artist, who prefers to stay private. Parts made by others keep their own licences, listed in its README.

The default character sprites in `public/assets/lachy/` derive from https://github.com/lachydotmcg/capri-desktop at revision `eb1aecd4831829285044b87111497668024a0695`. The complete PolyForm Noncommercial 1.0.0 license is in `public/vendor/lachy-capri/LICENSE.md`; source paths and SHA-256 hashes are recorded in `SOURCE.json` in the same directory. Preserve the license and Required Notices when redistributing these parts.

`tools/prepare-lachy-sprites.js` resizes, aligns and resamples the original sprite cells. `public/sprite-player.js` and `sprite-timing.js` adapt sprite placement, standing/perched blink windows and separate mouth drawing described in upstream `app/Capri.cs`, `cross/Pet.cs` and `site/helper.js`. They do not import the upstream executable, brain, cloud endpoints or automatic desktop control. The one `point.png` clip still derives from the earlier mochiiwuff renderer; its earlier notices above remain applicable. Character rights are not transferred by either project's license.

`tools/import-reference-voice.py` verifies the SHA-256 declared by upstream `app/VoicePack.cs` for the `voice-pack-1` release, then imports only synthetic Kokoro speaker 53, selected by upstream `LocalVoice.Styles`. It does not extract or run the pack's DLLs. Local provenance is recorded alongside `.models/capri-reference.npy`. Kokoro-82M keeps its Apache-2.0 model license; the upstream project's Required Notices above also accompany this adaptation. `speech/effects.py` adapts the pitch/tempo compensation, volume and delayed-layer settings documented in upstream `Voice.cs` and `Capri.cs`. Its WSOLA overlap/search layer processor and short lookahead limiter adapt upstream's pitch-preserving DSP, with a slower default pace selected for this app. This remains synthetic speech, not an actor's voice. No recording-based voice cloning is involved.

## Bundled local AI runtime

Capricorn includes Ollama 0.40.13 Windows x64 CPU binaries from the signed official Windows distribution. Ollama is MIT licensed; runtime/ollama/LICENSE, its lib/ollama notices, and SOURCE.json accompany the installation. The optional Qwen3 models are downloaded through Ollama only after the installer/setup selection and keep their supplied model licenses. The Capricorn application icon reproduces the existing face-look.png reference; the artwork notices above remain applicable.
