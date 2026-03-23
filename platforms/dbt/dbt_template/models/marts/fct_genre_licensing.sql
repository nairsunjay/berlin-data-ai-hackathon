-- Mart: Genre-Level Licensing Analysis
-- Aggregates AVOD and TVOD scores by genre (from OBJECTS.genre_tmdb array)
-- to reveal which genres are best suited for ad-supported vs transactional licensing.
-- Output is a heatmap-ready table: genre × monetization metric.

with priority as (
    select * from {{ ref('fct_licensing_priority') }}
),

engagement as (
    select * from {{ ref('int_title_engagement') }}
),

-- Flatten genre array from priority (which carries genre_tmdb from stg_objects)
genre_title as (
    select
        p.entity_id,
        p.title,
        p.object_type,
        p.release_year,
        p.market_count,
        p.total_users,
        p.avod_score,
        p.tvod_score,
        p.avod_roi,
        p.tvod_roi,
        p.licensing_priority_score,
        p.has_avod_offer,
        p.has_tvod_offer,
        p.is_avod_gap,
        g.value::text                   as genre
    from priority p,
         lateral flatten(input => p.genre_tmdb) g
    where p.genre_tmdb is not null
),

genre_agg as (
    select
        genre,
        object_type,

        count(distinct entity_id)           as title_count,
        sum(total_users)                    as total_users,
        sum(market_count)                   as total_market_appearances,

        -- Aggregate scores
        sum(avod_score)                     as total_avod_score,
        sum(tvod_score)                     as total_tvod_score,
        avg(avod_roi)                       as avg_avod_roi,
        avg(tvod_roi)                       as avg_tvod_roi,
        avg(licensing_priority_score)       as avg_licensing_priority_score,

        -- Offer availability rates
        avg(has_avod_offer::int)            as avod_offer_rate,
        avg(has_tvod_offer::int)            as tvod_offer_rate,

        -- Gap opportunity: fraction of titles with high demand but no AVOD offer
        avg(is_avod_gap::int)               as avod_gap_rate,

        -- Monetization preference: >1 means AVOD-dominant, <1 means TVOD-dominant
        nullif(sum(avod_score), 0) / nullif(sum(tvod_score), 0)
                                            as avod_tvod_ratio

    from genre_title
    group by 1, 2
)

select * from genre_agg
order by total_avod_score desc nulls last
