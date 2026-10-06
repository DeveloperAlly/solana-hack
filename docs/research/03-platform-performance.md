# What makes a post perform: platform by platform

Research date: 2026-10-06. **[O]** = official (platform docs, engineering blog, executive on record). **[S]** = industry study. **[U]** = popular tip with no good source.

## X / Twitter
- **[O] 2023 open-source ranker.**
  - About 1,500 candidates, roughly half from followed and half from unfollowed accounts ([X eng blog](https://blog.x.com/engineering/en_us/topics/open-source/2023/twitter-recommendation-algorithm)).
  - 2023 weights: like 0.5, repost 1.0, reply 13.5, profile click + engage 12.0, conversation click + engage 11.0, **reply that the author engages with 75.0**, negative feedback −74, **report −369**. The weights are "periodically adjusted" ([recap README](https://github.com/twitter/the-algorithm-ml/blob/main/projects/home/recap/README.md)).
- **[O] Jan 2026 rewrite.**
  - A Grok-based "Phoenix" transformer predicts positive actions (like, reply, repost, quote, share, DM share, link copy, dwell, video view, follow) and negative ones (not interested, mute, block, report, not dwelled).
  - Weights are unpublished. Author-diversity decay applies ([xai-org/x-algorithm](https://github.com/xai-org/x-algorithm), [ppc.land](https://ppc.land/xs-algorithm-source-code-drops-what-it-reveals-about-the-platforms-feed-mechanics/)).
- **[O] Links.**
  - Nikita Bier (Oct 2025) denied that links are deboosted; they get lower engagement because the browser covers the post ([Nieman Lab](https://www.niemanlab.org/2025/10/x-makes-overtures-to-journalists-with-new-feature-designed-to-improve-reach-for-links/)).
  - Since 20 Apr 2026, API link posts cost **$0.20** against $0.015 for plain posts ([TechCrunch](https://techcrunch.com/2026/04/22/x-makes-it-more-expensive-to-post-links-through-its-api/), [X pricing](https://docs.x.com/x-api/getting-started/pricing)).
  - **[S, weak]** a Nieman Lab study of 18 publishers found link-heavy accounts underperform ([Nieman Lab](https://www.niemanlab.org/2026/04/do-links-hurt-news-publishers-on-twitter-our-analysis-suggests-yes/)).
- **[S] Buffer 2026** (52M+ posts): text leads on X, and X's median engagement (about 2.5%) is the lowest of the platforms measured ([Buffer](https://buffer.com/resources/state-of-social-media-engagement-2026/)).

## LinkedIn
- **[O] Mar 2026 feed rebuild.** LLM dual-encoder retrieval plus a transformer "Generative Recommender" with professional context ([LinkedIn Engineering](https://www.linkedin.com/blog/engineering/feed/engineering-the-next-generation-of-linkedins-feed)). It downranks engagement bait ("Comment 'Yes'"), video that doesn't match its caption, and recycled low-substance posts ([Social Media Today](https://www.socialmediatoday.com/news/linkedin-updates-its-feed-algorithm/814638/)).
- **[O] Dan Roth (Feb 2024).** LinkedIn dropped "read more" clicks as a signal after broetry gamed it, and favours expertise; evergreen posts can resurface ([SMT](https://www.socialmediatoday.com/news/linkedin-shares-insights-into-latest-feed-algorithm-updates/708710/)).
- **[S] Link penalty.** Estimates range from 17% to 36% reach loss, falling mostly on **company pages** ([Ordinal](https://www.tryordinal.com/blog/linkedin-link-penalty-study)). **[U]** "Put the link in the first comment" has no official source.
- **[S] Buffer.** Carousels have a 21.77% median engagement rate against 7.35% for video. Posting 2–5 times a week is most efficient. Replying to comments is associated with about 30% more engagement ([Buffer](https://buffer.com/resources/linkedin-algorithm/)).

## Instagram
- **[O] Ranking Explained (May 2023).** Each surface ranks differently. Reels are demoted if low-res, watermarked, muted, bordered, mostly text or reposted ([Instagram](https://about.instagram.com/blog/announcements/instagram-ranking-explained)).
- **[O] Mosseri (Jan 2025).** The top three signals are watch time, likes per reach and **sends per reach** ([SMT](https://www.socialmediatoday.com/news/instagram-shares-algorithm-insights-2025/738034/)).
- **[O] Originality (Apr 2026).** "Aggregator" accounts lose recommendations ([SMT](https://www.socialmediatoday.com/news/instagram-updates-algorithm-to-benefit-original-creators/819016/)).
- **[O] Mosseri (Dec 2025).** "Authenticity is fast becoming a scarce resource" ([netinfluencer](https://www.netinfluencer.com/instagram-head-adam-mosseri-sees-creator-value-rising-as-ai-floods-social-feeds/)).
- **[S]** Carousels drive engagement and Reels drive reach (Buffer 2026). Sprout's best times are local-time windows; test them ([Sprout](https://sproutsocial.com/insights/best-times-to-post-on-social-media/)).
- **[U]** Hashtag counts, the "first hour decides reach" rule, and edit penalties have no official source ([RecurPost](https://blog.recurpost.com/instagram-ranking-signals-published-vs-invented/)).

## TikTok
- **[O] Ranking (2020).** Signals are interactions, video info and device/account settings (weighted lower). Completion is a strong signal. Follower count is not a direct factor ([TikTok](https://newsroom.tiktok.com/en-us/how-tiktok-recommends-videos-for-you)).
- **[O] Guidelines (Sep 2025).** Sponsored content must be disclosed, and off-platform purchase pushes are reduced where TikTok Shop operates ([TechCrunch](https://techcrunch.com/2025/08/15/tiktoks-new-guidelines-add-subtle-changes-for-live-creators-ai-content-and-more/)).
- **[O] AI content (Nov 2025).** An AI-content slider, invisible watermarks and C2PA ([TechCrunch](https://techcrunch.com/2025/11/18/tiktok-now-lets-you-choose-how-much-ai-generated-content-you-want-to-see/)).
- **[S] Cadence.** 2–5 posts a week ([SEJ](https://www.searchenginejournal.com/study-shows-2-5-weekly-tiktoks-deliver-biggest-view-increase/558641/)). **[U]** Fixed length sweet spots.

## YouTube (incl. Shorts)
- **[O] Signals.** Clicks, watch time, survey-based valued watch time, shares, likes and dislikes; borderline content is demoted ([YouTube blog](https://blog.youtube/inside-youtube/on-youtubes-recommendation-system/)). Recommendations "pull" videos for viewers; judge performance over 90+ days ([SEJ, Beaupré](https://www.searchenginejournal.com/how-youtubes-recommendation-system-works-in-2025/538379/)).
- **[O] Shorts.** Up to 3 minutes; the view-count method changed on 31 Mar 2025 ([ppc.land](https://ppc.land/youtube-changes-how-shorts-views-are-counted-from-march-31/)).
- **[O] Policy.** "Inauthentic content" (mass-produced uploads) is demonetised, Jul 2025 ([SMT](https://www.socialmediatoday.com/news/youtube-clarifies-monetization-update-inauthentic-repeated-content/752892/)). Realistic synthetic content must be disclosed ([YouTube](https://blog.youtube/news-and-events/disclosing-ai-generated-content/)).

## Threads
- **[O]** For You ranks on replies, likes and profile visits, and Instagram activity feeds in. Links aren't downranked. API limits: max 5 links per post, 250 posts per 24h ([Threads API](https://developers.facebook.com/docs/threads/posts/), [Buffer](https://buffer.com/resources/threads-algorithm/)).
- **[S]** Replying to comments is associated with **+42%** engagement, the largest effect measured (Buffer 2026).

## Bluesky
- **[O]** An open marketplace of custom feeds, so reach means fitting topic feeds ([Bluesky](https://bsky.social/about/blog/7-27-2023-custom-feeds)). Rate limits apply ([docs](https://docs.bsky.app/docs/advanced-guides/rate-limits)).

## Substack and newsletters
- **[O]** Recommendations and the app drive 50% of new subscriptions; 3+ Notes in launch week gives 50% more subscribers. Both are Substack's own data with no method published ([Substack](https://on.substack.com/p/substacks-recommendations-network), [Notes](https://on.substack.com/p/how-publishers-are-using-notes-to-grow)).
- **[O]** Gmail/Yahoo sender rules: SPF/DKIM/DMARC, one-click unsubscribe, complaint rate under 0.3% ([AWS summary](https://aws.amazon.com/blogs/messaging-and-targeting/an-overview-of-bulk-sender-changes-at-yahoo-gmail/)).

## Blogs and SEO
- **[O] Helpful content.** People-first content; Who/How/Why (bylines, disclosing how it was made including AI); E-E-A-T with trust most important; "we don't" have a preferred word count ([Google](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)).
- **[O] Spam policies.** Scaled content abuse and site reputation abuse ([Google](https://developers.google.com/search/docs/essentials/spam-policies)).

## Policy changes affecting brands and automation

| Date | Change |
|---|---|
| 15 Jan 2026 | X bans apps that reward users for posting (InfoFi) ([post](https://x.com/nikitabier/status/2011825522817270230)) |
| 20 Apr 2026 | X API link posts cost $0.20 |
| 2024– | Meta "AI info" labels via C2PA/IPTC ([Meta](https://about.fb.com/news/2024/04/metas-approach-to-labeling-ai-generated-content-and-manipulated-media/)) |
| Mar 2024 | YouTube synthetic-content disclosure |
| Nov 2025 | TikTok AI slider and watermarks |
| Apr 2026 | Instagram aggregator demotion |

LinkedIn's User Agreement automation clauses couldn't be fetched; check them manually before building LinkedIn automation.

## Draft-scoring checklist (product)
Score **[O]** checks as rules and **[S]** checks as defaults to A/B test.
- **X**
  - [O] Invites replies, and the author plans to reply back
  - [O] No report or block bait
  - [O] Hook works without a click
  - [O] Links carry context; warn about the $0.20 API cost
  - [S] Text-first
  - [O] Not posted through a reward-for-posting scheme
- **LinkedIn**
  - [O] Clear, professionally specific topic
  - [O] No engagement bait or broetry
  - [O] Video matches its caption
  - [S] Try a carousel or document format
  - [S] Warn company pages about links
  - [S] 2–5 posts a week, and reply to comments
- **Instagram**
  - [O] Original, not mostly reposts
  - [O] No watermark, low resolution or borders
  - [O] Built for watch time and DM sends
  - [O] Keyword-clear caption
  - [O] AI label where needed
- **TikTok**
  - [O] Hook supports completion
  - [O] Relevant captions and sounds
  - [O] Sponsored content disclosed
  - [O] AI content labelled
- **YouTube**
  - [O] Title and thumbnail deliver on their promise
  - [O] Retention planned
  - [O] Not templated
  - [O] Synthetic content disclosed
  - [O] Judge over 90+ days
- **Threads**
  - [O] Starts a conversation
  - [O] 5 links or fewer
  - [S] Author replies to comments
- **Bluesky**
  - [O] Fits target custom feeds
- **Substack**
  - [O] Recommendations set up
  - [O] Notes cadence
  - [O] Authentication and unsubscribe compliance
- **Blog/SEO**
  - [O] Byline
  - [O] Original analysis
  - [O] Disclose AI use
  - [O] No word-count padding
  - [O] Not scaled
  - [O] Stronger E-E-A-T for YMYL topics

**Methodology warnings:**
- Buffer and Sprout data come from their own customers, report medians, and show correlation only.
- "Best times" are local-time windows.
- The Nieman Lab sample covers 18 accounts.
- Substack numbers come with no published method.
