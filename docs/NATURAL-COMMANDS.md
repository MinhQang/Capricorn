# Natural computer requests — 2026-11-03

The source build now routes text and transcribed speech through the same
`lib/intent-router.js`. The speech UI already submits transcripts through the
chat form; there is no separate, less capable voice command parser.

Routing order:

1. Explicit slash commands, folder paths and clear app commands use existing
   deterministic executors. Informational and explicit negative requests do not
   execute. App aliases include Chrome, Visual Code and VS Code.
2. Existing recognized file/window operations retain the checked planner.
3. Other messages use the selected local Qwen model with a constrained JSON
   classification: chat, open_app, computer or clarify. This classification has
   no character persona and cannot directly execute code.
4. App names must be grounded in the current utterance (including equivalent
   known aliases), then resolved against trusted aliases or the installed app
   catalog. Multiple matches ask for a full name. Other operations still pass
   through the existing operation, path and drive-C checks.
5. Ambiguous operational requests and inference errors produce a concrete
   clarification/error rather than a fictional success or conversational joke.

Only classification is cached for 15 seconds to avoid duplicate inference in
the existing /command -> /chat UI flow. Execution results are never cached or
replayed. No conversation reset or memory deletion is performed.

Launch replies explicitly say "Launch request sent". The existing desktop UI
adds window-location confirmation only when native window detection succeeds.
An already running process is not proof of a newly opened, visible window.

Reference: lachydotmcg/capri-desktop's Brain.cs dispatches tool requests and
Computer.cs handles open_app and waits for the screen to settle:

- https://github.com/lachydotmcg/capri-desktop/blob/main/app/Brain.cs
- https://github.com/lachydotmcg/capri-desktop/blob/main/app/Computer.cs

We adopt the separation of interpretation and checked execution, not its full
mouse/keyboard/screen agent or cloud model integrations.

Validation: 28 Node tests; live Qwen3 1.7B classification of indirect Chrome and
Visual Studio Code requests, ordinary conversation, explanation and negation.
A real indirect Notepad request dispatched to Windows; target-window.ps1 then
detected its window. Speech submission/VAD regression tests also pass; no new
live microphone recording was made for this change.

Limits: small models still make interpretation mistakes; opening an unspecified
"it" asks for the app name rather than guessing from history. General GUI
automation is not added. Qwen3 0.6B was not validated live for this change.
Indirect requests add a local inference pass; direct commands remain faster.
The existing 0.3.1 installer has not been rebuilt with this source change.

## End-user UI validation

Run `node tools/check-end-user.js` for the real Electron UI with real local
Qwen3 1.7B, STT and TTS. Only the physical microphone is replaced with a
prerecorded audio stream; backend responses are not intercepted. The profile
and screenshots are isolated under `.cache/end-user-*`.

On 2026-11-03 the UI run exposed a launch bug: requested GUI applications were
spawned with `windowsHide: true`. Notepad could run without a visible window.
Requested app launches now use `windowsHide: false`; internal PowerShell helpers
remain hidden. Native window detection now waits up to eight seconds, with an
eleven-second parent timeout. Initial placeholder text with replacement
characters was also corrected.

After fixes, 17 UI scenarios passed with no renderer errors, including four
natural app requests with actual window detection, distinct sequential chat
answers, ambiguous/missing apps, negative/informational requests, drive C
exclusion, slash suggestions, separate settings, spoken text replies with
measured audio and talking state, and real local transcription auto-sending an
indirect Notepad request. Evidence: `.cache/end-user-x0hOJm/report.json`.
The test runner's Playwright teardown hung after Electron itself exited; its
cleanup was corrected. A separate UI-button quit check verified exit code 0:
`.cache/end-user-jKDlAL/report.json`. All 28 Node regression tests also passed.

This does not certify physical microphone/speaker operation, voice similarity,
every phrasing of a request, a cold boot on other hardware, or the old installer.
