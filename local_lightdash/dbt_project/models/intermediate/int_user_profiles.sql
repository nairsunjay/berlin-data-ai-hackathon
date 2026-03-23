-- Intermediate: Per-user behavioral segments
-- Used to understand the audience mix that drives CPM estimates.
-- Premium (iOS + TVOD) → 1.5x CPM  | Price-sensitive (Android + free-only) → 0.7x
-- Power browsers (10+ titles) → 1.2x | Mainstream → 1.0x

WITH user_events AS (
    SELECT
        user_id,
        MAX(device_class)                              AS primary_device,
        MAX(agent_name)                                AS primary_agent,
        COUNT(DISTINCT title_id)                       AS titles_browsed,
        COUNT(DISTINCT session_id)                     AS session_count,
        COUNT_IF(event_type = 'tvod_clickout')         AS tvod_clickouts,
        COUNT_IF(event_type = 'avod_clickout')         AS avod_clickouts,
        COUNT_IF(event_type = 'svod_clickout')         AS svod_clickouts,
        COUNT_IF(event_type LIKE '%clickout%')         AS total_clickouts
    FROM {{ ref('stg_events') }}
    WHERE user_id IS NOT NULL
    GROUP BY 1
)

SELECT
    user_id,
    primary_device,
    titles_browsed,
    session_count,
    tvod_clickouts,
    avod_clickouts,
    svod_clickouts,
    total_clickouts,

    -- Audience segment
    CASE
        WHEN tvod_clickouts > 0
            AND primary_device = 'Desktop'                  THEN 'premium'
        WHEN total_clickouts > 0
            AND avod_clickouts = total_clickouts
            AND primary_device IN ('Phone','Tablet')        THEN 'price_sensitive'
        WHEN titles_browsed >= 10                           THEN 'power_browser'
        ELSE 'mainstream'
    END                                                     AS audience_segment,

    -- CPM multiplier
    CASE
        WHEN tvod_clickouts > 0
            AND primary_device = 'Desktop'                  THEN 1.5
        WHEN total_clickouts > 0
            AND avod_clickouts = total_clickouts
            AND primary_device IN ('Phone','Tablet')        THEN 0.7
        WHEN titles_browsed >= 10                           THEN 1.2
        ELSE 1.0
    END                                                     AS cpm_multiplier

FROM user_events
