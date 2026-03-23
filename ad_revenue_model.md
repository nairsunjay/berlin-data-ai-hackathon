# Ad Revenue Licensing Model — dbt Data Architecture

## Challenge 6: JustWatch as a Streaming Provider — Content Licensing Intelligence

Goal: Estimate potential ad revenue per title to prioritize content licensing for JustWatch's AVOD/TVOD offering.

---

## Revenue Formula

```
Title Ad Revenue = Estimated Views x Watch Hours x Ad Load x CPM / 1000
```

Where each component is derived from a different data layer:

| Component | What it measures | Source |
|-----------|-----------------|--------|
| Estimated Views | How many people would watch this title | Event signals (clickouts, watchlists, page views) |
| Watch Hours | How long is the content | OBJECTS metadata (runtime, episodes) |
| Ad Load | How many ads per hour | Industry constant (~6 ads/hr for AVOD) |
| CPM | What is each ad impression worth | f(genre, audience segment, device, brand safety) |

---

## Data Flow: Source to Revenue Estimate

```
                         RAW SOURCES (DB_JW_SHARED.CHALLENGE)
                    ┌──────────────────────────────────────────┐
                    │                                          │
               T1/T2/T3/T4          OBJECTS            PACKAGES
               (Events)          (Content Meta)      (Providers)
               9M-254M rows         13M rows          1.5K rows
                    │                   │                  │
                    └─────────┬─────────┘                  │
                              │                            │
════════════════════════════════════════════════════════════════════
                         STAGING LAYER (stg_)
                    Clean, rename, type-cast, deduplicate
════════════════════════════════════════════════════════════════════
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
   stg_events           stg_objects          stg_packages
   - Dedupe by rid      - Filter movies/     - Clean provider
   - Extract cc_*         shows only           names
     JSON fields        - Valid runtime      - Parse monetization
   - Classify event     - Cast types           types
     types              │                    │
   - Cast types         │                    │
         │              │                    │
         │         ┌────┴─────┐              │
         │         │          │              │
         │    stg_objects   stg_objects       │
         │    _genres      _ai_enriched      │
         │    (FLATTEN     (Cortex LLM)      │
         │     genres)     - avod_tier        │
         │         │       - audience_seg     │
         │         │       - brand_safety     │
         │         │       - sentiment        │
         │         └────┬─────┘              │
         │              │                    │
════════════════════════════════════════════════════════════════════
                     INTERMEDIATE LAYER (int_)
                Aggregate, join, compute business logic
════════════════════════════════════════════════════════════════════
         │              │                    │
         │              │                    │
    ┌────┴────┐         │              ┌─────┴──────┐
    │         │         │              │            │
int_title   int_user    │         int_title    int_provider
_demand     _profiles   │         _content     _landscape
    │         │         │              │            │
    │   Per-user:  Per-title:    Per-title:    Per-provider:
    │   - device   - watch_hrs   - genre CPM   - clickout
    │   - platform - adjusted    - AI tier       share
    │   - geo        runtime     - sentiment   - title count
    │   - clickout - episodes    - brand       - monetization
    │     behavior - freshness     safety        mix
    │   - genre    - quality     - audience    - market
    │     prefs      score        segment       coverage
    │         │         │              │            │
    │         │         │              │            │
    ├─────────┴─────────┴──────────────┘            │
    │                                               │
    │  ┌────────────────────────────────────────┐   │
    │  │          int_title_demand               │   │
    │  │  Per title x market:                   │   │
    │  │  - page_views                          │   │
    │  │  - title_clicks                        │   │
    │  │  - watchlist_adds                      │   │
    │  │  - avod_clickouts (free + ads)         │   │
    │  │  - tvod_clickouts (rent + buy)         │   │
    │  │  - trailer_plays                       │   │
    │  │  - unique_users                        │   │
    │  │  - unique_sessions                     │   │
    │  │  - avg_session_depth                   │   │
    │  └────────────────────────────────────────┘   │
    │                                               │
    │  ┌────────────────────────────────────────┐   │
    │  │         int_title_supply                │   │
    │  │  Per title x market:                   │   │
    │  │  - current_provider_count              │   │
    │  │  - avod_providers (free/ads)           │   │
    │  │  - svod_providers (flatrate)           │   │
    │  │  - tvod_providers (rent/buy)           │   │
    │  │  - provider_names (array)              │   │
    │  │  - supply_gap_score                    │◄──┘
    │  └────────────────────────────────────────┘
    │
════════════════════════════════════════════════════════════════════
                        MART LAYER (mart_)
                 Final business-facing models & metrics
════════════════════════════════════════════════════════════════════
    │
    │   ┌───────────────────────────────────────────────────┐
    │   │                                                   │
    ▼   ▼                                                   │
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ mart_title       │  │ mart_genre       │  │ mart_market      │
│ _ad_revenue      │  │ _performance     │  │ _opportunity     │
│                  │  │                  │  │                  │
│ Per title:       │  │ Per genre:       │  │ Per market:      │
│ - title          │  │ - genre          │  │ - country        │
│ - object_type    │  │ - total_titles   │  │ - total_users    │
│ - genres         │  │ - avg_demand     │  │ - avod_demand    │
│ - imdb_score     │  │ - avg_cpm        │  │ - tvod_demand    │
│ - watch_hours    │  │ - total_revenue  │  │ - top_genres     │
│ - est_views      │  │ - avod_share     │  │ - total_revenue  │
│ - cpm            │  │ - tvod_share     │  │ - revenue_per    │
│ - est_ad_revenue │  │ - top_titles     │  │   _user          │
│ - supply_gap     │  │ - brand_safety   │  │ - supply_gaps    │
│ - ai_tier        │  │   _distribution  │  │ - provider       │
│ - licensing_rank │  │                  │  │   _landscape     │
│                  │  │                  │  │                  │
└────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
         │                     │                      │
         └─────────────────────┼──────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Lightdash          │
                    │   Metric Layer       │
                    │                      │
                    │   Dimensions:        │
                    │   - title            │
                    │   - genre            │
                    │   - market           │
                    │   - object_type      │
                    │   - ai_tier          │
                    │   - provider         │
                    │                      │
                    │   Metrics:           │
                    │   - est_ad_revenue   │
                    │   - est_views        │
                    │   - cpm              │
                    │   - supply_gap_score │
                    │   - licensing_rank   │
                    │   - watch_hours      │
                    └──────────────────────┘
```

---

## Layer Details

### STAGING: Clean & Extract

#### stg_events

Reads from T1 (prototype) → swap to T2/T3/T4 when scaling.

```sql
-- Core transformations:
-- 1. Deduplicate by rid
QUALIFY ROW_NUMBER() OVER (PARTITION BY rid ORDER BY collector_tstamp) = 1

-- 2. Extract JSON context into typed columns
cc_title:jwEntityId::TEXT           AS title_id
cc_title:objectType::TEXT           AS content_type
cc_page_type:pageType::TEXT         AS page_type
cc_page_type:appLocale::TEXT        AS app_locale
cc_clickout:providerId::NUMBER      AS provider_id
cc_clickout:monetizationType::TEXT  AS monetization_type
cc_yauaa:deviceClass::TEXT          AS device_class
cc_search:searchEntry::TEXT         AS search_query

-- 3. Classify event into business categories
CASE
    WHEN se_category = 'clickout' AND se_action IN ('free','ads')   THEN 'avod_clickout'
    WHEN se_category = 'clickout' AND se_action IN ('rent','buy')   THEN 'tvod_clickout'
    WHEN se_category = 'clickout' AND se_action = 'flatrate'        THEN 'svod_clickout'
    WHEN se_category = 'clickout'                                   THEN 'other_clickout'
    WHEN se_category = 'watchlist_add'                               THEN 'watchlist_add'
    WHEN se_category = 'seenlist_add'                                THEN 'seenlist_add'
    WHEN se_category = 'likelist_add'                                THEN 'like'
    WHEN se_category = 'dislikelist_add'                             THEN 'dislike'
    WHEN se_category = 'userinteraction' AND se_action = 'title_clicked' THEN 'title_click'
    WHEN se_category = 'youtube_started'                             THEN 'trailer_play'
    WHEN event = 'page_view'                                         THEN 'page_view'
    ELSE 'other'
END AS event_type
```

#### stg_objects

```sql
-- Filter to movies and shows only (episodes/seasons linked via title_id)
-- Clean runtime outliers
-- Compute adjusted runtime (subtract credits/intros)
WHERE object_type IN ('movie', 'show')
  AND runtime > 0
  AND runtime < 100000
```

#### stg_objects_ai_enriched (Cortex AI)

```sql
-- Run Snowflake Cortex on title descriptions for:
-- 1. AVOD tier classification (A/B/C)
-- 2. Audience segment (families, young_adults, mainstream, niche, premium)
-- 3. Brand safety rating (safe/moderate/risky)
-- 4. Sentiment score

SNOWFLAKE.CORTEX.COMPLETE('llama3.1-8b', prompt)  -- classification
SNOWFLAKE.CORTEX.SENTIMENT(short_description)      -- sentiment
SNOWFLAKE.CORTEX.EMBED_TEXT_768('e5-base-v2', ...)  -- for clustering (optional)
```

**Important**: This is expensive. Materialize as a table and run once per batch.

#### stg_objects_genres (FLATTEN)

```sql
-- Explode genre array into one row per title x genre
SELECT object_id, g.value::TEXT AS genre
FROM objects, LATERAL FLATTEN(input => genre_tmdb) g
```

---

### INTERMEDIATE: Business Logic

#### int_title_demand

The core demand aggregation. One row per title_id (x market for T2+).

| Signal | Weight | Rationale |
|--------|--------|-----------|
| avod_clickout | 1.0 | Direct AVOD intent — user clicked to watch free/ad-supported |
| tvod_clickout | 0.8 | Transactional intent — shows premium willingness |
| watchlist_add | 0.5 | Future viewing intent |
| trailer_play | 0.3 | Active interest, not yet commitment |
| title_click | 0.1 | Browsing interest |
| page_view (with title) | 0.05 | Passive exposure |

```sql
estimated_views = avod_clickouts * 1.0
               + tvod_clickouts * 0.8
               + watchlist_adds * 0.5
               + trailer_plays * 0.3
               + title_clicks * 0.1
               + page_views * 0.05
```

#### int_title_content

Enriches title metadata with revenue-relevant attributes:

| Attribute | Source | Revenue Impact |
|-----------|--------|----------------|
| watch_hours | OBJECTS.runtime (adjusted) | More hours = more ad slots per viewer |
| freshness | DATEDIFF from release_date | New content commands higher CPM |
| quality_score | imdb_score | Higher rated = premium advertiser appeal |
| genre_cpm_tier | Genre lookup | Drama/thriller = $25, comedy/action = $18, other = $15 |
| ai_avod_tier | Cortex classification | A/B/C tier from AI analysis |
| audience_segment | Cortex classification | families/young_adults/mainstream/niche/premium |
| brand_safety | Cortex classification | safe/moderate/risky affects CPM |
| sentiment | Cortex sentiment | Positive sentiment = higher brand safety |

#### int_title_supply

How many providers currently carry this title:

```sql
supply_gap_score = CASE
    WHEN current_providers = 0 THEN 1.0    -- completely unserved
    WHEN current_providers <= 2 THEN 0.8   -- underserved
    WHEN current_providers <= 5 THEN 0.5   -- moderately served
    WHEN current_providers <= 10 THEN 0.3  -- well served
    ELSE 0.1                                -- saturated
END
```

Titles with fewer providers are easier/cheaper to license and fill a gap.

#### int_user_profiles

Behavioral segments for CPM estimation:

| Segment | Definition | CPM Multiplier |
|---------|-----------|----------------|
| Premium | iOS + Desktop + TVOD clickouts | 1.5x |
| Mainstream | Web + mixed clickouts | 1.0x |
| Price-sensitive | Android + free-only clickouts | 0.7x |
| Power browsers | 10+ titles/session | 1.2x (more ad inventory) |

#### int_provider_landscape

Current competitive landscape per market:

- Which providers dominate (Amazon Prime: 250K clickouts, Plex: 61K, Apple TV Store: 49K, JustWatch TV: 42K)
- AVOD competitors: Plex, Joyn, Pluto TV, ARD, ZDF, Crunchyroll
- Where JustWatch TV already has traction (42K clickouts on just 1,015 titles)

---

### MART: Business-Facing Models

#### mart_title_ad_revenue (PRIMARY OUTPUT)

The licensing decision table. One row per title.

```sql
est_ad_revenue_usd =
    estimated_views
    * watch_hours
    * ads_per_hour          -- 6 (industry standard AVOD)
    * adjusted_cpm          -- base_cpm * audience_multiplier * brand_safety_mult * freshness_mult
    / 1000

licensing_score =
    est_ad_revenue_usd
    * supply_gap_score      -- prioritize underserved titles
    * quality_score_norm    -- prefer higher rated content

licensing_rank = ROW_NUMBER() OVER (ORDER BY licensing_score DESC)
```

**CPM Adjustment Formula:**

```
adjusted_cpm = base_genre_cpm
             * audience_multiplier      -- 0.7 to 1.5 based on user segment mix
             * brand_safety_multiplier  -- 1.0 (safe), 0.7 (moderate), 0.3 (risky)
             * freshness_multiplier     -- 1.2 (last 2 years), 1.0 (3-10 years), 0.8 (older)
```

#### mart_genre_performance

Aggregate view for genre-level licensing strategy:

- Which genres have highest AVOD revenue potential
- Genre CPM comparison
- AVOD vs TVOD split by genre (romance: 9.5% clickout rate, documentation: 10.0%)
- Brand safety distribution by genre

#### mart_market_opportunity (T2+ only)

Per-market licensing ROI:

- Market size (unique users)
- AVOD demand intensity
- Supply gaps per market
- Revenue per user potential
- Entry priority ranking

---

## Key Data Findings (from T1 exploration)

### Audience Scale
- 1.58M unique users, 2.53M sessions in Germany alone (Dec 2025)
- 269K users clicked on AVOD content (17% of all users)
- 79K users clicked on TVOD content (5% of all users)
- Only 4.5% of users are logged in — most analysis is anonymous

### Engagement Patterns
- Web users have 12% clickout rate vs 2.3% for mobile app users
- SHOW_SEASON pages have highest clickout rate: 19.3% (ready to watch)
- 80% of sessions browse only 1 title (quick, intent-driven)
- Sessions with 10+ titles have 1.18 avg clickouts but lower rate (2.3%)

### Content Landscape
- 93K movies and 31K shows have events in T1
- Long-running shows dominate revenue (One Piece: $142K, Conan: $39K)
- Only 27% of movies and 26% of shows have IMDB scores
- Cortex AI can classify the rest using descriptions (68% of movies have descriptions)

### Provider Landscape
- Amazon Prime dominates: 251K clickouts (198K free + 52K flatrate)
- JustWatch TV already has 42K clickouts on just 1,015 titles
- AVOD competitors: Plex (61K), Crunchyroll (18K), Joyn (12K)
- TVOD market: Apple TV Store (49K), Amazon Video (33K)

### Genre Intelligence
- Romance has highest clickout rate (9.5%) — high monetization efficiency
- Documentation has highest AVOD potential (10.0% clickout rate)
- Drama is largest by volume (5.5M events) but moderate clickout rate (7.9%)
- Reality TV: small but highest clickout rate (10.1%) — efficient for AVOD

---

## dbt Project Structure

```
models/
├── staging/
│   ├── stg_events.sql                  -- Dedupe, extract JSON, classify events
│   ├── stg_objects.sql                 -- Clean title metadata, compute watch_hours
│   ├── stg_objects_genres.sql          -- Flatten genre arrays
│   ├── stg_objects_ai_enriched.sql     -- Cortex AI classification (materialize as table)
│   └── stg_packages.sql               -- Clean provider data
│
├── intermediate/
│   ├── int_title_demand.sql            -- Aggregate demand signals per title
│   ├── int_title_content.sql           -- Title metadata + AI enrichment + genre CPM
│   ├── int_title_supply.sql            -- Provider count + supply gap score
│   ├── int_user_profiles.sql           -- User behavioral segments for CPM
│   └── int_provider_landscape.sql      -- Provider competitive analysis
│
├── marts/
│   ├── mart_title_ad_revenue.sql       -- PRIMARY: per-title revenue estimate
│   ├── mart_genre_performance.sql      -- Genre-level strategy view
│   └── mart_market_opportunity.sql     -- Per-market opportunity (T2+)
│
└── schema.yml                          -- Descriptions + Lightdash metrics
```

### Materialization Strategy

| Layer | Materialization | Why |
|-------|----------------|-----|
| staging | view | Lightweight, always fresh |
| stg_objects_ai_enriched | table | Cortex calls are expensive, cache results |
| intermediate | view | Composable, avoid storage cost |
| marts | table | Fast dashboard queries, stable for Lightdash |

---

## Scaling Path

```
Phase 1: T1 (Germany, Dec 2025)        ──► Validate model logic, tune weights
Phase 2: T2 (8 EU markets, Dec 2025)   ──► Add market dimension, cross-market analysis
Phase 3: T3 (8 EU, 3 months)           ──► Add time dimension, trend/seasonality
Phase 4: T4 (15 global markets)         ──► Full global licensing strategy
```

To scale: change `stg_events` source from T1 to T2/T3/T4. All downstream models auto-update.

---

## Lightdash Metric Layer

Mart models expose these metrics for dashboards:

| Metric | Type | Definition |
|--------|------|------------|
| est_ad_revenue | sum | Estimated monthly ad revenue per title |
| est_views | sum | Weighted demand signal score |
| watch_hours | sum | Total watchable content hours |
| cpm | average | Adjusted CPM (genre + audience + safety) |
| supply_gap_score | average | 0-1 score, higher = more opportunity |
| licensing_rank | min | Priority rank (1 = best licensing target) |
| unique_users | sum | Distinct users showing interest |
| avod_clickouts | sum | Direct AVOD intent signals |
| tvod_clickouts | sum | Direct TVOD intent signals |
| clickout_rate | derived | clickouts / total events |

Slice by: title, genre, market (T2+), object_type (movie/show), ai_tier, provider, device_class
