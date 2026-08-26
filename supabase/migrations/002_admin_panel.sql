-- =============================================
-- WUSL Notice Alert — Admin Panel Migration
-- =============================================
-- Run this in Supabase SQL Editor.
-- Admin identification is purely via ADMIN_EMAILS
-- env var checked at application level (no is_admin column).
--
-- Regarding sent_at on existing notification_logs rows:
--   The notification_logs table has NO created_at column,
--   so there is no historical timestamp to backfill from.
--   Existing rows receive NULL for sent_at (honest "unknown").
--   Only new rows get sent_at = NOW() via the column default.
--   status = 'sent' IS safe for existing rows because any
--   record that exists in notification_logs was successfully logged.
-- =============================================

-- 1. Extend notification_logs with status tracking
-- =============================================

-- status: safe default for existing rows. A row in notification_logs
-- means the notification was attempted and logged, so 'sent' is accurate.
ALTER TABLE notification_logs
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'sent';

-- sent_at: added WITHOUT a default so existing rows stay NULL.
-- PostgreSQL 11+ applies ADD COLUMN DEFAULT to existing rows
-- via a catalog-only rewrite — we avoid that here.
ALTER TABLE notification_logs
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

-- Now set the default for FUTURE inserts only.
-- This is a metadata-only change; existing NULL rows are not affected.
ALTER TABLE notification_logs
  ALTER COLUMN sent_at SET DEFAULT NOW();

ALTER TABLE notification_logs
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

ALTER TABLE notification_logs
  ADD COLUMN IF NOT EXISTS error_message TEXT;

ALTER TABLE notification_logs
  ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Indexes for admin query patterns
CREATE INDEX IF NOT EXISTS idx_notification_logs_status
  ON notification_logs (status);

CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at
  ON notification_logs (sent_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_notification_logs_channel
  ON notification_logs (channel);

-- Composite index for analytics queries
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at_channel
  ON notification_logs (sent_at DESC NULLS LAST, channel);

-- 2. Admin activity logs
-- =============================================

CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_admin_user
  ON admin_activity_logs (admin_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_action
  ON admin_activity_logs (action, created_at DESC);

-- 3. Add created_at to subscribers if missing
-- =============================================

ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill existing rows that have NULL created_at
UPDATE subscribers SET created_at = NOW() WHERE created_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_subscribers_created_at
  ON subscribers (created_at DESC);
