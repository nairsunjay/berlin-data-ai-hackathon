-- Staging: events
-- Source: T1 (Germany, Dec 2025 — swap to base_events_t3 to scale up)
-- Deduplicates via rid, extracts all JSON context fields into typed columns.

with source as (
    select * from {{ ref('base_events_t1') }}
),

deduped as (
    select
        rid,
        event_id,
        collector_tstamp,
        derived_tstamp,
        event,
        user_id,
        login_id,
        session_id,
        app_id,
        platform,
        se_category,
        se_action,
        se_label,
        se_property,
        se_value,
        geo_country,
        geo_region_name,
        geo_city,

        -- Title context
        cc_title:jwEntityId::text                   as entity_id,
        cc_title:objectType::text                   as object_type,
        cc_title:seasonNumber::int                  as season_number,
        cc_title:episodeNumber::int                 as episode_number,

        -- Page context
        cc_page_type:pageType::text                 as page_type,
        cc_page_type:appLocale::text                as app_locale,

        -- Clickout context (NULL when se_category != 'clickout')
        cc_clickout:providerId::number              as provider_id,
        cc_clickout:monetizationType::text          as monetization_type,

        -- Device context
        cc_yauaa:deviceClass::text                  as device_class,
        cc_yauaa:agentName::text                    as agent_name

    from source
    qualify row_number() over (partition by rid order by collector_tstamp) = 1
)

select * from deduped
