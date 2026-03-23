# JustWatch Licensing Advisor — Demo Story

> **Challenge 6 | Berlin Data & AI Hackathon | March 2026**
> Built on JustWatch behavioral data (T2, 8 EU markets, Dec 2025) · Snowflake · dbt · Cortex AI · Lightdash

---

## The Setup

JustWatch is launching its own streaming service — **JustWatch TV** — with an AVOD model (free, ad-supported). The business question is deceptively simple:

> *"Which titles should we license first, and in which markets?"*

But the answer is complex. You can't just license the most popular titles — they're already on Netflix, Amazon, and Disney+, which means high acquisition cost and low differentiation. You need titles that users **want to watch**, that **don't have enough supply**, and where **advertising revenue will cover the licensing cost**.

JustWatch has a unique asset no other player has: **behavioral data from 45M+ users across 100+ markets** — every click, watchlist add, and trailer play. This project turns that raw behavioral signal into a **licensing recommendation engine**.

---

## Act 1: Understanding Demand

We start with **40 million events** from 8 EU markets in December 2025. Every time a user clicks on a title, adds it to their watchlist, or plays a trailer — that's a demand signal. We aggregate these into a weighted engagement score per title per market:

| Signal | Weight | Rationale |
|--------|--------|-----------|
| AVOD clickout | 1.0× | Strongest intent — they want to watch for free |
| TVOD clickout | 0.8× | Willing to pay, but would prefer free |
| Watchlist add | 0.5× | Intent without immediacy |
| Trailer play | 0.3× | Interest, not commitment |
| Title click | 0.1× | Awareness |

This gives us **234,854 scored titles** across 8 markets.

---

## Act 2: Pricing the Inventory

Raw demand tells us what people want. But to make a licensing decision, we need to estimate **how much ad revenue a title will generate** if we acquire it.

### The Revenue Formula

```
Est. Ad Revenue = Estimated Views × Watch Hours × 6 ads/hr × Adjusted CPM / 1000
```

The **Adjusted CPM** is not one number — it varies by four multipliers stacked on top of a genre base rate:

| Factor | Signal | Multiplier Range |
|--------|--------|-----------------|
| Genre | Drama/Thriller → $25 base CPM · Animation → $14 | $14–$25 base |
| Audience segment | Premium desktop (TVOD clickers) vs mobile-only | 0.7× – 1.5× |
| Brand safety | Advertiser-safe vs mature/risky content | 0.3× – 1.0× |
| Freshness | New release vs library content | 0.8× – 1.2× |
| AVOD tier | Mainstream hit vs niche/aging title | 0.7× – 1.3× |

### Cortex AI Enrichment

The AVOD tier, audience type, and brand safety classifications come from **Snowflake Cortex AI** (`llama3.1-8b`). We ran it against the 10,000 most-engaged titles — classifying each from its title and description alone.

**9,916 titles classified in 89 seconds. No data left Snowflake.**

- **Tier A** (mainstream, broad appeal) → 1.3× CPM multiplier
- **Tier B** (solid, specific audience) → 1.0× (baseline)
- **Tier C** (niche or aging) → 0.7× CPM multiplier

---

## Act 3: Finding the Opportunity

Not all revenue potential is equal. A title generating $500K in estimated ad revenue on Netflix is not the same opportunity as one generating $500K with **no current AVOD provider**.

### The Supply Gap Score

Derived from actual clickout events to providers — if users clicked through to a service, that service carries the title.

| Providers Carrying Title | Gap Score | What It Means |
|--------------------------|-----------|---------------|
| 0 | 1.0 | Nobody has it — cheapest to license |
| 1–2 | 0.8 | Thin coverage — low competition |
| 3–5 | 0.5 | Moderate — negotiate carefully |
| 6–10 | 0.3 | Well covered — premium cost |
| 10+ | 0.1 | Saturated — avoid |

### The Licensing Score

All three signals combined into a single ranking metric:

```
Licensing Score = Est. Ad Revenue × Supply Gap Score × Quality Score
```

A title with $500K revenue potential and 1 provider (gap score 0.8) **beats** a $700K title available on 12 platforms (gap score 0.1) on licensing ROI.

---

## Act 4: The Recommendations

### By Market

| Rank | Market | Est. Ad Revenue | Revenue / User | Verdict |
|------|--------|----------------|----------------|---------|
| 1 | 🇪🇸 Spain | $2.08M | $0.65 | Highest volume |
| 2 | 🇫🇷 France | $1.70M | $0.83 | Most efficient |
| 3 | 🇩🇪 Germany | $1.68M | $0.50 | Strong base |
| 4 | 🇮🇹 Italy | $1.47M | $0.63 | Growing market |
| 5 | 🇬🇧 UK | $1.39M | $0.44 | Competitive |

**Spain** for launch volume. **France** for per-user ROI.

### By Title

| Rank | Title | Est. Ad Revenue | Gap Score | Why It Ranks Here |
|------|-------|----------------|-----------|-------------------|
| 1 | Stranger Things | $261K | 0.3 | Massive demand, not overexposed |
| 2 | La Isla de las Tentaciones | $350K | 0.3 | High Spanish demand, thin AVOD coverage |
| 3 | One Piece | $671K | 0.1 | Highest raw revenue — but already on too many platforms |
| 4 | Meitantei Conan | $164K | 0.3 | Strong EU anime audience, supply gap |
| 5 | Masterchef Italia | $101K | 0.3 | Reality + Italian market + AVOD intent 92% |

> One Piece has the highest raw ad revenue ($671K) but a gap score of 0.1 — already saturated across providers. Licensing cost would be prohibitive. Stranger Things ranks higher on ROI despite lower revenue.

### By Genre

| Genre | Est. Ad Revenue | Avg CPM | AVOD Intent | Verdict |
|-------|----------------|---------|-------------|---------|
| Drama (shows) | $7.1M | $17.69 | 85% | **Priority AVOD category** |
| Action (shows) | $3.6M | $15.47 | 86% | Strong secondary |
| Comedy (shows) | $3.5M | $14.84 | 86% | Broad appeal |
| Thriller (shows) | $2.9M | $17.96 | 83% | Highest CPM relative to volume |
| Crime (shows) | $2.6M | $18.01 | 82% | Premium advertiser segment |
| Animation | $1.9M | $14.03 | **92%** | Near-universal AVOD preference |
| Reality | $1.5M | $14.95 | **92%** | Near-universal AVOD preference |

**Drama and Crime/Thriller** are the anchor categories — high CPM, high demand, strong advertiser value.

**Animation and Reality** show the highest AVOD intent (89–92%) — audiences strongly prefer free for these genres, making them ideal first acquisitions for JustWatch TV.

---

## The Punchline

> JustWatch already knows what 45 million people want to watch next week. This pipeline turns that knowledge into a ranked acquisition list — with estimated revenue, market priority, and competitive exposure — before the licensing negotiation even starts.

**Instead of guessing which titles to bid on, JustWatch TV walks into every licensing conversation knowing exactly what a title is worth to them.**

---

## Technical Architecture

```
DB_JW_SHARED.CHALLENGE.T2          DB_JW_SHARED.CHALLENGE.OBJECTS
  40M events · 8 EU markets            ~13M titles · metadata
         │                                      │
         ▼                                      ▼
  ┌─────────────────────────────────────────────────────┐
  │                  dbt Staging (views)                │
  │  stg_events · stg_objects · stg_objects_genres      │
  │  stg_packages · stg_objects_ai_enriched (table)     │
  │                        │                            │
  │              Cortex AI (llama3.1-8b)                │
  │         9,916 titles classified in 89s              │
  └─────────────────────────────────────────────────────┘
         │
         ▼
  ┌─────────────────────────────────────────────────────┐
  │              dbt Intermediate (views)               │
  │  int_title_demand    — weighted engagement scores   │
  │  int_title_content   — CPM multipliers + metadata   │
  │  int_title_supply    — provider counts + gap score  │
  │  int_user_profiles   — audience segments            │
  │  int_provider_landscape — competitive analysis      │
  └─────────────────────────────────────────────────────┘
         │
         ▼
  ┌─────────────────────────────────────────────────────┐
  │                  dbt Marts (tables)                 │
  │  mart_title_ad_revenue    — 234,854 titles ranked   │
  │  mart_genre_performance   — 38 genre × type rows    │
  │  mart_market_opportunity  — 8 markets ranked        │
  └─────────────────────────────────────────────────────┘
         │
         ▼
  ┌─────────────────────────────────────────────────────┐
  │              Lightdash Semantic Layer               │
  │  13 charts · 2 dashboards                          │
  │  hackathon.lightdash.cloud (Team 7 project)         │
  └─────────────────────────────────────────────────────┘
```

### Stack

| Layer | Technology | Role |
|-------|-----------|------|
| Data warehouse | Snowflake (`DB_TEAM_7`) | Storage + compute |
| AI enrichment | Snowflake Cortex (`llama3.1-8b`) | Title classification |
| Transformation | dbt 1.11 | Staging → Intermediate → Marts |
| BI / dashboards | Lightdash Cloud | Semantic layer + visualisation |
| Raw data | JustWatch T2 (40M events) | Behavioral signal source |
