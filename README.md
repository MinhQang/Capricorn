# Capricorn ? local desktop companion

## Download for Windows

<!-- CAPRICORN-DOWNLOAD:START -->
[![Download for Windows x64](https://img.shields.io/badge/Download-Windows_x64-8b35ff?style=for-the-badge)](https://github.com/MinhQang/Capricorn/releases/download/v0.3.2/Capricorn-Setup-0.3.2-x64.exe)

[All releases](https://github.com/MinhQang/Capricorn/releases) · [SHA-256 checksum](https://github.com/MinhQang/Capricorn/releases/download/v0.3.2/Capricorn-Setup-0.3.2-x64.exe.sha256)
<!-- CAPRICORN-DOWNLOAD:END -->

Download the installer, close Capricorn if running, then install and launch it. Choose the local AI model during setup; it downloads automatically on first launch. No separate Node.js, Python or Ollama installation is required. Windows 10 22H2 / Windows 11 x64; 8 GB RAM recommended. First setup needs internet, then chat and voice run locally.

**For developers:** source setup instructions are below. Download ZIP under GitHub's Code menu contains source code; the ready-to-install app is distributed through Releases.


Windows fan prototype for a ThinkPad X1 Carbon Gen 8, integrated graphics and 8 GB RAM. English conversation, voice, explicit memory, task management and checked local computer tools. Unofficial character interpretation; no actor voice cloning.

## Run

Use Node.js 22.13+ (Node 24 tested), install dependencies with npm install, then double-click Start-Capri.cmd or run npm start. Setup-Local.cmd installs local speech components once. Ollama needs qwen3:1.7b installed. Normal operation uses local models and original assets on disk, without cloud APIs.

The default companion is a transparent 320 x 340 window. Drag its header to move it. Chat & voice opens a content-sized cyberpunk dialogue card above Capri; History expands the conversation. Settings opens separately and is destroyed when closed. Closing Settings does not stop speech. The task/memory dashboard is optional from Settings. Quit from Capri's header.

## Character and model frame

Latest source: [gentle idle motion, 27 images, adaptive square/wide frames and setup safety](docs/MOTION-SETUP-FIXES.md). These changes are included in the current 0.3.2 Windows installer.

A small violet/cyan frame surrounds only the 255 px-high character stage. Settings > Model frame toggles it. There is no fullscreen overlay and no second renderer for the frame. Chat input and Settings sit outside that stage. The companion's native input region remains rectangular.

Body poses hold still: standing, sitting, lying, sleeping and pointing. Old body sway, dance and flail loops are disabled. All 24 original Mochiiwuff bitmap assets are kept: eight portraits, five cut-ins, nine intro/mouth/wave drawings and two body references. Four inverted faces are corrected at display time in both portrait and stage.

Faces/cut-ins use closer framing; speech crops the original intro drawings closer without deforming joints. A reply's expression returns for 2.2 seconds after speech, even if voice generation took several seconds. Mouth frames cycle only during actual audio playback, not while synthesizing. Preview pose in Settings includes all 24 images. Expression selection is heuristic, not emotion recognition or newly trained artwork.

Pose/emote changes produce a local 360 ms glitch: displaced image bands, cyan/pink fragments and frame interference. Mouth frames do not retrigger transitions. Occasional signal bursts remain 3-7 seconds apart. Digital interference, Still mode and the OS reduced-motion setting can suppress effects. The runtime uses Canvas 2D and static SVG/CSS, no live WebGL or joint rig. The decoded bitmap cache budget is 24 MiB, separate from overall Electron and AI memory.

## Local voice and memory

Speak replies is on by default; mute it in chat or Settings. Click the mic icon beneath Capri to unmute for continuous local conversation. Pause for about one second to send each utterance automatically; click again to mute. Listening pauses while Capri processes or speaks, and Escape mutes the microphone. Stop voice interrupts playback and clears mouth motion. History loads silently. Kokoro FP32, the approved synthetic Capri speaker, phrase-level prosody and digital voice effects run on CPU. Faster-whisper base.en uses INT8 recognition. Pitch/speed/delivery settings remain adjustable; this is stylized synthetic speech, not a clone of the actor.

Saved facts are explicit and editable in Memory. Up to 100 conversation turns persist locally across restarts. The model receives up to six recent turns within a 3,000-character budget plus at most two keyword-matched older exchanges; its context window is 3,072 tokens. History shows the latest 24 messages. Clear chat history removes both recent and retrievable conversation, while saved facts remain editable separately. App launch results and explicit remember requests also enter the conversation history. Tasks and chat history stay in Capri's internal data directory. Local files read by computer tools are not automatically ingested into memory or the planner.

## Computer tools and drive C

The latest source supports ordered requests such as `search Google for Capri in Chrome then create file "E:/Work/notes.txt" with text "Hello"`. Search sends a browser request; it does not read or summarize results. File paths are checked before any step and existing files are not overwritten. See [full model and workflow changes](docs/FULL-MODEL-WORKFLOWS.md) for examples and validation. These changes are included in the current 0.3.2 Windows installer.

Direct file tools exclude C; installed apps may still run and be window-managed there. This is an app-level tool policy, not a Windows account sandbox: Windows, Capri's own internal state and installed apps still use their ordinary system/profile files. No arbitrary shell, scripts, file execution or generic mouse/keyboard automation is exposed.

Supported operations:

- Open installed apps by Start menu name, exact HTTP/HTTPS URLs and ordinary documents/folders.
- List a directory; read a text file up to 64 KB.
- Create a folder or a NEW text file from user-supplied text. Existing files are not overwritten.
- Copy files/folders, rename or move on the same drive, or send items to Recycle Bin. Recursive work is bounded to 1,500 entries / 100 MB. Use copy for a cross-drive transfer.
- List app windows and focus, minimize, maximize, restore or request a graceful close. Multiple matches need an exact title or window ID. Unsaved-work prompts remain with the app.

Use quoted absolute paths, such as create folder "E:/Project/Notes" or copy "E:/Project/a.txt" to "E:/Project/b.txt" and then rename "E:/Project/b.txt" to "E:/Project/c.txt". Other examples: list windows, minimize chrome, read file "E:/Project/notes.txt".

Simple commands run directly. Other requests use local Qwen with a bounded JSON schema, at most six steps and only requested operation types. All paths/fields are validated before the first side effect. File tools reject C, streams/device paths, network/SUBST mappings, C-volume aliases, links and junctions. This does not provide kernel-level protection against another process racing path changes. Ollama schema reference: https://github.com/ollama/ollama/blob/main/docs/api.md.

The card shows actual job steps. Stop job aborts planning and stops later steps; already-completed operations remain, and an interrupted copy can leave a partial destination. Successful action metadata, excluding file contents, is kept in computer-actions.ndjson in Capri's internal state directory.

## Verification and development

- npm test: authentication, persistence, command routing, file guards, checked operations, schema validation, emote provenance and sprite timing.
- node tools/check-companion-ui.js: separate Settings, adaptive chat, progress, playback and stop/end lifecycle.
- node tools/check-emotes.js: all 24 images, held poses, transitions, mouth cycling and saved mute. Add --live for real local TTS.
- node tools/check-computer-ui.js: real folder creation, C rejection, local model frame, frame toggle and reduced motion.
- node tools/check-native-computer.js: a disposable test window and Recycle Bin fixture.
- node tools/check-live-planner.js: real Qwen folder creation plus multi-step copy/rename in .cache.
- node tools/check-live-voice-button.js and check-voice-feedback.js: voice preview and error/cancellation feedback.

To regenerate Lachy sprites, place pinned source images/revision under .cache/lachy-reference, then use tools/prepare-lachy-sprites.js. The checked-in pointing pose is retained; no legacy shader atlas is required. Bitmap emote and synthetic-speaker import tools retain pinned provenance and verify upstream hashes.

## Cleanup and credits

Unused fullscreen-HUD code, joint/shader playback/build code, old atlas assets and obsolete animation diagnostics have been removed. tools/clean-obsolete.ps1 removes only identified cache/build/test outputs and retired assets under this workspace; it checks absolute paths and skips reparse points. Run with diagnostic apps closed. It preserves active models, Whisper cache, installed Python/speech runtime, node_modules, all current emotes/poses, references and license notices. The last cleanup inventory is docs/CLEANUP-REPORT.json. File-byte totals are logical sizes and may differ from physical space recovered because package caches can use hardlinks.

See THIRD_PARTY_NOTICES.md and public/assets/ATTRIBUTION.md. Keep both upstream license notices. External Capri_data and source/reference documents are not cleanup targets.

Windows packaging: see [docs/WINDOWS-INSTALLER.md](docs/WINDOWS-INSTALLER.md). Version 0.3.2 includes a private CPU Ollama runtime and an installer model choice; first launch downloads the selected Qwen model with progress/retry. Speech and recognition are included. No separate Node/Python/Ollama installation is needed on the destination machine. Startup now shows Capri eyes and CAPRICORN PROJECT // By Kwang, followed by digital fragments and a local CRT reveal (about 3.2 seconds); automated checks may set CAPRI_SKIP_INTRO=1.

Slash commands are documented in docs/WINDOWS-INSTALLER.md. Suggestions load independently of the local LLM. `/write` creates an unsaved blank Notepad document using its native editor control; it does not inject text into an arbitrary active app. App discovery retries after failure and uses Windows PowerShell by absolute path.

Startup animation details and screenshots: [Eyes intro](docs/EYES-INTRO.md).
