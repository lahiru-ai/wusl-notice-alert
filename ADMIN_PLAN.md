# Admin Panel Implementation Plan — WUSL Notice Alert

## Overview

Build a complete admin panel for the existing WUSL Notice Alert System. The admin area lives at `/admin` and is protected server-side. All existing functionality remains untouched.

## Architecture Decisions

| Decision | Choice |
|---|---|
| Admin identification | Email whitelist via `ADMIN_EMAILS` env var + `is_admin` column on `subscribers` |
| Charts | Recharts (lightweight React charting library) |
| Notification logs | Alter existing `notification_logs` table (add status, sent_at, delivered_at, error_message, metadata) |
| Server Supabase client | New `lib/supabase-server.ts` utility |
| Route protection | Next.js middleware at root `middleware.ts` |

---

## Phase 0: Database Migration

### File: `supabase/migrations/002_admin_panel.sql`

**Alter `notification_logs`:**
- `status` TEXT NOT NULL DEFAULT 'sent' — enum: 'sent', 'failed', 'pending'
- `sent_at` TIMESTAMPTZ DEFAULT NOW()
- `delivered_at` TIMESTAMPTZ
- `error_message` TEXT
- `metadata` JSONB — flexible field for extra data
- Indexes on `status`, `sent_at`, `channel`

**Create `admin_activity_logs`:**
- `id` UUID PK
- `admin_user_id` UUID NOT NULL
- `admin_email` TEXT NOT NULL
- `action` TEXT NOT NULL — e.g. 'login', 'manual_notification', 'test_notification', 'retry_notification', 'notice_check', 'settings_change'
- `details` JSONB
- `created_at` TIMESTAMPTZ DEFAULT NOW()
- Index on `admin_user_id`, `created_at`

**Add `is_admin` to `subscribers`:**
- `is_admin` BOOLEAN NOT NULL DEFAULT FALSE
- Index for fast admin lookups

**RLS policies:**
- Admin users can read all notification_logs
- Admin users can read/write admin_activity_logs
- Admin users can update subscriber is_admin status

---

## Phase 1: Core Infrastructure

### 1a. Environment Configuration

**File: `.env.example` (update)**
- Add `ADMIN_EMAILS` — comma-separated list of admin email addresses

### 1b. Server Supabase Client

**File: `lib/supabase-server.ts`**
- `createServerSupabaseClient()` — uses `createServerClient` from `@supabase/ssr` with cookie handling (same pattern as `auth/callback/route.ts`)
- `createAdminSupabaseClient()` — uses `createClient` from `@supabase/supabase-js` with `SUPABASE_SERVICE_ROLE_KEY` (same pattern as `api/delete-account/route.ts`)

### 1c. Middleware — Route Protection

**File: `middleware.ts` (root)**
- Intercepts all requests to `/admin*`
- Creates server Supabase client from cookies
- Calls `supabase.auth.getUser()`
- If not authenticated → redirect to `/login`
- If authenticated, queries `subscribers` table for `is_admin` via service-role client
- If not admin → redirect to `/dashboard` with error
- Passes admin user info through request headers/cookies for downstream use

### 1d. Admin Config

**File: `lib/admin-config.ts`**
- `ADMIN_EMAILS` parsed from env var
- `isAdminEmail(email: string)` helper function
- `getAdminUser(request)` helper to extract admin info from middleware

### 1e. Shared Admin UI Components

**Directory: `components/admin/`**

| Component | Purpose |
|---|---|
| `AdminSidebar.tsx` | Navigation sidebar with links to all admin pages |
| `AdminHeader.tsx` | Top header with admin user info and logout |
| `AdminLayout.tsx` | Wrapper combining sidebar + header + content area |
| `StatCard.tsx` | Reusable stat card (icon, label, value, trend) |
| `DataTable.tsx` | Reusable sortable table with pagination |
| `StatusBadge.tsx` | Status indicator (sent/failed/active/inactive) |
| `FilterBar.tsx` | Reusable filter/search bar |
| `EmptyState.tsx` | Empty state placeholder |
| `LoadingSpinner.tsx` | Loading state component |
| `ConfirmDialog.tsx` | Confirmation modal dialog |

---

## Phase 2: Admin API Routes

### 2a. Dashboard Stats

**File: `app/api/admin/stats/route.ts` (GET)**
- Returns: total_subscribers, active_subscribers, email_subscribers, whatsapp_subscribers, notifications_sent, failed_notifications, notices_detected, system_health
- Queries: `subscribers`, `notification_logs`, `notices` tables

### 2b. Subscriber Management

**File: `app/api/admin/subscribers/route.ts` (GET)**
- List all subscribers with pagination, search, and filters
- Query params: page, limit, search, channel (email/whatsapp), status (active/inactive)
- Joins with auth data for email verification status

**File: `app/api/admin/subscribers/[id]/route.ts` (GET)**
- Detailed subscriber info with notification timeline
- All notification_logs for this subscriber joined with notices/results/exam_venues

### 2c. Notification History

**File: `app/api/admin/notifications/route.ts` (GET)**
- List all notification_logs with pagination, filters
- Query params: page, limit, channel, status, date_from, date_to, notice_id, subscriber_id
- Joins with subscribers, notices, results, exam_venues for display data

**File: `app/api/admin/notifications/[id]/retry/route.ts` (POST)**
- Retry a failed notification
- Re-sends via the appropriate channel (email/WhatsApp)
- Updates notification_logs status

### 2d. Test Notifications

**File: `app/api/admin/test-notification/route.ts` (POST)**
- Body: { channel: 'email'|'whatsapp', recipient: string, subject?: string, message: string }
- Uses actual Nodemailer transport and WhatsApp API (real sends, not mocks)
- Logs to admin_activity_logs

### 2e. Manual Notifications

**File: `app/api/admin/manual-notification/route.ts` (POST)**
- Body: { target: 'all'|'email'|'whatsapp'|'selected', channel: 'email'|'whatsapp'|'both', subscriber_ids?: string[], subject: string, message: string }
- Sends to matching subscribers
- Records each send in notification_logs
- Logs to admin_activity_logs

### 2f. Notice Check Trigger

**File: `app/api/admin/check-notices/route.ts` (POST)**
- Reuses existing scraper logic from `scripts/check-notices.ts`
- Runs the check as a server-side function
- Returns results (new notices found, notifications sent)
- Logs to admin_activity_logs

### 2g. Analytics

**File: `app/api/admin/analytics/route.ts` (GET)**
- Returns daily/weekly/monthly notification counts
- Email vs WhatsApp usage breakdown
- Success/failure rates
- Time-series data for charts

### 2h. System Health

**File: `app/api/admin/health/route.ts` (GET)**
- Tests Supabase connectivity
- Tests SMTP connection (via nodemailer.verify())
- Tests WhatsApp API (optional, lightweight check)
- Tests notice source website (fetch head request)
- Returns status of each component

### 2i. Activity Logs

**File: `app/api/admin/activity-logs/route.ts` (GET)**
- List admin activity logs with pagination
- Filter by admin, action type, date range

---

## Phase 3: Admin Pages

### 3a. Admin Layout

**File: `app/admin/layout.tsx`**
- Server component that wraps all admin pages
- Renders AdminSidebar + AdminHeader + children content area
- Fetches current admin user for header display

### 3b. Dashboard

**File: `app/admin/page.tsx`**
- 8 stat cards in a grid (total subscribers, active, email, whatsapp, notifications sent, failed, notices detected, system health)
- Notification activity chart (line chart — last 30 days)
- Email vs WhatsApp usage chart (pie/donut chart)
- Recent notifications table (last 10)
- Quick actions panel

### 3c. Subscribers

**File: `app/admin/subscribers/page.tsx`**
- Data table with all subscribers
- Search by email
- Filter by: notification type preference, channel preference, active/inactive
- Columns: email, notice/result/venue enabled, whatsapp enabled, phone, verified, created_at
- Click row to view details

**File: `app/admin/subscribers/[id]/page.tsx`**
- Full subscriber profile
- All notification preferences
- WhatsApp phone number
- Email verification status (from auth)
- Subscription date
- Notification timeline: every notification sent, with notice title, channel, status, timestamps

### 3d. Notification History

**File: `app/admin/notifications/page.tsx`**
- Full notification log table
- Columns: notice/result/venue title, subscriber email, recipient, channel, status, sent_at, delivered_at, error_message
- Filters: date range, channel, status, notice, subscriber
- Retry button for failed notifications
- Pagination

### 3e. Test Notifications

**File: `app/admin/test/page.tsx`**
- Form: channel selector (email/whatsapp), recipient input, subject, message
- "Send Test to Myself" button (pre-fills admin's email/phone)
- Real-time success/failure result display
- Logs result to activity log

### 3f. Manual Notification

**File: `app/admin/manual-notify/page.tsx`**
- Step 1: Select recipients (all / email subscribers / whatsapp subscribers / select specific)
- Step 2: Select channel (email / whatsapp / both)
- Step 3: Compose message (subject + body)
- Step 4: Confirmation step showing recipient count and preview
- Step 5: Send and show results
- Records all sends in notification_logs

### 3g. Notice Monitoring

**File: `app/admin/monitoring/page.tsx`**
- Last website check timestamp
- Last successful check
- Last detected notice
- Notices detected today count
- GitHub Actions cron status (last run time, success/fail)
- "Check Now" button that triggers `POST /api/admin/check-notices`

### 3h. Analytics

**File: `app/admin/analytics/page.tsx`**
- Daily notification count (bar chart — last 30 days)
- Weekly notification count (bar chart — last 12 weeks)
- Monthly notification count (bar chart — last 12 months)
- Email success rate (gauge/percentage)
- WhatsApp success rate (gauge/percentage)
- Email vs WhatsApp usage (pie chart)
- Failed notification breakdown

### 3i. Activity Logs

**File: `app/admin/activity-logs/page.tsx`**
- Table of admin actions
- Columns: admin email, action, details, timestamp
- Filter by action type, date range

---

## Phase 4: Existing Notification Script Enhancement

To support the admin panel's notification features, the existing scripts need minor modifications:

### Modify `scripts/check-notices.ts`
- Export the `checkNotices()` function (currently only runs at module level)
- Extract the email transporter creation into a shared utility
- Add `status`, `sent_at`, `error_message` to notification_logs inserts
- Same changes for `check-results.ts` and `check-venues.ts`

### Create `lib/email.ts`
- Shared `createTransporter()` function
- Shared `sendNotificationEmail()` functions for notices/results/venues
- Eliminates duplication across all 5 scripts

---

## File Tree (New/Modified Files)

```
NEW FILES:
├── middleware.ts                              # Admin route protection
├── lib/
│   ├── supabase-server.ts                    # Server-side Supabase client
│   ├── admin-config.ts                       # Admin email whitelist config
│   └── email.ts                              # Shared email transport utilities
├── components/admin/
│   ├── AdminSidebar.tsx
│   ├── AdminHeader.tsx
│   ├── AdminLayout.tsx
│   ├── StatCard.tsx
│   ├── DataTable.tsx
│   ├── StatusBadge.tsx
│   ├── FilterBar.tsx
│   ├── EmptyState.tsx
│   ├── LoadingSpinner.tsx
│   └── ConfirmDialog.tsx
├── app/admin/
│   ├── layout.tsx                            # Admin layout (sidebar + header)
│   ├── page.tsx                              # Dashboard
│   ├── subscribers/
│   │   ├── page.tsx                          # Subscriber list
│   │   └── [id]/page.tsx                     # Subscriber detail + timeline
│   ├── notifications/page.tsx                # Notification history
│   ├── test/page.tsx                         # Test notification center
│   ├── manual-notify/page.tsx                # Manual notification composer
│   ├── monitoring/page.tsx                   # Notice monitoring
│   ├── analytics/page.tsx                    # Analytics charts
│   └── activity-logs/page.tsx                # Admin activity logs
├── app/api/admin/
│   ├── stats/route.ts
│   ├── subscribers/route.ts
│   ├── subscribers/[id]/route.ts
│   ├── notifications/route.ts
│   ├── notifications/[id]/retry/route.ts
│   ├── test-notification/route.ts
│   ├── manual-notification/route.ts
│   ├── check-notices/route.ts
│   ├── analytics/route.ts
│   ├── health/route.ts
│   └── activity-logs/route.ts
└── supabase/migrations/002_admin_panel.sql

MODIFIED FILES:
├── .env.example                              # Add ADMIN_EMAILS
├── package.json                              # Add recharts dependency
├── scripts/check-notices.ts                  # Export function, add status tracking
├── scripts/check-results.ts                  # Export function, add status tracking
└── scripts/check-venues.ts                   # Export function, add status tracking
```

---

## Routes Summary

| Route | Type | Description |
|---|---|---|
| `/admin` | Page | Admin dashboard |
| `/admin/subscribers` | Page | Subscriber management |
| `/admin/subscribers/[id]` | Page | Subscriber detail + timeline |
| `/admin/notifications` | Page | Notification history |
| `/admin/test` | Page | Test notification center |
| `/admin/manual-notify` | Page | Manual notification composer |
| `/admin/monitoring` | Page | Notice monitoring |
| `/admin/analytics` | Page | Analytics charts |
| `/admin/activity-logs` | Page | Admin activity logs |
| `/api/admin/stats` | GET | Dashboard statistics |
| `/api/admin/subscribers` | GET | List subscribers |
| `/api/admin/subscribers/[id]` | GET | Subscriber detail |
| `/api/admin/notifications` | GET | Notification history |
| `/api/admin/notifications/[id]/retry` | POST | Retry failed notification |
| `/api/admin/test-notification` | POST | Send test notification |
| `/api/admin/manual-notification` | POST | Send manual notification |
| `/api/admin/check-notices` | POST | Trigger notice check |
| `/api/admin/analytics` | GET | Analytics data |
| `/api/admin/health` | GET | System health check |
| `/api/admin/activity-logs` | GET | Admin activity logs |

---

## Security Measures

1. **Middleware protection**: All `/admin*` routes require authenticated + admin user
2. **Server-side only**: All admin API routes verify admin status before processing
3. **Service-role key isolation**: Only used in server-side API routes, never exposed to browser
4. **Input validation**: All admin inputs validated server-side before processing
5. **CSRF protection**: Origin header check on state-changing operations
6. **Activity logging**: All admin actions logged for audit trail
7. **No existing functionality broken**: Auth flow, notifications, and cron all remain unchanged

---

## Access Instructions

1. Set `ADMIN_EMAILS=your@email.com` in `.env.local`
2. The user with that email must have a subscriber account (signed up via `/signup`)
3. Run the SQL migration `002_admin_panel.sql` in Supabase SQL Editor
4. The middleware will automatically grant admin access to matching emails
5. Navigate to `/admin` to access the admin panel
