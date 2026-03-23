-- Intermediate: Title content metadata enriched with genre CPM tiers,
-- AI classification, and all CPM multipliers needed for revenue estimation.
-- One row per title (movie or show).

WITH obj AS (
    SELECT * FROM {{ ref('stg_objects') }}
),

ai AS (
    SELECT * FROM {{ ref('stg_objects_ai_enriched') }}
),

genres_agg AS (
    SELECT
        object_id,
        LISTAGG(genre, ', ') WITHIN GROUP (ORDER BY genre) AS genres
    FROM {{ ref('stg_objects_genres') }}
    GROUP BY 1
),

-- Genre CPM: assign base CPM from the highest-value genre for each title
genre_cpm AS (
    SELECT
        object_id,
        MAX(
            CASE
                WHEN genre IN ('drama', 'thriller', 'crime')                THEN 25.0
                WHEN genre IN ('documentation', 'reality')                  THEN 20.0
                WHEN genre IN ('comedy', 'action', 'romance', 'animation')  THEN 18.0
                WHEN genre IN ('family', 'fantasy', 'scifi', 'horror')      THEN 16.0
                ELSE 15.0
            END
        ) AS base_cpm
    FROM {{ ref('stg_objects_genres') }}
    GROUP BY 1
)

SELECT
    o.object_id,
    o.object_type,
    o.title,
    o.short_description,
    o.release_year,
    o.freshness_category,
    o.quality_tier,
    o.quality_score_norm,
    o.watch_hours_single,
    o.est_total_watch_hours,
    o.imdb_score,
    o.original_language,

    COALESCE(g.genres,          'Unknown')    AS genres,

    -- AI enrichment (defaults for titles not run through Cortex)
    COALESCE(ai.avod_tier,         'B')           AS avod_tier,
    COALESCE(ai.audience_segment,  'mainstream')  AS audience_segment,
    COALESCE(ai.brand_safety,      'moderate')    AS brand_safety,
    COALESCE(ai.sentiment_score,   0.0)           AS sentiment_score,

    -- Base genre CPM
    COALESCE(gc.base_cpm, 15.0)                   AS base_genre_cpm,

    -- Brand safety CPM multiplier
    CASE COALESCE(ai.brand_safety, 'moderate')
        WHEN 'safe'     THEN 1.0
        WHEN 'moderate' THEN 0.7
        WHEN 'risky'    THEN 0.3
        ELSE 0.7
    END                                            AS brand_safety_multiplier,

    -- Freshness CPM multiplier
    CASE o.freshness_category
        WHEN 'new'     THEN 1.2
        WHEN 'catalog' THEN 1.0
        WHEN 'library' THEN 0.8
        ELSE 1.0
    END                                            AS freshness_multiplier,

    -- AVOD tier CPM multiplier (AI-assigned)
    CASE COALESCE(ai.avod_tier, 'B')
        WHEN 'A' THEN 1.3
        WHEN 'B' THEN 1.0
        WHEN 'C' THEN 0.7
        ELSE 1.0
    END                                            AS avod_tier_multiplier

FROM obj o
LEFT JOIN ai       ON o.object_id = ai.object_id
LEFT JOIN genres_agg g ON o.object_id = g.object_id
LEFT JOIN genre_cpm gc ON o.object_id = gc.object_id
