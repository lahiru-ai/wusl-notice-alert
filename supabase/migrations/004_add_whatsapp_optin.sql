-- =============================================
-- WUSL Notice Alert — WhatsApp Opt-in Migration
-- =============================================
-- Collect WhatsApp numbers now for future use.
-- No WhatsApp messages are sent yet.
--
-- Naming notes:
--   whatsapp_number  — stored in E.164 format, e.g. +94771234567 (preferred)
--   whatsapp_opted_in — explicit user consent to receive future WhatsApp
--                      notifications. Nothing is sent until this is true
--                      AND an actual sending implementation exists.
--   whatsapp_verified — reserved for a future verification flow. Always
--                      FALSE for now; do NOT mark verified without a real
--                      verification process.
--
-- Legacy columns (phone_number, whatsapp_enabled) are intentionally LEFT
-- in place so existing notification scripts and admin surfaces keep working.
-- =============================================

ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS whatsapp_opted_in BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS whatsapp_verified BOOLEAN NOT NULL DEFAULT FALSE;