-- Aldacore Database Initialization Script
-- This script sets up the initial database configuration

-- Create database extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create indexes for better performance (these will be created by SQLAlchemy but we can optimize)
-- The actual tables will be created by SQLAlchemy models

-- Set timezone
SET timezone = 'UTC';

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Print initialization completion message
SELECT 'Aldacore database initialized successfully' AS message;