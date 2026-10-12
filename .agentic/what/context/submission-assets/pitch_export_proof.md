---
type: report
status: draft
created: 2026-10-13
updated: 2026-10-13
last_edited_by: agent
tags: [submission, pitch, capture, proof]
---
> **Status: draft.** Local export evidence for independent orchestrator review on [#114](https://github.com/DeveloperAlly/solana-hack/issues/114). The approved pitch source is unchanged; upload and submission progress live in [STATE.md](../../../../STATE.md).

# Original pitch capture and video export

**Reviewable file:** [JamJam pitch MP4](./jamjam-pitch-synthetic-review.mp4).

**Narration disclosure:** this review export uses the built-in synthetic **Karen (en_AU)** voice at 180 words/minute. It is not a recording of Alison. Every spoken word comes from the existing approved script; no voice cloning or pitch rewriting occurred. The source visuals, including their sales language, are captured as-is.

## Source and preservation

- Original [approved Claude artifact](https://claude.ai/artifact/4QPRrRAXx8VF4PsKf5qZ8d): “JamJam: build, create, prove,” 24 slides (12 main plus 12 appendix). Only the existing script's 12 timed main slides appear in the video; the original appendix remains untouched and available for Q&A.
- Source viewer frame revision: `1791825040-4463`; runtime manifest `manifest.8e95a1ce6076990b.json`, observed during the read-only capture on 13 October 2026.
- Screenshots came directly from the original viewer's selected `[data-slide-surface]`, at a 2560 × 1600 browser viewport. Each PNG is 2364 × 1329. No slide was recreated, reworded or visually redesigned.
- Existing [pitch script](../pitch_script_2026_10_12.md): exactly **441 spoken words** from its “Full script” section, split by its 12 existing beats. The source file's SHA-256 is `a7c1e3f69e0b20b72eb60274a690af017c94a8497f005e9eda2f99d46730560b`.

## Export acceptance

`ffprobe` reports:

- **165.719456 seconds (2:45.72)**, within the official [2–3 minute presentation range](https://colosseum.com/hackathon).
- H.264 video, **1920 × 1080**, **30 fps**; AAC audio.
- **4,126,946 bytes**; fast-start MP4.
- MP4 SHA-256: `b0762080062ea7efaa4d2afda934abe277fb9de42bc007c2a123fd42819b9d5e`.

`ffmpeg -v error -i jamjam-pitch-synthetic-review.mp4 -f null -` decoded the entire file with exit 0 and no errors. The source contact sheet was visually inspected across all 12 slides; individual cover and Solana slide captures were also opened. Independent playback/audio review remains the orchestrator's acceptance gate before selecting this as the uploaded pitch.

## Exact slide timing

Times are seconds from the video start. The original cue slots are retained, with small end padding where narration slightly exceeds a slot. No words were dropped.

| Slide | Spoken words | Start | Duration | Original capture |
|---|---|---|---|---|
| 1 | 39 | 0.000 | 15.000 | [PNG](./pitch-slides/slide-01.png) |
| 2 | 48 | 15.000 | 18.000 | [PNG](./pitch-slides/slide-02.png) |
| 3 | 31 | 33.000 | 11.000 | [PNG](./pitch-slides/slide-03.png) |
| 4 | 37 | 44.000 | 14.000 | [PNG](./pitch-slides/slide-04.png) |
| 5 | 43 | 58.000 | 16.000 | [PNG](./pitch-slides/slide-05.png) |
| 6 | 46 | 74.000 | 18.000 | [PNG](./pitch-slides/slide-06.png) |
| 7 | 20 | 92.000 | 7.173 | [PNG](./pitch-slides/slide-07.png) |
| 8 | 39 | 99.173 | 15.000 | [PNG](./pitch-slides/slide-08.png) |
| 9 | 31 | 114.173 | 11.000 | [PNG](./pitch-slides/slide-09.png) |
| 10 | 38 | 125.173 | 15.000 | [PNG](./pitch-slides/slide-10.png) |
| 11 | 29 | 140.173 | 10.494 | [PNG](./pitch-slides/slide-11.png) |
| 12 | 40 | 150.667 | 15.000 | [PNG](./pitch-slides/slide-12.png) |

## Reproduce and review

1. Open the original artifact read-only in a headed browser. Select each of the 12 main slide thumbnails and capture its `[data-slide-surface]`; never regenerate from the repo mirror.
2. Extract the 12 paragraphs under “Full script” in the existing pitch script. Verify their total is 441 words and the script hash above remains unchanged.
3. Generate each audio beat with `say -v Karen -r 180 -f <beat.txt> -o <beat.aiff>`; the standard synthetic voice is disclosed above.
4. For each beat, combine its original screenshot with its narration using ffmpeg, H.264/AAC, 1920 × 1080 at 30 fps, preserving its complete words and cue duration; concatenate and add fast-start metadata.
5. Run `ffprobe -v error -show_entries format=duration,size:stream=codec_name,width,height,r_frame_rate -of json jamjam-pitch-synthetic-review.mp4` and full decode validation. Play the export independently, then upload and verify its public playback link.

This evidence proves a local, reviewable presentation export. It does not prove publication, portal submission or a human narration recording. The orchestrator owns the next upload/acceptance step and records its result on #114.
