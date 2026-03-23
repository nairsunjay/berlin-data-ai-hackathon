-- Staging: content objects
-- Source: OBJECTS (~13M rows)
-- Filters to movies and shows only — licensing decisions happen at title level,
-- not at season/episode level. Selects key metadata fields needed by downstream models.

with source as (
    select * from {{ ref('base_objects') }}
),

top_level_titles as (
    select
        object_id,
        object_type,
        title,
        original_title,
        short_description,
        release_year,
        release_date,
        runtime,
        original_language,
        genre_tmdb,           -- ARRAY — use LATERAL FLATTEN downstream
        production_countries, -- ARRAY — use LATERAL FLATTEN downstream
        production_budget,
        seasons,
        imdb_score,
        id_imdb,
        id_tmdb,
        talent_cast,          -- ARRAY
        talent_director       -- ARRAY
    from source
    where object_type in ('movie', 'show')
)

select * from top_level_titles
