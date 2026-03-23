-- Staging: One row per title × genre (FLATTEN of genre_tmdb array)
-- Used by int_title_content for genre CPM lookups and
-- mart_genre_performance for genre-level aggregations.

SELECT
    o.object_id,
    g.value::TEXT AS genre

FROM {{ ref('stg_objects') }} o,
     LATERAL FLATTEN(input => o.genre_tmdb) g

WHERE o.genre_tmdb IS NOT NULL
