-- ============================================
-- QLess Migration Script
-- Run this if the DB was created before the
-- started_at column was added to the schema.
-- ============================================
USE qless;

-- Add started_at column if it doesn't exist
ALTER TABLE tokens 
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMP NULL AFTER called_at;

-- Add completed_at column if it doesn't exist
ALTER TABLE tokens 
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP NULL AFTER started_at;

-- Add service_duration column if it doesn't exist
ALTER TABLE tokens 
  ADD COLUMN IF NOT EXISTS service_duration INT AFTER completed_at;

-- Verify columns exist
DESCRIBE tokens;
