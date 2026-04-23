-- Add template column to pairwises table
ALTER TABLE pairwises ADD COLUMN IF NOT EXISTS template TEXT;

-- Backfill existing demo pairwise
UPDATE pairwises 
SET template = 'value_vs_effort' 
WHERE share_token = 'demo-q3-features' OR name = 'FY27 Top Priorities';
