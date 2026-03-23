-- Mart: Underserved Demand — licensing gap titles
-- Identifies titles with strong user engagement but no or limited free/ad-supported
-- (AVOD) offers. These are the highest-priority licensing targets for JustWatch's
-- own streaming service.
--
-- Logic: top-quartile AVOD score + no AVOD offer currently = licensing gap

with priority as (
    select * from {{ ref('fct_licensing_priority') }}
),

-- Compute the 75th percentile of avod_score to define "high demand"
avod_p75 as (
    select percentile_cont(0.75) within group (order by avod_score) as avod_score_p75
    from priority
    where avod_score > 0
),

-- Flatten genres so we can surface genre breakdown per gap title
genres_flat as (
    select
        p.entity_id,
        g.value::text as genre
    from priority p,
         lateral flatten(input => p.genre_tmdb) g
),

-- Aggregate genres back into a comma-separated list per title
genres_agg as (
    select
        entity_id,
        listagg(genre, ', ') within group (order by genre) as genres
    from genres_flat
    group by 1
),

gap_titles as (
    select
        p.entity_id,
        p.title,
        p.object_type,
        p.release_year,
        p.imdb_score,
        p.original_language,
        p.market_count,
        p.total_users,
        p.avod_score,
        p.tvod_score,
        p.licensing_priority_score,
        p.has_avod_offer,
        p.has_svod_offer,
        p.has_tvod_offer,
        p.provider_count,
        coalesce(g.genres, 'Unknown')   as genres,

        -- Rank by AVOD score (most wanted without free offer = highest priority)
        row_number() over (order by p.avod_score desc nulls last)
                                        as demand_gap_rank

    from priority p
    left join genres_agg g
        on p.entity_id = g.entity_id
    cross join avod_p75 q
    where
        -- High demand: above 75th percentile
        p.avod_score >= q.avod_score_p75
        -- No AVOD offer currently available
        and p.has_avod_offer = false
)

select * from gap_titles
order by demand_gap_rank
