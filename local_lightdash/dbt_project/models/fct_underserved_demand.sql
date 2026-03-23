-- Challenge 6: Underserved Demand — Licensing Gap Titles
-- Titles with top-quartile AVOD demand but no current ad-supported offer.
-- These are the highest-priority licensing targets for JustWatch's own streaming.

WITH priority AS (
    SELECT * FROM {{ ref('fct_licensing_priority') }}
),

avod_p75 AS (
    SELECT PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY avod_score) AS avod_score_p75
    FROM priority
    WHERE avod_score > 0
),

genres_flat AS (
    SELECT
        p.entity_id,
        g.value::TEXT AS genre
    FROM priority p,
         LATERAL FLATTEN(input => p.genre_tmdb) g
    WHERE p.genre_tmdb IS NOT NULL
),

genres_agg AS (
    SELECT
        entity_id,
        LISTAGG(genre, ', ') WITHIN GROUP (ORDER BY genre) AS genres
    FROM genres_flat
    GROUP BY 1
)

SELECT
    p.entity_id,
    p.title,
    p.object_type,
    p.release_year,
    p.imdb_score,
    p.original_language,
    p.market_count,
    p.total_users,
    p.page_views,
    p.watchlist_adds,
    p.avod_clickouts,
    p.rent_clickouts,
    p.buy_clickouts,
    p.avod_score,
    p.tvod_score,
    p.licensing_priority_score,
    p.has_avod_offer,
    p.has_svod_offer,
    p.has_tvod_offer,
    p.provider_count,
    COALESCE(g.genres, 'Unknown')  AS genres,
    ROW_NUMBER() OVER (ORDER BY p.avod_score DESC NULLS LAST) AS demand_gap_rank
FROM priority p
LEFT JOIN genres_agg g   ON p.entity_id = g.entity_id
CROSS JOIN avod_p75 q
WHERE
    p.avod_score >= q.avod_score_p75
    AND p.has_avod_offer = FALSE
ORDER BY demand_gap_rank
