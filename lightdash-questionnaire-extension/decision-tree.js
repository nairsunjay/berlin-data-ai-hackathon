// Decision tree for content licensing questionnaire
// Each node has: question, options (label + next node or prompt builder)

const DECISION_TREE = {
  root: {
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

  if (rootChoice.includes("AVOD")) return buildAvodPrompt(answers);
  if (rootChoice.includes("TVOD")) return buildTvodPrompt(answers);
  if (rootChoice.includes("gaps")) return buildGapPrompt(answers);
  if (rootChoice.includes("genres")) return buildGenrePrompt(answers);
  if (rootChoice.includes("Movies or shows")) return buildComparePrompt(answers);
  return "Show me the top 20 titles by licensing priority score.";
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
