-- ============================================================
-- Snowflake setup: create analytics tables for Lightdash test
-- Run with:
--   snow sql -f snowflake_tables.sql --account OHHGHHL-ZM06890 \
--     --user sunjay.nair@moia.io --password 'u#ZPXBy7STBJwr' \
--     --warehouse DB_TEAM_7
-- ============================================================

USE WAREHOUSE WH_TEAM_7_XS;
USE DATABASE DB_TEAM_7;

CREATE SCHEMA IF NOT EXISTS DB_TEAM_7.MARTS;

-- ── 1. Orders summary ───────────────────────────────────────
-- Aggregated order metrics by status, priority and month.
CREATE OR REPLACE TABLE DB_TEAM_7.MARTS.orders_summary AS
SELECT
    o_orderstatus                               AS order_status,
    o_orderpriority                             AS order_priority,
    DATE_TRUNC('month', o_orderdate)::DATE      AS order_month,
    COUNT(*)                                    AS order_count,
    SUM(o_totalprice)                           AS total_revenue,
    AVG(o_totalprice)                           AS avg_order_value,
    COUNT(DISTINCT o_custkey)                   AS unique_customers
FROM SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.ORDERS
GROUP BY 1, 2, 3;

-- ── 2. Revenue by nation ────────────────────────────────────
-- Customer revenue broken down by nation and region.
CREATE OR REPLACE TABLE DB_TEAM_7.MARTS.revenue_by_nation AS
SELECT
    n.n_name                                    AS nation,
    r.r_name                                    AS region,
    DATE_TRUNC('year', o.o_orderdate)::DATE     AS order_year,
    COUNT(DISTINCT o.o_orderkey)                AS order_count,
    SUM(l.l_extendedprice * (1 - l.l_discount)) AS net_revenue,
    SUM(l.l_extendedprice
        * (1 - l.l_discount)
        * (1 - l.l_tax))                        AS net_profit
FROM SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.LINEITEM  l
JOIN SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.ORDERS    o  ON l.l_orderkey   = o.o_orderkey
JOIN SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.CUSTOMER  c  ON o.o_custkey    = c.c_custkey
JOIN SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.NATION    n  ON c.c_nationkey  = n.n_nationkey
JOIN SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.REGION    r  ON n.n_regionkey  = r.r_regionkey
GROUP BY 1, 2, 3;

-- ── 3. Part performance ─────────────────────────────────────
-- Which parts drive the most revenue, grouped by type and segment.
CREATE OR REPLACE TABLE DB_TEAM_7.MARTS.part_performance AS
SELECT
    p.p_type                                    AS part_type,
    p.p_size                                    AS part_size,
    p.p_brand                                   AS brand,
    COUNT(DISTINCT l.l_orderkey)                AS order_count,
    SUM(l.l_quantity)                           AS total_quantity,
    SUM(l.l_extendedprice)                      AS gross_revenue,
    SUM(l.l_extendedprice * (1 - l.l_discount)) AS net_revenue,
    AVG(l.l_discount)                           AS avg_discount_rate
FROM SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.LINEITEM l
JOIN SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.PART     p ON l.l_partkey = p.p_partkey
GROUP BY 1, 2, 3;

-- ── 4. Supplier reliability ─────────────────────────────────
-- Late shipment rate and average delay per supplier nation.
CREATE OR REPLACE TABLE DB_TEAM_7.MARTS.supplier_reliability AS
SELECT
    n.n_name                                                        AS supplier_nation,
    r.r_name                                                        AS supplier_region,
    COUNT(*)                                                        AS total_lineitems,
    COUNT_IF(l.l_receiptdate > l.l_commitdate)                     AS late_deliveries,
    ROUND(
        COUNT_IF(l.l_receiptdate > l.l_commitdate) * 100.0 / COUNT(*),
        2
    )                                                               AS late_rate_pct,
    AVG(DATEDIFF('day', l.l_commitdate, l.l_receiptdate))          AS avg_delay_days
FROM SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.LINEITEM  l
JOIN SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.SUPPLIER  s ON l.l_suppkey    = s.s_suppkey
JOIN SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.NATION    n ON s.s_nationkey  = n.n_nationkey
JOIN SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.REGION    r ON n.n_regionkey  = r.r_regionkey
GROUP BY 1, 2;

-- ── Confirm ─────────────────────────────────────────────────
SELECT 'orders_summary'      AS table_name, COUNT(*) AS rows FROM DB_TEAM_7.MARTS.orders_summary      UNION ALL
SELECT 'revenue_by_nation',                 COUNT(*)          FROM DB_TEAM_7.MARTS.revenue_by_nation   UNION ALL
SELECT 'part_performance',                  COUNT(*)          FROM DB_TEAM_7.MARTS.part_performance    UNION ALL
SELECT 'supplier_reliability',              COUNT(*)          FROM DB_TEAM_7.MARTS.supplier_reliability;
