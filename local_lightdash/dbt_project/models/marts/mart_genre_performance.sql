-- Mart: Genre-level licensing strategy
-- Aggregates estimated ad revenue, CPM, and demand signals by genre.
-- Answers: which genres are best for AVOD vs TVOD licensing?
-- Genres come from stg_objects_genres (one row per title × genre).

WITH title_rev AS (
    SELECT * FROM {{ ref('mart_title_ad_revenue') }}
),

genre_title AS (
    -- Fan-out: one row per title × genre
    SELECT
        t.title_id,
        t.object_type,
        t.avod_tier,
        t.brand_safety,
        t.total_users,
        t.avod_clickouts,
        t.tvod_clickouts,
        t.estimated_views,
        t.adjusted_cpm,
        t.watch_hours_single,
        t.est_ad_revenue_usd,
        t.est_tvod_revenue_usd,
        t.supply_gap_score,
        t.has_avod_supply,
        t.quality_score_norm,
        t.imdb_score,
        g.genre
    FROM title_rev t
    JOIN {{ ref('stg_objects_genres') }} g
        ON t.title_id = g.object_id
)

SELECT
    genre,
    object_type,

    COUNT(DISTINCT title_id)                                AS title_count,
    SUM(total_users)                                        AS total_users,

    -- Clickout signals
    SUM(avod_clickouts)                                     AS total_avod_clickouts,
    SUM(tvod_clickouts)                                     AS total_tvod_clickouts,

    -- CPM and revenue
    ROUND(AVG(adjusted_cpm), 2)                            AS avg_cpm,
    ROUND(SUM(est_ad_revenue_usd), 2)                      AS total_est_ad_revenue,
    ROUND(SUM(est_tvod_revenue_usd), 2)                    AS total_est_tvod_revenue,
    ROUND(SUM(est_ad_revenue_usd) + SUM(est_tvod_revenue_usd), 2)
                                                            AS total_est_revenue,

    -- Supply and quality
    ROUND(AVG(supply_gap_score), 3)                        AS avg_supply_gap_score,
    ROUND(AVG(has_avod_supply::INT), 3)                    AS avod_coverage_rate,
    ROUND(AVG(quality_score_norm), 3)                      AS avg_quality_score,
    ROUND(AVG(imdb_score), 2)                              AS avg_imdb_score,

    -- Monetization intent split
    ROUND(
        SUM(avod_clickouts)
            / NULLIF(SUM(avod_clickouts + tvod_clickouts), 0),
        3
    )                                                       AS avod_intent_share,
    ROUND(
        SUM(tvod_clickouts)
            / NULLIF(SUM(avod_clickouts + tvod_clickouts), 0),
        3
    )                                                       AS tvod_intent_share

FROM genre_title
GROUP BY 1, 2
ORDER BY total_est_ad_revenue DESC NULLS LAST
