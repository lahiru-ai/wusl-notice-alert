# Smart University Notice Alert System

A web-based university notification system developed to automatically monitor Wayamba University of Sri Lanka (WUSL) Faculty of Applied Sciences notices, examination results, and examination venue updates and notify registered students through email and WhatsApp.

## Project Overview

Students often need to repeatedly check the university website for important notices, examination information, results, deadlines, and other academic announcements.

The **Smart University Notice Alert System** automates this process.

The system periodically checks the WUSL notices and results pages using an automated GitHub Actions workflow. When a new notice, result, or venue update is detected, the information is stored in Supabase and notification emails/WhatsApp messages are sent to subscribed users.

## Main Features

* Student registration and login
* Email verification and authentication
* Automatic university notice notifications
* Automatic examination result notifications
* Automatic examination venue notifications
* PDF detection and delivery (email attachments + WhatsApp documents)
* WhatsApp notification channel
* Subscriber management
* Notification preferences (per type and channel)
* Account deletion
* Supabase database
* Notification history with channel tracking
* Responsive web interface
* Automated background monitoring
* Duplicate-notification prevention
* Mobile-friendly interface

## System Architecture

```text
                    WUSL Website
                         |
                         v
              +---------------------+
              |   GitHub Actions    |
              |                     |
              | Scheduled Workflow  |
              +----------+----------+
                         |
                         v
              +---------------------+
              | Notice / Result /   |
              | Venue Checker       |
              |                     |
              | TypeScript +        |
              | Cheerio             |
              +----------+----------+
                         |
                         v
              +---------------------+
              |      Supabase       |
              |                     |
              | • Notices           |
              | • Results           |
              | • Exam Venues       |
              | • Subscribers       |
              | • Notification Logs |
              +----------+----------+
                         |
              +----------+----------+
              |                     |
              v                     v
    +-----------------+   +-----------------+
    | Email Service   |   | WhatsApp API    |
    | SMTP/Nodemailer |   | Cloud API       |
    +--------+--------+   +--------+--------+
             |                     |
             v                     v
       Student Email        Student WhatsApp
```

## Technology Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS

### Backend / Database

* Supabase
* PostgreSQL
* Supabase Authentication

### Notice Monitoring

* TypeScript
* Cheerio
* Node.js

### Automation

* GitHub Actions
* Cron-based scheduled workflow

### Email

* Nodemailer
* SMTP

### WhatsApp (optional)

* WhatsApp Business Cloud API

### Deployment

* Vercel

### Version Control

* Git
* GitHub

## Project Structure

```text
wusl-notice-alert/
|
+-- .github/
|   +-- workflows/
|       +-- check-notices.yml
|
+-- app/
|   +-- api/
|   |   +-- cron/check-notices/route.ts
|   |   +-- delete-account/route.ts
|   +-- auth/callback/route.ts
|   +-- dashboard/page.tsx
|   +-- login/page.tsx
|   +-- signup/page.tsx
|   +-- forgot-password/page.tsx
|   +-- reset-password/page.tsx
|   +-- success/page.tsx
|   +-- page.tsx
|   +-- layout.tsx
|
+-- lib/
|   +-- supabase.ts
|   +-- whatsapp.ts
|
+-- scripts/
|   +-- check-notices.ts
|   +-- check-results.ts
|   +-- check-venues.ts
|   +-- send-notification.ts
|   +-- send-result-notification.ts
|
+-- supabase/
|   +-- migrations/
|       +-- 001_add_v2_features.sql
|
+-- public/
+-- .env.example
+-- package.json
+-- tsconfig.json
+-- next.config.ts
+-- README.md
```

## How Automatic Notice Checking Works

The monitoring system runs through GitHub Actions.

```text
GitHub Actions
      |
      v
Run scheduled workflow
      |
      v
check-notices.ts / check-results.ts / check-venues.ts
      |
      v
Fetch WUSL page
      |
      v
Extract notice information
      |
      v
Check Supabase
      |
      +-- Existing
      |       |
      |     Ignore
      |
      +-- New
              |
        Save to Supabase
              |
        Find subscribers
              |
        Send email + WhatsApp
```

## Automated Workflow

The GitHub Actions workflow is defined in:

```text
.github/workflows/check-notices.yml
```

The workflow runs every 10 minutes and checks:
1. University notices
2. Examination results
3. Examination venue updates

> GitHub Actions scheduled workflows are not guaranteed to start at the exact second or minute specified by the cron expression.

## Supabase Database

The system uses Supabase to manage application data.

### Main tables

```text
public
|
+-- notices
|   +-- id
|   +-- title
|   +-- url
|   +-- pdf_url
|   +-- published_date
|   +-- created_at
|
+-- results
|   +-- id
|   +-- title
|   +-- url
|   +-- pdf_url
|   +-- published_date
|   +-- created_at
|
+-- exam_venues
|   +-- id
|   +-- title
|   +-- url
|   +-- pdf_url
|   +-- published_date
|   +-- created_at
|
+-- subscribers
|   +-- id
|   +-- user_id
|   +-- email
|   +-- notice_enabled
|   +-- result_enabled
|   +-- venue_enabled
|   +-- whatsapp_enabled
|   +-- phone_number
|
+-- notification_logs
    +-- id
    +-- subscriber_id
    +-- result_id
    +-- venue_id
    +-- notice_id
    +-- channel
```

### Table descriptions

**notices** - Stores detected university notices and prevents duplicates. Includes PDF URL when available.

**results** - Stores detected examination results. Includes PDF URL when available.

**exam_venues** - Stores detected examination venue notices from the dedicated venue page. Includes PDF URL when available.

**subscribers** - Stores registered users and their notification preferences, including phone numbers for WhatsApp.

**notification_logs** - Records notification activity per channel (email/whatsapp) and helps prevent duplicate notifications.

### Database migration

Run the v2 migration in the Supabase SQL Editor:

```text
supabase/migrations/001_add_v2_features.sql
```

This adds:
- `phone_number`, `whatsapp_enabled`, `venue_enabled` columns to `subscribers`
- New `exam_venues` table
- Extended `notification_logs` with `venue_id`, `notice_id`, `channel` columns

## Notification Types

### University Notices
- Source: `https://fas.wyb.ac.lk/notices/`
- PDFs detected from individual post pages when available
- Original PDF attached to notification emails
- Original PDF sent as WhatsApp document

### Examination Results
- Source: `https://fas.wyb.ac.lk/results/`
- Per-subscriber deduplication via notification_logs
- PDFs detected from individual post pages when available
- Original PDF attached to notification emails
- Original PDF sent as WhatsApp document

### Examination Venue
- Source: `https://fas.wyb.ac.lk/examination-venues/`
- Dedicated examination venue page (Elementor Pro Posts widget)
- Paginated: fetches all pages automatically
- Stored in `exam_venues` table
- PDFs detected from individual post pages when available
- Original PDF attached to notification emails
- Original PDF sent as WhatsApp document

## Notification Channels

### Email
- Always active for all users
- Sent via Gmail SMTP / Nodemailer
- Styled HTML emails with action buttons

### WhatsApp (optional)
- Requires WhatsApp Business API credentials
- Users must provide a phone number
- Users can enable/disable independently per channel
- Messages sent via WhatsApp Cloud API (server-side only)

## WhatsApp Business API Setup

1. Create a Meta Business account
2. Set up WhatsApp Business API
3. Get a phone number ID and API token
4. Add the credentials to environment variables:

```text
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_API_TOKEN=your_whatsapp_api_token
```

5. Add the secrets to GitHub Actions for automated notifications

## Account Deletion

Users can permanently delete their account from the dashboard.

The deletion process:
1. User clicks "Delete Account" in Account Settings
2. Confirmation dialog requires typing "DELETE"
3. Server-side API route removes:
   - All notification logs for the user
   - The subscriber record
   - The Supabase Auth user
4. Session is cleared
5. User is redirected to the homepage

The service-role key is used server-side only and never exposed to the client.

## Security

* Supabase Row Level Security (RLS) on all tables
* Users can only modify their own preferences
* Account deletion uses service-role key server-side only
* WhatsApp API credentials are server-side only
* Phone number validation on input
* PKCE authentication flow
* Never commit `.env.local` or secrets to GitHub

Sensitive configuration values:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASSWORD
CRON_SECRET
WHATSAPP_API_URL (optional)
WHATSAPP_PHONE_NUMBER_ID (optional)
WHATSAPP_API_TOKEN (optional)
```

## Environment Variables

See `.env.example` for a complete list of required and optional environment variables.

### Required

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) |
| `SMTP_HOST` | SMTP host (e.g., smtp.gmail.com) |
| `SMTP_PORT` | SMTP port (e.g., 587) |
| `SMTP_USER` | SMTP username/email |
| `SMTP_PASSWORD` | SMTP password/app password |
| `CRON_SECRET` | Secret for cron endpoint authentication |

### Optional (WhatsApp)

| Variable | Description |
|----------|-------------|
| `WHATSAPP_API_URL` | WhatsApp Graph API base URL |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp Business phone number ID |
| `WHATSAPP_API_TOKEN` | WhatsApp Business API bearer token |

## Local Development

Clone the repository:

```bash
git clone https://github.com/lahiru-ai/wusl-notice-alert.git
```

Enter the project:

```bash
cd wusl-notice-alert
```

Install dependencies:

```bash
npm install
```

Copy `.env.example` to `.env.local` and configure the required environment variables.

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Running Scripts Manually

Notice checker:

```bash
npx tsx scripts/check-notices.ts
```

Results checker:

```bash
npx tsx scripts/check-results.ts
```

Venue checker:

```bash
npx tsx scripts/check-venues.ts
```

Set `DRY_RUN=true` to preview without sending emails:

```bash
DRY_RUN=true npx tsx scripts/check-notices.ts
```

## Deployment

The web application is deployed using Vercel.

GitHub is used for:

* Source-code management
* Version control
* GitHub Actions automation
* Scheduled background jobs

Supabase is used for:

* Authentication
* Database storage
* Subscriber management
* Notification records

### Post-deployment steps

1. Run the database migration in Supabase SQL Editor
2. Add new environment variables to Vercel (if using WhatsApp)
3. Add WhatsApp secrets to GitHub Actions (if using WhatsApp)
4. Verify the cron workflow runs successfully

## Project Evolution

This project evolved from an earlier Python-based university notice monitoring prototype.

### Earlier version

```text
Python
   |
   v
BeautifulSoup
   |
   v
WUSL website
   |
   v
TXT files
   |
   v
Gmail SMTP
   |
   v
GitHub Actions
```

### Current version (v2)

```text
Next.js + TypeScript
        |
     Cheerio
        |
   WUSL website
        |
     Supabase
        |
Subscribers + Notification Logs
        |
  +-----+-----+
  |           |
SMTP      WhatsApp API
  |           |
Email    WhatsApp
```

## Developer

**Lahiru Madhushan**

Wayamba University of Sri Lanka
Faculty of Applied Sciences

GitHub: [lahiru-ai](https://github.com/lahiru-ai)

## License

This project is developed as an academic and educational project.

---

**Smart University Notice Alert System**

Automatically bringing important university announcements to students instead of making students repeatedly search for them.
