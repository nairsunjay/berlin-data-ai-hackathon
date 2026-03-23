-- Intermediate: Provider-level competitive landscape
-- Shows which providers dominate by market and monetization type.
-- Useful for understanding where JustWatch TV competes (42K clickouts on 1,015 titles).

WITH provider_events AS (
    SELECT
        e.provider_id,
        p.clear_name       AS provider_name,
        p.technical_name   AS provider_slug,
        e.market,
        e.event_type,
        e.title_id
    FROM {{ ref('stg_events') }} e
    INNER JOIN {{ ref('stg_packages') }} p
        ON e.provider_id = p.provider_id
    WHERE e.event_type LIKE '%clickout%'
      AND e.provider_id IS NOT NULL
)

SELECT
    provider_id,
    provider_name,
    provider_slug,
    market,
    COUNT(*)                                                AS total_clickouts,
    COUNT(DISTINCT title_id)                               AS title_count,
    COUNT_IF(event_type = 'avod_clickout')                 AS avod_clickouts,
    COUNT_IF(event_type = 'svod_clickout')                 AS svod_clickouts,
    COUNT_IF(event_type = 'tvod_clickout')                 AS tvod_clickouts,

    -- Monetization mix ratios
    COUNT_IF(event_type = 'avod_clickout')
        / NULLIF(COUNT(*), 0)                             AS avod_share,
    COUNT_IF(event_type = 'svod_clickout')
        / NULLIF(COUNT(*), 0)                             AS svod_share,
    COUNT_IF(event_type = 'tvod_clickout')
        / NULLIF(COUNT(*), 0)                             AS tvod_share

FROM provider_events
GROUP BY 1, 2, 3, 4
ORDER BY total_clickouts DESC
