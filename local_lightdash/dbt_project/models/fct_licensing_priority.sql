-- Challenge 6: Content Licensing Priority
-- Scores every title by AVOD and TVOD revenue potential.
-- Source: DB_JW_SHARED.CHALLENGE.T2 (8 EU markets, Dec 2025)
--
-- AVOD Score  = Σ(weighted engagement) × LN(market_count + 1)
-- TVOD Score  = Σ(rent + buy signals) × LN(market_count + 1)
-- Cost Proxy  = f(imdb_score, release_year, object_type)
-- Priority    = (avod_score + tvod_score) / NULLIF(cost_proxy, 0)

WITH deduped AS (
    SELECT *
    FROM DB_JW_SHARED.CHALLENGE.T2
    QUALIFY ROW_NUMBER() OVER (PARTITION BY rid ORDER BY collector_tstamp) = 1
),

events AS (
    SELECT
        cc_title:jwEntityId::TEXT           AS entity_id,
        cc_page_type:appLocale::TEXT        AS market,
        user_id,
        session_id,
        event,
        se_category,
        se_action,
        cc_clickout:providerId::NUMBER      AS provider_id,
        cc_clickout:monetizationType::TEXT  AS monetization_type
    FROM deduped
    WHERE cc_title:jwEntityId::TEXT IS NOT NULL
),

title_engagement AS (
    SELECT
        entity_id,
        market,
        COUNT(*)                                                                            AS total_events,
        COUNT(DISTINCT user_id)                                                             AS unique_users,
        COUNT_IF(event = 'page_view')                                                       AS page_views,
        COUNT_IF(se_category = 'userinteraction' AND se_action = 'title_clicked')          AS title_clicks,
        COUNT_IF(se_category = 'youtube_started')                                           AS trailer_plays,
        COUNT_IF(se_category = 'watchlist_add')                                             AS watchlist_adds,
        COUNT_IF(se_category = 'clickout' AND se_action IN ('free', 'ads'))                 AS avod_clickouts,
        COUNT_IF(se_category = 'clickout' AND se_action = 'flatrate')                       AS flatrate_clickouts,
        COUNT_IF(se_category = 'clickout' AND se_action = 'rent')                           AS rent_clickouts,
        COUNT_IF(se_category = 'clickout' AND se_action = 'buy')                            AS buy_clickouts
    FROM events
    GROUP BY 1, 2
),

engagement AS (
    SELECT
        entity_id,
        SUM(page_views)             AS page_views,
        SUM(title_clicks)           AS title_clicks,
        SUM(trailer_plays)          AS trailer_plays,
        SUM(watchlist_adds)         AS watchlist_adds,
        SUM(flatrate_clickouts)     AS flatrate_clickouts,
        SUM(avod_clickouts)         AS avod_clickouts,
        SUM(rent_clickouts)         AS rent_clickouts,
        SUM(buy_clickouts)          AS buy_clickouts,
        SUM(unique_users)           AS total_users,
        COUNT(DISTINCT market)      AS market_count
    FROM title_engagement
    GROUP BY 1
),

offer_flags AS (
    SELECT
        entity_id,
        MAX(CASE WHEN monetization_type = 'flatrate'             THEN 1 ELSE 0 END) = 1  AS has_svod_offer,
        MAX(CASE WHEN monetization_type IN ('free', 'ads')        THEN 1 ELSE 0 END) = 1  AS has_avod_offer,
        MAX(CASE WHEN monetization_type IN ('rent', 'buy')        THEN 1 ELSE 0 END) = 1  AS has_tvod_offer,
        COUNT(DISTINCT provider_id)                                                        AS provider_count
    FROM events
    WHERE se_category = 'clickout' AND provider_id IS NOT NULL
    GROUP BY 1
),

objects AS (
    SELECT
        object_id,
        object_type,
        title,
        release_year,
        imdb_score,
        original_language,
        genre_tmdb
    FROM DB_JW_SHARED.CHALLENGE.OBJECTS
    WHERE object_type IN ('movie', 'show')
),

scored AS (
    SELECT
        e.entity_id,
        o.title,
        o.object_type,
        o.release_year,
        o.imdb_score,
        o.original_language,
        o.genre_tmdb,
        e.market_count,
        e.total_users,
        COALESCE(offs.has_avod_offer, FALSE)  AS has_avod_offer,
        COALESCE(offs.has_svod_offer, FALSE)  AS has_svod_offer,
        COALESCE(offs.has_tvod_offer, FALSE)  AS has_tvod_offer,
        COALESCE(offs.provider_count, 0)      AS provider_count,
        e.page_views,
        e.title_clicks,
        e.trailer_plays,
        e.watchlist_adds,
        e.flatrate_clickouts,
        e.avod_clickouts,
        e.rent_clickouts,
        e.buy_clickouts,

        -- AVOD Score: ad-supported streaming potential
        (
            COALESCE(e.page_views,         0) * 1  +
            COALESCE(e.title_clicks,       0) * 2  +
            COALESCE(e.trailer_plays,      0) * 3  +
            COALESCE(e.watchlist_adds,     0) * 4  +
            COALESCE(e.flatrate_clickouts, 0) * 3  +
            COALESCE(e.avod_clickouts,     0) * 8
        ) * LN(e.market_count + 1)              AS avod_score,

        -- TVOD Score: rental/purchase potential
        (
            COALESCE(e.rent_clickouts, 0) * 10 +
            COALESCE(e.buy_clickouts,  0) * 15
        ) * LN(e.market_count + 1)              AS tvod_score,

        -- Cost Proxy: licensing difficulty estimate
        COALESCE(o.imdb_score, 5.0) * 10
            + CASE
                WHEN o.release_year >= 2024 THEN 50
                WHEN o.release_year >= 2022 THEN 30
                WHEN o.release_year >= 2020 THEN 15
                ELSE 5
              END
            + CASE WHEN o.object_type = 'show' THEN 20 ELSE 0 END
                                                AS cost_proxy

    FROM engagement e
    JOIN objects o    ON e.entity_id = o.object_id
    LEFT JOIN offer_flags offs ON e.entity_id = offs.entity_id
)

SELECT
    *,
    avod_score / NULLIF(cost_proxy, 0)                      AS avod_roi,
    tvod_score / NULLIF(cost_proxy, 0)                      AS tvod_roi,
    (avod_score + tvod_score) / NULLIF(cost_proxy, 0)       AS licensing_priority_score,
    CASE
        WHEN avod_score > 0 AND has_avod_offer = FALSE THEN TRUE
        ELSE FALSE
    END                                                     AS is_avod_gap
FROM scored
ORDER BY licensing_priority_score DESC NULLS LAST
