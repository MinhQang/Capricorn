# Capri — user-provided reference review

Sources: `E:\Capri_data\Capri 1.mp4` (56.43s, 1914×1078) and `E:\Capri_data\Capri Introduce.mp4` (48.11s, 1034×1036).

## Method and limitations

Frames sampled locally at four-second intervals; English audio transcribed locally using faster-whisper base.en, CPU INT8. Original files are unchanged. Tools and model weights were downloaded; the video/audio was not uploaded for transcription.

Visual observations below are based on inspected contact sheets. Dialogue analysis uses imperfect machine transcripts. No direct listening verification or reliable speaker diarization was completed. Speaker hypotheses must not be presented as verified acoustic identity, actor identity, isolated voice, or clean training data. Sampled stills alone cannot establish exact motion timing or lip synchronization.

## Visual observations

- Angular, graphic 2D silhouette; bright pink/red spiky hair or head mass with a speckled texture.
- Black facial/body regions and strong neon green facial areas; circular blue/white eye elements with graphic rings.
- Palette changes between shots: green, white and red/pink should be treated as reference variants, not randomly interchanged skins.
- A zigzag-like mouth; large eye-shape changes and narrow/closed-eye expressions are visible.
- The introduction opens on an elongated, bent silhouette. This suggests deformation is an important design requirement, but the exact movement must be reviewed in continuous playback.
- The blond human avatar currently in the app is an inaccurate placeholder. Do not build final Capri assets around its anatomy or palette.

## Dialogue-supported working interpretation

The introduction transcript attributes the self-description to a personality construct made from digitized human psyches. These content cues suggest Capri is speaking, but the boundaries are not yet acoustically verified.

- The invitation to become friends followed by an objection about body hijacking supports a proposed teasing, intrusive dynamic. Confirm the speaker changes before treating this as a final personality rule.
- The comparison between mammals/dogs and the AI label suggests rhetorical correction and confidence, rather than a generic agreeable assistant.
- The self-description as “one beautiful me” suggests theatrical self-regard.
- Translate these into proposed app behavior: short confident English replies, occasional playful challenge and expressive reactions. Do not translate fictional body hijacking into unapproved computer actions.
- Avoid extrapolating a complete personality, emotional attachment or actor-specific voice characteristics from these two excerpts.

## Candidate review intervals — approximate, not verified labels

| File | Seconds | Content cue | Status |
|---|---|---|---|
| Capri Introduce.mp4 | 2.29–5.29 | Invitation to be friends | Possible Capri; review speaker and overlap |
| Capri Introduce.mp4 | 19.29–27.29 | Personality construct / digitized psyches / self-description | Strong narrative candidate; boundaries unconfirmed |
| Capri Introduce.mp4 | 29.29–39.29 | Mammals/dogs comparison and origin explanation | Likely multiple turns; not a single clean clip |
| Capri Introduce.mp4 | 45.29–46.29 | Brief response to compatibility remark | Candidate only |
| Capri 1.mp4 | 0.43–20.15 | Teasing exchanges between multiple characters | ASR merged turns; do not assign as one speaker |
| Capri 1.mp4 | 26.34–33.56 | Calling out to another character | Speaker unverified; exclude from Capri corpus for now |

## Next verification gate

Use `reference-analysis/review.html` for side-by-side listening/playback and timestamp navigation. Two extracted WAV snippets are labeled candidates only. Confirm one clearly single-speaker Capri segment first; then compare other candidate turns, isolate speech with padding and flag overlap/music. Actor identity, vocal timbre and prosody remain unverified in this review. Do not train or clone a voice from the candidate snippets.

## Lightweight 2D direction

Prioritize deformable angular parts, independently controlled eyes/eyelids and zigzag mouth shapes. Evaluate vector/mesh rendering before committing to a conventional human Live2D rig. Keep expression, palette variant, gesture and audio-driven mouth movement separate. The supplied scenes should guide timing once continuous playback has been reviewed.

### 2026-11-02 — command routing and conversation repetition

Reviewed current upstream app/Hands.cs and app/Computer.cs. Upstream uses an actual open_app tool, an installed-app catalog from shell:AppsFolder, expiring catalog caching and different launch paths for an executable versus an app ID. Its computer loop consumes tool results; a spoken acknowledgement alone is not treated as execution. References: https://github.com/lachydotmcg/capri-desktop/blob/main/app/Hands.cs and https://github.com/lachydotmcg/capri-desktop/blob/main/app/Computer.cs.

Our implementation now uses deterministic slash commands and the same native action path for microphone transcripts and typed messages. It retries app discovery after failures, invokes Windows PowerShell by its system path, and has trusted installed-location fallbacks for common apps. User-supplied shell commands and executable arguments are not accepted. /write uses a new blank Notepad document, through its new-tab automation control when necessary, then writes literal text into the editor; existing documents and drive-C file restrictions remain protected.

Conversation changes simplify the persona for 0.6B/1.7B models and prioritize the current question. If an answer exactly repeats a previous long answer for a different question, one retry excludes earlier assistant messages. If that still repeats, an explicit error is shown instead of persisting the duplicate. Tests on both actual models answered arithmetic, geography, opposites and a follow-up about the preceding question distinctly and correctly. This is a bounded regression check, not a claim that small models can answer every question correctly.
