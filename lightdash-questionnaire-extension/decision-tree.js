// Decision tree for content licensing questionnaire
// Each node has: question, options (label + next node or prompt builder)

const DECISION_TREE = {
  root: {
    question: "How can I help you?",
    type: "single",
    icon: true,
    options: [
      { label: "Explain Analysis", next: "explain_what", description: "Help me understand what I'm looking at" },
      { label: "Guide me to Licensing Titles", next: "guide_root", description: "Find the right titles to license" },
    ],
  },

  // ── Explain Analysis ────────────────────────────────────────
  // Maps directly to the two deployed dashboards and their tabs/charts
  explain_what: {
    question: "Which dashboard are you looking at?",
    type: "single",
    options: [
      { label: "Ad Revenue Licensing Intelligence", next: "explain_adrev_tab", value: "ad_revenue", description: "Revenue estimates, market comparison, title & genre rankings" },
      { label: "Challenge 6 -- Content Licensing Intelligence", next: "explain_ch6_tab", value: "challenge_6", description: "Priority scores, licensing gaps, genre AVOD vs TVOD" },
      { label: "I want to understand a metric", next: "explain_metric", value: "metric" },
    ],
  },

  // ── Ad Revenue dashboard tabs ───────────────────────────────
  explain_adrev_tab: {
    question: "Which tab are you on?",
    type: "single",
    options: [
      { label: "Revenue Overview", next: "explain_adrev_overview", value: "revenue_overview" },
      { label: "Title Rankings", next: "explain_adrev_titles", value: "title_rankings" },
      { label: "Genre Intelligence", next: "explain_adrev_genre", value: "genre_intelligence" },
    ],
  },
  explain_adrev_overview: {
    question: "Which chart do you want explained?",
    type: "single",
    options: [
      { label: "Total Est. Revenue (big number)", next: null, value: "kpi_total_revenue" },
      { label: "Est. AVOD & TVOD Revenue by Market (bar chart)", next: null, value: "market_revenue" },
      { label: "Revenue Efficiency Per User (bar chart)", next: null, value: "revenue_per_user" },
      { label: "The methodology note at the bottom", next: null, value: "methodology" },
    ],
  },
  explain_adrev_titles: {
    question: "Which element?",
    type: "single",
    options: [
      { label: "Top 20 Titles by Est. Ad Revenue (bar chart)", next: null, value: "top20_ad_revenue" },
      { label: "Est. Ad Revenue vs Licensing Score (explainer)", next: null, value: "revenue_vs_score" },
    ],
  },
  explain_adrev_genre: {
    question: "Which chart?",
    type: "single",
    options: [
      { label: "Est. Ad Revenue by Genre -- Shows (bar chart)", next: null, value: "genre_ad_revenue_shows" },
      { label: "AVOD vs TVOD Demand by Genre (grouped bar)", next: null, value: "genre_avod_tvod" },
      { label: "Key genre insights (text panel)", next: null, value: "genre_insights" },
    ],
  },

  // ── Challenge 6 dashboard tabs ──────────────────────────────
  explain_ch6_tab: {
    question: "Which tab are you on?",
    type: "single",
    options: [
      { label: "Overview", next: "explain_ch6_overview", value: "overview" },
      { label: "Licensing Gaps", next: "explain_ch6_gaps", value: "gaps" },
      { label: "Genre Analysis", next: "explain_ch6_genre", value: "genre" },
    ],
  },
  explain_ch6_overview: {
    question: "Which element?",
    type: "single",
    options: [
      { label: "Users Engaged with Scored Content (KPI)", next: null, value: "kpi_users" },
      { label: "AVOD Clickouts on Gap Titles (KPI)", next: null, value: "kpi_avod_gap" },
      { label: "AVOD / TVOD Demand Ratio (KPI)", next: null, value: "kpi_ratio" },
      { label: "Top 20 Licensing Priority Titles (bar chart)", next: null, value: "top20_priority" },
    ],
  },
  explain_ch6_gaps: {
    question: "Which element?",
    type: "single",
    options: [
      { label: "Top 20 Licensing Gap Titles (bar chart)", next: null, value: "top20_gap" },
      { label: "Licensing Gap -- Full List table (top 100)", next: null, value: "gap_table" },
    ],
  },
  explain_ch6_genre: {
    question: "Which chart?",
    type: "single",
    options: [
      { label: "AVOD vs TVOD Score by Genre (grouped bar)", next: null, value: "ch6_genre_avod_tvod" },
      { label: "AVOD Gap Rate by Genre (bar chart)", next: null, value: "ch6_gap_rate" },
      { label: "How to read this (text panel)", next: null, value: "ch6_genre_howto" },
    ],
  },

  // ── Metric explainers (shared) ──────────────────────────────
  explain_metric: {
    question: "Which metric or concept?",
    type: "single",
    options: [
      { label: "Est. Ad Revenue", next: null, value: "est_ad_revenue" },
      { label: "Licensing Score", next: null, value: "licensing_score" },
      { label: "AVOD Score / TVOD Score", next: null, value: "avod_tvod_score" },
      { label: "Supply Gap Score", next: null, value: "supply_gap" },
      { label: "Adjusted CPM", next: null, value: "adjusted_cpm" },
      { label: "AVOD / TVOD Ratio", next: null, value: "avod_tvod_ratio" },
      { label: "AVOD Gap Rate", next: null, value: "avod_gap_rate" },
      { label: "Revenue Per User", next: null, value: "revenue_per_user" },
      { label: "Cost Proxy / Priority Score", next: null, value: "cost_proxy" },
    ],
  },

  // ── Guide to Licensing Titles ───────────────────────────────
  guide_root: {
    question: "What licensing question would you like to explore?",
    type: "single",
    options: [
      { label: "What should I license for AVOD?", next: "avod_type" },
      { label: "What should I license for TVOD?", next: "tvod_type" },
      { label: "Where are the biggest content gaps?", next: "gap_type" },
      { label: "Which genres should I invest in?", next: "genre_strategy" },
      { label: "Movies or shows -- what's the better bet?", next: "compare_strategy" },
    ],
  },

  // ── Q1: AVOD Licensing ──────────────────────────────────────
  avod_type: {
    question: "What type of content are you looking at?",
    type: "single",
    options: [
      { label: "Movies", next: "avod_priority", value: "movies" },
      { label: "Shows", next: "avod_priority", value: "shows" },
      { label: "Both", next: "avod_priority", value: "both" },
    ],
  },
  avod_priority: {
    question: "What's your priority?",
    type: "single",
    options: [
      { label: "Maximize viewers (highest demand)", next: "avod_genre", value: "max_viewers" },
      { label: "Best ROI (high demand, low cost)", next: "avod_genre", value: "best_roi" },
      { label: "Fill supply gaps (unserved demand)", next: "avod_genre", value: "fill_gaps" },
    ],
  },
  avod_genre: {
    question: "Any genre preference?",
    type: "single",
    options: [
      { label: "Any genre", next: "avod_budget", value: "any" },
      { label: "Action & Adventure", next: "avod_budget", value: "action" },
      { label: "Drama", next: "avod_budget", value: "drama" },
      { label: "Comedy", next: "avod_budget", value: "comedy" },
      { label: "Thriller & Crime", next: "avod_budget", value: "thriller" },
      { label: "Documentary", next: "avod_budget", value: "documentary" },
      { label: "Sci-Fi & Fantasy", next: "avod_budget", value: "scifi" },
      { label: "Romance", next: "avod_budget", value: "romance" },
      { label: "Horror", next: "avod_budget", value: "horror" },
    ],
  },
  avod_budget: {
    question: "What's your licensing budget tier?",
    type: "single",
    options: [
      { label: "Low cost (older/niche titles)", next: null, value: "low" },
      { label: "Mid range", next: null, value: "mid" },
      { label: "Premium (new releases, high-rated)", next: null, value: "premium" },
      { label: "Show me all", next: null, value: "all" },
    ],
  },

  // ── Q2: TVOD Licensing ──────────────────────────────────────
  tvod_type: {
    question: "What type of content?",
    type: "single",
    options: [
      { label: "Movies", next: "tvod_pricing", value: "movies" },
      { label: "Shows", next: "tvod_pricing", value: "shows" },
      { label: "Both", next: "tvod_pricing", value: "both" },
    ],
  },
  tvod_pricing: {
    question: "Which pricing model?",
    type: "single",
    options: [
      { label: "Rental focus", next: "tvod_recency", value: "rent" },
      { label: "Buy/own focus", next: "tvod_recency", value: "buy" },
      { label: "Both rent & buy", next: "tvod_recency", value: "both" },
    ],
  },
  tvod_recency: {
    question: "Content recency preference?",
    type: "single",
    options: [
      { label: "New releases (2024+)", next: "tvod_genre", value: "new" },
      { label: "Recent catalog (2020-2023)", next: "tvod_genre", value: "catalog" },
      { label: "Library titles (older)", next: "tvod_genre", value: "library" },
      { label: "All years", next: "tvod_genre", value: "all" },
    ],
  },
  tvod_genre: {
    question: "Genre preference?",
    type: "single",
    options: [
      { label: "Any genre", next: null, value: "any" },
      { label: "Action & Adventure", next: null, value: "action" },
      { label: "Drama", next: null, value: "drama" },
      { label: "Comedy", next: null, value: "comedy" },
      { label: "Thriller & Crime", next: null, value: "thriller" },
      { label: "Sci-Fi & Fantasy", next: null, value: "scifi" },
      { label: "Horror", next: null, value: "horror" },
    ],
  },

  // ── Q3: Content Gaps ────────────────────────────────────────
  gap_type: {
    question: "What kind of gap are you looking for?",
    type: "single",
    options: [
      { label: "High demand, no AVOD offer", next: "gap_content", value: "no_avod" },
      { label: "High demand, no SVOD offer", next: "gap_content", value: "no_svod" },
      { label: "High demand, no streaming at all", next: "gap_content", value: "no_streaming" },
    ],
  },
  gap_content: {
    question: "Content type?",
    type: "single",
    options: [
      { label: "Movies", next: "gap_threshold", value: "movies" },
      { label: "Shows", next: "gap_threshold", value: "shows" },
      { label: "Both", next: "gap_threshold", value: "both" },
    ],
  },
  gap_threshold: {
    question: "How deep should we look?",
    type: "single",
    options: [
      { label: "Top 50 highest-demand gaps", next: null, value: "top50" },
      { label: "Top 200", next: null, value: "top200" },
      { label: "All gaps", next: null, value: "all" },
    ],
  },

  // ── Q4: Genre Investment ────────────────────────────────────
  genre_strategy: {
    question: "What revenue model are you optimizing for?",
    type: "single",
    options: [
      { label: "AVOD (ad-supported free streaming)", next: "genre_optimize", value: "avod" },
      { label: "TVOD (rent/buy transactions)", next: "genre_optimize", value: "tvod" },
      { label: "Compare both side by side", next: "genre_optimize", value: "both" },
    ],
  },
  genre_optimize: {
    question: "Optimize for?",
    type: "single",
    options: [
      { label: "Total revenue potential (volume)", next: "genre_content_type", value: "volume" },
      { label: "ROI efficiency (best return per title)", next: "genre_content_type", value: "roi" },
      { label: "Untapped opportunity (biggest gaps)", next: "genre_content_type", value: "gaps" },
    ],
  },
  genre_content_type: {
    question: "Movies, shows, or both?",
    type: "single",
    options: [
      { label: "Movies", next: null, value: "movies" },
      { label: "Shows", next: null, value: "shows" },
      { label: "Both", next: null, value: "both" },
    ],
  },

  // ── Q5: Movies vs Shows ─────────────────────────────────────
  compare_strategy: {
    question: "For which revenue model?",
    type: "single",
    options: [
      { label: "AVOD", next: "compare_metric", value: "avod" },
      { label: "TVOD", next: "compare_metric", value: "tvod" },
      { label: "Overall licensing value", next: "compare_metric", value: "overall" },
    ],
  },
  compare_metric: {
    question: "What matters most to you?",
    type: "single",
    options: [
      { label: "Total catalog volume", next: "compare_budget", value: "volume" },
      { label: "Per-title revenue potential", next: "compare_budget", value: "per_title" },
      { label: "Audience reach (unique users)", next: "compare_budget", value: "audience" },
      { label: "Supply gap opportunity", next: "compare_budget", value: "gaps" },
    ],
  },
  compare_budget: {
    question: "Budget range?",
    type: "single",
    options: [
      { label: "Low cost titles", next: null, value: "low" },
      { label: "Mid range", next: null, value: "mid" },
      { label: "Premium", next: null, value: "premium" },
      { label: "Compare across all budgets", next: null, value: "all" },
    ],
  },
};

// ── Prompt Builders ─────────────────────────────────────────
// Maps each question path to a Lightdash AI prompt

function buildPrompt(answers) {
  const rootChoice = answers[0]?.label || "";

  // Top-level split: Explain renders inline (returns null), Guide sends to AI
  if (rootChoice === "Explain Analysis") return null; // handled by getExplanation()
  if (rootChoice === "Guide me to Licensing Titles") {
    // Shift answers to skip root + guide_root, re-route to guide builders
    const guideAnswers = answers.slice(1); // remove "Guide me to Licensing Titles"
    const guideChoice = guideAnswers[0]?.label || "";
    if (guideChoice.includes("AVOD")) return buildAvodPrompt(guideAnswers);
    if (guideChoice.includes("TVOD")) return buildTvodPrompt(guideAnswers);
    if (guideChoice.includes("gaps")) return buildGapPrompt(guideAnswers);
    if (guideChoice.includes("genres")) return buildGenrePrompt(guideAnswers);
    if (guideChoice.includes("Movies or shows")) return buildComparePrompt(guideAnswers);
  }
  return "Show me the top 20 titles by licensing priority score.";
}

// ── Explain: inline content (rendered in extension, NOT sent to AI) ───

const EXPLANATIONS = {
  // ── Ad Revenue dashboard > Revenue Overview ──────────────────
  kpi_total_revenue: {
    title: "Total Est. Revenue Across 8 EU Markets",
    chart: "Big number KPI",
    model: "mart_market_opportunity",
    explanation: `This single number sums the estimated ad revenue (AVOD) and transactional revenue (TVOD) across all 8 EU markets in the dataset (DE, FR, GB, IT, ES, AT, CH, NL — Dec 2025).

<strong>How it's calculated:</strong>
Est. Ad Revenue = Estimated Views x Watch Hours x 6 ads/hr x Adjusted CPM / 1000

It represents the total addressable licensing revenue if JustWatch licensed every title with measurable demand.`,
    action: "Use this as the headline number for the total opportunity size. Compare it to actual licensing budgets to gauge feasibility.",
  },
  market_revenue: {
    title: "Est. AVOD & TVOD Revenue by Market",
    chart: "Grouped bar chart (purple = AVOD, yellow = TVOD)",
    model: "mart_market_opportunity",
    explanation: `Each bar shows one EU market. The purple bar is estimated ad-supported revenue (AVOD), yellow is rent/buy revenue (TVOD).

Markets are sorted by AVOD revenue descending. Germany (DE) typically leads by volume due to the largest user base, but smaller markets may show higher per-user efficiency.

<strong>Key question:</strong> Which market gives the best return? A large total doesn't always mean the best place to start — check Revenue Efficiency next.`,
    action: "Compare bars to identify which markets have a meaningful TVOD component vs pure AVOD plays. Markets with balanced AVOD+TVOD offer diversified revenue.",
  },
  revenue_per_user: {
    title: "Revenue Efficiency (Per User)",
    chart: "Bar chart (green)",
    model: "mart_market_opportunity",
    explanation: `Revenue per user = total estimated revenue / unique users in that market.

This normalizes for market size. A small market (e.g. AT, CH) with high revenue per user may be more efficient to enter than a large market with low per-user yield.

<strong>Why this matters:</strong> Content licensing is often territory-specific. Revenue per user tells you where each licensing dollar works hardest.`,
    action: "High revenue/user + low total volume = niche but efficient. High revenue/user + high volume = priority market. Low revenue/user = consider last.",
  },
  methodology: {
    title: "Revenue Estimation Methodology",
    chart: "Explanation text panel",
    model: "Multiple models",
    explanation: `<strong>Formula:</strong> Est. Ad Revenue = Estimated Views x Watch Hours x 6 ads/hr x Adjusted CPM / 1000

<strong>Adjusted CPM</strong> is the base genre CPM modified by four multipliers:
- <strong>Audience multiplier</strong> (0.7-1.5): based on user segment mix (premium/mainstream/price-sensitive)
- <strong>Brand safety multiplier</strong> (0.3-1.0): safe/moderate/risky content
- <strong>Freshness multiplier</strong> (0.8-1.2): newer content commands higher CPMs
- <strong>AVOD tier multiplier</strong>: A/B/C tier from Cortex AI classification

Audience and AVOD tier are classified by Snowflake Cortex AI (llama3.1-8b) on the top 10K most-engaged titles. Remaining titles default to Tier B / moderate brand safety.`,
    action: "If a title's revenue looks surprisingly high or low, check its adjusted CPM — the multipliers can swing revenue 3-4x.",
  },

  // ── Ad Revenue dashboard > Title Rankings ───────────────────
  top20_ad_revenue: {
    title: "Top 20 Titles — Est. Ad Revenue (USD)",
    chart: "Horizontal bar chart (red), sorted by revenue",
    model: "mart_title_ad_revenue",
    explanation: `The 20 highest-revenue titles across all 8 EU markets. Each bar length = estimated monthly ad revenue in USD.

Revenue is driven by: <strong>demand volume</strong> (estimated views from engagement signals), <strong>watch hours</strong> (runtime x episodes), and <strong>adjusted CPM</strong> (genre + audience + brand safety + freshness).

Long-running shows (e.g. One Piece, Detective Conan) tend to dominate because they have hundreds of episodes = massive watch hours.

<strong>Important:</strong> High revenue does not mean "easy to license." These top titles may be expensive. That's why the Licensing Score exists.`,
    action: "Cross-reference with the supply gap score. A top-revenue title available on 12 platforms is harder to acquire than a mid-revenue title with 0 providers.",
  },
  revenue_vs_score: {
    title: "Est. Ad Revenue vs Licensing Score",
    chart: "Explanation text panel",
    model: "mart_title_ad_revenue",
    explanation: `<strong>Est. Ad Revenue</strong> = raw demand-based revenue potential (this chart).
<strong>Licensing Score</strong> = Est. Ad Revenue x Supply Gap Score x Quality Score.

The licensing score adjusts for <strong>supply gap</strong> (fewer providers = easier/cheaper to license) and <strong>quality</strong> (higher IMDb = better content).

A title with $500K revenue and 1 provider (gap 0.8) scores higher than a $700K title on 12 platforms (gap 0.1).

<strong>Supply gap score:</strong>
- 0 providers = 1.0 (fully unserved)
- 1-2 providers = 0.8 (underserved)
- 3-5 = 0.5, 6-10 = 0.3, 11+ = 0.1 (saturated)`,
    action: "For acquisition decisions, use Licensing Score (not raw revenue). It surfaces the best ROI targets — high demand that competitors haven't locked up.",
  },

  // ── Ad Revenue dashboard > Genre Intelligence ───────────────
  genre_ad_revenue_shows: {
    title: "Est. Ad Revenue by Genre (Shows)",
    chart: "Horizontal bar chart (purple), sorted by revenue",
    model: "mart_genre_performance",
    explanation: `Total estimated ad revenue for TV shows, broken down by genre.

Drama dominates (~$7.1M) due to high volume + premium CPM ($25 base). Crime & Thriller carry high CPM relative to title count — premium advertiser appeal.

<strong>Note:</strong> Each show can have multiple genres, so one title may appear in multiple genre bars. This is intentional — it shows genre-level opportunity, not unique title revenue.`,
    action: "Genres at the top = highest AVOD licensing priority. But also check AVOD vs TVOD split — some genres are better for rent/buy.",
  },
  genre_avod_tvod: {
    title: "AVOD vs TVOD Demand by Genre",
    chart: "Grouped bar chart (purple = AVOD score, yellow = TVOD score)",
    model: "fct_genre_licensing",
    explanation: `Side-by-side comparison of AVOD demand (ad-supported intent) vs TVOD demand (rent/buy intent) for each genre.

<strong>How to read:</strong>
- Genre with tall purple, short yellow = strong AVOD fit (users want it free)
- Genre with tall yellow relative to purple = TVOD-suitable (users willing to pay)

Animation & Reality typically show 89-92% AVOD intent. Action/Thriller movies show stronger TVOD share.`,
    action: "License AVOD-dominant genres for your free streaming tier. For TVOD-heavy genres, consider rent/buy deals instead.",
  },
  genre_insights: {
    title: "Key Genre Insights",
    chart: "Text panel with recommendations",
    model: "Multiple models",
    explanation: `Summary findings:
- <strong>Drama shows</strong>: $7.1M potential, highest CPM ($25 base), 85% AVOD intent
- <strong>Crime & Thriller</strong>: highest CPM relative to volume, premium advertiser segments
- <strong>Animation & Reality</strong>: 89-92% AVOD intent share, audiences strongly prefer free
- <strong>Action/Thriller movies</strong>: higher TVOD share, better for rent/buy

<strong>Recommendation:</strong> Prioritize drama and crime/thriller shows for AVOD licensing. Use TVOD for action/thriller movies with lower AVOD intent.`,
    action: "This is the strategic takeaway. Use it to set genre priorities for your licensing team's next acquisition round.",
  },

  // ── Challenge 6 dashboard > Overview ────────────────────────
  kpi_users: {
    title: "Users Engaged with Scored Content",
    chart: "Big number KPI",
    model: "fct_licensing_priority",
    explanation: `Total unique users who interacted with at least one title that has been scored by the licensing model.

This is the addressable audience — users whose behavior feeds the demand signals. It represents the potential reach of any content JustWatch licenses.`,
    action: "A large user base validates the model's signal strength. More users = more reliable demand scores.",
  },
  kpi_avod_gap: {
    title: "AVOD Clickouts on Gap Titles",
    chart: "Big number KPI",
    model: "fct_underserved_demand",
    explanation: `Total AVOD clickouts (free/ads) on titles that have NO current AVOD offer.

These are users who clicked to watch something for free — but the title isn't available for free anywhere. Each clickout is a lost monetization opportunity.

<strong>Translation:</strong> This many ad-supported viewing sessions are being lost because the content isn't licensed for AVOD yet.`,
    action: "This is the direct business case for licensing. Each gap clickout = a viewer you could have monetized with ads.",
  },
  kpi_ratio: {
    title: "AVOD / TVOD Demand Ratio",
    chart: "Big number KPI",
    model: "fct_genre_licensing",
    explanation: `Average ratio of AVOD demand score to TVOD demand score across all genres.

- Ratio > 1: overall demand skews toward ad-supported (free streaming)
- Ratio < 1: demand skews toward transactional (rent/buy)
- Ratio = 1: balanced

A high ratio means the market is primarily ad-supported — users prefer free content over paying. This guides the overall licensing strategy.`,
    action: "If ratio >> 1, prioritize AVOD licensing deals. If closer to 1, build a mixed AVOD + TVOD portfolio.",
  },
  top20_priority: {
    title: "Top 20 Licensing Priority Titles",
    chart: "Horizontal bar chart (indigo), sorted by priority score",
    model: "fct_licensing_priority",
    explanation: `The 20 titles with the highest <strong>licensing priority score</strong> = (AVOD score + TVOD score) / cost proxy.

Unlike the Ad Revenue chart, this factors in <strong>licensing cost</strong>. A cheap-to-license title with decent demand ranks higher than an expensive blockbuster.

<strong>AVOD Score</strong> weights: page views (x1), clicks (x2), trailers (x3), watchlist (x4), SVOD clickouts (x3), AVOD clickouts (x8), all multiplied by LN(market_count + 1).

<strong>Cost Proxy</strong> = IMDB score x 10 + recency bonus (5-50) + show premium (+20).`,
    action: "This is your acquisition shortlist. Start licensing conversations with rights holders for these titles first.",
  },

  // ── Challenge 6 dashboard > Licensing Gaps ──────────────────
  top20_gap: {
    title: "Top 20 Licensing Gap Titles",
    chart: "Horizontal bar chart (green), sorted by AVOD score",
    model: "fct_underserved_demand",
    explanation: `The 20 titles with the highest AVOD demand that currently have <strong>no ad-supported streaming offer</strong>.

These are filtered to the top quartile (75th percentile) of AVOD scores, then further filtered to titles where has_avod_offer = false.

<strong>Why these matter:</strong> Users are actively looking for these titles on free/ad-supported platforms and can't find them. Licensing any of these fills a real demand gap.`,
    action: "These are your lowest-hanging fruit. No competitor offers them for free — first mover advantage if you license them for AVOD.",
  },
  gap_table: {
    title: "Licensing Gap — Full List (Top 100)",
    chart: "Data table with conditional formatting",
    model: "fct_underserved_demand",
    explanation: `Detailed table of the top 100 gap titles, ranked by demand_gap_rank (1 = highest priority).

<strong>Columns:</strong>
- <strong>Rank</strong>: priority order (1 = license first)
- <strong>Title</strong>: content name
- <strong>Type</strong>: movie or show
- <strong>Genres</strong>: comma-separated genre list
- <strong>Markets</strong>: how many EU markets show demand
- <strong>SVOD Offer?</strong>: is it on a subscription service?
- <strong>TVOD Offer?</strong>: is it available to rent/buy?
- <strong>AVOD Score</strong>: demand strength (green bar = relative magnitude)
- <strong>Watchlist Adds</strong>: users who saved it for later

Titles with SVOD but no AVOD = users currently need a subscription but would watch for free with ads.`,
    action: "Export this table for your licensing team. Filter by genre or type to focus on specific content strategies.",
  },

  // ── Challenge 6 dashboard > Genre Analysis ──────────────────
  ch6_genre_avod_tvod: {
    title: "AVOD vs TVOD Score by Genre",
    chart: "Grouped bar chart (indigo = AVOD, yellow = TVOD)",
    model: "fct_genre_licensing",
    explanation: `Same as the Ad Revenue dashboard's genre comparison, but using raw AVOD/TVOD scores instead of revenue estimates.

AVOD score = weighted engagement signals (higher weight for free clickouts).
TVOD score = weighted rent + buy clickouts.

Genres sorted by AVOD score descending. The relative height of AVOD vs TVOD bars shows genre monetization preference.`,
    action: "Genres where AVOD bar >> TVOD bar are natural AVOD licensing targets. Balanced or TVOD-heavy genres should go into rent/buy deals.",
  },
  ch6_gap_rate: {
    title: "AVOD Gap Rate by Genre",
    chart: "Horizontal bar chart (red), sorted by gap rate",
    model: "fct_genre_licensing",
    explanation: `<strong>Gap rate</strong> = fraction of titles in each genre that have strong demand but NO current AVOD offer.

A high gap rate means most titles in that genre are underserved — users want free content but it's not available. This identifies which genres have the most licensing white space.

<strong>Example:</strong> If Drama has a 40% gap rate, 40% of drama titles with demand aren't available for free streaming.`,
    action: "High gap rate + high total AVOD score = the most urgent licensing opportunity. Cross-reference with the genre revenue chart.",
  },
  ch6_genre_howto: {
    title: "How to Read This (Genre Analysis Guide)",
    chart: "Text panel",
    model: "fct_genre_licensing",
    explanation: `<strong>AVOD vs TVOD Score:</strong> higher AVOD = good fit for ad-supported licensing (high volume, rewatchable). Higher TVOD = premium/event content better for rent/buy.

<strong>AVOD Gap Rate:</strong> fraction of titles with demand but no free offer. High gap rate = licensing opportunity.

Drama and thriller dominate AVOD demand. High-gap-rate genres are the lowest-hanging fruit for JustWatch's new streaming service.`,
    action: "Use gap rate to prioritize which genres to license first, then use the score charts to pick specific titles within those genres.",
  },

  // ── Metric explainers ──────────────────────────────────────
  est_ad_revenue: {
    title: "Estimated Ad Revenue (USD)",
    chart: "Used across multiple charts",
    model: "mart_title_ad_revenue",
    explanation: `<strong>Formula:</strong> Est. Views x Watch Hours x 6 ads/hr x Adjusted CPM / 1000

- <strong>Est. Views</strong>: weighted engagement signals (clickouts, watchlist adds, page views)
- <strong>Watch Hours</strong>: runtime x episodes (adjusted for credits/intros)
- <strong>6 ads/hr</strong>: industry standard AVOD ad load
- <strong>Adjusted CPM</strong>: base genre CPM modified by audience, brand safety, freshness, AVOD tier

This is a per-title monthly revenue estimate based on observed demand in Dec 2025.`,
    action: "Compare titles on this metric to find the highest-revenue licensing targets. But also check supply gap — expensive titles on many platforms may not be worth it.",
  },
  licensing_score: {
    title: "Licensing Score",
    chart: "mart_title_ad_revenue",
    model: "mart_title_ad_revenue",
    explanation: `<strong>Formula:</strong> Est. Ad Revenue x Supply Gap Score x Quality Score (normalized)

This adjusts raw revenue for acquisition difficulty:
- <strong>Supply Gap Score</strong> (0.1-1.0): fewer current providers = higher score (easier to license)
- <strong>Quality Score</strong>: normalized IMDb rating (higher quality = better content)

Licensing Score is the primary ranking metric — it surfaces titles with high revenue potential that are actually acquirable.`,
    action: "Rank by licensing_score, not raw revenue. A $500K title with gap score 0.8 beats a $700K title with gap score 0.1.",
  },
  avod_tvod_score: {
    title: "AVOD Score & TVOD Score",
    chart: "Used in fct_licensing_priority and fct_genre_licensing",
    model: "fct_licensing_priority",
    explanation: `<strong>AVOD Score</strong> = (page_views x1 + title_clicks x2 + trailer_plays x3 + watchlist_adds x4 + svod_clickouts x3 + avod_clickouts x8) x LN(market_count + 1)

<strong>TVOD Score</strong> = (rent_clickouts x10 + buy_clickouts x15) x LN(market_count + 1)

The cross-market bonus (LN) rewards titles popular in multiple countries — they offer better licensing ROI since one deal can serve multiple markets.

AVOD clickouts carry the highest weight (x8) because they directly signal ad-supported viewing intent.`,
    action: "High AVOD score + low TVOD score = pure AVOD play. High both = versatile title. High TVOD only = rent/buy deal.",
  },
  supply_gap: {
    title: "Supply Gap Score",
    chart: "mart_title_ad_revenue",
    model: "mart_title_ad_revenue",
    explanation: `Measures how underserved a title is by current streaming providers:

- <strong>1.0</strong>: 0 providers (completely unserved)
- <strong>0.8</strong>: 1-2 providers (underserved)
- <strong>0.5</strong>: 3-5 providers (moderately served)
- <strong>0.3</strong>: 6-10 providers (well served)
- <strong>0.1</strong>: 11+ providers (saturated)

Higher score = bigger gap = easier/cheaper to license and more competitive advantage.`,
    action: "Filter for supply_gap >= 0.5 to focus on titles that are genuinely underserved. Saturated titles (0.1) are usually locked in exclusive deals.",
  },
  adjusted_cpm: {
    title: "Adjusted CPM (Cost Per Mille)",
    chart: "mart_title_ad_revenue",
    model: "mart_title_ad_revenue",
    explanation: `What advertisers pay per 1,000 ad impressions, adjusted for content characteristics:

<strong>Base genre CPM:</strong> Drama/Thriller $25 | Comedy/Action $18 | Other $15

<strong>Multipliers:</strong>
- Audience (0.7-1.5): premium iOS/desktop users = 1.5x, price-sensitive Android = 0.7x
- Brand safety (0.3-1.0): safe content = 1.0, risky = 0.3
- Freshness (0.8-1.2): last 2 years = 1.2, older = 0.8
- AVOD tier (AI-classified A/B/C): top tier = higher CPM

A drama with premium audience and high brand safety can command $25 x 1.5 x 1.0 x 1.2 = $45 effective CPM.`,
    action: "Titles with high adjusted CPM but moderate demand may still generate good revenue. Don't just look at volume — CPM quality matters.",
  },
  avod_tvod_ratio: {
    title: "AVOD / TVOD Ratio",
    chart: "fct_genre_licensing and KPI",
    model: "fct_genre_licensing",
    explanation: `<strong>Formula:</strong> total AVOD score / total TVOD score per genre.

- <strong>>1</strong>: genre is more suitable for ad-supported streaming (volume, rewatchable)
- <strong><1</strong>: genre skews toward rent/buy (premium, event-driven)
- <strong>=1</strong>: balanced demand

Animation and Reality typically have the highest ratios (89-92% AVOD intent). Action/Thriller movies tend toward TVOD.`,
    action: "Use this to decide the licensing deal type per genre. High-ratio genres = AVOD deals. Low-ratio = TVOD/rental deals.",
  },
  avod_gap_rate: {
    title: "AVOD Gap Rate",
    chart: "fct_genre_licensing",
    model: "fct_genre_licensing",
    explanation: `Fraction (0-1) of titles in a genre that have measurable AVOD demand but NO current ad-supported offer.

<strong>High gap rate</strong> = most demand in this genre is unserved. Licensing here fills a real market gap.
<strong>Low gap rate</strong> = the genre is already well-covered by free/ad-supported providers.

This is calculated from the is_avod_gap flag in fct_licensing_priority, aggregated per genre.`,
    action: "Sort genres by gap rate to find where the biggest licensing opportunities are. High gap rate + high AVOD score = top priority.",
  },
  revenue_per_user_metric: {
    title: "Revenue Per User",
    chart: "mart_market_opportunity",
    model: "mart_market_opportunity",
    explanation: `<strong>Formula:</strong> total estimated revenue / unique users per market.

This normalizes for market size. Small markets with engaged, high-value users (e.g. FR, US) may show higher revenue per user than Germany despite lower total volume.

It measures <strong>market efficiency</strong> — where each licensing dollar generates the most return relative to audience size.`,
    action: "Prioritize markets with high revenue/user for initial entry. High volume + high per-user = ideal; high per-user alone = niche but profitable.",
  },
  cost_proxy: {
    title: "Cost Proxy & Licensing Priority Score",
    chart: "fct_licensing_priority",
    model: "fct_licensing_priority",
    explanation: `<strong>Cost Proxy</strong> estimates licensing difficulty:
- IMDb score x 10 (higher rated = more expensive)
- Recency bonus: +50 (2024+), +30 (2022-23), +15 (2020-21), +5 (older)
- Show premium: +20 (multi-season deal complexity)

<strong>Licensing Priority Score</strong> = (AVOD score + TVOD score) / cost proxy
Higher = better value for money.

A cheap catalog title (cost proxy ~20) with moderate demand can rank higher than a premium blockbuster (cost proxy ~120) with huge demand.`,
    action: "Sort by priority score to find the best licensing ROI. Low cost proxy + high demand = quick wins for your catalog.",
  },
};

// ── MCP Query Config Builders ─────────────────────────────────
// Builds structured {title, description, queryConfig} for run_metric_query
// queryConfig requires: exploreName, dimensions[], metrics[], sorts[]

function buildMcpQuery(answers) {
  const rootChoice = answers[0]?.label || "";

  if (rootChoice === "Explain Analysis") return null;
  if (rootChoice === "Guide me to Licensing Titles") {
    const guideAnswers = answers.slice(1);
    const guideChoice = guideAnswers[0]?.label || "";
    if (guideChoice.includes("AVOD")) return buildAvodMcpQuery(guideAnswers);
    if (guideChoice.includes("TVOD")) return buildTvodMcpQuery(guideAnswers);
    if (guideChoice.includes("gaps")) return buildGapMcpQuery(guideAnswers);
    if (guideChoice.includes("genres")) return buildGenreMcpQuery(guideAnswers);
    if (guideChoice.includes("Movies or shows")) return buildCompareMcpQuery(guideAnswers);
  }
  return null;
}

function buildAvodMcpQuery(answers) {
  const contentType = answers[1]?.value || "both";
  const priority = answers[2]?.value || "max_viewers";

  const sortField = priority === "best_roi" ? "fct_licensing_priority_avg_avod_roi" : "fct_licensing_priority_total_avod_score";

  return {
    title: `Top AVOD Licensing Targets (${priority.replace(/_/g, " ")})`,
    description: `Top titles for AVOD licensing: ${answers.map(a => a.label).join(" > ")}`,
    queryConfig: {
      exploreName: "fct_licensing_priority",
      dimensions: [
        "fct_licensing_priority_title",
        "fct_licensing_priority_object_type",
        "fct_licensing_priority_has_avod_offer",
      ],
      metrics: [
        "fct_licensing_priority_total_avod_score",
        "fct_licensing_priority_sum_users",
        "fct_licensing_priority_avg_avod_roi",
      ],
      sorts: [{ fieldId: sortField, descending: true }],
    },
  };
}

function buildTvodMcpQuery(answers) {
  return {
    title: "Top TVOD Licensing Targets",
    description: `Top titles for TVOD licensing: ${answers.map(a => a.label).join(" > ")}`,
    queryConfig: {
      exploreName: "fct_licensing_priority",
      dimensions: [
        "fct_licensing_priority_title",
        "fct_licensing_priority_object_type",
        "fct_licensing_priority_release_year",
        "fct_licensing_priority_has_tvod_offer",
      ],
      metrics: [
        "fct_licensing_priority_total_tvod_score",
        "fct_licensing_priority_avg_tvod_roi",
        "fct_licensing_priority_sum_users",
      ],
      sorts: [{ fieldId: "fct_licensing_priority_total_tvod_score", descending: true }],
    },
  };
}

function buildGapMcpQuery(answers) {
  const threshold = answers[3]?.value || "top50";
  const limitMap = { top50: 50, top200: 200, all: 500 };

  return {
    title: "Content Licensing Gaps",
    description: `Titles with high demand but no AVOD offer: ${answers.map(a => a.label).join(" > ")}`,
    queryConfig: {
      exploreName: "fct_underserved_demand",
      dimensions: [
        "fct_underserved_demand_demand_gap_rank",
        "fct_underserved_demand_title",
        "fct_underserved_demand_object_type",
        "fct_underserved_demand_genres",
        "fct_underserved_demand_market_count",
      ],
      metrics: [
        "fct_underserved_demand_total_avod_score",
        "fct_underserved_demand_sum_users",
        "fct_underserved_demand_sum_watchlist_adds",
      ],
      sorts: [{ fieldId: "fct_underserved_demand_demand_gap_rank", descending: false }],
    },
  };
}

function buildGenreMcpQuery(answers) {
  const strategy = answers[1]?.value || "avod";
  const optimize = answers[2]?.value || "volume";

  const sortMap = {
    volume: { avod: "fct_genre_licensing_sum_avod_score", tvod: "fct_genre_licensing_sum_tvod_score", both: "fct_genre_licensing_sum_avod_score" },
    roi: { avod: "fct_genre_licensing_mean_avod_roi", tvod: "fct_genre_licensing_mean_tvod_roi", both: "fct_genre_licensing_mean_avod_roi" },
    gaps: { avod: "fct_genre_licensing_mean_avod_gap_rate", tvod: "fct_genre_licensing_mean_avod_gap_rate", both: "fct_genre_licensing_mean_avod_gap_rate" },
  };

  return {
    title: `Genre Licensing Strategy (${strategy.toUpperCase()}, ${optimize})`,
    description: `Genre analysis: ${answers.map(a => a.label).join(" > ")}`,
    queryConfig: {
      exploreName: "fct_genre_licensing",
      dimensions: [
        "fct_genre_licensing_genre",
        "fct_genre_licensing_object_type",
      ],
      metrics: [
        "fct_genre_licensing_sum_titles",
        "fct_genre_licensing_sum_avod_score",
        "fct_genre_licensing_sum_tvod_score",
        "fct_genre_licensing_mean_avod_roi",
        "fct_genre_licensing_mean_tvod_roi",
        "fct_genre_licensing_mean_avod_gap_rate",
        "fct_genre_licensing_mean_avod_tvod_ratio",
      ],
      sorts: [{ fieldId: sortMap[optimize][strategy], descending: true }],
    },
  };
}

function buildCompareMcpQuery(answers) {
  const strategy = answers[1]?.value || "overall";

  const metricField = strategy === "avod" ? "fct_licensing_priority_total_avod_score"
    : strategy === "tvod" ? "fct_licensing_priority_total_tvod_score"
    : "fct_licensing_priority_avg_priority_score";

  return {
    title: `Movies vs Shows Comparison (${strategy.toUpperCase()})`,
    description: `Comparing movies vs shows: ${answers.map(a => a.label).join(" > ")}`,
    queryConfig: {
      exploreName: "fct_licensing_priority",
      dimensions: [
        "fct_licensing_priority_object_type",
      ],
      metrics: [
        "fct_licensing_priority_total_avod_score",
        "fct_licensing_priority_total_tvod_score",
        "fct_licensing_priority_avg_priority_score",
        "fct_licensing_priority_sum_users",
        "fct_licensing_priority_avg_avod_roi",
        "fct_licensing_priority_avg_tvod_roi",
      ],
      sorts: [{ fieldId: metricField, descending: true }],
    },
  };
}

// Returns an explanation object {title, chart, model, explanation, action} or null
function getExplanation(answers) {
  // Last answer's value is the explanation key
  const lastValue = answers[answers.length - 1]?.value;
  return EXPLANATIONS[lastValue] || null;
}

function buildAvodPrompt(answers) {
  const contentType = answers[1]?.value || "both";
  const priority = answers[2]?.value || "max_viewers";
  const genre = answers[3]?.value || "any";
  const budget = answers[4]?.value || "all";

  const typeFilter = contentType === "both" ? "" : `Only show ${contentType}.`;
  const genreFilter = genre === "any" ? "" : `Filter to the ${answers[3]?.label} genre.`;

  const budgetMap = {
    low: "Focus on titles with cost proxy below 50 (older or niche content that's cheap to license).",
    mid: "Focus on titles with cost proxy between 50 and 80.",
    premium: "Focus on titles with cost proxy above 80 (new, high-rated premium content).",
    all: "",
  };

  const priorityMap = {
    max_viewers: `Using the fct_licensing_priority table, show me the top 30 titles ranked by avod_score (highest AVOD demand). ${typeFilter} ${genreFilter} ${budgetMap[budget]}
Include columns: title, object_type, avod_score, total_users, has_avod_offer, provider_count.
Create a bar chart of the top 15 titles by avod_score.`,

    best_roi: `Using the fct_licensing_priority table, show me the top 30 titles ranked by avod_roi (best AVOD return on licensing cost). ${typeFilter} ${genreFilter} ${budgetMap[budget]}
Include columns: title, object_type, avod_score, cost_proxy, avod_roi, has_avod_offer.
Create a scatter plot with cost_proxy on X-axis and avod_score on Y-axis, sized by total_users.`,

    fill_gaps: `Using the fct_licensing_priority table, show me titles where is_avod_gap is true (high demand but no current AVOD offer), ranked by avod_score descending. ${typeFilter} ${genreFilter} ${budgetMap[budget]}
Show top 30 results with columns: title, object_type, avod_score, cost_proxy, avod_roi, provider_count.
Create a bar chart of the top 15 gap titles by avod_score. These are prime licensing targets.`,
  };

  return priorityMap[priority];
}

function buildTvodPrompt(answers) {
  const contentType = answers[1]?.value || "both";
  const pricing = answers[2]?.value || "both";
  const recency = answers[3]?.value || "all";
  const genre = answers[4]?.value || "any";

  const typeFilter = contentType === "both" ? "" : `Only ${contentType}.`;
  const genreFilter = genre === "any" ? "" : `Filter to ${answers[4]?.label} genre.`;

  const recencyMap = {
    new: "Only titles from 2024 or later.",
    catalog: "Only titles from 2020 to 2023.",
    library: "Only titles before 2020.",
    all: "",
  };

  const pricingMap = {
    rent: "rank by rent_clickouts descending",
    buy: "rank by buy_clickouts descending",
    both: "rank by tvod_score descending",
  };

  return `Using the fct_licensing_priority table, show me the top 30 titles ${pricingMap[pricing]}. ${typeFilter} ${genreFilter} ${recencyMap[recency]}
Include columns: title, object_type, release_year, rent_clickouts, buy_clickouts, tvod_score, tvod_roi, cost_proxy.
Create a bar chart of the top 15 titles by tvod_score. Highlight which ones don't have a current TVOD offer (has_tvod_offer = false).`;
}

function buildGapPrompt(answers) {
  const gapType = answers[1]?.value || "no_avod";
  const contentType = answers[2]?.value || "both";
  const threshold = answers[3]?.value || "top50";

  const typeFilter = contentType === "both" ? "" : `Only ${contentType}.`;
  const limitMap = { top50: 50, top200: 200, all: 500 };

  const gapFilterMap = {
    no_avod: "has_avod_offer is false",
    no_svod: "has_svod_offer is false",
    no_streaming: "has_avod_offer is false AND has_svod_offer is false AND has_tvod_offer is false",
  };

  const gapDescMap = {
    no_avod: "no current AVOD (free/ad-supported) offer",
    no_svod: "no current SVOD (subscription) offer",
    no_streaming: "no streaming offer of any kind",
  };

  return `Using the fct_licensing_priority table, find titles where ${gapFilterMap[gapType]}, ranked by avod_score descending. ${typeFilter}
These are titles with high user demand but ${gapDescMap[gapType]} -- prime licensing targets.
Show the top ${limitMap[threshold]} results with columns: title, object_type, release_year, avod_score, tvod_score, total_users, provider_count, licensing_priority_score.
Create a bar chart of the top 20 by avod_score. Also show a breakdown by object_type (how many movies vs shows in the gap).`;
}

function buildGenrePrompt(answers) {
  const strategy = answers[1]?.value || "avod";
  const optimize = answers[2]?.value || "volume";
  const contentType = answers[3]?.value || "both";

  const typeFilter = contentType === "both" ? "" : `Filter to ${contentType} only.`;

  const metricMap = {
    volume: {
      avod: "total_avod_score descending (highest total AVOD revenue potential)",
      tvod: "total_tvod_score descending (highest total TVOD revenue potential)",
      both: "total_avod_score + total_tvod_score descending",
    },
    roi: {
      avod: "avg_avod_roi descending (best average AVOD return per title)",
      tvod: "avg_tvod_roi descending (best average TVOD return per title)",
      both: "avg_avod_roi + avg_tvod_roi descending",
    },
    gaps: {
      avod: "avod_gap_rate descending (highest fraction of unserved demand)",
      tvod: "avod_gap_rate descending",
      both: "avod_gap_rate descending",
    },
  };

  return `Using the fct_genre_licensing table, show all genres ranked by ${metricMap[optimize][strategy]}. ${typeFilter}
Include columns: genre, object_type, title_count, total_users, total_avod_score, total_tvod_score, avg_avod_roi, avg_tvod_roi, avod_gap_rate, avod_tvod_ratio.
Create a horizontal bar chart comparing genres. Also show which genres have the highest avod_tvod_ratio (>1 means better for AVOD, <1 means better for TVOD).
Highlight the top 3 genres to invest in based on the ranking.`;
}

function buildComparePrompt(answers) {
  const strategy = answers[1]?.value || "overall";
  const metric = answers[2]?.value || "volume";
  const budget = answers[3]?.value || "all";

  const budgetFilter = {
    low: "Only titles with cost_proxy below 50.",
    mid: "Only titles with cost_proxy between 50 and 80.",
    premium: "Only titles with cost_proxy above 80.",
    all: "",
  };

  const metricDescMap = {
    volume: "total number of titles and total score",
    per_title: "average score per title (avg_avod_score, avg_tvod_score, avg_licensing_priority_score)",
    audience: "total unique users reached",
    gaps: "number and percentage of titles that are AVOD gaps (is_avod_gap = true)",
  };

  const strategyMetric = {
    avod: "avod_score and avod_roi",
    tvod: "tvod_score and tvod_roi",
    overall: "licensing_priority_score",
  };

  return `Using the fct_licensing_priority table, compare movies vs shows side by side. ${budgetFilter[budget]}
For each type (movie vs show), compute: count of titles, ${metricDescMap[metric]}, focusing on ${strategyMetric[strategy]}.
Create a grouped bar chart comparing movies vs shows on the key metrics.
Also show a table with the top 10 movies and top 10 shows by ${strategyMetric[strategy]}.
Which type offers the better licensing opportunity and why?`;
}
