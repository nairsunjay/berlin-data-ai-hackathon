-- Intermediate: Current streaming supply per title × market
-- Derived from clickout events: if users clicked to a provider, that provider
-- carries the title. Titles with fewer providers have higher licensing opportunity.

WITH clickouts AS (
    SELECT
        e.title_id,
        e.market,
        e.provider_id,
        e.event_type,
        p.clear_name AS provider_name
    FROM {{ ref('stg_events') }} e
    LEFT JOIN {{ ref('stg_packages') }} p
        ON e.provider_id = p.provider_id
    WHERE e.event_type LIKE '%clickout%'
      AND e.title_id   IS NOT NULL
      AND e.provider_id IS NOT NULL
)

SELECT
    title_id,
    market,
    COUNT(DISTINCT provider_id)                                                     AS provider_count,
    MAX(CASE WHEN event_type = 'avod_clickout' THEN 1 ELSE 0 END) = 1             AS has_avod_supply,
    MAX(CASE WHEN event_type = 'svod_clickout' THEN 1 ELSE 0 END) = 1             AS has_svod_supply,
    MAX(CASE WHEN event_type = 'tvod_clickout' THEN 1 ELSE 0 END) = 1             AS has_tvod_supply,
    LISTAGG(DISTINCT provider_name, ', ')
        WITHIN GROUP (ORDER BY provider_name)                                       AS provider_names,

    -- Supply gap: fewer providers = bigger licensing opportunity
    CASE
        WHEN COUNT(DISTINCT provider_id) = 0   THEN 1.0
        WHEN COUNT(DISTINCT provider_id) <= 2  THEN 0.8
        WHEN COUNT(DISTINCT provider_id) <= 5  THEN 0.5
        WHEN COUNT(DISTINCT provider_id) <= 10 THEN 0.3
        ELSE 0.1
    END                                                                             AS supply_gap_score

FROM clickouts
GROUP BY 1, 2
