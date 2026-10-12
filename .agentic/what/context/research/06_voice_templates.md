---
type: research
status: active
created: 2026-10-06
updated: 2026-10-12
last_edited_by: agent
tags: [research, voice-templates, presets]
---
> **Status: active.** Research input (2026-10-06) for voice templates; preset values still to be calibrated.

# Voice templates: what exists and a measurable preset model

*Research 2026-10-06. Product preset names come from each product's own pages where possible. Pages were read through a summariser, so re-check exact wording before publishing.*

## Bottom line
Tone presets are everywhere, but almost all are **labels or one-click rewrite verbs**. No mainstream product publishes presets as measurable parameter sets. The closest is ChatGPT's More/Less/Default controls for warmth, enthusiasm and emoji (Dec 2025). HubSpot, Jasper and Copy.ai skip presets and learn voice from samples. Numeric tone vectors with per-channel overrides exist only in small open-source projects (Grain).

## Existing preset sets
| Product | Presets (as published) |
|---|---|
| ChatGPT | Default, Professional, Friendly, Candid, Quirky, Efficient, Cynical (Nerdy also announced); Warmth/Enthusiasm/Emoji/Headers/Lists More–Less ([help](https://help.openai.com/en/articles/11899719-customizing-your-chatgpt-personality), [TechCrunch](https://techcrunch.com/2025/12/20/openai-allows-users-to-directly-adjust-chatgpts-warmth-and-enthusiasm)) |
| Microsoft Copilot (SharePoint) | Natural, Professional, Casual, Imaginative, Enthusiastic ([support](https://support.microsoft.com/en-us/sharepoint/copilot-in-sharepoint/write-and-rewrite-with-ai)) |
| Google "Help me write" (Chrome) | Polish, Elaborate, Formalize; Casual, Formal, Shorten, Rephrase ([help](https://support.google.com/chrome/answer/14582048?hl=en)) |
| Canva Magic Write | More fun, More formal, custom saved tones ([help](https://www.canva.com/help/use-magic-write/)) |
| Wordtune | Casual, Formal, Shorten, Expand ([guide](https://www.wordtune.com/blog/wordtune-guide)) |
| QuillBot | Standard, Fluency, Formal, Academic, Simple, Creative, Expand, Shorten, Custom ([blog](https://quillbot.com/blog/reviews/quillbot-review/)) |
| Grammarly | Tone detector labels; Goals: Audience, Formality, Domain, Intent ([tone](https://www.grammarly.com/tone), [goals](https://support.grammarly.com/hc/en-us/articles/360054679292-What-are-Goals)) |
| Buffer | more casual / more formal, shorten, rewrite for an audience ([Buffer](https://buffer.com/resources/introducing-ai-made-for-social-media-buffers-ai-assistant/)) |
| HubSpot / Jasper / Copy.ai | Voice learned from samples; no preset taxonomy ([HubSpot](https://knowledge.hubspot.com/blog/set-up-brand-voice-using-ai), [Jasper](https://help.jasper.ai/hc/en-us/articles/18618693085339-Brand-Voice)) |

No product offers "flirty". The nearest are ChatGPT's Quirky and Canva's "More fun".

## How well each dimension is backed
| Dimension | Backing |
|---|---|
| Formality | Literature and measurable: Heylighen & Dewaele F-score ([paper](https://pespmc1.vub.ac.be/Papers/Formality.pdf)), Pavlick & Tetreault formality data ([dataset](https://huggingface.co/datasets/osyvokon/pavlick-formality-scores)), NN/g ([NN/g](https://www.nngroup.com/articles/tone-of-voice-dimensions/)) |
| Sentence length | Readability formulas ([textstat](https://pypi.org/project/textstat)), Biber features |
| Energy | Partial: NN/g enthusiasm; no validated text metric |
| Humour | Partial: NN/g dimension; automatic detection is weak |
| Warmth | Partial: social-psychology construct; LIWC Tone as a proxy ([LIWC-22](https://www.liwc.app/static/documents/LIWC-22%20Manual%20-%20Development%20and%20Psychometrics.pdf)) |
| Jargon | Partial: difficult-word ratios |
| Emoji/punctuation | Practitioner, but countable |
| CTA intensity | Practitioner (copy formulas) |
| Claims | Regulatory: FTC substantiation ([FTC](https://www.ftc.gov/legal-library/browse/ftc-policy-statement-regarding-advertising-substantiation)). Use it as a gate, not a slider |

**User evidence:** NN/g found casual, conversational, moderately enthusiastic tones performed best; playful tones hurt trust in serious industries ([NN/g](https://www.nngroup.com/articles/tone-voice-users/)).

## Open-source precedents
- [Grain](https://github.com/ReallyArtificial/grain): 8 numeric 0–1 parameters with `channelOverrides`; tiny adoption.
- [VOICE.md](https://github.com/efeoncepro/voice.md): structured spec with per-surface rules.
- [simonpainter/tone](https://github.com/simonpainter/tone) and [zoharbabin/brand-voice](https://github.com/zoharbabin/brand-voice/blob/main/brand-voice-design-brief.md): labels and examples.

## Gaps (opportunity)
No mainstream product publishes measurable presets, offers **per-post template mixing** (e.g. 70% enterprise / 30% playful), or treats **allowed claims** as part of the preset.

*Update 2026-10-12:* per-post template mixing does exist in open source (AIWG `voice_blender.py`, MIT); see "Reusable template sources" below. Measurable presets with a claims gate are still not offered anywhere.

## Starter set (1–5; J = judgment call, S = sourced)
Fo formality · En energy · Hu humour · Wa warmth · SL sentence length · Ja jargon · Em emoji/punct · CTA · Cl claims strictness

| Template | Fo | En | Hu | Wa | SL | Ja | Em | CTA | Cl |
|---|---|---|---|---|---|---|---|---|---|
| Academic | 5 S | 1 | 1 | 2 | 5 S | 4 | 1 | 1 | 5 S |
| Enterprise | 4 | 2 | 1 | 3 S | 3 | 3 | 1 | 2 | 5 S |
| Professional | 4 | 2 | 1 | 3 | 3 | 2 | 1 | 2 | 4 |
| Friendly | 2 | 3 | 2 | 5 | 2 | 1 | 3 | 2 | 4 |
| Plainspoken | 2 | 2 | 2 S | 3 | 2 | 1 S | 1 | 2 | 4 |
| Efficient | 3 | 1 | 1 | 2 | 1 | 2 | 1 | 2 | 4 |
| Candid / Founder | 2 | 3 | 2 | 3 | 2 | 2 | 1 | 3 | 4 |
| Playful | 1 | 4 | 5 | 4 | 2 | 1 | 4 | 2 | 3 |
| Flirty (suggestive, never explicit) | 1 | 4 | 4 | 5 | 1 | 1 | 4 | 2 | 4 |
| Sales | 3 | 4 | 2 | 3 | 2 | 2 | 2 | 5 | 5 S |
| Hype / Launch | 2 | 5 | 3 | 3 | 1 | 2 | 4 | 4 | 4 |
| Empathetic / Support | 3 | 2 | 1 S | 5 | 2 | 1 | 1 | 1 | 4 |

**Flirty guardrail:** a hard content policy (no sexual content, no minors, no explicit language), enforced as a classifier gate.

## Measuring each dimension automatically
- **Formality:** F-score or a formality classifier.
- **Sentence length:** words per sentence and Flesch-Kincaid.
- **Jargon:** difficult-words ratio and domain-term hits.
- **Emoji:** emoji and exclamation rate per 100 words.
- **Warmth and energy:** LIWC-style proxies plus an LLM rater, validated against human ratings.
- **Humour:** LLM rater plus human spot check.
- **CTA intensity:** imperatives and a CTA lexicon.
- **Claims:** extraction plus an approved-list check (pass/fail).

**Recommendation:** ship each preset as numeric targets with tolerance bands and per-channel overrides. Calibrate the judgment-call values with a small user test.

## Reusable template sources (added 2026-10-12)

Owner ruling (2026-10-12, [ADR-010](../../decisions/adr_010_component_list_and_plan_tiers.md)): the proof of concept starts from voice templates, adopting existing open-source sets where licence and format fit. This section answers which ones. Repos were cloned read-only and their LICENSE files and template files read directly; GitHub star counts could not be read, so npm monthly downloads (2026-09-11 to 2026-10-10) stand in for adoption. Dimension codes are those of the starter set above.

### Bottom line

**No drop-in set exists.** No permissively licensed source ships a template set that covers our 9 dimensions, and none ships Flirty, Sales, Hype/Launch, Empathetic/Support or Academic as parameterised templates. The specific gap that forces us to write our own values: **no source has numeric presets for humour + emoji + CTA together, and none treats claims as part of the preset.** The closest is AIWG's claims-adjacent `authenticity` flags.

**What we can adopt is the machinery.** That is two MIT template formats with real presets (AIWG voice-framework, Grain), a blender for weighted template mixing, analysers that turn samples into a profile, and linters. Their preset values also land close to ours, which helps calibrate them (see "Convergence check").

**Recommendation: combine AIWG + Grain, author the rest.**
1. **File format:** AIWG voice-profile YAML (numeric tone + vocabulary prefer/avoid + signature phrases + inline samples). Extend it with our missing fields (humour, emoji, CTA, claims gate) and Grain-style `channelOverrides`.
2. **Prompt rendering:** Grain's approach: each 0–1 dimension maps to 5 graded natural-language directives.
3. **Seed values:** take 5 of our 12 from AIWG/Grain presets (mapping below), and author the other 7 plus every humour/emoji/CTA/claims value ourselves.
4. **Lint layer:** VOICE.md `surfaces` rules and the Vale Microsoft/Google packages (MIT) for the countable dimensions.

---

### Ranked table

| # | Candidate | Licence (from LICENSE file) | Commercial | Format | Templates | Our dims covered | Examples | Maintenance |
|---|---|---|---|---|---|---|---|---|
| 1 | **AIWG voice-framework** [jmagly/aiwg `agentic/code/addons/voice-framework`](https://github.com/jmagly/aiwg) | MIT (`LICENSE`, "Copyright (c) 2024 Joe Magly"); addon manifest also says MIT | Yes | YAML + JSON Schema (`schemas/voice-profile.schema.json`). `tone` holds 5 numeric 0–1 dims: formality, confidence, warmth, energy, complexity. Also vocabulary prefer/avoid/domain_terms/signature_phrases, structure enums, perspective, `authenticity` booleans, inline samples | **5**: technical-authority, friendly-explainer, executive-brief, casual-conversational, ethical-cypherpunk | Fo, En, Wa, Ja (≈complexity), SL (enum, coarse); Cl partial (`uses_specific_numbers`, `acknowledges_uncertainty`). **No Hu, Em, CTA.** No per-channel overrides in the schema | 3 inline samples per template, specific and good (e.g. the PostgreSQL trade-off sample in technical-authority) | Last commit 2026-10-11; `aiwg` npm 46,952/month (whole toolkit, not only voice). Ships `voice_analyzer.py` (samples to profile), `voice_blender.py` (weighted mixing, "70% voice1, 30% voice2"), `voice_generator.py` |
| 2 | **Grain / AgentSpec** [ReallyArtificial/grain](https://github.com/ReallyArtificial/grain) | MIT (`LICENSE`, "Copyright (c) 2026 Really Artificial") | Yes | YAML/JSON Schema. 8 numeric 0–1 dims: formality, warmth, humor, assertiveness, verbosity, confidence, concreteness, urgency. `LanguageStyle` enums: sentenceLength, jargonLevel, emojiUsage, structure. `channelOverrides` | **5** personality presets (`sdk/typescript/src/presets.ts`): professional, friendly, expert, creative, executor | Fo, Hu, Wa numeric; SL, Ja, Em as enums; En/CTA only by proxy (urgency, assertiveness). **No Cl.** Per-channel overrides: **yes** | No sample copy. Instead, 40 graded directives (8 dims × 5 bands) in `prompt-generator.ts`. These are the reusable part | 2 commits, both 2026-09-23; npm `@reallyartificial/grain` 17/month. Built for agent personas, not brands |
| 3 | **VOICE.md** [efeoncepro/voice.md](https://github.com/efeoncepro/voice.md) | Apache-2.0 (`LICENSE`) | Yes | Markdown + YAML front matter spec with a linter CLI. `register.formality` low/medium/high, `emoji_policy`, `exclamation_marks`, `surfaces[]` (max_length, forbid_emoji, cta_count, hashtags), `lexicon`, `audiences`, `tones[]` | **0 presets.** One full example (Efeonce Group, Spanish, a real company) | Fo (3-level), Em, CTA (count per surface), per-surface overrides: **yes**. No En, Hu, Wa | One production example, Spanish only | 2 commits, 2026-05-16, "alpha"; npm `@efeonce/voice.md` 840/month. Linter rules are deterministic (`docs/rules.md`) |
| 4 | **Anthropic knowledge-work-plugins brand-voice** (Tribe AI) [partner-built/brand-voice](https://github.com/anthropics/knowledge-work-plugins) | MIT (`partner-built/brand-voice/LICENSE`, "Copyright (c) 2025 Tribe AI") | Yes | Markdown skills. "We Are / We Are Not" pairs plus 3 tone flexes (formality, energy, technical depth), each with levels and when to use them (`voice-constant-tone-flexes.md`) | 0 presets (method and an illustrative table) | Fo, En, Ja (as levels). No numeric values | Before/after examples file | Last commit 2026-10-11 |
| 5 | **rampstackco brand-voice skill** [rampstackco/claude-skills](https://github.com/rampstackco/claude-skills) | MIT (`LICENSE`, "Copyright (c) 2026 RampStack Co.") | Yes | Markdown. `voice-frameworks.md` covers "We are X, not Y", NN/g's 4 sliders with a worked 0–100 example, and the **12 Jung brand archetypes**, each with a voice signature | 12 archetypes (one-line prose each), not parameterised | Hu, Fo, En (NN/g axes), descriptive only | Calls for 15–25 bad/good pairs; ships a template, not pairs | Last commit 2026-10-06 |
| 6 | **coroboros brand-voice** [coroboros/agent-skills](https://github.com/coroboros/agent-skills) | MIT (`LICENSE.md`) | Yes | `BRAND-VOICE.md`: YAML front matter (forbidden/required lexicon, rewrite_rules, `sentence_norms`, `contexts` per register, pronouns, **`extends` inheritance**) + 11 prose sections; validated by `voice_lint.py` | 0 presets. Example files include `example-chanel.md` (a real brand, so do not reuse) and a multi-voice example | SL, Em (exclamation, emoji pattern), per-context overrides | Has evals (`evals/evals.json`) | Last commit 2026-09-27. `measure_corpus.py` derives sentence norms from a corpus of 30+ sentences, which is useful at rung 3 |
| 7 | **zoharbabin/brand-voice** [repo](https://github.com/zoharbabin/brand-voice) | MIT (`LICENSE`) | Yes | One `brand-guidelines.md` (<600 words): person, active voice, max sentence words, contractions, exclamation marks, always/avoid/forbidden vocab, on/off-tone examples, readability grade | 0 presets; 1 example (fictional "Acme") | SL, Em (exclamation), Ja (readability + avoid list) | 3 on-brand / 2 off-brand lines | 22 commits, last 2026-07-05; npm 358/month. Enforcer (hook, MCP, CLI), not a template source |
| 8 | **Brand Voice Spec** (HF) [thehonestape/brand-voice-spec](https://huggingface.co/datasets/thehonestape/brand-voice-spec) | CC BY 4.0 (HF tag + card) | Yes, with attribution | `voice.json` + JSONL: 8 rules, 28 on/off-voice examples tagged by surface and register, 5 DPO preference pairs, 93 lexicon rows, changelog linking each rule to the correction that produced it | 1 fictional brand (Lantern Coffee) | None numeric; registers act as per-surface voice | Good examples, small | Last modified 2026-06 (HF API). Worth adopting as the **correction-loop pattern**, not as templates |
| 9 | **simonpainter/tone** [repo](https://github.com/simonpainter/tone) | **No LICENSE file** in the repo (checked the full tree), so default copyright applies | **No** | Prose `AGENTS.md`: one common voice plus 8 format layers (blog, email, slides, strategy, social, tech docs, user guides, READMEs) | 1 voice × 8 formats | SL, Em, Hu (prose) | Good banned-phrase list | Last commit 2026-09-21. Read as inspiration only; **do not copy** |

#### Style guides and prompt libraries (sources of rules, not templates)

| Source | Licence (verified) | Commercial | Use for us |
|---|---|---|---|
| [18F Content Guide](https://github.com/18F/content-guide) | CC0 + US public domain (`LICENSE.md`) | Yes | Plainspoken template rules; plain-language word lists. Last commit 2023-12-14 |
| [GOV.UK style guide](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/style-guides/a-to-z-style-guide) | "All content is available under the Open Government Licence v3.0" (page footer) | Yes, with attribution | Plainspoken/Efficient rules: active voice, flag sentences over 25 words, words to avoid ("leverage", "utilise") |
| [Google developer documentation style guide](https://developers.google.cn/style) | "licensed under the Creative Commons Attribution 4.0 License" | Yes, with attribution | Voice and tone section for Professional/Enterprise |
| [Vale Microsoft package](https://github.com/errata-ai/Microsoft), [Vale Google package](https://github.com/errata-ai/Google) | MIT (both `LICENSE`) | Yes | Ready lint rules: `ExclamationPoints`, `SentenceLength`, `Passive`, `Jargon`, `Contractions`, `We`, `FirstPerson`, `Wordiness`. Measures Em, SL, Ja, Fo proxies. Last commits 2026-09-28 |
| [Mailchimp Content Style Guide](https://github.com/mailchimp/content-style-guide) | CC BY-NC 4.0 (`LICENSE.md`) | **No** (JamJam is a paid subscription, per ADR-003) | Do not adapt into the product |
| [Shopify Polaris](https://github.com/Shopify/polaris) | MIT-style, but rights limited to apps that "integrate or interoperate with Shopify" (`LICENSE.md`) | **No** for JamJam | Exclude |
| [Atlassian voice and tone](https://atlassian.design/foundations/content/voice-tone) | "© 2026 Atlassian"; licence page not reviewed | UNVERIFIED | Its traits model (Bold / Optimistic / Practical-with-a-wink, scaled to the reader's emotional state) is a good idea for Support. Use the idea, not the text |
| [awesome-chatgpt-prompts](https://github.com/f/awesome-chatgpt-prompts) | Prompts CC0 (`LICENSE`, `LICENSE-CC0`) | Yes | "Act as" personas, not voice parameters. Low value |
| [fabric](https://github.com/danielmiessler/fabric) | MIT (`LICENSE`) | Yes | 266 task patterns (`humanize`, `improve_writing`, `tweet`), no tone presets. Low value |

#### Datasets for scoring

| Dataset / model | Licence (HF API tag) | Commercial | Scores |
|---|---|---|---|
| [Pavlick & Tetreault formality scores](https://huggingface.co/datasets/osyvokon/pavlick-formality-scores) | cc-by-3.0 | Yes, with attribution | Fo: calibrating an LLM-judge or a small classifier |
| [s-nlp/roberta-base-formality-ranker](https://huggingface.co/s-nlp/roberta-base-formality-ranker) | cc-by-nc-sa-4.0 (trained on GYAFC + Pavlick) | **No** | Fo; usable for internal research only |
| [s-nlp/mdeberta-base-formality-ranker](https://huggingface.co/s-nlp/mdeberta-base-formality-ranker) | openrail++ | Yes, with use restrictions | Fo, multilingual; 57 downloads, check quality before use |
| GYAFC ([paper](https://arxiv.org/pdf/1803.06535)) | Needs Yahoo L6 corpus access; licence not verified here | UNVERIFIED | Fo style-transfer pairs |
| [GoEmotions](https://huggingface.co/datasets/google-research-datasets/go_emotions) | apache-2.0 | Yes | Proxies for Wa (caring, gratitude) and En (excitement) |
| [Stanford politeness (Cleanlab mirror)](https://huggingface.co/datasets/Cleanlab/stanford-politeness) | mit on the mirror; original corpus licence UNVERIFIED | UNVERIFIED | Wa/Fo proxy |
| [ColBERT humor detection](https://huggingface.co/datasets/CreativeLang/ColBERT_Humor_Detection) | cc-by-2.0 | Yes, with attribution | Hu (short-text, joke-vs-not only) |
| [manifesta/brandvoice-marketing-briefs](https://huggingface.co/datasets/manifesta/brandvoice-marketing-briefs) | cc0-1.0 claimed | **Exclude** | The card claims 6,403 rows with a 15-field fingerprint. The JSONL downloaded on 2026-10-12 has 1,300 rows, `formality`/`humor`/`rhythm` are absent, and `tone` is free text. Rows are tagged with real brands (Stripe and others), the copy reads machine-written, and CC0 from a scraper does not clear third-party copy |

---

### Convergence check (why the seeds are safe to take)

AIWG and Grain values converted to our 1–5 scale (v = 1 + 4x, rounded to one decimal) and compared with `steps.ts`:

| Ours | Fo | En | Hu | Wa | Ja | External match | Fo | En | Hu | Wa | Ja |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Professional | 4 | 2 | 1 | 3 | 2 | Grain `professional` | 3.8 | (urgency 2.6) | 1.4 | 3.0 | n/a |
| Friendly | 2 | 3 | 2 | 5 | 1 | AIWG `friendly-explainer` / Grain `friendly` | 2.2 / 2.2 | 3.8 / n/a | n/a / 2.6 | 4.2 / 4.2 | 2.6 / n/a |
| Enterprise | 4 | 2 | 1 | 3 | 3 | AIWG `technical-authority` | 3.8 | 2.6 | n/a | 2.2 | 4.2 |
| Efficient | 3 | 1 | 1 | 2 | 2 | AIWG `executive-brief` / Grain `executor` | 4.2 / 2.6 | 3.0 / (urgency 4.2) | n/a / 1.0 | 2.6 / 1.8 | 3.0 / n/a |
| Candid founder | 2 | 3 | 2 | 3 | 2 | AIWG `casual-conversational` | 1.8 | 4.2 | n/a | 4.6 | 2.2 |

Formality and warmth agree within about one point for Professional, Friendly and Enterprise. **Efficient disagrees on energy**: AIWG executive-brief is mid-energy and Grain executor is high-urgency, while ours is 1. That is a real calibration question for the owner. Values come from `voices/templates/*.yaml` in jmagly/aiwg and `sdk/typescript/src/presets.ts` in ReallyArtificial/grain.

**Templates with no external precedent, so we author them:** Academic, Plainspoken (use the 18F/GOV.UK rules), Playful, Flirty, Sales, Hype/Launch, Empathetic/Support. We also author all Hu/Em/CTA/Cl values for all 12.

---

### Recommendation

**Combine AIWG + Grain as the PoC template source, extend with our own fields, and author 7 of 12 templates.**

- **Adopt (MIT, with attribution in a NOTICE):**
  - the AIWG voice-profile schema shape and its 5 YAML templates as seeds;
  - Grain's 40 graded directives as the text renderer for dimension values;
  - Grain's `channelOverrides` shape for X/LinkedIn;
  - AIWG `voice_blender.py` logic for per-post mixing. This means "per-post template mixing" from research 06 already exists in open source; our version would be a port.
- **Author:** the 7 templates above, every humour/emoji/CTA value, and the claims gate.
- **Gap that forces authoring:** none of the permissive sources defines humour, emoji, CTA and claims as preset values together. AIWG has no humour/emoji/CTA, Grain has no claims or energy, and VOICE.md has no presets. None ships Flirty/Sales/Hype/Support/Academic.
- **Port effort:** AIWG and coroboros tools are Python, and the Worker is TypeScript. Grain ships a TypeScript SDK. The blender and analyser are short heuristic scripts that would need porting, not importing.

---

### The ladder, as the evidence supports it

| Rung | What | Evidence | Open-source tools |
|---|---|---|---|
| 1. Template | Numeric preset rendered to directives plus inline samples | Zero-shot style matching is poor: 3.1–6.9% verifier accuracy without examples ([Jemama & Kumar 2025](https://arxiv.org/pdf/2509.24930v1)). Templates must carry samples, not only adjectives | AIWG templates + schema; Grain prompt-generator; VOICE.md / Vale / zoharbabin linters for countable dims |
| 2. Template + the brand's own samples (few-shot) | 3–5 approved lines from the brand's site or earlier posts in the prompt | "few-shot prompting yields up to 23.5x higher style-matching accuracy than zero-shot"; few-shot 91–100%, completion 96.9–100% ([same paper](https://arxiv.org/pdf/2509.24930v1)). Caveat: across 400+ real authors, models "approximate user styles in structured formats like news and email" but "struggle with nuanced, informal writing in blogs and forums" ([arXiv 2509.14543](https://arxiv.org/abs/2509.14543v1)), and social posts are informal. AIWG's evidence ADR also records that "no universal exemplar count is established" (`docs/natural-voice/ADR-001-evidence-and-ownership.md`) | [DSPy](https://github.com/stanfordnlp/dspy) (MIT) for example selection; [promptfoo](https://github.com/promptfoo/promptfoo) (MIT) for rubric evals; [StyleDistance](https://huggingface.co/StyleDistance/styledistance) (MIT) or [LUAR-MUD](https://huggingface.co/rrivera1849/LUAR-MUD) (Apache-2.0) style embeddings to score closeness to the samples |
| 3. Voice pack from authored writing, with provenance | Measure the brand's corpus into numeric targets; every rule links to its source line or to the correction that created it | Brand Voice Spec changelog pattern (rule → correction → revision) ([HF](https://huggingface.co/datasets/thehonestape/brand-voice-spec)); coroboros `measure_corpus.py` refuses to derive norms below 30 sentences; AIWG evidence ledger pins source hashes | AIWG `voice_analyzer.py` (heuristic 0–1 from samples); coroboros `measure_corpus.py` + `extends` inheritance (template → brand override); [textstat](https://github.com/textstat/textstat) (MIT) or [retext-readability](https://github.com/retextjs/retext-readability) (MIT, JS) for SL/Ja; Pavlick data for Fo calibration. Provenance hashes fit the existing SAS registration |
| 4. Optional fine-tune | LoRA on approved posts + DPO on human corrections | The only fine-tune result found is the manifesta LoRA claim (+24.3%), which is excluded above for data problems. **No reliable evidence found that fine-tuning beats rung 2–3 for brand voice.** Treat it as a bet, not a step | [Unsloth](https://github.com/unslothai/unsloth) (core Apache-2.0; Studio UI AGPL-3.0, per its README); DPO pairs in the Brand Voice Spec format. OpenRouter, our current gateway, is inference-only (not verified here), so this rung needs a different host |

---

### Unverified

- GitHub star counts for every repo (the `gh api` path was refused and github.com HTML returned 403). npm downloads used instead.
- Atlassian design licence terms (atlassian.design/license not read).
- Microsoft Writing Style Guide reuse terms (the terms-of-use fetch was not approved). Not recommended until checked.
- GYAFC licence and access terms; the original Stanford Politeness corpus licence (only the Cleanlab mirror's MIT tag was seen).
- Whether mdeberta-formality-ranker quality is adequate (57 downloads).
- Grain's citation of the "SAC framework" ([arXiv 2506.20993](https://arxiv.org/abs/2506.20993)) was not read.
- The NN/g dimensions page could not be re-fetched (permission timed out). Research 06's NN/g claims stand on that file's own sourcing.
- AIWG voice-framework's own commit history: the clone was depth 1, so "last commit" is for the whole aiwg repo, not that folder.
- That OpenRouter does not offer fine-tuning (stated from memory, not checked).
- How good AIWG's analyser heuristics are. They are keyword counts (e.g. `!` and "amazing" for energy) and have not been validated against human ratings.
