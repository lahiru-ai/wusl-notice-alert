-- =============================================
-- WUSL Notice Alert v2.0 Migration
-- =============================================
-- Run this migration in the Supabase SQL Editor
-- or via supabase db push if using the CLI.
-- =============================================

-- 1. Add new columns to subscribers table
-- =============================================

ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS phone_number TEXT;

ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS venue_enabled BOOLEAN NOT NULL DEFAULT TRUE;

-- 1b. Add pdf_url columns to existing tables
-- =============================================

ALTER TABLE notices
  ADD COLUMN IF NOT EXISTS pdf_url TEXT;

ALTER TABLE results
  ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- 2. Create exam_venues table
-- =============================================

CREATE TABLE IF NOT EXISTS exam_venues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  pdf_url TEXT,
  published_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE exam_venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read exam venues"
  ON exam_venues
  FOR SELECT
  TO authenticated
  USING (true);

-- 3. Extend notification_logs for multi-type and multi-channel tracking
-- =============================================

ALTER TABLE notification_logs
  ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES exam_venues(id) ON DELETE CASCADE;

ALTER TABLE notification_logs
  ADD COLUMN IF NOT EXISTS notice_id UUID REFERENCES notices(id) ON DELETE CASCADE;

ALTER TABLE notification_logs
  ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'email';

-- 4. Add indexes for common query patterns
-- =============================================

-- Partial unique indexes: prevent duplicate notifications
-- per subscriber + item + channel. These protect against
-- race conditions when concurrent cron runs overlap.

CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_logs_unique_notice
  ON notification_logs (subscriber_id, notice_id, channel)
  WHERE notice_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_logs_unique_result
  ON notification_logs (subscriber_id, result_id, channel)
  WHERE result_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_logs_unique_venue
  ON notification_logs (subscriber_id, venue_id, channel)
  WHERE venue_id IS NOT NULL;

-- Query performance indexes

CREATE INDEX IF NOT EXISTS idx_notification_logs_subscriber_result
  ON notification_logs (subscriber_id, result_id);

CREATE INDEX IF NOT EXISTS idx_notification_logs_subscriber_venue
  ON notification_logs (subscriber_id, venue_id);

CREATE INDEX IF NOT EXISTS idx_notification_logs_subscriber_notice
  ON notification_logs (subscriber_id, notice_id);

CREATE INDEX IF NOT EXISTS idx_subscribers_user_id
  ON subscribers (user_id);

CREATE INDEX IF NOT EXISTS idx_exam_venues_url
  ON exam_venues (url);
