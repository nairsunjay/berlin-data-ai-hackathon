-- Staging: JustWatch events from T2 (8 EU markets, Dec 2025, ~40M rows)
-- Deduplicates via rid, extracts all JSON context fields, and classifies
-- each event into a business-meaningful event_type.
-- Swap T2 → T3/T4 in the source CTE to scale up.

WITH source AS (
    SELECT *
    FROM DB_JW_SHARED.CHALLENGE.T2
    QUALIFY ROW_NUMBER() OVER (PARTITION BY rid ORDER BY collector_tstamp) = 1
)

SELECT
    rid,
    collector_tstamp,
    user_id,
    login_id,
    session_id,
    event,
    se_category,
    se_action,
    geo_country,

    -- Title context
    cc_title:jwEntityId::TEXT           AS title_id,
    cc_title:objectType::TEXT           AS content_type,
    cc_title:seasonNumber::INT          AS season_number,
    cc_title:episodeNumber::INT         AS episode_number,

    -- Page context
    cc_page_type:pageType::TEXT         AS page_type,
    cc_page_type:appLocale::TEXT        AS market,

    -- Clickout context (NULL on non-clickout events)
    cc_clickout:providerId::NUMBER      AS provider_id,
    cc_clickout:monetizationType::TEXT  AS monetization_type,

    -- Device context
    cc_yauaa:deviceClass::TEXT          AS device_class,
    cc_yauaa:agentName::TEXT            AS agent_name,

    -- Search context
    cc_search:searchEntry::TEXT         AS search_query,

    -- Unified event type (business classification)
    CASE
        WHEN se_category = 'clickout' AND se_action IN ('free', 'ads')          THEN 'avod_clickout'
        WHEN se_category = 'clickout' AND se_action IN ('rent', 'buy')          THEN 'tvod_clickout'
        WHEN se_category = 'clickout' AND se_action = 'flatrate'                THEN 'svod_clickout'
        WHEN se_category = 'clickout'                                           THEN 'other_clickout'
        WHEN se_category = 'watchlist_add'                                      THEN 'watchlist_add'
        WHEN se_category = 'watchlist_remove'                                   THEN 'watchlist_remove'
        WHEN se_category = 'seenlist_add'                                       THEN 'seenlist_add'
        WHEN se_category = 'likelist_add'                                       THEN 'like'
        WHEN se_category = 'dislikelist_add'                                    THEN 'dislike'
        WHEN se_category = 'userinteraction' AND se_action = 'title_clicked'    THEN 'title_click'
        WHEN se_category = 'youtube_started'                                    THEN 'trailer_play'
        WHEN event = 'page_view'                                                THEN 'page_view'
        ELSE 'other'
    END AS event_type

FROM source
