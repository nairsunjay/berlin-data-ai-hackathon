# Challenge 6: Content Licensing Intelligence — Architecture

Data pipeline for ranking JustWatch titles by AVOD and TVOD revenue potential, identifying underserved demand gaps, and surfacing cross-market licensing opportunities.

**Team:** 7 | **Warehouse:** `WH_TEAM_7_XS` | **Database:** `DB_TEAM_7`

---

## Full Architecture

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#29b5e8', 'primaryBorderColor': '#1a8cb8', 'primaryTextColor': '#fff', 'lineColor': '#636e7b', 'secondaryColor': '#f4f4f4', 'tertiaryColor': '#e8f4fd'}}}%%

graph TB
    subgraph sources["☁️ Snowflake — DB_JW_SHARED.CHALLENGE (Read-Only)"]
        T1["T1 — Events<br/>9.2M rows · Germany · Dec 2025"]
        T3["T3 — Events<br/>128M rows · 8 EU · 3 months"]
        OBJ["OBJECTS<br/>~13M rows · Title metadata"]
        PKG["PACKAGES<br/>1,526 rows · Provider lookup"]
    end

    subgraph collate["📚 Collate — Data Catalog"]
        CAT_EXPLORE["Schema browser<br/>Column descriptions<br/>Data profiles"]
        CAT_AI["AskCollate AI<br/>MCP Server"]
    end

    subgraph dbt_staging["dbt — Staging Layer (views → DB_TEAM_7.staging)"]
        STG_E["stg_events<br/>Dedup via rid<br/>Extract JSON → typed cols"]
        STG_O["stg_objects<br/>Movies + shows only<br/>Key metadata fields"]
        STG_P["stg_packages<br/>Provider lookup<br/>Rename id → provider_id"]
    end

    subgraph dbt_intermediate["dbt — Intermediate Layer (tables → DB_TEAM_7.intermediate)"]
        INT_ENG["int_title_engagement<br/>Engagement signals per title × market<br/>page_views, clicks, watchlist,<br/>avod_clickouts, tvod_clickouts"]
        INT_OFF["int_title_offers<br/>Offer landscape per title<br/>has_avod_offer, has_svod_offer,<br/>provider_count"]
    end

    subgraph dbt_marts["dbt — Marts Layer (tables → DB_TEAM_7.marts)"]
        FCT_LP["fct_licensing_priority<br/>AVOD score + TVOD score<br/>Cost proxy + ROI ranking<br/>Cross-market bonus"]
        FCT_UD["fct_underserved_demand<br/>High demand + no AVOD offers<br/>= licensing gap targets"]
        FCT_GL["fct_genre_licensing<br/>Genre × AVOD vs TVOD suitability<br/>Per-market heatmap data"]
    end

    subgraph cortex["🧠 Snowflake Cortex (Optional AI)"]
        LLM["COMPLETE — llama3.1-70b<br/>AVOD suitability classifier"]
        EMB["EMBED_TEXT_768<br/>Title similarity clustering"]
    end

    subgraph lightdash["📊 Lightdash — hackathon.lightdash.cloud"]
        DASH["Dashboard: Content Licensing Intelligence"]
        CH1["Licensing Priority Table<br/>Top 50 titles by ROI"]
        CH2["AVOD vs TVOD Quadrant<br/>Scatter: score × score"]
        CH3["Underserved Demand<br/>Bar: demand gap titles"]
        CH4["Genre Heatmap<br/>Genre × monetization"]
        CH5["Cross-Market Map<br/>Multi-market opportunities"]
    end

    T1 --> STG_E
    T3 -.->|"scale up later"| STG_E
    OBJ --> STG_O
    PKG --> STG_P

    sources -.->|"metadata"| collate
    collate -.->|"explore schema<br/>before building"| dbt_staging

    STG_E --> INT_ENG
    STG_E --> INT_OFF
    STG_P --> INT_OFF

    INT_ENG --> FCT_LP
    INT_OFF --> FCT_LP
    STG_O --> FCT_LP
    INT_ENG --> FCT_UD
    INT_OFF --> FCT_UD
    STG_O --> FCT_UD
    INT_ENG --> FCT_GL
    STG_O --> FCT_GL

    STG_O -.->|"optional"| LLM
    STG_O -.->|"optional"| EMB
    LLM -.-> FCT_LP
    EMB -.-> FCT_LP

    FCT_LP -->|"lightdash deploy"| DASH
    FCT_UD -->|"lightdash deploy"| DASH
    FCT_GL -->|"lightdash deploy"| DASH
    DASH --> CH1
    DASH --> CH2
    DASH --> CH3
    DASH --> CH4
    DASH --> CH5

    classDef source fill:#29b5e8,stroke:#1a8cb8,color:#fff
    classDef staging fill:#7bc96f,stroke:#5aa94e,color:#fff
    classDef intermediate fill:#f4a742,stroke:#d48e30,color:#fff
    classDef mart fill:#e85d75,stroke:#c24058,color:#fff
    classDef bi fill:#9b59b6,stroke:#7d3c98,color:#fff
    classDef ai fill:#3498db,stroke:#2980b9,color:#fff
    classDef catalog fill:#95a5a6,stroke:#7f8c8d,color:#fff

    class T1,T3,OBJ,PKG source
    class STG_E,STG_O,STG_P staging
    class INT_ENG,INT_OFF intermediate
    class FCT_LP,FCT_UD,FCT_GL mart
    class DASH,CH1,CH2,CH3,CH4,CH5 bi
    class LLM,EMB ai
    class CAT_EXPLORE,CAT_AI catalog
```

---

## Scoring Model

```mermaid
graph LR
    subgraph signals["Engagement Signals (per title)"]
        PV["page_views ×1"]
        TC["title_clicks ×2"]
        TP["trailer_plays ×3"]
        WA["watchlist_adds ×4"]
        FC["flatrate_clickouts ×3"]
        AC["avod_clickouts ×8"]
        RC["rent_clickouts ×10"]
        BC["buy_clickouts ×15"]
    end

    subgraph scores["Scoring"]
        AVOD["AVOD Score<br/>= Σ(weighted signals)<br/>× LN(markets + 1)"]
        TVOD["TVOD Score<br/>= Σ(rent + buy weighted)<br/>× LN(markets + 1)"]
        COST["Cost Proxy<br/>= IMDB×10 + recency<br/>+ content_type"]
    end

    subgraph output["Output Ranking"]
        ROI["licensing_priority_score<br/>= (AVOD + TVOD) / Cost"]
        GAP["is_avod_gap<br/>= high demand + no free offers"]
    end

    PV & TC & TP & WA & FC & AC --> AVOD
    RC & BC --> TVOD
    AVOD & TVOD & COST --> ROI
    AVOD --> GAP

    classDef signal fill:#7bc96f,stroke:#5aa94e,color:#fff
    classDef score fill:#f4a742,stroke:#d48e30,color:#fff
    classDef out fill:#e85d75,stroke:#c24058,color:#fff

    class PV,TC,TP,WA,FC,AC,RC,BC signal
    class AVOD,TVOD,COST score
    class ROI,GAP out
```

---

## Data Lineage (dbt model dependencies)

```mermaid
graph LR
    T1[base_events_t1] --> SE[stg_events]
    BO[base_objects] --> SO[stg_objects]
    BP[base_packages] --> SP[stg_packages]

    SE --> ITE[int_title_engagement]
    SE --> ITO[int_title_offers]
    SP --> ITO

    ITE --> FLP[fct_licensing_priority]
    ITO --> FLP
    SO --> FLP

    ITE --> FUD[fct_underserved_demand]
    ITO --> FUD
    SO --> FUD

    ITE --> FGL[fct_genre_licensing]
    SO --> FGL

    style T1 fill:#29b5e8,color:#fff
    style BO fill:#29b5e8,color:#fff
    style BP fill:#29b5e8,color:#fff
    style SE fill:#7bc96f,color:#fff
    style SO fill:#7bc96f,color:#fff
    style SP fill:#7bc96f,color:#fff
    style ITE fill:#f4a742,color:#fff
    style ITO fill:#f4a742,color:#fff
    style FLP fill:#e85d75,color:#fff
    style FUD fill:#e85d75,color:#fff
    style FGL fill:#e85d75,color:#fff
```

---

## Running the Pipeline

```bash
# 1. Set warehouse
snow sql -q "USE WAREHOUSE WH_TEAM_7_XS" -c hackathon

# 2. Run all models (T1 — Germany prototype)
cd platforms/dbt/dbt_template
dbt run

# 3. Spot-check the priority ranking
snow sql -q "SELECT * FROM DB_TEAM_7.marts.fct_licensing_priority ORDER BY licensing_priority_score DESC LIMIT 20" -c hackathon --format json

# 4. Check underserved demand titles
snow sql -q "SELECT * FROM DB_TEAM_7.marts.fct_underserved_demand ORDER BY demand_gap_rank LIMIT 20" -c hackathon --format json

# 5. Deploy to Lightdash
lightdash deploy

# 6. Scale up: edit stg_events.sql, change base_events_t1 → base_events_t3
#    Then re-run with a larger warehouse:
snow sql -q "USE WAREHOUSE WH_TEAM_7_S" -c hackathon
dbt run --select stg_events+
```

---

## Lightdash Dashboard Specs

| Chart | Type | X | Y | Color/Size |
|-------|------|---|---|------------|
| Licensing Priority Table | Table | title | avod_score, tvod_score, licensing_priority_score | object_type |
| AVOD vs TVOD Quadrant | Scatter | avod_score | tvod_score | object_type / unique_users |
| Underserved Demand | Bar (horizontal) | demand gap rank | title | — |
| Genre Heatmap | Heatmap / Table | genre | avod_roi vs tvod_roi | — |
| Cross-Market Opportunities | Bar | market_count | title | object_type |
