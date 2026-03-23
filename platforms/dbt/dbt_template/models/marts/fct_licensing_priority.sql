-- Mart: Content Licensing Priority
-- Core output model. Scores every title by AVOD and TVOD revenue potential,
-- computes a cost proxy based on quality/recency signals, and ranks titles
-- by overall licensing ROI.
--
-- AVOD Score  = Σ(weighted engagement) × LN(market_count + 1)
-- TVOD Score  = Σ(rent + buy weighted) × LN(market_count + 1)
-- Cost Proxy  = f(imdb_score, release_year, object_type)
-- Priority    = (avod_score + tvod_score) / NULLIF(cost_proxy, 0)

with engagement as (
    select
        entity_id,
        sum(page_views)          as page_views,
        sum(title_clicks)        as title_clicks,
        sum(trailer_plays)       as trailer_plays,
        sum(watchlist_adds)      as watchlist_adds,
        sum(flatrate_clickouts)  as flatrate_clickouts,
        sum(avod_clickouts)      as avod_clickouts,
        sum(rent_clickouts)      as rent_clickouts,
        sum(buy_clickouts)       as buy_clickouts,
        sum(unique_users)        as total_users,
        count(distinct market)   as market_count
    from {{ ref('int_title_engagement') }}
    group by 1
),

offers as (
    select
        entity_id,
        max(has_avod_offer::int) = 1    as has_avod_offer,
        max(has_svod_offer::int) = 1    as has_svod_offer,
        max(has_tvod_offer::int) = 1    as has_tvod_offer,
        max(provider_count)             as max_provider_count
    from {{ ref('int_title_offers') }}
    group by 1
),

objects as (
    select * from {{ ref('stg_objects') }}
),

scored as (
    select
        e.entity_id,
        o.title,
        o.object_type,
        o.release_year,
        o.imdb_score,
        o.original_language,
        o.genre_tmdb,
        e.market_count,
        e.total_users,

        -- Offer landscape
        coalesce(of.has_avod_offer, false)   as has_avod_offer,
        coalesce(of.has_svod_offer, false)   as has_svod_offer,
        coalesce(of.has_tvod_offer, false)   as has_tvod_offer,
        coalesce(of.max_provider_count, 0)   as provider_count,

        -- Raw signal counts
        e.page_views,
        e.title_clicks,
        e.trailer_plays,
        e.watchlist_adds,
        e.flatrate_clickouts,
        e.avod_clickouts,
        e.rent_clickouts,
        e.buy_clickouts,

        -- AVOD Score: ad-supported streaming revenue potential
        -- Cross-market bonus via LN amplifies titles popular in multiple markets
        (
            coalesce(e.page_views, 0)         * 1  +
            coalesce(e.title_clicks, 0)       * 2  +
            coalesce(e.trailer_plays, 0)      * 3  +
            coalesce(e.watchlist_adds, 0)     * 4  +
            coalesce(e.flatrate_clickouts, 0) * 3  +
            coalesce(e.avod_clickouts, 0)     * 8
        ) * ln(e.market_count + 1)                  as avod_score,

        -- TVOD Score: rental/purchase revenue potential
        (
            coalesce(e.rent_clickouts, 0)  * 10 +
            coalesce(e.buy_clickouts, 0)   * 15
        ) * ln(e.market_count + 1)                  as tvod_score,

        -- Cost Proxy: rough estimate of licensing difficulty / price
        -- Higher imdb + newer + show (multi-season deals) = harder to license cheaply
        coalesce(o.imdb_score, 5.0) * 10
            + case
                when o.release_year >= 2024 then 50
                when o.release_year >= 2022 then 30
                when o.release_year >= 2020 then 15
                else 5
              end
            + case when o.object_type = 'show' then 20 else 0 end
                                                    as cost_proxy

    from engagement e
    left join objects o
        on e.entity_id = o.object_id
    left join offers of
        on e.entity_id = of.entity_id
    -- Only score titles we have metadata for
    where o.object_id is not null
),

final as (
    select
        *,

        -- ROI metrics
        avod_score / nullif(cost_proxy, 0)              as avod_roi,
        tvod_score / nullif(cost_proxy, 0)              as tvod_roi,
        (avod_score + tvod_score) / nullif(cost_proxy, 0)
                                                        as licensing_priority_score,

        -- Licensing gap flag: strong demand with no ad-supported offer currently
        case
            when avod_score > 0
              and has_avod_offer = false
            then true
            else false
        end                                             as is_avod_gap

    from scored
)

select * from final
order by licensing_priority_score desc nulls last
