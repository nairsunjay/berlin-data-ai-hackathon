-- Mart: Per-market licensing opportunity (T2 = 8 EU markets)
-- Shows which markets have the highest AVOD revenue potential,
-- demand intensity, and supply gaps — input to market entry decisions.

WITH demand_by_market AS (
    SELECT
        market,
        SUM(unique_users)               AS total_unique_users,
        SUM(total_events)               AS total_events,
        SUM(avod_clickouts)             AS avod_clickouts,
        SUM(tvod_clickouts)             AS tvod_clickouts,
        SUM(svod_clickouts)             AS svod_clickouts,
        SUM(watchlist_adds)             AS watchlist_adds,
        COUNT(DISTINCT title_id)        AS titles_with_demand,
        AVG(clickout_rate)              AS avg_clickout_rate
    FROM {{ ref('int_title_demand') }}
    WHERE market IS NOT NULL
    GROUP BY 1
),

-- Distribute each title's revenue to markets proportional to demand share
revenue_by_market AS (
    SELECT
        d.market,
        d.title_id,
        r.est_ad_revenue_usd
            * (
                d.estimated_views
                / NULLIF(SUM(d.estimated_views) OVER (PARTITION BY d.title_id), 0)
            )                           AS market_est_ad_revenue,
        r.est_tvod_revenue_usd
            * (
                d.estimated_views
                / NULLIF(SUM(d.estimated_views) OVER (PARTITION BY d.title_id), 0)
            )                           AS market_est_tvod_revenue
    FROM {{ ref('int_title_demand') }} d
    INNER JOIN {{ ref('mart_title_ad_revenue') }} r
        ON d.title_id = r.title_id
    WHERE d.market IS NOT NULL
),

revenue_agg AS (
    SELECT
        market,
        ROUND(SUM(market_est_ad_revenue), 2)            AS est_ad_revenue,
        ROUND(SUM(market_est_tvod_revenue), 2)          AS est_tvod_revenue,
        COUNT(DISTINCT title_id)                        AS revenue_title_count
    FROM revenue_by_market
    GROUP BY 1
)

SELECT
    d.market,
    d.total_unique_users,
    d.total_events,
    d.avod_clickouts,
    d.tvod_clickouts,
    d.svod_clickouts,
    d.watchlist_adds,
    d.titles_with_demand,
    ROUND(d.avg_clickout_rate, 4)                       AS avg_clickout_rate,

    COALESCE(r.est_ad_revenue,   0)                     AS est_ad_revenue,
    COALESCE(r.est_tvod_revenue, 0)                     AS est_tvod_revenue,
    COALESCE(r.est_ad_revenue, 0) + COALESCE(r.est_tvod_revenue, 0)
                                                        AS total_est_revenue,

    -- Revenue efficiency: how much revenue per engaged user?
    ROUND(
        COALESCE(r.est_ad_revenue, 0) / NULLIF(d.total_unique_users, 0),
        4
    )                                                   AS revenue_per_user,

    -- Market entry priority rank
    ROW_NUMBER() OVER (
        ORDER BY COALESCE(r.est_ad_revenue, 0) DESC NULLS LAST
    )                                                   AS market_rank

FROM demand_by_market d
LEFT JOIN revenue_agg r ON d.market = r.market
ORDER BY market_rank
