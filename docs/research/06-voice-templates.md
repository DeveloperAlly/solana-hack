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
