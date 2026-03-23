-- Mart: Title-level ad revenue estimates — PRIMARY LICENSING OUTPUT
-- One row per title. Applies the full revenue formula:
--
--   Est. Ad Revenue = estimated_views × watch_hours × 6 ads/hr × adjusted_CPM / 1000
--
-- adjusted_CPM = base_genre_cpm × audience_mult × brand_safety_mult × freshness_mult × avod_tier_mult
--
-- licensing_score = est_ad_revenue × supply_gap_score × quality_score_norm
-- (higher supply gap = easier/cheaper to license = better ROI)

WITH demand AS (
    -- Aggregate demand across all markets into a single per-title row
    SELECT
        title_id,
        SUM(unique_users)               AS total_users,
        SUM(avod_clickouts)             AS avod_clickouts,
        SUM(tvod_clickouts)             AS tvod_clickouts,
        SUM(svod_clickouts)             AS svod_clickouts,
        SUM(watchlist_adds)             AS watchlist_adds,
        SUM(seenlist_adds)              AS seenlist_adds,
        SUM(trailer_plays)              AS trailer_plays,
        SUM(title_clicks)               AS title_clicks,
        SUM(page_views)                 AS page_views,
        SUM(estimated_views)            AS estimated_views,
        AVG(audience_cpm_multiplier)    AS audience_cpm_multiplier,
        MAX(market_count)               AS market_count
    FROM {{ ref('int_title_demand') }}
    GROUP BY 1
),

supply AS (
    -- Aggregate supply across all markets (take worst-case gap = min score)
    SELECT
        title_id,
        MAX(provider_count)                                     AS max_provider_count,
        MAX(CASE WHEN has_avod_supply THEN 1 ELSE 0 END) = 1   AS has_avod_supply,
        MAX(CASE WHEN has_svod_supply THEN 1 ELSE 0 END) = 1   AS has_svod_supply,
        MAX(CASE WHEN has_tvod_supply THEN 1 ELSE 0 END) = 1   AS has_tvod_supply,
        MIN(supply_gap_score)                                   AS supply_gap_score
    FROM {{ ref('int_title_supply') }}
    GROUP BY 1
),

content AS (
    SELECT * FROM {{ ref('int_title_content') }}
),

combined AS (
    SELECT
        d.title_id,
        c.title,
        c.object_type,
        c.release_year,
        c.freshness_category,
        c.quality_tier,
        c.quality_score_norm,
        c.watch_hours_single,
        c.est_total_watch_hours,
        c.imdb_score,
        c.original_language,
        c.genres,
        c.avod_tier,
        c.audience_segment,
        c.brand_safety,
        c.sentiment_score,
        c.base_genre_cpm,
        c.brand_safety_multiplier,
        c.freshness_multiplier,
        c.avod_tier_multiplier,

        d.total_users,
        d.avod_clickouts,
        d.tvod_clickouts,
        d.svod_clickouts,
        d.watchlist_adds,
        d.trailer_plays,
        d.title_clicks,
        d.page_views,
        d.estimated_views,
        d.audience_cpm_multiplier,
        d.market_count,

        COALESCE(s.max_provider_count, 0)       AS provider_count,
        COALESCE(s.has_avod_supply, FALSE)       AS has_avod_supply,
        COALESCE(s.has_svod_supply, FALSE)       AS has_svod_supply,
        COALESCE(s.has_tvod_supply, FALSE)       AS has_tvod_supply,
        COALESCE(s.supply_gap_score, 1.0)        AS supply_gap_score,

        -- Composite adjusted CPM
        c.base_genre_cpm
            * d.audience_cpm_multiplier
            * c.brand_safety_multiplier
            * c.freshness_multiplier
            * c.avod_tier_multiplier                AS adjusted_cpm

    FROM demand d
    JOIN    content c ON d.title_id = c.object_id
    LEFT JOIN supply s ON d.title_id = s.title_id
)

SELECT
    *,

    -- ── REVENUE FORMULA ────────────────────────────────────────────────
    -- Views × Watch Hours × Ad Load (6/hr) × CPM / 1000
    estimated_views
        * watch_hours_single
        * 6
        * adjusted_cpm
        / 1000                                      AS est_ad_revenue_usd,

    -- TVOD revenue proxy (industry avg: 5% of rent-clickers convert @ €4,
    --                                   2% of buy-clickers convert @ €10)
    tvod_clickouts * 0.05 * 4.0
        + tvod_clickouts * 0.02 * 10.0             AS est_tvod_revenue_usd,

    -- ── LICENSING SCORE ────────────────────────────────────────────────
    -- Revenue potential × supply gap bonus × quality adjustment
    (
        estimated_views
            * watch_hours_single
            * 6
            * adjusted_cpm
            / 1000
    )
    * supply_gap_score
    * quality_score_norm                            AS licensing_score,

    -- Final rank: 1 = best title to license
    ROW_NUMBER() OVER (
        ORDER BY (
            estimated_views * watch_hours_single * 6 * adjusted_cpm / 1000
        ) * supply_gap_score * quality_score_norm
        DESC NULLS LAST
    )                                               AS licensing_rank

FROM combined
ORDER BY licensing_rank
