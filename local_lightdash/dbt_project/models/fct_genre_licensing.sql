-- Challenge 6: Genre-Level Licensing Analysis
-- Aggregates AVOD and TVOD scores by genre to reveal which genres suit
-- ad-supported vs transactional licensing strategies.

WITH priority AS (
    SELECT * FROM {{ ref('fct_licensing_priority') }}
),

genre_title AS (
    SELECT
        p.entity_id,
        p.object_type,
        p.market_count,
        p.total_users,
        p.avod_score,
        p.tvod_score,
        p.avod_roi,
        p.tvod_roi,
        p.licensing_priority_score,
        p.has_avod_offer,
        p.has_tvod_offer,
        p.is_avod_gap,
        g.value::TEXT  AS genre
    FROM priority p,
         LATERAL FLATTEN(input => p.genre_tmdb) g
    WHERE p.genre_tmdb IS NOT NULL
)

SELECT
    genre,
    object_type,
    COUNT(DISTINCT entity_id)           AS title_count,
    SUM(total_users)                    AS total_users,
    SUM(market_count)                   AS total_market_appearances,
    SUM(avod_score)                     AS total_avod_score,
    SUM(tvod_score)                     AS total_tvod_score,
    AVG(avod_roi)                       AS avg_avod_roi,
    AVG(tvod_roi)                       AS avg_tvod_roi,
    AVG(licensing_priority_score)       AS avg_licensing_priority_score,
    AVG(has_avod_offer::INT)            AS avod_offer_rate,
    AVG(has_tvod_offer::INT)            AS tvod_offer_rate,
    AVG(is_avod_gap::INT)               AS avod_gap_rate,
    NULLIF(SUM(avod_score), 0) / NULLIF(SUM(tvod_score), 0)  AS avod_tvod_ratio
FROM genre_title
GROUP BY 1, 2
ORDER BY total_avod_score DESC NULLS LAST
