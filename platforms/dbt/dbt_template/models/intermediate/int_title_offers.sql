-- Intermediate: current offer landscape per title (inferred from clickout events)
-- Identifies which providers have clickouts per title and what monetization types
-- are available — enabling detection of titles with demand but no free offers.
-- Materialized as table because aggregation is non-trivial.

with clickouts as (
    select
        e.entity_id,
        e.app_locale                                            as market,
        e.provider_id,
        e.monetization_type,
        p.clear_name                                            as provider_name,
        p.technical_name                                        as provider_slug,
        p.monetization_types                                    as provider_supported_types
    from {{ ref('stg_events') }} e
    left join {{ ref('stg_packages') }} p
        on e.provider_id = p.provider_id
    where
        e.se_category = 'clickout'
        and e.entity_id is not null
        and e.provider_id is not null
),

offer_flags as (
    select
        entity_id,
        market,

        -- Count distinct providers with clickouts
        count(distinct provider_id)                             as provider_count,

        -- Availability flags (true = at least one clickout seen for that type)
        max(case when monetization_type = 'flatrate' then 1 else 0 end) = 1
                                                                as has_svod_offer,
        max(case when monetization_type in ('free', 'ads') then 1 else 0 end) = 1
                                                                as has_avod_offer,
        max(case when monetization_type = 'rent' then 1 else 0 end) = 1
                                                                as has_rent_offer,
        max(case when monetization_type = 'buy' then 1 else 0 end) = 1
                                                                as has_buy_offer,

        -- Combined TVOD flag
        max(case when monetization_type in ('rent', 'buy') then 1 else 0 end) = 1
                                                                as has_tvod_offer,

        -- Top provider by clickout volume (most prominent for this title)
        mode(provider_name)                                     as top_provider_name

    from clickouts
    group by 1, 2
)

select * from offer_flags
