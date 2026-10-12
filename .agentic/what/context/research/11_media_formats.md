---
type: research
status: active
created: 2026-10-12
updated: 2026-10-12
last_edited_by: agent
tags: [research, media]
---
> **Status: active.** Research 11 (2026-10-12): which media formats win per platform, what competitors ship, and the platform and legal rules for AI media. The generation stack, licences, evaluation and provenance are in [11_media_detail/generation_stack.md](./11_media_detail/generation_stack.md). Feeds backlog §6 (M1 to M10).

# Research 11: Media formats. What wins, what competitors ship, platform AI rules

Research date: 2026-10-12. Desk research only. This extends [research 03](./03_platform_performance.md) (2026-10-06). It does not repeat that file's ranking-signal findings; it adds format evidence, specs, competitor media features and AI-media rules.

**Evidence legend**
- **[O]** official: platform docs, help centre, engineering or company blog, regulator.
- **[SV]** vendor study: a social-tool vendor analysing its own customers' posts (Buffer, Metricool, Socialinsider). Large samples, but correlation only, customer base skewed, metrics defined differently by each vendor.
- **[S3]** third-party review, press or pricing tracker.
- **[W]** weak: agency blog, small or unstated sample, self-interested.
- **UNVERIFIED**: not confirmed on a primary source; the reason is given.

---

## Ten-line summary
1. Carousels (LinkedIn PDF/document posts, Instagram swipe posts) are the best-evidenced engagement format in 2026: Buffer 21.77% median on LinkedIn, about 3x video; Metricool 11x the interactions of single images; Socialinsider and Buffer both put Instagram carousels first for engagement [SV].
2. Short vertical video is the reach format, not the engagement format: Instagram Reels get 36% more reach than carousels but lower engagement per reach; video leads engagement only on TikTok, Threads, Bluesky and Pinterest [SV]. LinkedIn reports video views up 36% YoY [O], but Metricool finds LinkedIn video underperforms its own volume [SV].
3. On X, text still leads but images are within 5% (3.56% vs 3.40%) [SV]. A text-only JamJam is weakest everywhere except X.
4. Developer audiences learn from docs first (68% use technical documentation) and long-form video (62%); social is used to keep up, not to learn [O survey, SlashData 2023]. That favours explainer carousels, diagrams, code/screenshot cards and clips from demos or talks.
5. Every media competitor enforces brand with tokens (logo, colours, fonts), style references or locked templates; only Jasper runs an automated check of images against written visual guidelines. None checks the *claims* inside a slide, chart or caption against evidence.
6. Per-asset cost anchors: about $0.07-$0.98 per AI image/carousel in SMB tools, $0.10 per source minute for clipping (OpusClip), about $1.50-$3 per finished avatar minute (HeyGen, Synthesia) [derived from vendor pricing].
7. Platform AI rules converged on: self-disclosure toggles plus auto-labels read from C2PA metadata (Meta, TikTok, YouTube, LinkedIn icon, X since Mar 2026). Realistic synthetic media must be disclosed on Meta, TikTok and YouTube [O].
8. EU AI Act Art. 50 applies from 2 Aug 2026: if JamJam generates images or video, JamJam is a *provider* and must machine-mark outputs; brands are *deployers* who must label deepfakes. AI text on public-interest matters is exempt when a human reviewed it and someone holds editorial responsibility [O]. JamJam's approval record is direct evidence for that exemption.
9. Minimum media set, ranked by evidence: (1) slide carousels rendered to PDF and image sets; (2) branded single-image cards (stat, quote, diagram, code/screenshot); (3) short vertical video made from slides or from a real recording, with captions; (4) clips from long-form recordings; (5) alt text and captions on everything. Avatars and photoreal generation come last.
10. JamJam's edge: run the claims gate and approval on every slide, chart and caption; render from kit tokens with deterministic templates; attach C2PA credentials that name the brand as issuer and point to the SAS record. LinkedIn already shows "Issued by" to every viewer [O].

---

## 1. Which formats perform, per platform

### 1a. Format evidence (2025-2026)

| Platform | What the evidence says | Strength | Sources |
|---|---|---|---|
| **X** | Text posts lead with a 3.56% median engagement rate; images 3.40%, video 2.96%, links 2.25%. Premium vs non-Premium matters more than format. | [SV] Buffer, 52M+ posts, 2024-2025 | https://buffer.com/resources/data-best-content-format-social-media/ ; https://buffer.com/resources/state-of-social-media-engagement-2026/ |
| X | Smaller study: images had the highest average engagement (2.09%), text the highest variance, video the most consistent (median 0.94%). | [W] Adilo, 3,200 posts, vendor | https://adilo.com/blog/x-engagement-rate-chart-2025/ |
| X | Jan 2026 Phoenix ranker predicts "video view" and dwell among positive actions (already in 03). | [O] | https://github.com/xai-org/x-algorithm |
| **LinkedIn** | Carousels (document/PDF posts) 21.77% median, video 7.35%, images 6.52%, links 3.81%, text 3.18%. Weak carousels (about 5.4%) still match median video. | [SV] Buffer | https://buffer.com/resources/data-best-content-format-social-media/ |
| LinkedIn | Carousels get 11x the interactions of images but are posted 6x less; multi-image posts have the top engagement rate (3.71%) vs video 1.80% and image 1.81%. Polls reach about 3x more people per post. Video is the most-used format on personal profiles yet underperforms. | [SV] Metricool, 673,658 posts, 63,108 accounts, Jan-Feb 2025 vs 2026 | https://metricool.com/press-release-linkedin-study-2026/ ; https://metricool.com/linkedin-trends/ |
| LinkedIn | Multi-image posts and native documents generate 2-4x the interactions of a standard image post and up to 7x a link post. | [SV] Socialinsider | https://www.socialinsider.io/blog/social-media-interaction/ |
| LinkedIn | Video watched 36% more YoY; video creation growing 2x other formats (early 2025). LinkedIn Marketing says video drives 5x the engagement of other formats (Oct 2025 post; method not given). | [O], self-reported, no method | https://www.linkedin.com/pulse/up-36-over-last-year-video-linkedin-booming-time-now-somasundaram-yqbzc ; https://digiday.com/media/linkedins-video-push-appears-to-be-working-in-2025/ ; https://www.linkedin.com/posts/linkedin-for-mktg_4-linkedin-video-ad-tips-to-boost-engagement-activity-7390073999042449409-VnhX |
| LinkedIn | The Mar 2026 feed rebuild downranks video that doesn't match its caption (in 03). | [O] via SMT | https://www.socialmediatoday.com/news/linkedin-updates-its-feed-algorithm/814638/ |
| **Instagram** | Engagement per reach: carousels 6.90%, single images 4.44%, Reels 3.31%. Reels get 36% more reach than carousels and 2.25x single images. | [SV] Buffer | https://buffer.com/resources/state-of-social-media-engagement-2026/ |
| Instagram | Carousels top engagement (0.55% by followers, 2025); images down 17% YoY; carousels lead saves and views at every account size. Q2 2026: carousels 0.50%, Reels 0.48%, images 0.33%. | [SV] Socialinsider | https://www.socialinsider.io/social-media-benchmarks/instagram |
| Instagram | Reels drive comments and shares; carousels drive saves (15M posts, Oct 2025-Mar 2026). | [SV] Socialinsider | https://www.socialinsider.io/social-media-benchmarks/instagram-engagement-report |
| Instagram | From 30 Apr 2026, accounts mostly reposting photos/carousels they didn't create or materially edit lose recommendations (previously Reels only). | [O] reported | https://techcrunch.com/2026/04/30/instagram-restricts-reach-of-content-aggregators-in-new-crackdown/ ; https://www.theverge.com/news/920999/instagram-says-it-doesnt-want-your-tweet-round-ups |
| **TikTok** | Video 3.39% median vs photo/carousel posts 1.92%. | [SV] Buffer | https://buffer.com/resources/data-best-content-format-social-media/ |
| TikTok | Median interactions down 30% YoY; TikTok still highest at 570 median interactions. | [SV] Socialinsider | https://www.socialinsider.io/blog/social-media-interaction/ |
| **YouTube Shorts** | Shorts up to 3 min for square/vertical uploads since 15 Oct 2024. No large-sample format study found for Shorts vs long-form engagement. | [O] | https://blog.youtube/news-and-events/tall-updates-coming-to-shorts/ ; https://support.google.com/youtube/answer/15424877 |
| YouTube | Over 1B monthly active podcast viewers (Jan 2025); most-used US podcast service. Supports clipping long-form into Shorts. | [O] | https://blog.youtube/news-and-events/1-billion-monthly-podcast-users/ |
| **Threads** | Video 5.55%, images 4.55%, text 2.79%, links 2.34%. Within-account regression: video about 20% above images; text vs image not significant; format explains about 0.16% of variance. | [SV] Buffer (4.7M posts); Buffer data-team analysis | https://buffer.com/resources/data-best-content-format-social-media/ ; https://symphonious-shortbread-cd2770.netlify.app/posts/threads-format-analysis/index.html (Buffer analyst blog, hosting unusual) |
| **Bluesky** | Video median 5 interactions, images 4, links and text 3. Early data. | [SV] Buffer | https://buffer.com/resources/data-best-content-format-social-media/ |
| Cross-platform | Video wins reach and discovery; carousels and polls lead interaction on Instagram and LinkedIn (39M posts, 1M+ accounts). | [SV] Metricool 2026 | https://metricool.com/social-media-study/ |
| Live / audio | No large-sample evidence found for LinkedIn Live, X Spaces or audio posts. One crypto agency reports Spaces posts at 151 avg likes. | [W] | https://tweetloft.com/blog/twitter-x-for-web3-and-crypto-projects |

**Method warnings.** Buffer computes engagement by followers for most platforms but by reach for Instagram and as raw interactions for Bluesky. Metricool counts clicks for Company Pages only. Socialinsider uses followers. Numbers are not comparable across vendors. Use rank order, not absolute values.

### 1b. Format specs (what JamJam's renderer must output)

| Platform | Images | Carousel / document | Video | API notes | Sources |
|---|---|---|---|---|---|
| X | Up to 4 photos, or 1 GIF, or 1 video per post. Image 5 MB (JPG/PNG/GIF/WEBP); GIF 15 MB | No native carousel (4-image grid) | Default 0.5 s-20 min / 8 GB; Premium up to 125 min / 16 GB. 1280x720 or 720x1280 recommended | Limits follow the posting user's Premium status. **Conflict:** TechCrunch (Mar 2025) said 2:20 for non-paying users; the docs mirror says 20 min. UNVERIFIED on docs.x.com directly (read via a docs mirror) | https://x-preview.mintlify.app/x-api/media/introduction ; https://techcrunch.com/2025/03/10/bluesky-now-lets-users-upload-videos-that-are-up-to-3-minutes-long/ |
| LinkedIn | Multi-image 2-20 images (API); JPG/GIF/PNG | Document post: PPT, PPTX, DOC, DOCX, PDF; max 100 MB and 300 pages; viewers can download as PDF; embedded video/animation shows static | 3 s-30 min; API upload up to 5 GB | Documents API, MultiImage API and Videos API all exist for organic posts | https://www.linkedin.com/help/linkedin/answer/a518909 ; https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/documents-api?view=li-lms-2026-04 ; https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/multiimage-post-api?view=li-lms-2026-09 ; https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/videos-api?view=li-lms-2026-04 ; https://www.linkedin.com/help/lms/answer/a493903 |
| Instagram | Feed 3:4 (1080x1440, fits the grid since May 2025), 4:5 (1080x1350), 1:1, 1.91:1 | App: up to 20 photos/videos, one orientation for all (Aug 2024). **API: up to 10 items** | Reels 9:16; API Reels 3 s-15 min, 300 MB | API: 50 posts per 24 h in one doc, 100 in another (conflict on Meta's own pages) | https://www.gadgets360.com/social-networking/news/instagram-photo-3-4-aspect-ratio-support-posts-carousels-8545108 ; https://www.dtnext.in/lifestyle/technology/instagram-increases-carousel-post-limit-to-20-pictures-or-videos-799203 ; https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/content-publishing/ ; https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-user/media |
| TikTok | Photo posts: JPEG/WebP, max 1080p, 20 MB each | API photo post: up to 35 images | All creators 3 min; some 5 or 10 min; API max 10 min, 4 GB, 23-60 fps | API has an `is_aigc` flag that adds an AI-generated tag. Max 5 pending uploads per user per 24 h | https://developers.tiktok.com/doc/content-posting-api-media-transfer-guide ; https://developers.tiktok.com/docs/en/content-posting-api-reference-photo-post |
| YouTube Shorts | n/a | n/a | Square or vertical, up to 3 min | | https://support.google.com/youtube/answer/15424877 |
| Threads | JPEG/PNG | Carousel 2-20 images/videos | Up to 5 min, 1 GB, 23-60 fps, 9:16 recommended | Threads API supports carousels | https://developers.facebook.com/documentation/threads/posts |
| Bluesky | Up to 4 images per post | No carousel | Up to 10 min (since Aug 2026; 3 min from Mar 2025) | A Jan 2026 Bluesky post mentions "more than 4 pics at a time"; whether shipped is UNVERIFIED | https://bsky.social/about/blog/01-29-2026-transparency-report-2025 ; https://techcrunch.com/2026/08/26/bluesky-now-lets-you-upload-10-minute-long-videos/ ; https://bsky.app/profile/bsky.app/post/3mdni342e422l |

**Design consequence.** One slide engine at 1080x1350 (4:5) or 1080x1440 (3:4) covers LinkedIn documents (export as PDF), Instagram and Threads carousels (export as images; cap at 10 for Instagram API), TikTok photo posts and X/Bluesky (first 4 slides as an image set). The same slides can be rendered to a 9:16 MP4 for Reels, Shorts and TikTok.

---

## 2. Formats realistic for developer, crypto and B2B-tech brands

| Format | Evidence for these niches | Strength | Fit for JamJam | Sources |
|---|---|---|---|---|
| Explainer carousel / PDF document | LinkedIn is the B2B platform and carousels lead it (Buffer, Metricool). A Web3 firm tracking 5 months of its own data says LinkedIn rewards PDFs and carousels and that recycled X copy fails there | [SV] + [W] case study | High: maps 1:1 to kit messaging and evidenced facts | https://buffer.com/resources/data-best-content-format-social-media/ ; https://holdex.io/insights/web3-social-growth |
| Diagrams / infographics | Developers rely on docs first (68% use technical documentation; Docker: 82% favour docs when learning online). Diagrams compress docs. Napkin and Nano Banana Pro both market text-to-diagram | [O] survey + product evidence; no format-performance study | High | https://survey.stackoverflow.co/2025/developers ; https://www.docker.com/blog/2025-docker-state-of-app-dev/ ; https://www.napkin.ai/pricing/ ; https://blog.google/innovation-and-ai/products/nano-banana-pro/ |
| Code / screenshot / dashboard cards | Crypto agency data: build-in-public posts average 324 likes vs 95 for promo posts; screenshots of real dashboards and testnet transactions cited as outperforming polished renders | [W] agency, sample unstated | High, and cheap to render deterministically | https://tweetloft.com/blog/twitter-x-for-web3-and-crypto-projects ; https://www.promoj.io/twitter-x-algorithm-2025-for-crypto-virality-tips/ |
| Short demo / tutorial video | Developer Nation (11,000+ devs, Q1 2025): tutorials and how-to videos are the second most valued onboarding resource (32.7%) after docs (39.3%). Docker: 66% favour how-to videos when learning online | [O] survey | Medium-high: needs a real screen recording as input | https://www.developernation.net/developer-reports/dn29/ ; https://www.docker.com/blog/2025-docker-state-of-app-dev/ |
| Long-form video and clips from it | 62% of developers learn from long-form recorded video, 57% long-form text; social is the least-preferred learning source (31%) but the top source for news (56%) | [O] SlashData, 17,000+ devs, 2023 (dated) | Medium: clip talks, podcasts, Spaces | https://www.slashdata.co/post/the-types-of-content-developers-prefer |
| Podcast / Spaces clips | YouTube 1B monthly podcast viewers [O]. X Spaces only weak agency evidence | [O] for podcasts, [W] for Spaces | Medium | https://blog.youtube/news-and-events/1-billion-monthly-podcast-users/ |
| Long text threads | Crypto agency data: threads over 2,000 characters averaged 1.9x the likes of single posts | [W] | Already supported (text) | https://tweetloft.com/blog/twitter-x-for-web3-and-crypto-projects |
| Polls | LinkedIn polls reach about 3x more people per post despite under 1% of posts | [SV] Metricool | Cheap add; not media | https://metricool.com/press-release-linkedin-study-2026/ |
| AI avatar presenter | No evidence for developer or crypto audiences. Realistic avatars can count as deepfakes needing visible disclosure in the EU (Synthesia's own guidance) | n/a | Low priority, high risk | https://help.synthesia.io/en/articles/16046624-what-does-the-eu-ai-act-article-50-mean-for-my-synthesia-videos |

**Honest gap.** There is no large-sample, niche-specific study of format performance for crypto or developer brands. The developer evidence is about how developers *learn*, not what they engage with on social. The crypto evidence is agency-grade. Treat niche fit as a hypothesis JamJam should measure with its own analytics (R9).

---

## 3. Competitor media features and pricing

### 3a. Competitors from the segment files that create media

| Competitor | Formats created | Brand consistency mechanism | Price per asset / credits | Human approval | Provenance / AI labelling | Sources |
|---|---|---|---|---|---|---|
| **Pressmaster** | On-brand images, stock, infographics, quote visuals, "cinematic carousels" (LinkedIn, Instagram), video *scripts* (no rendered video documented) | "Creative Director": upload images/PDFs (recommended), write a style prompt, or extract from a URL | Image about 124 credits vs post about 33 ([research 10 B](./10_competitor_detail/b_ai_social_voice.md)). Starter $29 for 9,000 credits gives about **$0.40/image**, $0.11/post (derived) | Agent approval rules; Content Library review | None documented | https://docs.pressmaster.ai/knowledge/identityos ; https://docs.pressmaster.ai/creating-content/instant-creation ; https://docs.pressmaster.ai/credits |
| **Canva** (Brand Kit, Magic Studio) | Everything: images, carousels, docs, video, AI video clips, charts, diagrams | Brand Kits (logo, colours, fonts); Business adds Brand Controls that lock fonts/colours/layouts and flag off-brand designs; templates | Pro $144/yr: up to 2,000 Standard or 200 Premium (image gen) or 20 Ultra (video) uses a month, pooled. Business $250/yr per person doubles it | Design approvals block publish/download (Business+) | C2PA on AI-assisted exports per Canva AI Product Terms, as reported by a secondary source; export coverage for composites undocumented (UNVERIFIED on a Canva page) | https://www.canva.com/en_us/pricing/ ; https://www.canva.com/help/design-approval/ ; https://www.eesel.ai/blog/canva-ai-pricing ; https://disclosureproof.com/eu-ai-act/ai-generators/canva-ai/ |
| **Google Pomelli** | Campaign images, Photoshoot product shots (Nano Banana), Animate (MP4/GIF), brand book, website | Business DNA (tone, fonts, colours, images) from URL/uploads/chat; style reference image | Free (Labs beta) | None; download only | Google says all its generated media carry SynthID; Pomelli-specific C2PA UNVERIFIED | https://blog.google/innovation-and-ai/models-and-research/google-labs/pomelli-photoshoot/ ; https://support.google.com/labs/answer/17090481 ; https://blog.google/innovation-and-ai/products/nano-banana-pro/ |
| **Jasper** | AI images (Image Generator agent) | Visual Guidelines (written rules, workspace default) plus an automated check that lists images failing a guideline with the reason; Knowledge Base context | Visual Guidelines on Business (custom price) only; Pro $59-69/seat has none ([research 10 A](./10_competitor_detail/a_brand_build.md)) | Automated guideline check, not a human gate | None documented | https://help.jasper.ai/hc/en-us/articles/55085010940187-Visual-Guidelines ; https://www.jasper.ai/visual-guidelines ; https://www.jasper.ai/pricing |
| **Typeface** | Multichannel content incl. visuals (enterprise) | Arc Graph extracts copy *and visual* guidelines into enforceable rules; rule-fired explanations | Unpublished ([research 10 A](./10_competitor_detail/a_brand_build.md)) | Per-rule approval; human approval before Arc Loop variants publish | None documented | https://www.typeface.ai/product/brand-agent |
| **Blaze** | Social images, AI B-roll video, blog, email | Brand Kit from URL (logos, colours, fonts, images) | Starter $79/mo, 600 credits; per-asset cost not published | Optional approvals | None documented. Reviewer found off-topic AI B-roll and weak images | https://www.blaze.ai/pricing ; https://ryandoser.com/blaze-ai-review/ |
| **Contentdrips** | Carousels, graphics, text posts | Brand kit (fonts, colours, logo), AI design agent | Carousel 10 credits, image 25; Starter $15 for 500 credits gives **$0.30/carousel, $0.75/image** (derived; page inconsistent, [research 10 B](./10_competitor_detail/b_ai_social_voice.md)) | None documented | None documented | https://contentdrips.com/pricing |
| **Supergrow** | LinkedIn carousel maker | Content DNA (voice); visual method UNVERIFIED | Included in Pro $39/mo | Teams plan only | None documented | https://www.supergrow.ai/pricing |
| **Kleo** | Graphics (20/mo) | UNVERIFIED | Included in $99/mo | None documented | None documented | https://kleo.so/pricing |
| **Hypefury** | Tweetshots (post screenshots for Instagram), LinkedIn carousels | Templates | Full $19/mo | None | None | https://hypefury.com/pricing/ |
| **Hootsuite** (Wisdom) | AI image generation and edits; Canva designs in composer (PDF, PNG, GIF, MP4) | Prompting; Canva brand kit via integration | Standard from $99/user/mo includes AI image generation ([research 10 C](./10_competitor_detail/c_social_ops.md)) | Approvals on Advanced $399/user | Wisdom images carry a machine-readable AI marker (Hootsuite help) | https://help.hootsuite.com/s/article/images-owlygpt ; https://help.hootsuite.com/s/article/canva ; https://www.hootsuite.com/plans |
| **Buffer** | No native image generation; Apple Image Playground on iOS; AI alt text (Jun 2026) | n/a | Free-$12/channel | Team plan | AI-generated disclosure toggle in composer ([research 10 C](./10_competitor_detail/c_social_ops.md)) | https://buffer.com/resources/image-playground-buffer/ ; https://buffer.com/changelog/generate-alt-text-for-images-in-seconds |
| **Later** | AI credits (captions); visual planner for uploaded media | Grid preview | 5-100 AI credits by plan; 100 extra for $3.75 | Growth+ | None documented | https://later.com/pricing/ |
| **SparkVox** | Input is audio/video (calls, podcasts); output is text posts with the transcript quote behind each draft | Evidence quote per draft | UNVERIFIED | Nothing publishes without approval | n/a | https://sparkvox.io |
| Sprout, Agorapulse, Taplio, Typefully, Edgar, Outerview, Sona, ambassador platforms ([research 10 D](./10_competitor_detail/d_ambassador_payouts.md)) | No media generation documented (Agorapulse has AI alt text; Roster/Aspire collect creator UGC with usage rights) | | | | | [research 10 B](./10_competitor_detail/b_ai_social_voice.md), [research 10 C](./10_competitor_detail/c_social_ops.md), [research 10 D](./10_competitor_detail/d_ambassador_payouts.md) |

### 3b. Major media-creation players missing from the segment files

| Player | Formats | Brand consistency | Price / unit | Approval | Provenance | Sources |
|---|---|---|---|---|---|---|
| **OpusClip** | Long video to short clips: captions, reframe 9:16/1:1/16:9, AI B-roll, scheduler | Brand templates (1 on Starter, up to 4 on Pro), custom fonts, brand vocabulary | 1 credit = 1 source minute. Starter $15 / 150 min (**$0.10/min**); Pro $29 / 300 min or $14.50/mo yearly | None documented | None documented | https://www.opus.pro/pricing ; https://www.viraldrop.ai/compare/opus-clip-pricing |
| **Descript** | Edit video/podcast by text, clips, AI avatars, dubbing, generated video | Brand Studio (Business, team-wide) | Hobbyist $16-24: 10 media h + 400 AI credits; Creator $24-35: 30 h + 800; Business $50-65: 40 h + 1,500 | Comments UNVERIFIED | None documented | https://www.descript.com/pricing ; https://help.descript.com/billing-payments-plans/track-and-understand-your-media-minutes-and-ai-credits |
| **HeyGen** | Avatar videos, digital twins, translation, B-roll, Video Agent | Brand Kit (Creator+), team templates (Business) | Creator $29: 600 credits; Avatar IV 31 credits/min gives about **$1.50/min** (HeyGen's own blog) | Video draft commenting (Business) | Webcam consent recording required for digital twins; no consent check for photo avatars. C2PA UNVERIFIED | https://www.heygen.com/pricing ; https://www.heygen.com/blog/ai-video-generator-pricing ; https://developers.heygen.com/docs/avatar-consent |
| **Synthesia** | Avatar training/marketing video | Brand kits (Enterprise) | Starter $29 ($18 yearly): 10 min/mo; Creator $89: 30 min (about **$2.97/min**) | 1 editor plus guests; Approver role in avatar policy | **C2PA on generated videos by default, plus an optional visible "AI-generated" label**; explicit biometric consent for custom avatars | https://help.synthesia.io/en/articles/16046624-what-does-the-eu-ai-act-article-50-mean-for-my-synthesia-videos ; https://help.synthesia.io/en/articles/15453102-avatar-policy-foundation ; https://ctxwire.com/articles/heygen-vs-synthesia/ |
| **Predis.ai** | Image ads, carousels, Reels/video up to 5 min, UGC-style video | Brand (logo, colours, tone, messaging) read from URL | Core $24-32/mo: 1,300 credits (vendor: about 325 images or 33 videos), so **$0.07-$0.10/image, $0.73-$0.97/video** (derived). Card required for 3-day trial | None documented | None documented | https://predis.ai/pricing/ ; https://predis.ai/predis-ai-ad-generator/ |
| **Napkin AI** | Text to diagrams, flowcharts, infographics (editable vectors) | Brand Styles (3 on Plus), custom fonts and branding (Pro) | Free 500 credits/week (about 1 credit per word); Plus $9/mo 10k; Pro $22/mo 30k | None | None documented | https://www.napkin.ai/pricing/ |
| **Adobe Express / Firefly** | Images, video, templates, partner models | Brand kits in Express (UNVERIFIED on a primary page here) | Express Premium 250 generative credits/mo; Firefly Standard 2,000, Pro 4,000 | n/a | **Content Credentials applied automatically to Firefly output** | https://helpx.adobe.com/creative-cloud/apps/generative-ai/generative-credits-faq.html ; https://helpx.adobe.com/creative-cloud/apps/adobe-content-authenticity/content-credentials/overview.html |
| **Model APIs** (Google Nano Banana 2/Pro, Veo 3.1; OpenAI image) | Building blocks JamJam could call via OpenRouter or direct | Reference images, style transfer, character consistency (Veo "Ingredients") | Veo 3.1 Lite about $1.50/min via Google AI Pro (HeyGen's comparison, vendor-authored) | n/a | Google: SynthID on all generated media, C2PA on Nano Banana Pro/2 output. OpenAI: C2PA plus SynthID | https://blog.google/innovation-and-ai/technology/ai/nano-banana-2/ ; https://blog.google/innovation-and-ai/technology/ai/veo-3-1-ingredients-to-video/ ; https://help.openai.com/en/articles/8912793-provenance-signals-in-openai-generated-content |

**Takeaways.**
- Brand consistency for media is done three ways: tokens (Canva, Contentdrips, Predis, OpusClip, Napkin), style references (Pressmaster Creative Director, Pomelli, Dream Lab style transfer), or locked templates plus rule checks (Canva Brand Controls, Jasper Visual Guidelines, Typeface). Nobody validates the *facts* inside media.
- Human approval for media is a team-tier upsell (Canva Business, Hootsuite Advanced, HeyGen Business), same pattern as text approvals in [research 10 C](./10_competitor_detail/c_social_ops.md).
- Only the big generators (Adobe, Google, OpenAI, Synthesia, Hootsuite Wisdom, reportedly Canva) mark output. No social-content tool in the segment files documents C2PA on its media.

---

## 4. Platform rules for AI media (2025-2026)

### 4a. Platforms

| Platform | Disclosure rule | Auto-label signals | C2PA support | Sources |
|---|---|---|---|---|
| **Meta** (Instagram, Facebook, Threads) | Users must disclose organic photorealistic video or realistic-sounding audio that was digitally created or altered; penalties possible. Stylised, non-photorealistic content needn't be self-labelled | "AI info" label from C2PA/IPTC signals or self-disclosure; AI-edited content moves the label to the post menu, fully generated stays on the content | Reads C2PA/IPTC. From May 2026 will label camera-captured media with Content Credentials on Instagram (Google announcement) | https://about.fb.com/news/2024/04/metas-approach-to-labeling-ai-generated-content-and-manipulated-media/ ; https://partnershiponai.org/wp-content/uploads/2024/11/case-study-meta.pdf ; https://www.facebook.com/help/7434563519957988/ ; https://blog.google/innovation-and-ai/products/identifying-ai-generated-media-online/ |
| **TikTok** | Creators must label all AI-generated content with realistic images, audio or video; unlabelled AIGC may be removed. Mislabelling unaltered content violates the ToS | Creator label, auto label from TikTok AI effects or C2PA; invisible watermarks (Nov 2025); viewers have an AIGC feed slider | Reads C2PA; attaches C2PA to TikTok content; API `is_aigc` flag for photo posts | https://support.tiktok.com/en/using-tiktok/creating-videos/ai-generated-content ; https://newsroom.tiktok.com/en-us/partnering-with-our-industry-to-advance-ai-transparency-and-literacy ; https://developers.tiktok.com/docs/en/content-posting-api-reference-photo-post |
| **YouTube** (incl. Shorts) | Must disclose realistic AI content: real people saying/doing things they didn't, altered real events or places, realistic scenes that didn't happen. Minor edits and unrealistic content exempt | Label from the "AI use" setting, YouTube AI tools, C2PA metadata (cannot be removed by creator) or internal detection | Reads C2PA 2.1+; "Captured with a camera" disclosure for unedited C2PA capture | https://support.google.com/youtube/answer/14328491 ; https://support.google.com/youtube/answer/15446725 ; https://support.google.com/youtube/answer/15447836 |
| **LinkedIn** | No self-disclosure rule found | Shows a C2PA icon on image/video with credentials; click shows AI assertion, app/device, creator, **issued by**, date. Not all AI content is labelled | Yes (since May 2024; still rolling out) | https://www.linkedin.com/help/linkedin/answer/a6282984 |
| **X** | "Made with AI" self-disclosure toggle (late Feb/Mar 2026) covering text, images and video; disclosure required for monetised AI content depicting armed conflict; Authenticity policy bans misleading synthetic media causing harm | Locked auto-label at upload; an internal toast name points to C2PA, inconsistent in tests (UNVERIFIED, secondary). "Edited visuals" warning (Jan 2026), criteria unpublished | Listed as a C2PA Contributor Member per a secondary source (UNVERIFIED). Whether the API exposes the toggle is UNVERIFIED | https://www.medianama.com/2026/03/223-x-made-with-ai-labels-india-tightens-deepfake-rules/ ; https://gigazine.net/gsc_news/en/20260225-x-ai-labels/ ; https://deletesynthid.com/blog/how-x-made-with-ai-label-works (secondary) ; https://tech.yahoo.com/social-media/articles/elon-musk-teases-image-labeling-214618735.html |
| **Bluesky** | No AI-specific labelling rule found in the Oct 2025 Community Guidelines. Self-labels exist for adult content; composable labeller services could add AI labels | Hive auto-labels for adult/graphic only | None found | https://bsky.social/about/support/community-guidelines ; https://bsky.social/about/blog/01-29-2026-transparency-report-2025 |

### 4b. Laws that bind JamJam or its brands

| Rule | What it requires | Who | Date | Sources |
|---|---|---|---|---|
| EU AI Act Art. 50(2) | Machine-readable marking of AI-generated or manipulated audio, image, video and text, effective, interoperable, robust. Exempt: assistive standard editing that doesn't substantially alter input | **Provider** of the generative system. If JamJam generates media, JamJam is a provider | 2 Aug 2026; systems on the market before then have until 2 Dec 2026 | https://digital-strategy.ec.europa.eu/en/factpages/quick-facts-transparency-rules-ai-systems ; https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-50 |
| EU AI Act Art. 50(4) | Visible disclosure of deepfakes. AI text informing the public on matters of public interest must be disclosed **unless it had human review and someone holds editorial responsibility** | **Deployer** (the brand) | 2 Aug 2026 | https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-50 ; https://digital-strategy.ec.europa.eu/en/faqs/code-practice-transparency-ai-generated-content |
| EU Code of Practice on Transparency of AI-generated Content | Voluntary route to show compliance; includes an optional EU icon for labels | Providers and deployers | Published Jun 2026 | https://digital-strategy.ec.europa.eu/en/policies/code-practice-ai-generated-content |
| Commission Art. 50 guidelines | Platforms that only distribute third-party AI content are not deployers but are encouraged to preserve markings; agent outputs perceived by people are in scope | | 20 Jul 2026 | https://ai.cy/images/ai-act/Transparency/Guidelines_on_the_implementation_of_the_transparency_obligations_for_certain_AI_systems_under_Article_50_of_the_AI_Act_BZptWqHk0IKg1dTlDDAp41PSFY_131215.pdf (mirror of C(2026) 5054) |
| India IT Rules amendment | Significant platforms must collect a user declaration of synthetic content, verify it and label it prominently | Platforms (drove X's toggle) | Notified 10 Feb 2026, effective 20 Feb 2026 | https://www.medianama.com/2026/03/223-x-made-with-ai-labels-india-tightens-deepfake-rules/ |
| California AI Transparency Act | Provider-side machine-readable marking and an available visible label | Providers | Cited by Synthesia; effective date UNVERIFIED here | https://help.synthesia.io/en/articles/16046624-what-does-the-eu-ai-act-article-50-mean-for-my-synthesia-videos |

---

## What JamJam must offer to compete (minimum media set, ranked by evidence)

| Rank | Capability | Why (evidence) | Build notes |
|---|---|---|---|
| 1 | **Slide carousels from the approved kit**: 5-10 slides, exported as a LinkedIn PDF document, Instagram/Threads image set (max 10 via IG API), TikTok photo post, first 4 for X/Bluesky | Highest-engagement format on LinkedIn (Buffer 21.77%; Metricool 11x image interactions) and Instagram (Buffer, Socialinsider). Developers learn from structured docs. Competitors ship it cheaply (Contentdrips about $0.30, Supergrow, Pressmaster, Canva) | Deterministic HTML/SVG templates on kit tokens (wireframe B/W), rendered to PNG/PDF. LinkedIn Documents API and MultiImage API exist. Text on slides passes the same slop and claims gates as posts |
| 2 | **Single branded image cards**: stat card, quote card, diagram, code/screenshot/dashboard card, announcement card | Images nearly tie text on X (3.40% vs 3.56%) and beat text on LinkedIn (6.52% vs 3.18%) and Threads (4.55% vs 2.79%) [SV]. Dev and crypto signal favours real screenshots and diagrams [W/O survey] | Template-rendered, not diffusion-generated, so outputs are honest and need no AI label. Diagram generation from kit facts (Mermaid/SVG); user-uploaded screenshots with redaction |
| 3 | **Short vertical video from slides or a real recording**: 9:16, 15-90 s, burned-in captions, brand intro/outro | Reach format: Reels +36% reach vs carousels; video leads TikTok, Threads, Bluesky; LinkedIn video views +36% YoY [O]. But LinkedIn downranks video that mismatches its caption, and Metricool shows video underperforming on LinkedIn | Start with slide-to-video (text motion) and screen-recording plus captions. Avoid generative footage in v1 |
| 4 | **Clips from long-form**: podcast, Spaces, talks, demos to captioned clips plus quote cards | YouTube 1B podcast viewers [O]; developers use long-form video (62%) [O survey 2023]; OpusClip sells this at $0.10/source minute; SparkVox shows demand for transcript-quoted drafts | Transcript becomes evidence: every clip and quote card links to its timestamp, which fits the evidence model |
| 5 | **Alt text, captions and per-platform previews** on every asset | Buffer and Agorapulse ship AI alt text; accessibility is table stakes; Art. 50(5) requires accessible disclosures | Cheap; also feeds the Verify page text |
| Later | Photoreal generative images, AI avatars, AI voice | Weakest evidence for target niches; triggers mandatory disclosure on Meta, TikTok, YouTube and EU deepfake rules; avatars need biometric consent flows (HeyGen, Synthesia) | Only behind explicit opt-in, with C2PA marking and visible label on by default |
| Not media | Polls | LinkedIn polls reach about 3x per post [SV] | Trivial add to the text composer |

---

## Where JamJam can be better

1. **Claims gate on media, not just captions.** Every number on a stat card, chart or slide must trace to an Evidenced kit fact or a cited source, using the same rule as text (quote must exist on the page). No competitor checks the facts inside media. Jasper checks style only; Canva Brand Controls check fonts, colours and layouts. (Sources: Jasper and Canva rows above.)
2. **Approval per slide with a reason record.** Media approval is a team-tier upsell elsewhere (Canva Business, Hootsuite Advanced $399, HeyGen Business). JamJam can approve each slide, store who/when/why, and block publish until all slides pass, on every plan.
3. **Deterministic, token-locked rendering.** Rendering from kit tokens keeps outputs on-brand by construction and avoids the "off-topic AI B-roll and weak images" complaint seen with Blaze. It also avoids unwanted auto "AI info" labels, because no generative pixels are involved.
4. **Provenance that platforms already display.** Attach C2PA Content Credentials to rendered images and video, with the brand (or JamJam on its behalf) as issuer and an assertion referencing the SAS attestation id. LinkedIn shows "Issued by" to all viewers; YouTube shows "Info from"; TikTok and Meta read C2PA. Disclose honestly: use the AI-disclosure assertion only where generative AI was used, because an AI assertion triggers platform AI labels (Meta, TikTok, YouTube, X). Which IPTC `digitalSourceType` value fits a template render is an open design question.
5. **Compliance as a feature.**
   - If JamJam ever generates media, Art. 50(2) makes JamJam a provider with a marking duty from 2 Aug 2026. Build marking in from day one, as Synthesia does.
   - For text, JamJam's recorded human approval is the evidence a brand needs for the Art. 50(4) human-review exemption.
   - Pre-fill platform disclosure flags (TikTok `is_aigc`, YouTube "AI use", X "Made with AI", Meta disclosure) from the asset's generation record at publish time.
6. **Verify for media.** Register media hashes on SAS alongside post hashes. Platforms re-encode uploads, so exact-hash matching on the downloaded file will usually fail. A perceptual hash or C2PA soft binding is needed. Feasibility UNVERIFIED; needs a spike before it is promised.
7. **Evidence-linked clips.** Clips and quote cards cut from a recording carry the timestamp and transcript span as their evidence, extending SparkVox's "transcript quote behind each draft" pattern to media.
8. **Cost position.** Template rendering costs JamJam close to zero per asset, against $0.30-$0.98 per image or carousel and about $1.50-$3 per avatar minute elsewhere. Media can be included in the subscription rather than metered, which avoids the credit-burn complaints in [research 10 B](./10_competitor_detail/b_ai_social_voice.md) (Pressmaster, Taplio) and Canva's mid-month exhaustion.

---

## Open questions and UNVERIFIED items
- X video length for non-Premium accounts: docs mirror says 20 min, TechCrunch 2025 says 2:20. Check docs.x.com directly.
- X "Made with AI" toggle: no X help article found; whether the API can set it is unknown.
- Instagram API publishing cap: 50 vs 100 posts per 24 h on two Meta pages.
- Canva C2PA coverage comes from secondary sources citing Canva's AI Product Terms; not read on a Canva page.
- HeyGen, Pomelli, Pressmaster, Predis: no first-party statement on C2PA output found.
- Whether X and LinkedIn preserve C2PA manifests on download (LinkedIn displays them; storage behaviour undocumented).
- Bluesky multi-image (more than 4) status after the Jan 2026 post.
- No niche-specific (crypto, developer) large-sample format study exists. The niche-fit rankings above are hypotheses to test.
- YouTube Data API field for the synthetic-media disclosure: not verified in this pass.
