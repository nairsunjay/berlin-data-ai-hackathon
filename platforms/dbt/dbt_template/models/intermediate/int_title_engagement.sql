-- Intermediate: engagement signals per title × market
-- Aggregates all behavioral signals from events into a per-title, per-market summary.
-- Materialized as table because this is a heavy aggregation used by three mart models.

with events as (
    select * from {{ ref('stg_events') }}
    -- Only events with a content entity attached
    where entity_id is not null
),

aggregated as (
    select
        entity_id,
        app_locale                                                      as market,

        -- Volume signals
        count(*)                                                        as total_events,
        count(distinct user_id)                                         as unique_users,
        count(distinct session_id)                                      as unique_sessions,

        -- Page views (event = 'page_view')
        count_if(event = 'page_view')                                   as page_views,

        -- Engagement clicks
        count_if(
            se_category = 'userinteraction'
            and se_action = 'title_clicked'
        )                                                               as title_clicks,

        -- Trailer plays
        count_if(se_category = 'youtube_started')                      as trailer_plays,

        -- Watchlist signals
        count_if(se_category = 'watchlist_add')                        as watchlist_adds,
        count_if(se_category = 'watchlist_remove')                     as watchlist_removes,

        -- Seenlist and like signals (engagement depth)
        count_if(se_category = 'seenlist_add')                         as seenlist_adds,
        count_if(se_category = 'likelist_add')                         as like_adds,

        -- AVOD clickouts: free ad-supported content
        count_if(
            se_category = 'clickout'
            and se_action in ('free', 'ads')
        )                                                               as avod_clickouts,

        -- Flatrate (SVOD) clickouts — proxy for subscription willingness
        count_if(
            se_category = 'clickout'
            and se_action = 'flatrate'
        )                                                               as flatrate_clickouts,

        -- TVOD: rent intent
        count_if(
            se_category = 'clickout'
            and se_action = 'rent'
        )                                                               as rent_clickouts,

        -- TVOD: buy intent (highest monetization signal)
        count_if(
            se_category = 'clickout'
            and se_action = 'buy'
        )                                                               as buy_clickouts,

        -- All clickouts combined
        count_if(se_category = 'clickout')                             as total_clickouts

    from events
    group by 1, 2
)

select * from aggregated
