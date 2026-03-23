-- Intermediate: Demand signals aggregated per title × market
-- Computes estimated_views (weighted engagement score) and audience CPM
-- multiplier from device mix. Used by mart_title_ad_revenue as input.
--
-- Signal weights (from plan):
--   avod_clickout 1.0 | tvod_clickout 0.8 | watchlist_add 0.5
--   trailer_play 0.3  | title_click 0.1   | page_view 0.05

WITH events AS (
    SELECT * FROM {{ ref('stg_events') }}
    WHERE title_id IS NOT NULL
),

demand_raw AS (
    SELECT
        title_id,
        market,
        COUNT(DISTINCT user_id)                                             AS unique_users,
        COUNT(DISTINCT session_id)                                          AS unique_sessions,
        COUNT(*)                                                            AS total_events,

        -- Monetization intent signals
        COUNT_IF(event_type = 'avod_clickout')                             AS avod_clickouts,
        COUNT_IF(event_type = 'tvod_clickout')                             AS tvod_clickouts,
        COUNT_IF(event_type = 'svod_clickout')                             AS svod_clickouts,

        -- Engagement signals
        COUNT_IF(event_type = 'watchlist_add')                             AS watchlist_adds,
        COUNT_IF(event_type = 'seenlist_add')                              AS seenlist_adds,
        COUNT_IF(event_type = 'trailer_play')                              AS trailer_plays,
        COUNT_IF(event_type = 'title_click')                               AS title_clicks,
        COUNT_IF(event_type = 'page_view')                                 AS page_views,
        COUNT_IF(event_type = 'like')                                      AS likes,

        -- Device mix for audience CPM estimation
        COUNT_IF(device_class = 'Desktop')                                 AS desktop_events,
        COUNT_IF(device_class IN ('Phone','Tablet')
            AND agent_name ILIKE '%safari%')                               AS ios_events,
        COUNT_IF(device_class IN ('Phone','Tablet')
            AND agent_name NOT ILIKE '%safari%')                           AS android_events,

        -- Overall clickout rate
        COUNT_IF(event_type LIKE '%clickout%')
            / NULLIF(COUNT(*), 0)                                          AS clickout_rate

    FROM events
    GROUP BY 1, 2
),

with_scores AS (
    SELECT
        *,

        -- Weighted demand score → proxy for estimated view count if licensed
        (
            avod_clickouts * 1.0 +
            tvod_clickouts * 0.8 +
            watchlist_adds * 0.5 +
            trailer_plays  * 0.3 +
            title_clicks   * 0.1 +
            page_views     * 0.05
        )                                                                  AS estimated_views,

        -- Audience CPM multiplier from device / platform mix
        CASE
            WHEN (ios_events + desktop_events) > 0.5 * total_events  THEN 1.3  -- premium
            WHEN android_events > 0.5 * total_events                  THEN 0.8  -- price-sensitive
            ELSE 1.0                                                            -- mainstream
        END                                                                AS audience_cpm_multiplier,

        -- How many markets this title has demand in
        COUNT(DISTINCT market) OVER (PARTITION BY title_id)                AS market_count

    FROM demand_raw
)

SELECT * FROM with_scores
