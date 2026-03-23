-- Staging: Cortex AI enrichment for content titles
-- Classifies each title by:
--   avod_tier     (A/B/C) — licensing priority tier
--   audience      — target demographic segment
--   brand_safety  — advertiser suitability
-- Also runs sentiment analysis on descriptions.
--
-- IMPORTANT: Materialized as TABLE to avoid re-running expensive Cortex calls.
-- Scoped to titles with user engagement in T2 + available descriptions only.
-- Re-run: dbt run --full-refresh --select stg_objects_ai_enriched

{{ config(materialized='table') }}

WITH engaged_titles AS (
    -- Rank titles by total event volume; take top 10K to cap Cortex cost
    SELECT
        cc_title:jwEntityId::TEXT  AS title_id,
        COUNT(*)                   AS event_count
    FROM DB_JW_SHARED.CHALLENGE.T2
    WHERE cc_title:jwEntityId::TEXT IS NOT NULL
    GROUP BY 1
    QUALIFY ROW_NUMBER() OVER (ORDER BY event_count DESC) <= 10000
),

titled AS (
    SELECT
        o.object_id,
        o.title,
        o.short_description,
        o.genre_tmdb
    FROM {{ ref('stg_objects') }} o
    INNER JOIN engaged_titles e ON o.object_id = e.title_id
    WHERE o.short_description IS NOT NULL
),

classified AS (
    SELECT
        object_id,
        title,

        -- Sentiment score: -1 (negative) to +1 (positive)
        SNOWFLAKE.CORTEX.SENTIMENT(short_description) AS sentiment_score,

        -- Single COMPLETE call for all three classifications (cost-efficient)
        TRY_PARSE_JSON(
            SNOWFLAKE.CORTEX.COMPLETE(
                'llama3.1-8b',
                'Classify this streaming content. Return ONLY a valid JSON object, nothing else.' ||
                CHR(10) || 'Title: ' || title ||
                CHR(10) || 'Description: ' || short_description ||
                CHR(10) || 'Return exactly: {"avod_tier":"A","audience":"mainstream","brand_safety":"safe"}' ||
                CHR(10) || 'Rules:' ||
                CHR(10) || 'avod_tier: A=mainstream hit broad appeal, B=solid specific audience, C=niche or old' ||
                CHR(10) || 'audience: families, young_adults, mainstream, niche, or premium' ||
                CHR(10) || 'brand_safety: safe=advertiser-friendly, moderate=some mature themes, risky=violence/explicit'
            )
        ) AS ai_result

    FROM titled
)

SELECT
    object_id,
    title,
    COALESCE(sentiment_score,              0.0)          AS sentiment_score,
    COALESCE(ai_result:avod_tier::TEXT,    'B')           AS avod_tier,
    COALESCE(ai_result:audience::TEXT,     'mainstream')  AS audience_segment,
    COALESCE(ai_result:brand_safety::TEXT, 'moderate')    AS brand_safety

FROM classified
