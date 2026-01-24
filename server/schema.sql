-- Database Schema for College Predictor

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user', -- 'admin', 'user'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE, -- e.g., 'JEE_MAIN'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS counselling_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'JoSAA', 'CSAB'
    exam_id INTEGER REFERENCES exams(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS colleges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50), -- Institute Code
    state VARCHAR(100),
    type VARCHAR(50), -- 'IIT', 'NIT', 'GFTI', etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, state)
);

CREATE TABLE IF NOT EXISTS branches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL, -- e.g., 'CSE', 'ECE'
    UNIQUE(code)
);

-- Main Cutoff Data Table
CREATE TABLE IF NOT EXISTS cutoffs (
    id SERIAL PRIMARY KEY,
    college_id INTEGER REFERENCES colleges(id) ON DELETE CASCADE,
    branch_id INTEGER REFERENCES branches(id) ON DELETE CASCADE,
    counselling_type_id INTEGER REFERENCES counselling_types(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    round INTEGER NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'OPEN', 'OBC-NCL', etc.
    quota VARCHAR(20) NOT NULL, -- 'AI', 'HS', 'OS'
    gender VARCHAR(20) NOT NULL, -- 'Gender-Neutral', 'Female-Only'
    opening_rank INTEGER NOT NULL,
    closing_rank INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Unique constraint to prevent duplicates
    UNIQUE(college_id, branch_id, counselling_type_id, year, round, category, quota, gender)
);

-- Indexes for faster search
CREATE INDEX idx_cutoffs_college ON cutoffs(college_id);
CREATE INDEX idx_cutoffs_branch ON cutoffs(branch_id);
CREATE INDEX idx_cutoffs_year ON cutoffs(year);
CREATE INDEX idx_cutoffs_category ON cutoffs(category);
CREATE INDEX idx_cutoffs_rank ON cutoffs(closing_rank);

-- Seed Initial Data
INSERT INTO exams (name, code) VALUES ('JEE Main', 'JEE_MAIN') ON CONFLICT DO NOTHING;
INSERT INTO counselling_types (name, exam_id) 
SELECT 'JoSAA', id FROM exams WHERE code = 'JEE_MAIN'
ON CONFLICT DO NOTHING;

INSERT INTO counselling_types (name, exam_id) 
SELECT 'CSAB', id FROM exams WHERE code = 'JEE_MAIN'
ON CONFLICT DO NOTHING;

-- Default Admin User (Password: admin123)
-- Hash generated using bcrypt
INSERT INTO users (username, password_hash, role)
VALUES ('admin', '$2b$10$X7.X.X.X.X.X.X.X.X.X.X', 'admin') -- Placeholder hash, will set real one in setup
ON CONFLICT DO NOTHING;
