-- Staging: JustWatch content metadata (movies and shows only)
-- Filters out seasons/episodes, cleans runtime, computes watch hours,
-- freshness category, and quality scores used in CPM estimation.

SELECT
    object_id,
    object_type,
    title,
    original_title,
    short_description,
    release_year,
    release_date,
    original_language,
    genre_tmdb,
    production_countries,
    imdb_score,
    id_imdb,
    id_tmdb,
    seasons,
    talent_cast,
    talent_director,

    -- Watch hours: how many ad slots does one viewing generate?
    -- Movies: runtime_minutes / 60
    -- Shows: runtime_per_episode_minutes / 60 (avg episode watch)
    CAST(runtime AS FLOAT) / 60.0                                   AS watch_hours_single,

    -- For shows, multiply by estimated seasons to get total content hours
    CAST(runtime AS FLOAT) / 60.0 * COALESCE(seasons, 1)           AS est_total_watch_hours,

    -- Freshness: newer content commands higher CPM
    CASE
        WHEN release_year >= YEAR(CURRENT_DATE()) - 2  THEN 'new'
        WHEN release_year >= YEAR(CURRENT_DATE()) - 10 THEN 'catalog'
        ELSE 'library'
    END AS freshness_category,

    -- Quality tier from IMDb score
    CASE
        WHEN imdb_score >= 8.0 THEN 'premium'
        WHEN imdb_score >= 6.5 THEN 'good'
        WHEN imdb_score >= 5.0 THEN 'average'
        WHEN imdb_score IS NOT NULL THEN 'below_average'
        ELSE 'unrated'
    END AS quality_tier,

    -- Normalized quality score (0–1) for licensing score calculation
    CASE
        WHEN imdb_score IS NOT NULL THEN imdb_score / 10.0
        ELSE 0.6  -- conservative default for unrated content
    END AS quality_score_norm

FROM DB_JW_SHARED.CHALLENGE.OBJECTS
WHERE object_type IN ('movie', 'show')
  AND runtime IS NOT NULL
  AND runtime > 0
  AND runtime < 100000  -- exclude data quality outliers
