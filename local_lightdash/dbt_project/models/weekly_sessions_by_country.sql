-- Weekly sessions by country from JustWatch event data
-- Deduplicates via rid, then counts distinct sessions per week × country

WITH deduped AS (
    SELECT *
    FROM DB_JW_SHARED.CHALLENGE.T2
    QUALIFY ROW_NUMBER() OVER (PARTITION BY rid ORDER BY collector_tstamp) = 1
)

SELECT
    DATE_TRUNC('WEEK', collector_tstamp)::DATE  AS week_start,
    geo_country,
    COUNT(DISTINCT session_id)                  AS session_count,
    COUNT(DISTINCT user_id)                     AS unique_users,
    COUNT(*)                                    AS total_events
FROM deduped
GROUP BY 1, 2
ORDER BY 1, 2
