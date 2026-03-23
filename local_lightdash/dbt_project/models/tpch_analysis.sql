-- Mirror of TPCH_ANALYTICS.SEMANTIC_MODELS.TPCH_ANALYSIS
-- Snowflake Semantic Views use a proprietary query syntax that standard SQL
-- tools (like Lightdash) cannot generate. This model replicates all of the
-- semantic view's public dimensions and metrics using standard SQL against
-- the underlying TPCH tables, producing a flat table Lightdash can query freely.
--
-- Entity grain: one row per order × lineitem aggregate
-- (customer + geography + order dimensions, order + revenue metrics)

SELECT
    -- ── Customer dimensions ───────────────────────────────
    c.c_name                                            AS customer_name,
    c.c_mktsegment                                      AS customer_market_segment,
    LEFT(c.c_phone, 2)                                  AS customer_country_code,

    -- ── Geography dimensions ─────────────────────────────
    n.n_name                                            AS nation_name,
    r.r_name                                            AS region_name,

    -- ── Order dimensions ─────────────────────────────────
    o.o_orderstatus                                     AS order_status,
    o.o_orderdate                                       AS order_date,
    YEAR(o.o_orderdate)                                 AS order_year,

    -- ── Metrics (match semantic view expressions) ─────────
    -- CUSTOMER entity
    COUNT(DISTINCT c.c_custkey)                         AS customer_count,
    -- ORDERS entity
    COUNT(DISTINCT o.o_orderkey)                        AS order_count,
    SUM(o.o_totalprice)                                 AS total_order_value,
    AVG(o.o_totalprice)                                 AS order_average_value,
    COUNT(l.l_linenumber)                               AS total_line_items,
    AVG(COUNT(l.l_linenumber)) OVER (
        PARTITION BY o.o_orderkey
    )                                                   AS avg_line_items_per_order,
    -- LINEITEM entity
    SUM(l.l_extendedprice * (1 - l.l_discount))        AS total_revenue,
    AVG(l.l_discount)                                   AS avg_discount,
    -- SUPPLIER entity
    COUNT(DISTINCT s.s_suppkey)                         AS supplier_count

FROM SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.ORDERS      o
JOIN SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.CUSTOMER    c  ON o.o_custkey      = c.c_custkey
JOIN SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.NATION      n  ON c.c_nationkey    = n.n_nationkey
JOIN SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.REGION      r  ON n.n_regionkey    = r.r_regionkey
JOIN SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.LINEITEM    l  ON l.l_orderkey     = o.o_orderkey
JOIN SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.SUPPLIER    s  ON l.l_suppkey      = s.s_suppkey

GROUP BY
    c.c_name, c.c_mktsegment, LEFT(c.c_phone, 2),
    n.n_name, r.r_name,
    o.o_orderstatus, o.o_orderdate, YEAR(o.o_orderdate)
