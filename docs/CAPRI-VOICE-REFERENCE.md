# Selected voice reference — Capri_voice_1.mp4

The user identified 0–3s, 6–9s, 12–14s and 18–37s as intervals to review. The user previously stated that the video contains several speakers, mainly Capri and a male character. These intervals are reference selections, not independently verified single-speaker labels.

## Processing completed

- Extracted four mono 16 kHz WAV files locally, exactly at the supplied boundaries (27 seconds total).
- Created timestamped contact sheets at one-second intervals and an offline review page.
- Transcribed the clips using cached faster-whisper base.en, CPU INT8, with approximate word timestamps. No network access was required for this run.
- Original video unchanged. No denoising, music removal, speaker separation, voice cloning or training performed.

Output: `reference-analysis/Capri_voice_1/review.html` and `selected-spans.json`.

## Visual and transcript evidence

| Interval | Observations | Caution |
|---|---|---|
| 0–3s | Multiple eye motifs, then full-body pose. ASR starts/ends mid-sentence. | Clip boundaries may truncate words; avoid treating transcript as exact. |
| 6–9s | Open-arm pose, then closer view. ASR includes “And now it's your turn” and laughter. | First word appears truncated; laughter and dialogue require listening verification. |
| 12–14s | Close view of Capri. ASR contains short fragments and an interjection. | Weak transcript; do not infer a stable speaking style from this text alone. |
| 18–37s | Capri interacts with the male character; pointing, leaning close, an exaggerated inverted pose, then arms raised. ASR contains teasing remarks and “Come on, let's play”. | Multiple conversational turns; do not label the entire interval as Capri-only. ASR does not cover the last part reliably. |

## Working animation direction

Build distinct pointing, forward-leaning, inverted/stretching and open-arm gestures, plus eyes-open and eyes-closed grin variants. These visible poses support an expressive 2D approach; exact gesture timing needs continuous playback, not just the sampled contact sheets.

## Speaker and voice status

The user's timestamps narrow the reference search substantially. However, this run provides transcript and visual inspection, not independently verified auditory speaker attribution. No claim is made about exact pitch, vocal texture, accent or actor identity. Do not train on all four files as a clean speaker dataset. First review each turn in the offline page, trim away other speakers and overlap, and preserve uncertain intervals separately.

## User listening feedback, 2026-10-31

The user approves the repository synthetic base voice but rejects uniformly fast speech and the later soft, melancholy delivery. The active target is mischievous, chaotic, sharply expressive delivery: contrasting phrase pitch and pacing, short teasing beats and a forward voice rather than a soothing narrator. This is user direction, not independent auditory identification of the speakers in the supplied video. Visual reference frames show close approaches, raised/open arms and inverted poses; the standing idle now uses clearer existing gesture clips and a larger stage. The implementation continues to use the approved synthetic speaker, not training on mixed-speaker reference audio.
