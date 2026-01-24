-- Migration: Add Imports Table

CREATE TABLE IF NOT EXISTS imports (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    counselling_type_id INTEGER REFERENCES counselling_types(id),
    admin_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    record_count INTEGER DEFAULT 0
);

-- Add import_id to cutoffs
ALTER TABLE cutoffs 
ADD COLUMN IF NOT EXISTS import_id INTEGER REFERENCES imports(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_cutoffs_import ON cutoffs(import_id);
