-- Staging: Streaming provider lookup table (1,526 providers)
-- Renames id → provider_id for consistent joins downstream.

SELECT
    id               AS provider_id,
    technical_name,
    clear_name,
    full_name,
    monetization_types

FROM DB_JW_SHARED.CHALLENGE.PACKAGES
