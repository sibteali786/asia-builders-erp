-- Initial database setup for Asia Builders ERP
-- This runs once when container is first created

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas (optional - for organization)
-- CREATE SCHEMA IF NOT EXISTS core;
-- CREATE SCHEMA IF NOT EXISTS audit;

-- Set timezone
SET timezone = 'Asia/Karachi';

-- Log initialization
DO $$
BEGIN
  RAISE NOTICE 'Asia Builders ERP database initialized successfully';
END $$;
