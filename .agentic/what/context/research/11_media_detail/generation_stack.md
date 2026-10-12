---
type: research
status: active
created: 2026-10-12
updated: 2026-10-12
last_edited_by: agent
tags: [research, media]
---
> **Status: active.** Research 11 detail (2026-10-12): how to generate each media type cheaply and on brand, licences, evaluation thresholds and provenance. The format and competitor evidence is in [research 11](../11_media_formats.md). Feeds backlog §6 (M1 to M10), §10 (L9) and §12 (X10).

# Research 11 detail: Media generation, on-brand control, evaluation and provenance (researched 2026-10-12)

Research question B: how JamJam should generate each media type, keep it on-brand, evaluate it and register it, cheaply, on Cloudflare Workers + Supabase + OpenRouter plus an optional self-hosted GPU provider (16 GB class).

Method: section 1 states the assumptions about the optional self-hosted GPU provider. External facts come from primary sources (vendor docs, pricing pages, model cards, licence files, repos), each cited inline. Prices are list prices seen on 2026-10-12, in USD. **UNVERIFIED** marks anything not confirmed from a primary source in this session, plus all of my own estimates. Licence notes are an engineering screen, not legal advice.

---

## 0. The answer on one page

| Media type | Recommended stack | Marginal cost per asset | Licence risk | Reusable module |
|---|---|---|---|---|
| Quote cards, carousels, code cards, OG images | Satori + resvg-wasm inside the Worker (`cf-workers-og`); Browser Run screenshots only for layouts Satori cannot do | About $0 (Worker CPU-ms; estimate under $0.0001) | Low (MPL-2.0 Satori, MIT wrapper) | `brand-render` |
| PDF document posts (LinkedIn) | Same templates rendered page by page, then assembled into a PDF; Browser Run `/pdf` as a fallback | About $0 to $0.001 | Low | `brand-render` (pdf target) |
| Diagrams | Graphviz (`@hpcc-js/wasm`), D2 (`@terrastruct/d2` wasm), Mermaid through a browserless renderer; themed from brand tokens | About $0 | Low (D2 is MPL-2.0) | `brand-render` (diagram target) |
| Animated text and motion video | Remotion (free licence while JamJam has 3 people or fewer) on a self-hosted container runner; ffmpeg for simple cuts and burns | About $0 locally; Remotion Automators plan is $0.01 per render with a $100/mo minimum once the free licence no longer applies | Medium (Remotion company licence later) | `motion-render` |
| Generative images | FLUX.2 [klein] 4B on the self-hosted provider (Apache-2.0) with brand reference images; Workers AI `flux-2-klein-4b` as the hosted fallback | Local: well under $0.001 in power (estimate). Workers AI: about $0.0012 per 1 MP output | Low for klein 4B; **avoid klein 9B / FLUX.2 [dev] weights locally** (non-commercial) | `media-gen` (image) |
| Short generative video | Hosted first: Veo 3.1 Lite ($0.05/s at 720p), Kling 3.0 ($0.084/s), Runway Gen-4 Turbo ($0.05/s), Luma Ray3.2 540p ($0.15 per 5 s). Local video not assumed | $0.15 to $0.70 per 5 to 8 s clip hosted | Medium (provider terms) | `media-gen` (video) |
| Avatar / talking head | Only of a consenting, verified person. Hosted HeyGen API (from $0.0167/s) or local MuseTalk (MIT) / LatentSync (Apache-2.0) | $1 to $4 per minute hosted; about $0 local | High (likeness, consent, EU AI Act deepfake labelling) | `media-gen` (avatar) + `consent-registry` |
| Clip-from-long-video | Transcript-first: faster-whisper/WhisperX, then an LLM picks segments, then scene snap with PySceneDetect, then ffmpeg cut and caption | About $0 local; Workers AI Whisper $0.0005 per audio minute | Low | `transcribe` + `clipper` |
| Voice-over / TTS | Kokoro-82M (Apache-2.0) locally for stock voices; ElevenLabs only for a verified voice clone of the brand's own spokesperson | Local about $0; Workers AI MeloTTS $0.0002/min; ElevenLabs Flash $0.04 to $0.05 per 1K characters | Low for Kokoro; XTTS-v2 and F5-TTS weights are non-commercial, so do not use them | `voice` + `consent-registry` |
| Two-voice podcast | Script with JamJam's own LLM + claims gate, then two-voice TTS (Kokoro voices or ElevenLabs), Podcastfy-style pipeline | About $0 to $0.50 per 10 minutes | Low | `podcast` (composes `voice`) |
| Transcription for repurposing | Workers AI `whisper-large-v3-turbo` ($0.0005/min) or faster-whisper on the self-hosted runner | $0.03 per hour of audio hosted | Low | `transcribe` |
| Evaluation (all) | Deterministic first (palette ΔE, OCR exact match, logo detection, contrast), then embedding similarity (SigLIP 2), then a calibrated vision-LLM judge, then the human approval gate | Mostly $0; LLM judge a few tenths of a cent | Low | `media-eval` |
| Provenance (all) | C2PA manifest signed at approval (c2pa-rs / c2patool) + SHA-256 of the signed bytes + perceptual hash, registered as a SAS attestation | About $0 per asset; a trusted C2PA certificate costs money (price UNVERIFIED) | Low | `media-provenance` |

Three design rules fall out of the evidence:

1. **Never let a generative model draw brand text, logos or exact colours.** Generate the picture, then composite text, logo and palette through the deterministic template renderer. That makes the most failure-prone checks (exact text, logo fidelity, brand colours) correct by construction, and the claims gate sees the exact text that ships.
2. **Hosted for video, local for images and audio.** A self-hosted 16 GB GPU can serve FLUX.2 klein 4B, but local video is not assumed, and 16 GB is the floor for current video models.
3. **Register the final signed bytes, plus a perceptual hash.** Most social platforms strip C2PA on upload (LinkedIn is the exception that displays it), so the Verify page must match stripped copies by perceptual similarity as well as exact hash.

---

## 1. Self-hosted provider assumptions

JamJam can use an optional self-hosted GPU provider: any host with a 16 GB class GPU behind its own authenticated, OpenAI-compatible or job API. This report assumes only that:

- It can serve FLUX.2 klein 4B (Apache-2.0 components only) for images; `flux2-dev` assets are avoided because their licence is non-commercial.
- Local video is not assumed: 16 GB is the floor for current video models and sustained video runs are power and thermal heavy, so brand video is hosted.
- CPU or container jobs (ffmpeg, Remotion, c2patool, a clipper, transcription with faster-whisper) can run in a container runner on that host or in Cloudflare Containers.
- A new local model is used only after it passes the evaluation harness.

---

## 2. Template-rendered media (deterministic, on-brand by construction)

### 2.1 Facts

**Workers limits.** Free: 10 ms CPU per HTTP request, 128 MB memory per isolate (JS heap plus wasm). Paid: up to 5 min CPU (default 30 s). Worker size is now 64 MiB uncompressed on both plans; the old 3 MB / 10 MB compressed limits were removed on 2026-09-04 ([limits](https://developers.cloudflare.com/workers/platform/limits/), [changelog](https://developers.cloudflare.com/changelog/post/2026-09-04-increased-worker-size-limit/)). Paid is $5/mo with 30M CPU-ms included, then $0.02 per extra million CPU-ms ([pricing](https://developers.cloudflare.com/workers/platform/pricing/)).

**Satori + resvg in Workers.**
- `@vercel/og` errors on Workers because of how it bundles wasm. `workers-og` exists to fix that ([kvnang/workers-og](https://github.com/kvnang/workers-og)).
- `cf-workers-og` is the maintained option: Satori 0.18.3, official `yoga-layout`, vendored precompiled wasm (Workers cannot compile wasm from raw bytes), PNG through `@resvg/resvg-wasm`, an HTML-string entry point and a bundled fallback font ([jillesme/cf-workers-og](https://github.com/jillesme/cf-workers-og/), [npm](https://www.npmjs.com/package/cf-workers-og)).
- Satori is not a full CSS engine. It accepts TTF, OTF and WOFF fonts but not WOFF2, and fonts must be passed in explicitly ([satori README](https://github.com/vercel/satori/)). Recent Satori (0.47.x) adds Grid and block layout through Taffy ([README 0.47.1](https://cdn.jsdelivr.net/npm/satori@0.47.1/README.md)). `cf-workers-og` pins 0.18.3, so Grid needs an upgrade.
- One user reports about 2 s to render an OG image, and notes that LinkedIn will not scrape OG images from `workers.dev` subdomains ([skorfmann/og-link](https://github.com/skorfmann/og-link)). jamjam.tech is a custom domain, so the second point does not apply.
- **UNVERIFIED:** the CPU time of a 1080x1350 PNG render. resvg rasterisation very likely exceeds the Free plan's 10 ms, so treat Workers Paid as required for rendering and measure it.

**Cloudflare Browser Run (formerly Browser Rendering).**
- Free: 10 browser-minutes per day and 3 concurrent browsers. Paid: 10 hours a month included, then $0.09 per browser hour; Browser Sessions add $2 per extra concurrent browser ([pricing](https://developers.cloudflare.com/browser-run/pricing/)).
- Browser timeout is 60 s. On Free, Quick Actions are limited to 1 request every 10 s ([limits](https://developers.cloudflare.com/browser-run/limits/)).
- Use it as the full-CSS fallback: screenshot a JamJam-hosted template page, or call `/pdf`.

**PDF document posts.** LinkedIn's Documents API accepts PDF, PPT(X) and DOC(X) up to 100 MB and 300 pages for organic posts. Organic multi-image *carousels* are not supported (sponsored only); the API lists Documents and MultiImage as the organic options ([Documents API](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/documents-api?view=li-lms-2026-04), [Posts API](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api?view=li-lms-2026-09)). So the "LinkedIn carousel" is a PDF document post. **UNVERIFIED:** which pure-JS PDF assembler (for example pdf-lib) runs inside the 128 MB Worker for 10 or more full-bleed PNG pages. If memory is tight, use Browser Run `/pdf` instead.

**Diagrams.**
- Graphviz: `@hpcc-js/wasm-graphviz` renders DOT to SVG in browser or Node environments ([docs](https://hpcc-systems.github.io/hpcc-js-wasm/packages/graphviz/README.html)).
- D2: runs server-side with no browser, ships a wasm build as D2.js, and is MPL-2.0 ([FAQ](https://d2lang.com/tour/faq/), [npm](https://registry.npmjs.org/@terrastruct/d2), [repo](https://github.com/terrastruct/d2)). **UNVERIFIED:** D2.js calls its wasm through web workers, which may not work in workerd.
- Mermaid: `mermaid-cli` needs a headless Chromium. Browserless options exist: `mermaid-wasm-renderer`, a Rust/wasm build that renders in 1 to 3 ms after a roughly 150 ms warm-up ([npm.io](https://npm.io/package/mermaid-wasm-renderer)), and `@speajus/mermaid-to-svg`, which covers 8 diagram types ([repo](https://github.com/speajus/mermaid-to-svg)). Both are young, so pin and test them.
- Excalidraw export needs a browser, for example through diagramkit, which uses Playwright for Mermaid, Excalidraw and draw.io and Viz.js wasm for Graphviz ([diagramkit](https://www.npmjs.com/package/diagramkit)).

**Motion video.**
- Remotion is free for individuals and companies of up to 3 people, commercial use included. Larger companies pay $25 per seat per month ("Creators") or $0.01 per render with a $100/mo minimum ("Automators", for apps and pipelines) ([remotion.pro/license](https://www.remotion.pro/license), [license FAQ](https://www.remotion.dev/docs/license-pricing-compliance/faq)).
- Revideo is MIT, a fork of Motion Canvas with headless `renderVideo()` that needs Node and a headless browser ([repo](https://github.com/midrender/revideo/)). Its team now works mainly on Midrender, and recent engine changes have not been upstreamed ([midrender.com/revideo](https://midrender.com/revideo)), which is a maintenance risk.
- Motion Canvas is MIT ([repo](https://github.com/motion-canvas/motion-canvas/)) but is meant as a standalone editor, not a library ([Revideo docs](https://docs.re.video/)).
- None of these run inside a Worker, because they need Chromium plus ffmpeg. They run on a self-hosted container runner, or in Cloudflare Containers (Paid plan; 375 vCPU-minutes a month included, then $0.000020 per vCPU-second, per the [Workers pricing page](https://developers.cloudflare.com/workers/platform/pricing/)). A minimal ffmpeg-in-Containers proof exists ([acoyfellow/ffmpeg-container](https://github.com/acoyfellow/ffmpeg-container)).
- Cloudflare Media Transformations can trim, resize, extract frames and extract audio from MP4s under 100 MB and 10 minutes, through a Worker binding ([bindings](https://developers.cloudflare.com/stream/transform-videos/bindings/), [limits](https://developers.cloudflare.com/stream/transform-videos/index.md)). Pricing is UNVERIFIED.

### 2.2 Recommendation

- **`brand-render` module (Worker, Workers Paid).** Input: `BrandKitVisual` (colour tokens, font files as TTF/WOFF in R2, logo SVG plus clear-space rule), a template id with version, and typed slots (headline, body, quote, attribution, code, image ref). Output: PNG / SVG / PDF bytes plus a render manifest that records the text drawn, fonts, colours, logo box and template hash.
  - Targets: OG 1200x630, square 1080x1080, portrait 1080x1350, story 1080x1920, LinkedIn PDF.
  - Code cards: highlight with Shiki to coloured spans, then Satori (**UNVERIFIED** that Shiki's wasm engine fits the bundle; its JS regex engine is the fallback).
  - The render manifest is the evaluation shortcut: text, logo position and palette are known exactly, so OCR only has to confirm that nothing broke during rasterisation.
- **Diagrams:** Graphviz wasm first, with Mermaid and D2 converted to themed SVG; fall back to a Browser Run screenshot. Apply brand tokens through theme variables and the brand font.
- **Motion:** start with Remotion compositions that take the same template tokens (kinetic quote, stat reveal, captioned clip). Remotion's free tier fits JamJam today (owner-only build). Keep a `motion-render` interface so Revideo or a pure-ffmpeg path can replace Remotion if the company outgrows the free tier.
- **Cost per asset:** under $0.0001 for an image or PDF page in the Worker (estimate: even 500 CPU-ms × $0.02 per million CPU-ms is $0.00001). Browser Run is about $0.0001 per 5 s screenshot beyond the included hours (estimate). Motion video costs only local power.

---

## 3. Generative images

### 3.1 Licences by FLUX variant

| Variant | Licence | Commercial self-hosting | Source |
|---|---|---|---|
| FLUX.2 [klein] 4B (distilled) and 4B Base | Apache-2.0 | Yes | [BFL flux2 README](https://github.com/black-forest-labs/flux2?tab=readme-ov-file), [BFL docs](https://docs.bfl.ai/flux_2/flux2_overview) |
| FLUX.2 [klein] 9B, 9B KV, 9B Base | FLUX Non-Commercial License v2.1 | No; a commercial self-hosted licence from BFL is required | [licence text](https://huggingface.co/black-forest-labs/FLUX.2-klein-9b-nvfp4/resolve/main/LICENSE.md?download=true), [model card](https://huggingface.co/black-forest-labs/FLUX.2-klein-9B) |
| FLUX.2 [dev] (32B) | FLUX.2-dev Non-Commercial | No (local); hosted APIs can sell access under their own BFL agreement | [BFL README](https://github.com/black-forest-labs/flux2?tab=readme-ov-file) |
| FLUX.2 [pro]/[flex]/[max] | API only | Through the API | [BFL pricing docs](https://docs.bfl.ml/quick_start/pricing) |

- The non-commercial licence excludes anything revenue-generating or anything that affects end users. It also requires filters or manual review for 9B ([model card](https://huggingface.co/black-forest-labs/FLUX.2-klein-9B)).
- BFL sells self-hosted licences for klein (10K images a month, fine-tuning and LoRA rights) and for 9B plus dev (100K images a month), but prices did not render in the search result ([bfl.ai/pricing](https://bfl.ai/pricing?category=flux.2)), so they are **UNVERIFIED**.
- **Rule for JamJam:** only klein 4B weights run locally. Use the 9B and dev quality tiers through hosted APIs.

### 3.2 Brand style control

- **Multi-reference editing is native in FLUX.2.** Klein accepts up to 4 reference images, and pro/flex/max accept up to 8 ([BFL overview](https://docs.bfl.ai/flux_2/flux2_overview)). Brand reference images (product shots, mood board, past approved assets) therefore go straight into the request. With FLUX.2 there is no need to bolt on IP-Adapter, which belonged to the FLUX.1 era.
- **LoRA.** BFL's own training guide puts klein 4B Base LoRA training at 12 GB VRAM and 32 GB RAM (9B needs 22 GB) through AI-Toolkit, at 1 to 3 hours on consumer GPUs ([BFL klein training](https://docs.bfl.ai/flux_2/flux2_klein_training)). A 16 GB card fits the 4B Base path. **UNVERIFIED** on this host: a third-party guide says no published AI-Toolkit FLUX.2 config exists yet ([localaimaster](https://localaimaster.com/blog/ai-toolkit-lora-training-guide)). Train on Base and run inference on the distilled model; whether a Base LoRA transfers to distilled klein is **UNVERIFIED**.
- **Order of preference:** references only, then a brand LoRA when an established brand has 20 or more consistent approved images (threshold is a judgement), then a style prompt from the kit's visual vocabulary.
- **Seed reproducibility.** On FLUX.2 Klein through OpenRouter, the same seed reproduced the image byte for byte; Gemini and OpenAI have no seed parameter ([OpenRouter comparison](https://openrouter.ai/blog/insights/image-generation-models-compared/)). Store the seed in the asset record so regeneration is auditable.

### 3.3 Hosted prices (1 MP, 1024x1024)

| Route | Price | Notes / source |
|---|---|---|
| Workers AI `flux-2-klein-4b` | $0.000287 per output 512 tile + $0.000059 per input tile, so about **$0.0012** per 1 MP output | Cheapest found; Worker binding with no outbound subrequest ([Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)). Per-request step charges are not listed for this model; confirm on the first invoice |
| Workers AI `flux-1-schnell` | 4 tiles × $0.0000528 + 4 steps × 4 tiles × $0.0001056 ≈ $0.0019 | Steps are billed per tile ([community explanation](https://community.cloudflare.com/t/flux-1-schnell-cost-and-limits/801029)) |
| Workers AI `flux-2-klein-9b` | $0.015 first MP | [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/) |
| BFL API klein 4B / 9B | $0.014 / $0.015 per first MP | [BFL help](https://help.bfl.ai/articles/7986977817-what-are-the-costs-associated-with-using-your-models) |
| fal FLUX.2 [dev] / [pro] / [flex] / [max] | $0.012/MP / $0.03 first MP / $0.05/MP / $0.07/MP | [fal FLUX.2](https://fal.ai/flux-2), [pro](https://fal.ai/models/fal-ai/flux-2-pro) |
| OpenRouter measured bills (2026-09-11) | gpt-image-2 $0.006; flux.2-klein-4b $0.014; gemini-3.1-flash-image $0.067; gemini-3-pro-image $0.134; recraft-v4.1-vector (SVG) $0.08 | [OpenRouter comparison](https://openrouter.ai/blog/insights/image-generation-models-compared/). OpenAI's `quality` setting moved the same image from $0.006 to $0.211 |
| Gemini API direct | Flash Image $0.067 per 1K image; Flash-Lite Image about $0.034; 3 Pro Image $0.134 | [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing) |

- OpenRouter has a unified Image API with per-endpoint pricing records and the real cost in the `usage` object ([blog](https://openrouter.ai/blog/announcements/image-api/)). That cost field feeds JamJam's cost ledger.
- **Local cost (estimate, UNVERIFIED tariff):** 11 s at 140 W is about 0.0004 kWh, a small fraction of a cent per image. Marginal cost is effectively zero; the real constraint is that one GPU serves one job at a time.

### 3.4 Recommendation

- `media-gen` image adapter with a typed request: `{brandId, kitVersion, prompt, negativePrompt?, refs: AssetRef[≤4], size, seed?, tier: "draft"|"final"}`. The response carries `{bytes, mime, seed, model, modelRevision, provider, costUsd, latencyMs}`.
- Routing:
  - Draft: self-hosted klein 4B when that provider is available, otherwise Workers AI klein 4B.
  - Final with a quality bump: BFL or fal FLUX.2 pro.
  - Typography inside the image: avoid; composite through `brand-render`.
  - Vector logo or icon exploration: Recraft vector (SVG) through OpenRouter. Use it only for exploration, never as the brand's logo of record.
- Calls to the self-hosted provider go through its authenticated API with a JamJam service identity, never to the model runtime directly.

---

## 4. Video

### 4.1 Hosted prices and API availability

| Model / API | Price | Source |
|---|---|---|
| Veo 3.1 (Gemini API, audio included) | Standard $0.40/s (720p/1080p), $0.60/s 4K; Fast $0.10 / $0.12 / $0.30; Lite $0.05/s 720p, $0.08/s 1080p; no free API tier | Secondary sources quoting Google's page: [benchlm](https://benchlm.ai/media-pricing/veo), [veopricing](https://www.veopricing.com/veo-3-1-lite-pricing/). Google Cloud also lists Veo 3.1 at $0.40 and Lite at $0.05 ([Vertex pricing](https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing)) |
| Runway Dev API | $0.01 per credit; Gen-4 Turbo 5 cr/s ($0.05/s); Gen-4.5 12 cr/s; Aleph 2.0 28 cr/s; Veo 3.1 Fast through Runway 15 cr/s with audio | [Runway API pricing](https://docs.dev.runwayml.com/guides/pricing/) |
| Kling official API | Kling 3.0 $0.084/s (720p, no audio), $0.126/s with audio; 1080p $0.112/s; prepaid packages (180-day package from $700 per a secondary source) | [Kling pricing](https://kling.ai/document-api/pricing/base/video.md), [magichour](https://magichour.ai/blog/kling-ai-pricing) |
| Luma Ray3.2 API | Per 5 s: $0.06 (360p draft), $0.15 (540p), $0.30 (720p), $1.20 (1080p) | [Luma API pricing](https://lumalabs.ai/api/pricing), [Luma Agents docs](https://docs.agents.lumalabs.ai/guides/pricing/) |
| Seedance 2.0 (BytePlus ModelArk) | $0.07/s 480p, $0.15/s 720p, $0.37/s 1080p (billed in video tokens) | Secondary: [modelpick](https://modelpick.dev/media-pricing/seedance-2-0/). Official doc: [ModelArk](https://docs.byteplus.com/en/docs/ModelArk/1520757). **UNVERIFIED** per-token rate |
| Sora 2 / Sora 2 Pro (OpenAI API) | $0.10/s (720p); Pro $0.30 / $0.50 / $0.70 per second by resolution | [OpenAI sora-2](https://developers.openai.com/api/docs/models/sora-2) |
| Pika | **UNVERIFIED** (no primary API pricing found this session) | n/a |

### 4.2 Open models on 16 GB

- **Wan2.2 TI2V-5B (Apache-2.0).** The official CLI path needs at least 24 GB, even with offload ([model card](https://huggingface.co/Wan-AI/Wan2.2-TI2V-5B)). ComfyUI's native offloading fits it on 8 GB ([ComfyUI docs](https://docs.comfy.org/tutorials/video/wan/wan2_2)). Wan's own figure is under 9 minutes for 5 s of 720p on one consumer GPU without optimisation. With ample system RAM for offload, a 16 GB card is feasible but slow (estimate: several minutes per 5 s clip; **UNVERIFIED** on this host).
- **Wan I2V 14B family.** On a 16 GB card these run near the thermal limit in practice (UNVERIFIED for any specific host). Common checkpoints are community merges, and Remix's licence is "other", so a commercial path should use official Wan-AI checkpoints.
- **LTX-2.x (22B, synchronised audio and video).** Free for commercial use below $10M annual company revenue; above that a paid licence is required ([LICENSE](https://github.com/Lightricks/LTX-2/blob/main/LICENSE.md), [ltx.io licence page](https://website.ltx.io/model/license)). Lightricks puts 16 GB as the floor for *preview* iteration only (FP8, distilled, 33 to 49 frames), with production two-stage runs at 24 to 32 GB ([LTX hardware guide](https://ltx.io/blog/hardware-for-ai-video-models)). The licence is fine for JamJam today; the hardware is not.
- **HunyuanVideo-1.5.** Its licence excludes the EU, UK and South Korea, and its outputs may not be used or displayed there ([LICENSE](https://github.com/Tencent-Hunyuan/HunyuanVideo-1.5/blob/main/LICENSE)). JamJam brands may sell into those regions, so **do not use it for brand output.**
- **Verdict:** local video stays an experiment until a self-hosted host proves a sustainable profile, and even then only Wan2.2 (official, Apache-2.0) qualifies. All brand video for the demo is hosted. Default to Veo 3.1 Lite or Luma 540p for 5 to 8 s social b-roll ($0.15 to $0.40 a clip), and Kling 3.0 or Runway Gen-4.5 for a hero shot.

### 4.3 Avatars and talking heads

- **HeyGen API.** Pay-as-you-go: Avatar III Digital Twin $0.0167/s (about $1/min), Avatar IV $0.05 to $0.0667/s (about $3 to $4/min); no free API credits since Feb 2026 ([HeyGen API pricing](https://developers.heygen.com/docs/pricing), [help](https://help.heygen.com/en/articles/10060327-heygen-api-pricing-explained)).
- **Synthesia.** API usage draws on plan credits; interactive avatars cost $0.10 to $0.20/min ([pricing](https://www.synthesia.io/pricing)). Its policy requires informed consent, including a biometric consent step, before creating an avatar of someone, and gives the person the right to revoke ([avatar policy](https://help.synthesia.io/en/articles/15453102-avatar-policy-foundation)). Its customer terms make the customer responsible for collecting free, informed consent from the person depicted ([terms](https://www.synthesia.io/legal/customer-terms-of-service)).
- **Open source.**
  - MuseTalk: MIT code, and weights usable for any purpose including commercial; about 8 GB VRAM, real-time at 256x256 face crops ([repo](https://github.com/TMElyralab/MuseTalk/), [secondary comparison](https://news.creeta.com/en/open-source-lip-sync-models-2026/)). Its *test data* is non-commercial, and its dependency models (whisper, dwpose, S3FD) keep their own licences.
  - LatentSync: Apache-2.0 ([repo](https://github.com/bytedance/latentsync)). Version 1.6 needs about 18 GB (secondary source), so use 1.5 on a 16 GB card.
- **Consent rules for JamJam:**
  1. An avatar or voice clone may only be made of a person who verifies themselves inside JamJam. The ElevenLabs model is that a Professional Voice Clone is only of your own voice, verified by reading a voice CAPTCHA; someone else's consent is not enough ([ElevenLabs help](https://help.elevenlabs.io/hc/en-us/articles/36842751624209-Can-I-create-a-Professional-Voice-Clone-of-someone-else-s-voice), [PVC API](https://elevenlabs.io/docs/eleven-api/guides/how-to/voices/professional-voice-cloning.md)).
  2. Store a consent record (who, scope, expiry, revocation) and register its hash on Solana like other JamJam records.
  3. Label the output. From 2 Aug 2026, deployers must disclose deepfakes, and providers must mark AI output in a machine-readable way ([AI Act Art. 50](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-50), [Commission news](https://digital-strategy.ec.europa.eu/en/news/commission-starts-enforcing-ai-act-rules-and-new-transparency-requirements-2-august)).
  4. This fits the plan's "AI persona, disclosed and registered" item (R8).

### 4.4 Clip-from-long-video (Opus Clip style)

- Open implementations all use the same transcript-first pipeline:
  1. Whisper (faster-whisper) for word timestamps.
  2. An LLM ranks hooks and segments.
  3. PySceneDetect snaps cuts to scene boundaries.
  4. ffmpeg cuts, reframes to 9:16 and burns ASS karaoke captions.
- Examples: [ClipPro](https://github.com/chang-pro/clippro), [Clips Studio](https://github.com/ColinGPT9/clips-studio) (which adds YOLOv8 pose tracking and TalkNet active-speaker framing, and a pairwise LLM re-rank because small models score everything in a narrow band), [opensource-clipping](https://github.com/NaufalRizqullah/opensource-clipping) (pyannote diarisation for podcast split-screen).
- Building blocks:
  - WhisperX: BSD-2, word-level alignment, needs under 8 GB for large-v2, diarisation through pyannote community-1 (CC-BY-4.0) ([repo](https://github.com/m-bain/whisperx)).
  - faster-whisper: MIT; large-v3 fp16 batched about 6 GB VRAM, int8 about 3 to 4.5 GB ([repo](https://github.com/SYSTRAN/faster-whisper)).
- **JamJam version.** Use faster-whisper as the transcription step (WhisperX on GPU once it passes the harness). Segment selection uses JamJam's own LLM gateway with the brand kit and claims gate in the prompt. Every chosen clip's transcript goes through the claims gate before render. Render with ffmpeg in the Tools runner, or with Cloudflare Media Transformations for simple trims of MP4s under 100 MB.

---

## 5. Audio and podcast

### 5.1 TTS prices

| Service | Price | Source |
|---|---|---|
| ElevenLabs API | Two current pages disagree: Multilingual v2/v3 $0.08 to $0.10 per 1K characters, Flash/Turbo $0.04 to $0.05 per 1K. Commercial use needs a paid plan. PVC needs the Creator plan or higher | [API pricing](https://elevenlabs.io/pricing/api), [variant](https://elevenlabs.io/pricing/api?price.platform=api), [TTS docs](https://elevenlabs.io/docs/overview/capabilities/text-to-speech.mdx). Treat the exact rate as **UNVERIFIED** until the console shows it |
| OpenAI | `gpt-4o-mini-tts` $12 per 1M audio output tokens (about $0.0144/min, derived by a third party); `tts-1` $15 per 1M characters | [model page](https://developers.openai.com/api/docs/models/gpt-4o-mini-tts), [derivation](https://getcartsignal.com/tools/openai-audio) |
| Cartesia Sonic | Plans $5 / $49 / $299 a month; 1 credit = 1 character; about $0.034 to $0.045/min | Secondary only: [costperoutput](https://costperoutput.com/cartesia-pricing). **UNVERIFIED** |
| Workers AI | `melotts` $0.0002 per audio minute; Deepgram `aura-1` $0.015 per 1K characters; `aura-2-en` $0.030 per 1K characters | [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/) |

### 5.2 Open TTS licences (the weights licence is what matters)

- **Kokoro-82M:** Apache-2.0 weights. 54 voices in 8 languages, no cloning, runs on CPU. The model card says roughly 1,000 characters make 1 minute of audio ([model card](https://huggingface.co/hexgrad/Kokoro-82M), [repo](https://github.com/hexgrad/kokoro)).
- **XTTS-v2:** Coqui Public Model License, non-commercial for both the model and its outputs. Coqui has shut down, so no commercial licence can be bought ([model card](https://huggingface.co/coqui/XTTS-v2), [Cartesia licence survey](https://www.cartesia.ai/learn/open-source-tts)). **Do not use.**
- **F5-TTS:** MIT code, CC-BY-NC-4.0 weights ([Cartesia survey](https://www.cartesia.ai/learn/open-source-tts), [localaimaster](https://localaimaster.com/blog/xtts-coqui-commercial-license)). **Do not use.**
- **Chatterbox:** MIT with watermarked output. Dia 1.6B is Apache-2.0 (a two-speaker dialogue model). Orpheus, CosyVoice 2 and Zonos are Apache-2.0 (Cartesia survey, a secondary source; check each model card before installing).
- **Qwen3-TTS 1.7B:** Apache-2.0 with voice design and cloning (already screened in the local research).
- **Microsoft VibeVoice:** MIT tag, built for 90-minute, 4-speaker podcasts. Microsoft disabled the repo in Sept 2025 after misuse, and the Large weights are disabled ([project page](https://microsoft.github.io/VibeVoice/), [HF card](https://huggingface.co/microsoft/VibeVoice-1.5B)). Not a dependable base.

### 5.3 Two-voice podcast

- **Podcastfy:** Apache-2.0. Content (URLs, PDFs, text) to a two-host transcript through any LLM, then TTS through OpenAI, Google, ElevenLabs or Edge ([repo](https://github.com/souzatharsis/podcastfy)).
- **Local-NotebookLM:** Apache-2.0, can point at a local Kokoro endpoint ([PyPI](https://pypi.org/project/local-notebooklm/)).
- **JamJam pattern:** take the approach, not the package.
  1. Script with JamJam's LLM gateway from approved kit facts (the claims gate runs on the *script*).
  2. Per-line TTS with two assigned brand voices.
  3. Concatenate with ffmpeg, normalise loudness, add an audio logo.
  4. Transcribe the result again and diff it against the script (see 6.4).
- Edge TTS is the free Microsoft read-aloud endpoint used by many open projects. Its terms for commercial automation are **UNVERIFIED**, so avoid it.

### 5.4 Transcription for repurposing

- Workers AI `whisper-large-v3-turbo` costs $0.0005 per audio minute, so an hour is $0.03 ([pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)). Deepgram `nova-3` on Workers AI is $0.0052/min.
- Locally, the existing Tools-runner `mp3-transcript` (faster-whisper small int8, CPU) is free. WhisperX on GPU adds diarisation for podcasts.
- Repurposing flow: transcript, then a quote and claim extractor (the existing R3 fact extraction with verbatim quotes from the transcript), then post drafts, quote cards (`brand-render`) and short clips (`clipper`).

### 5.5 Audio branding

- Sonic logo or intro sting: generate options once with ACE-Step 1.5 (MIT, already screened locally). ElevenLabs Eleven Music costs $0.15/min and sound effects $0.12/min ([API pricing](https://elevenlabs.io/pricing/api)).
- Store the approved sting in the brand kit as an asset with a hash; every podcast or video reuses the same bytes. Reuse is what makes it consistent.
- Brand voice settings (voice id, speed, stability, pronunciation dictionary for product names) live in the kit as `BrandKitAudio`.

---

## 6. On-brand evaluation per media type

Principle: cheap deterministic checks gate first, learned scores rank, and a human approves. Every threshold below is a starting value. Calibrate each one on a fixture of approved and rejected assets per brand, using the evaluation harness in [architecture §13](../../brand_builder_architecture.md#13-evaluation-harness-accepted-2026-10-12) (judge calibration, regression protocol).

### 6.1 Metric toolbox (facts)

- **Colour distance.** CIEDE2000 is the ISO/CIE standard ([CIE](https://www.cie.co.at/publications/colorimetry-part-6-ciede2000-colour-difference-formula)). A graphic-arts study proposed an *acceptability* tolerance of 3 ΔE00 ([Green & Johnson 2005](https://exa.ai/library/publication/0vmnl779jvk)). On-screen perception on the web is coarser than lab values ([Szafir et al. 2014](https://exa.ai/library/publication/6v4c9x5mrk0)).
- **Contrast.** WCAG 2.2 AA requires 4.5:1 for normal text and 3:1 for large text; logotypes are exempt ([WCAG 2.2](https://www.w3.org/TR/WCAG22/)).
- **OCR.** Tesseract, EasyOCR and PaddleOCR are all Apache-2.0. All three are perfect on clean text. PaddleOCR is far stronger on rotated, noisy, low-resolution or stylised text, while Tesseract is about 10x faster and lighter on CPU ([anyformat benchmark](https://anyformat.ai/blog/best-python-ocr-library), [DocsAPI benchmark](https://docsapi.co/resources/blogs/paddleocr-vs-tesseract-vs-docsapi)).
- **Image-text and image-image similarity.** SigLIP 2 (Apache-2.0, B/16 to g sizes, multilingual) ([big_vision README](https://github.com/google-research/big_vision/blob/main/big_vision/configs/proj/image_text/README_siglip2.md)).
- **Aesthetics.**
  - Aesthetic Predictor V2.5 is SigLIP-based on a 1 to 10 scale, and its authors call 5.5+ a great score ([repo](https://github.com/discus0434/aesthetic-predictor-v2-5)).
  - AestheticSigLIP is Apache-2.0 on SigLIP 2, where 5 to 6 means generic and 3 to 4 includes "obvious AI slop" ([model card](https://huggingface.co/somepago/AestheticSigLIP/blob/c49a46bc5929b1b9d6d100d94f4a9ef44ea55ca6/README.md)). Its labels came from Gemini Flash, so it is a weak proxy.
- **Logo detection.** OWLv2 (Apache-2.0) supports one-shot, image-guided detection: pass the logo as the query image ([transformers docs](https://huggingface.co/docs/transformers/en/model_doc/owlv2), [Roboflow](https://inference-models.roboflow.com/models/owlv2/)).
- **Video quality.** VMAF is full-reference, so it suits re-encodes and transcodes only; BSD+Patent licence ([repo](https://github.com/netflix/vmaf)). For generated video there is no reference, so use no-reference scores (DOVER-style) plus frame-level image checks. **UNVERIFIED:** DOVER's licence was not retrieved.
- **Speech quality.** DNSMOS P.835 (SIG/BAK/OVRL, correlation with human ratings 0.94 to 0.98) ([paper](https://arxiv.org/html/2110.01763v4)). UTMOS and UTMOSv2 predict naturalness on a 1 to 5 MOS scale ([VERSA metric list](https://github.com/wavlab-speech/versa/blob/main/docs/supported_metrics.md), [UltraEval guide](https://github.com/OpenBMB/UltraEval-Audio/blob/main/docs/how%20use%20UTMOS%2C%20DNSMOS%20eval%20speech%20quality.md)).

### 6.2 Per media type: checks and starting thresholds

| Media | Hard gates (block on fail) | Scored signals (rank, warn) | Human |
|---|---|---|---|
| Template image / PDF / diagram | OCR text equals the render manifest after normalising whitespace and case (expect 100%; any miss means a rendering bug); text contrast ≥ 4.5:1 (≥ 3:1 for large text); all fills within ΔE00 ≤ 2 of a brand token (deterministic, so this should be exact); logo box respects clear space; claims gate on all drawn text | None needed beyond layout lint (overflow, line-clamp hit) | Approve at the existing gate |
| Generative image (no text by rule) | OCR finds no stray text above a confidence threshold (generated pseudo-text is a slop signal), or text exactly matches what was requested; NSFW filter; no logo-like marks unless supplied | Palette adherence: share of pixels whose k-means colour lies within ΔE00 ≤ 5 of a brand or neutral token (start at ≥ 60%, calibrate); SigLIP 2 cosine to the brand reference set ≥ the 10th percentile of approved assets' scores; aesthetic ≥ 5.5 (V2.5 scale); artefact check by a vision-LLM judge (hands, warped geometry, duplicate limbs) | Blind A/B on the first 50 per brand (approved vs. generated) to set thresholds |
| Composite (generated photo + template overlay) | Template gates apply to the overlay layer; logo detected by OWLv2 in the expected region, score ≥ calibrated threshold | Generative-image signals on the photo layer | Approve |
| Generative video | Sampled frames (1 fps): no stray text, NSFW clean; duration and aspect exact; audio track present or absent as requested | Per-frame SigLIP 2 to brand refs (median), temporal flicker (mean frame-to-frame SSIM drop, flag outliers), no-reference quality score; VMAF ≥ 90 only for transcodes against the master (VMAF 90 is a common rule of thumb, **UNVERIFIED**) | Watch in full before approval |
| Avatar video | Consent record valid and in scope; deepfake disclosure label rendered; ASR transcript matches the approved script (WER ≤ 3%, calibrate) | Lip-sync confidence (SyncNet-style; LatentSync and MuseTalk ship a SyncNet), face-identity similarity to the consented source | Mandatory |
| TTS / podcast | Whisper round-trip transcript vs. script, WER ≤ 2% for single voice and ≤ 5% for two-voice (start; calibrate); pronunciation dictionary terms present; loudness within target (for example -16 LUFS for podcasts, **UNVERIFIED** platform norms); voice id is in the consent registry | UTMOS ≥ 3.5 and DNSMOS OVRL ≥ 3.0 (starting values; compare against the provider's own samples) | Listen to the first and last minute plus random spots |
| Clips from long video | Clip transcript passes the claims gate; cut does not start or end mid-word (word timestamps); captions match ASR exactly | Hook score by the LLM (pairwise re-rank); speaker framed (face box inside the crop) | Approve |

### 6.3 How to set the thresholds (protocol)

1. For each brand, collect 20 to 50 approved reference assets plus any rejected ones.
2. Compute every score on them, and set the warn threshold at the 10th percentile of approved scores. Set a hard gate only where the score separates approved from rejected (AUC ≥ 0.8 on the fixture; a judgement).
3. Run a blind human test (shuffled approved vs. generated, "which is on-brand?") on 30 pairs. If people cannot tell them apart better than chance, the generator passes at that tier.
4. Re-run the fixture on every model or prompt change, using the regression protocol in [architecture §13](../../brand_builder_architecture.md#13-evaluation-harness-accepted-2026-10-12).

### 6.4 Claims check on text inside media

- Text in a template is known from the render manifest, so it is claim-checked *before* rendering.
- Text in generated pixels, audio or video is recovered by OCR or ASR, and the recovered text goes through the same claims gate (R2).
- Any claim-like span (numbers, superlatives, comparisons, names) not found in the approved draft blocks approval. This catches a model that "helpfully" adds a fake statistic or a price to an image.

### 6.5 Where evaluation runs

- **In the Worker:** palette ΔE (pure JS colour maths on a downsampled PNG decode; **UNVERIFIED** CPU budget, so use a Queue consumer or Workflow step with the 30 s+ budget), contrast, and manifest checks.
- **On the self-hosted provider, as a container on CPU or GPU once it passes the harness:** PaddleOCR, SigLIP 2, OWLv2, the aesthetic predictor, WhisperX, UTMOS/DNSMOS and VMAF.
- **Hosted fallback:** a vision LLM through OpenRouter for OCR plus artefact judging when the self-hosted provider is offline. That costs a fraction of a cent per image; **UNVERIFIED** exact cost, and it depends on the model.

---

## 7. Provenance for media: C2PA + Solana

### 7.1 Facts

- **Signing libraries.** c2pa-rs (the CAI Rust SDK) creates, signs, embeds and validates manifests in JPEG, PNG, WebP, AVIF, HEIC, GIF, SVG, TIFF, MP4, MOV, M4A, MP3, WAV and more, and builds for Wasm (without `file_io`) ([docs.rs c2pa](https://docs.rs/crate/c2pa/0.37.1)). c2patool adds manifests from a JSON definition, supports external or remote signers, handles fragmented MP4, and ships a WASI build ([usage](https://github.com/contentauth/c2pa-rs/blob/main/cli/docs/usage.md), [repo](https://github.com/contentauth/c2patool)).
- **AI marker.** Manifests can declare `digitalSourceType` as `trainedAlgorithmicMedia` for AI output ([usage](https://github.com/contentauth/c2pa-rs/blob/main/cli/docs/usage.md)). That is the machine-readable AI mark the AI Act asks providers for.
- **Trust.** To be shown as trusted, a generator product must use a certificate from a CA on the C2PA Trust List and go through the Conformance Program. The Interim Trust List was frozen on 1 Jan 2026 ([C2PA conformance](https://c2pa.org/conformance/), [CAI trust lists](https://opensource.contentauthenticity.org/docs/conformance/trust-lists.md), [getting a certificate](https://opensource.contentauthenticity.org/docs/signing/get-cert/)). Certificate price is **UNVERIFIED**. A self-signed or untrusted certificate still gives tamper evidence, but validators will show the signer as unknown.
- **Platforms (mid-2026, behaviour changes often):**
  - LinkedIn displays the CR icon and a provenance panel, but its served copy has the manifest stripped.
  - Instagram, Facebook and Threads read C2PA at upload for "AI info" labels, then strip it.
  - X strips everything and displays nothing.
  - YouTube reads C2PA for disclosures (including "captured with a camera") but transcodes.
  - TikTok auto-labels from C2PA and added invisible watermarking because metadata gets lost.
  
  Sources: [ImgKey policy snapshot](https://imgkey.com/platform-policies/), [Autoposting summary citing IPTC](https://autoposting.ai/blog/c2pa-ai-metadata-images-social-media), [Lumethic](https://www.lumethic.com/en/articles/content-credentials-social-media-platforms). All are secondary; test empirically.
- **Cloudflare Images** can preserve existing Content Credentials through transforms, and signs its own resize or convert actions with a DigiCert certificate on the trust list ([docs](https://developers.cloudflare.com/images/optimization/transformations/preserve-content-credentials/), [blog](https://blog.cloudflare.com/preserve-content-credentials-with-cloudflare-images/)). If JamJam serves media through Cloudflare Images, the chain survives on JamJam's own pages.
- **Upstream credentials.** Gemini 3.1 Flash Image on Vertex lists Content Credentials (C2PA) as supported ([Vertex model page, mirror](https://hideme.live/proxy/docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/3-1-flash-image)). Upstream credentials from hosted generators should be kept as an *ingredient* when JamJam composites, not thrown away.
- **Existing research.** [research 10 F](../10_competitor_detail/f_provenance.md) covers the Adobe soft-binding (watermark plus fingerprint lookup) model and why a lookup is needed after stripping; not repeated here.

### 7.2 Recommended design (`media-provenance` module)

Order of operations at the approval gate:

1. **Finalise bytes.** Use the rendered or composited asset, keeping any upstream C2PA manifest as an ingredient.
2. **Sign C2PA.**
   - Assertions: `c2pa.actions` (created / composited / edited, with `digitalSourceType`), a CreativeWork author (the brand), and a custom assertion `tech.jamjam.record` holding `{assetId, brandId, kitVersion, verifyUrl: https://jamjam.tech/verify/<assetId>}`.
   - Do not put the Solana address in the manifest, because the attestation must hash the signed bytes and so comes after signing. `assetId` is the stable join key instead.
   - Signer: c2patool in the Tools runner, or c2pa-rs wasm in a Worker or Container (**UNVERIFIED** that the wasm signer fits Worker limits). The key goes in a remote signer or Workers secret, never on disk in the repo.
3. **Hash.**
   - `sha256` of the final signed bytes (exact match).
   - A perceptual hash for stripped or re-encoded copies: pHash or PDQ for images, per-keyframe hashes for video, an audio fingerprint for audio (the specific algorithm choice is **UNVERIFIED**; PDQ is a common open choice).
   - `manifestHash` of the C2PA claim.
4. **Attest on SAS.** Use a new schema `WL-ASSET` v1 alongside `WL-KIT`: `asset_id, brand_id, kit_version, media_type, sha256, phash, manifest_hash, approver, claims_check_id, consent_ref?`. Same Registrar, same "hashes and ids only" rule.
5. **Verify page.** Upload a file or paste a URL. Results:
   - exact `sha256` match: official, untouched;
   - C2PA manifest valid with a JamJam record: official (with signer trust state shown);
   - perceptual match above a threshold: "likely a re-encoded copy of official asset X";
   - otherwise not found.
   
   Show each proof type as its own row (the research 10 F recommendation).
6. **Publishing.** Upload the signed original. LinkedIn will show CR, while other platforms strip it. The Ledger and the perceptual lookup are what make verification work after stripping.

**Compliance note:** this design gives JamJam both the machine-readable marking expected of AI providers and a place to record deepfake disclosure for avatars and voices (AI Act Art. 50(2) and (4), applicable from 2 Aug 2026; [Commission code of practice](https://digital-strategy.ec.europa.eu/en/policies/code-practice-ai-generated-content)). JamJam's own role (provider vs. deployer) needs a legal read; **UNVERIFIED**.

---

## 8. Reusable modules and typed contracts

Every module is a pure function or async job with a versioned contract. Each one returns a cost line and a provenance block, so the ledger, evaluation and attestation consume one shape.

```ts
// shared
type AssetRef = { assetId: string; sha256: string; mime: string; r2Key: string };
type Cost = { provider: string; model: string; unit: string; qty: number; usd: number };
type ModelProvenance = { provider: string; model: string; revision?: string; seed?: number; promptHash: string };

// brand-render (Worker): deterministic
type RenderRequest = { brandId: string; kitVersion: number; templateId: string; templateVersion: string;
  target: "png"|"svg"|"pdf"; size: {w:number;h:number}; slots: Record<string,string|AssetRef> };
type RenderManifest = { textDrawn: string[]; fonts: string[]; colours: string[]; logoBox?: [number,number,number,number]; templateHash: string };

// media-gen (provider-neutral; backends: self-hosted provider, Workers AI, OpenRouter Image API, BFL, fal, Veo, Kling, Runway, Luma, HeyGen)
type GenRequest = { kind: "image"|"video"|"avatar"|"tts"; brandId: string; kitVersion: number; prompt: string;
  refs?: AssetRef[]; params: Record<string,unknown>; tier: "draft"|"final"; consentRef?: string };
type GenResult = { asset: AssetRef; cost: Cost; provenance: ModelProvenance; upstreamC2pa?: boolean };

// media-eval
type EvalCheck = { id: string; kind: "gate"|"score"; value: number|boolean; threshold?: number; pass: boolean; evidence?: string };
type EvalReport = { assetId: string; checks: EvalCheck[]; extractedText: string; claimsCheckId?: string };

// media-provenance
type ProvenanceRecord = { assetId: string; sha256: string; phash?: string; manifestHash: string; sasAttestation?: string };
```

| Module | Runs on | Reuses | New |
|---|---|---|---|
| `brand-render` | Worker (Paid) | Design tokens (ADR-005), kit visual fields | Templates, font loader, render manifest |
| `motion-render` | Self-hosted container runner or Cloudflare Containers (Remotion / ffmpeg) | Container runner, `brand-render` tokens | Compositions |
| `media-gen` | Worker orchestrates; backends local or hosted | Self-hosted provider API, `web/worker/llm.ts` gateway pattern, OpenRouter key | Provider adapters, router by tier and availability |
| `transcribe` | Workers AI or the Tools runner | Existing `mp3-transcript` tool | WhisperX upgrade (after gate) |
| `clipper` | Tools runner | `transcribe`, LLM gateway, claims gate | Segment ranker, ffmpeg recipes |
| `voice` / `podcast` | Tools runner (Kokoro) or hosted (ElevenLabs, Workers AI) | LLM gateway, claims gate | Pronunciation dictionary, two-voice assembler |
| `consent-registry` | Supabase + SAS | Approval-gate records, Registrar | Consent schema, revocation |
| `media-eval` | Worker (deterministic) + Tools runner (models) | Evaluation harness (architecture §13; backlog X12) | Palette, OCR, logo, similarity, AV metrics |
| `media-provenance` | Tools runner or Container for signing; Worker for the attestation call | Registrar, SAS, Verify page, Ledger | `WL-ASSET` schema, C2PA signer, perceptual index |

Jobs go through Cloudflare Workflows or Queues (backlog X4, issue #32), because rendering, evaluation and signing exceed Free-plan CPU limits.

---

## 9. Cost per asset at a glance (marginal, excluding human time)

| Asset | Local | Cheapest hosted found |
|---|---|---|
| Quote card / carousel slide / OG image | ~$0 | ~$0 (Worker CPU) |
| 10-page LinkedIn PDF | ~$0 | ~$0 to $0.002 (Browser Run if used) |
| Generated 1 MP image | power only, well under $0.001 (estimate) | $0.0012 (Workers AI klein 4B) |
| 8 s social video clip | not assumed (local video) | $0.40 (Veo 3.1 Lite 720p) or $0.30 to $0.45 (Luma 540p, 5 to 10 s) |
| 60 s avatar video | ~$0 (MuseTalk, after gate) | $1.00 (HeyGen Avatar III) |
| 10-minute two-voice podcast (~10K characters) | ~$0 (Kokoro) | $0.002 (Workers AI MeloTTS) to $0.40 to $0.50 (ElevenLabs Flash) |
| Transcribe 60 minutes | ~$0 (faster-whisper) | $0.03 (Workers AI Whisper turbo) |
| C2PA sign + SAS attest | ~$0 | devnet fees ~$0; trusted certificate price UNVERIFIED |

---

## 10. Open items marked UNVERIFIED

1. Worker CPU time and memory for Satori + resvg at 1080x1350, and for PDF assembly. Measure before choosing Free vs. Paid (expect Paid).
2. Whether D2.js and the Mermaid wasm renderers run inside workerd (web workers, wasm instantiation).
3. Pika API pricing; Seedance per-token rate on BytePlus; Cartesia list prices; ElevenLabs' exact current per-1K rate (two pages disagree).
4. BFL self-hosted licence prices for klein 9B / dev; whether a klein 4B Base LoRA transfers to the distilled klein checkpoint; LoRA training time on a 16 GB card.
5. Wan2.2 TI2V-5B time per clip on a 16 GB card with offload, and whether a sustainable power profile exists.
6. DOVER licence; VMAF 90 and -16 LUFS as targets; all starting thresholds in section 6 until calibrated per brand.
7. C2PA certificate cost and conformance effort; c2pa-rs wasm signing inside Workers limits; platform C2PA behaviour (secondary sources, and it changes often).
8. JamJam's AI Act role (provider vs. deployer) for avatars, voice clones and generated media; get a legal read.
9. Edge TTS commercial terms (avoid until verified).
10. Cloudflare Media Transformations pricing.
