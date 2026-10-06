# What a brand voice actually is: elements and a Brand Kit model

*Research note, 2026-10-06. Every claim links to its source; secondary or practitioner-level sources are marked.*

## 1. The elements of brand identity

"Voice" is more than tone:
- Kapferer's prism has six facets, and only one of them, personality, is close to what software calls "voice" ([Toolshero, secondary](https://www.toolshero.com/marketing/brand-identity-prism/)).
- Aaker's brand personality scale has five dimensions: Sincerity, Excitement, Competence, Sophistication, Ruggedness ([Aaker 1997](https://journals.sagepub.com/doi/abs/10.1177/002224379703400304)).
- Brakus, Schmitt and Zarantonello define brand experience as sensory, affective, intellectual and behavioural ([JM 2009](https://business.columbia.edu/sites/default/files-efs/pubfiles/4243/Brand%20Experience%20and%20Loyalty_Journal_of%20_Marketing_May_2009.pdf)).

### 1a. Strategic core (what the brand stands for)
- **Purpose and values.** Collins and Porras: core values are held "even if they became a competitive disadvantage"; core purpose is why the organisation exists ([HBR 1996](https://hbr.org/1996/09/building-your-companys-vision)). Beliefs and POV belong here, not under tone.
- **Positioning:** Dunford's five components ([Dunford](https://www.aprildunford.com/post/a-quickstart-guide-to-positioning)).
- **Value proposition:** Strategyzer's canvas ([Strategyzer](https://www.strategyzer.com/library/the-value-proposition-canvas)).
- **Messaging framework:** value proposition, 3–4 pillars, proof points, persona variants ([PMA](https://www.productmarketingalliance.com/your-guide-to-messaging/)). *Thin evidence: "pillars" is a practitioner convention.*

### 1b. Verbal identity
- **Voice attributes as "this, not that" pairs.** Mailchimp: Plainspoken, Genuine, Translators, Dry humour ([Mailchimp](https://styleguide.mailchimp.com/voice-and-tone/)). Atlassian: "Bold, Optimistic, Practical, with a wink" ([Atlassian](https://atlassian.design/foundations/content/voice-tone)).
- **Tone dimensions:** NN/g's four spectrums ([NN/g](https://www.nngroup.com/articles/tone-of-voice-dimensions/)).
- **Vocabulary.** Shopify: one term per concept ([Shopify dev](https://shopify.dev/docs/apps/design/content)). Writer's term base sorts terms into Approved, Don't Use, Use Carefully and Pending ([Writer](https://support.writer.com/article/73-building-a-styleguide)).
- **Words to avoid:** GOV.UK's A–Z ([GOV.UK](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/style-guides/a-to-z-style-guide/)).
- **Mechanics:** grammar, capitalisation, reading level. Shopify targets US grade 7.

### 1c. Visual identity
- **Core assets:** logo, colour, type, imagery, graphics, guidelines. Canva's Brand Kit builder extracts these, plus "brand voice", from a URL or PDF, and warns "results may vary" ([Canva](https://www.canva.com/help/brand-kit-builder/)).
- **Design tokens:** the DTCG format covers colour, dimension, font, duration, easing, shadow, border, gradient, transition and typography ([DTCG draft](https://www.designtokens.org/tr/drafts/format/), not a W3C standard).

### 1d. Audio and sonic identity
- **Mastercard's sonic architecture:** a 30-second melody, a 3-second version, a 1.6-second transaction sound and many mood variants ([Mastercard 2024](https://www.mastercard.com/us/en/news-and-trends/stories/2024/inside-the-science-and-success-of-sound.html)). Its effectiveness figures are Mastercard's own claims.
- **Spoken voice:** Microsoft custom voice needs a persona design document, studio recordings, a consent recording from the voice talent and limited-access approval ([Microsoft Learn](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/custom-neural-voice)).

### 1e. Behavioural identity
- How the brand acts: response patterns, empathy in errors, rituals, service. The anchors are Brakus et al. and Kapferer's "relationship" facet. *Thin evidence: no machine-readable standard for behavioural rules was found.*

## 2. One voice, flexible tone

- **Mailchimp and Shopify:** voice stays fixed, tone shifts with context ([Mailchimp](https://styleguide.mailchimp.com/voice-and-tone/), [Shopify](https://shopify.dev/docs/apps/design/content)).
- **Atlassian:** each trait is turned up or down by the user's emotional state and stage; the "wink" is used only at success moments with experienced users ([Atlassian](https://atlassian.design/foundations/content/voice-tone)).
- **Mailchimp social:** changes length and platform conventions, not voice ([Mailchimp social](https://styleguide.mailchimp.com/writing-for-social-media/)).
- **NN/g study:** trustworthiness explained 52% of the variation in desirability and friendliness 8%; humour hurt credibility in serious sectors ([NN/g](https://www.nngroup.com/articles/tone-voice-users/)).
- **For the product:** "playful vs academic" should be a **tone preset** inside fixed voice attributes. Key it by context (channel, reader state, topic risk), and store limits as well as the label.

## 3. Audience and positioning as part of voice

Style guides encode the audience in three ways:
1. **Description.** Shopify's reader description produces the grade-7 target and the ban on idioms.
2. **Reader state.** Mailchimp and Atlassian set tone from how the reader feels.
3. **Segments.** Dunford, Strategyzer and PMA vary messaging by persona.

Jasper "Audiences" and HubSpot's audience description play the same role ([Jasper](https://help.jasper.ai/hc/en-us/articles/18618654325787-Jasper-Brand-Voice), [HubSpot](https://knowledge.hubspot.com/blog/set-up-brand-voice-using-ai)).

## 4. Discovering and measuring each element

| Element | New brand (elicit) | Existing brand (extract) |
|---|---|---|
| Purpose, values | Interview: purpose, and values held even at a cost | Mine About pages, talks and posts |
| Positioning | Dunford sequence | Competitor comparison (method inferred) |
| Value props | Value Proposition Canvas per segment | Cluster benefit statements |
| Personality | Reaction cards: 118 words, pick 5, at least 40% negative words ([NN/g](https://www.nngroup.com/articles/microsoft-desirability-toolkit/)); Aaker scale | Same cards shown to customers |
| Voice attributes | "This, not that" pairs | LLM profiling of samples |
| Tone | NN/g sliders, then Likert-rated variants | Corpus scoring, e.g. LIWC-22 Analytic/Clout/Authentic/Tone ([manual](https://www.liwc.app/static/documents/LIWC-22%20Manual%20-%20Development%20and%20Psychometrics.pdf)); the mapping to NN/g is unvalidated |
| Vocabulary | Seed approved and banned lists | Term extraction, then human approval |
| Visual | Upload and pick | Extract from URL or PDF |
| Sonic / spoken | Persona design doc | Upload audio |

**Sample sizes for voice extraction:** Writer needs at least 300 words and recommends 500+ ([Writer](https://support.writer.com/article/250-how-to-calibrate-voice-for-your-content)); HubSpot needs 500+.

## 5. What current AI brand-voice tools capture, and what they miss

- **Jasper IQ:** Brand Voice, Knowledge Base, Audiences, Style Guide, Visual Guidelines, Product IQ (Business plan).
- **Writer:** voices from 300+ words, term base, snippets, rules, claim detection ([Writer guardrails](https://writer.com/blog/ai-guardrails/)).
- **HubSpot:** voice from 500+ words plus an audience; up to 4 traits, a mission statement, terms to avoid ([HubSpot](https://knowledge.hubspot.com/blog/set-up-brand-voice-using-ai)).
- **Typeface Arc Graph:** tone, channel rules, compliance, visuals, performance signals (company blog post, not product docs) ([Typeface](https://www.typeface.ai/blog/arc-graph-your-brands-brain-that-keeps-your-marketing-consistent-at-scale)).
- **Canva:** mostly visual assets plus a voice field.

**Generally missing** (absence from docs is not proof the feature is absent):
1. Beliefs and POV as first-class fields
2. Tone presets as a structured context matrix
3. Audio identity
4. Behavioural rules
5. **Claims tied to evidence and an expiry date** (relevant to the FTC's "reasonable basis" principle: [FTC](https://www.ftc.gov/legal-library/browse/ftc-policy-statement-regarding-advertising-substantiation))
6. Rules linked to examples
7. Drift measurement against a baseline
8. Founder voice as distinct from the company's

## 6. Proposed Brand Kit data model

Capture: **A** = asked, **I** = inferred then confirmed by a person, **U** = uploaded.

1. **Identity:** name, entity type, parent brand. *A*
2. **Purpose:** purpose, mission, envisioned future. *A/I*
3. **Beliefs / POV:** stance, what we're against, confidence, evidence, topics. *A/I*
4. **Values:** value, definition, behaviour it implies, accepted cost. *A*
5. **Positioning:** alternatives, differentiators, value, best-fit customers, category. *A/I*
6. **Value propositions** per segment. *A+I*
7. **Audience segments:** expertise, language, emotional states, channels. *A/U*
8. **Messaging framework:** primary message, pillars with proof points and allowed claims, segment variants. *A+I*
9. **Voice attributes:** 3–5 traits with "this, not that" pairs and do/don't examples. *A/I*
10. **Tone presets** per context or channel: 4 slider values, trait adjustments, format conventions, emoji/hashtag policy, examples. *A+I*
11. **Vocabulary:** approved, banned, careful, product names, reading level, locale. *I+A*
12. **Claims and compliance:** claim, status, evidence URL, owner, expiry, disclaimers. *A+U*
13. **Visual kit:** logos, colour/type/spacing/motion tokens (DTCG JSON). *U/I*
14. **Audio kit:** sonic logo, music palette, spoken persona, pronunciation, TTS reference with consent record. *U+A*
15. **Behaviour:** response principles by situation. *A*
16. **Examples library:** on/off-brand samples linked to the rules they illustrate, with performance data. *U/I*
17. **Governance:** owners, version, change log, drift score. *System*

**Design note:** keep "what we say" (sections 2–8) separate from "how we say it" (sections 9–11). Every tool above merges them into one "brand voice" blob.

## Sources
All sources are linked inline above.
