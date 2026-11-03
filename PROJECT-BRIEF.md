# Capri desktop companion — agreed requirements

## User decisions

- Reference performance: English-language Capri.
- Character dialogue and speech output: English.
- Target hardware: ThinkPad X1 Carbon Gen 8, 8 GB RAM, weak integrated graphics.
- Prefer fully local operation, including dialogue and speech. No cloud service or paid speech dependency by default.
- Prefer a 2D character model.
- User will supply character and animation references later. Do not treat the current CSS illustration or invented expressions as an accurate Capri model.

## Implementation direction, pending measurements

- Keep existing task storage and allowlisted desktop actions independent of AI.
- Use a lightweight 2D renderer; measure idle resource consumption and frame pacing on the target machine before expanding animation complexity.
- Evaluate compact CPU-oriented language and English speech models together, accounting for Windows and other applications in the 8 GB memory limit. Do not assume a 7B model is an appropriate default.
- A locally designed English voice with suitable delivery is the initial goal. Exact actor-voice reproduction is not assumed or promised.
- Drive mouth animation from generated audio, with separate expression and gesture controls.
- Validate one short English spoken reply with synchronized animation before producing a full animation set.
- Downloading software/models during setup is distinct from network access during normal operation; document required downloads and verify the eventual offline runtime.

## Still needed

- User-supplied visual and motion references.
- Actual model sizes, licenses, runtime memory use and latency measurements before selecting the local AI/TTS stack.
- Final character artwork and rig; current artwork, Windows voice integration and browser companion are prototypes.

## Implementation status (2026-10-31)

The app now defaults to English and Qwen3-1.7B, uses explicit SQLite memories and bounded chat history, and includes a local speech service (faster-whisper base.en CPU INT8 + Kokoro FP32). FP32 replaced Kokoro INT8 after local timings showed a substantial speed improvement. It has an Electron character window and reference-image body/expressions. These are prototype implementations, not a trained Capri voice or complete character rig. See README for current limitations and verification commands. Automatic preference learning and fine-tuning remain unimplemented.

After rollback of the first continuous joint prototype, the user authorized the upstream animation approach and delegated the choice of style. The current default is pre-baked cel playback using the upstream prepared sprite, renderer and held exposure sheets: 12 fps normally, 24 fps for designated action beats. Expression changes use a brief stepped digital cut. A lightweight emote mode and a still mode are available. Normal playback uses Canvas 2D and keeps Electron's software-rendering default. This is a fan-style adaptation supported by the supplied visual references; exact film-wide exposure timing has not been established.
