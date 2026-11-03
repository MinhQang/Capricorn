# Full model and checked workflows — 2026-11-03

These are source changes. The existing 0.3.2 installer does not contain them;
release preparation is paused.

Digital emotes mode previously kept face-look as its idle fallback. It now uses
the complete capri-cutout image as its held pose; Cel mode uses full-body sprites.
The capri-full reference is missing an arm in the source artwork and is excluded
from automatic idle selection. A real Electron check verified capri-cutout idle
and captured `.cache/complete-body-4hA1Pw/complete-body.png`.
Thinking and reply emotes expire back to a body pose. Authored speech frames,
glitch transitions and the 24 MiB bitmap cache budget remain.

All 24 imported images can be previewed in Settings. Greeting, target, success,
failure, calm, curiosity, surprise, intensity and joke pools rotate suitable
images; three mouth drawings animate speech, and two body references provide
idle alternatives. No joint deformation or old body sway was added.

## Examples

```text
search Google for Capri desktop assistant in Chrome
create empty file "E:/Work/notes.txt"
create a file named notes.txt in E:/Work with text "Hello"
create folder "E:/Work/Capri" then create file "E:/Work/Capri/notes.txt" with text "Hello"
search Google for Capri then create file "E:/Work/search-notes.txt" with text "Search requested"
```

`/search Capri desktop` is also available. Explicit workflows run up to six
ordered operations. Every path is checked before the first operation. Drive C
remains excluded and existing files are never overwritten. Errors report any
earlier completed steps. Quoted content, including "Do not overwrite" and
"and then create", is treated as data.

Google search sends an encoded query to the browser and needs internet. It does
not read, summarize or verify the page or automatically save results. File
content must come from the user. General clicks, shell execution and unattended
web research have not been added.

## Validation

32 Node tests passed. Real Electron UI verified full body with saved emote mode,
all 24 images through Settings, return to full body after chat, a real Chrome
search dispatch followed by folder/file creation with verified text, rejection
of overwriting, and full-plan C rejection before the search. No renderer errors.
Evidence: `.cache/workflow-ui-khnWzY/report.json` and screenshots.

A later title check could not confirm a loaded Google page, so the search result
is reported only as a browser request sent. Physical microphone input was not
retested for this change; voice transcripts use the same command route.

An initial UI run closed without a crash entry; subsequent runs got past that
point. The next run exposed quoted negative file text being routed to chat;
that bug was fixed, and the final UI run passed all six scenarios.
