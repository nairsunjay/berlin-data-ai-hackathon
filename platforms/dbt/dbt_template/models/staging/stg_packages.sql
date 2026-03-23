-- Staging: streaming provider lookup
-- Source: PACKAGES (1,526 rows)
-- Renames id → provider_id for consistent joins across the pipeline.

with source as (
    select * from {{ ref('base_packages') }}
)

select
    id               as provider_id,
    technical_name,
    clear_name,
    full_name,
    monetization_types
from source
