# Smart University Notice Alert System

A web-based university notification system developed to automatically monitor Wayamba University of Sri Lanka (WUSL) Faculty of Applied Sciences notices and results and notify registered students through email.

## 🚀 Project Overview

Students often need to repeatedly check the university website for important notices, examination information, results, deadlines, and other academic announcements.

The **Smart University Notice Alert System** automates this process.

The system periodically checks the WUSL notices and results pages using an automated GitHub Actions workflow. When a new notice or result is detected, the information is stored in Supabase and notification emails are sent to subscribed users.

## ✨ Main Features

* 🔐 Student registration and login
* 📧 Email verification and authentication
* 🔔 Automatic university notice notifications
* 📊 Automatic results notifications
* 👤 Subscriber management
* ⚙️ Notification preferences
* 🗄️ Supabase database
* 📜 Notification history
* 🌐 Responsive web interface
* 🤖 Automated background monitoring
* 🔄 Duplicate-notification prevention
* 📱 Mobile-friendly interface

## 🏗️ System Architecture

```text
                    WUSL Website
                         │
                         ▼
              ┌─────────────────────┐
              │   GitHub Actions    │
              │                     │
              │ Scheduled Workflow  │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │ Notice / Result     │
              │ Checker             │
              │                     │
              │ TypeScript +        │
              │ Cheerio             │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │      Supabase       │
              │                     │
              │ • Notices           │
              │ • Results           │
              │ • Subscribers       │
              │ • Notification Logs │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │   Email Service     │
              │                     │
              │   SMTP / Nodemailer │
              └──────────┬──────────┘
                         │
                         ▼
                   Student Email
```

## 🛠️ Technology Stack

### Frontend

* Next.js
* React
* TypeScript
* CSS

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

### Deployment

* Vercel

### Version Control

* Git
* GitHub

## 📁 Project Structure

```text
wusl-notice-alert/
│
├── .github/
│   └── workflows/
│       └── check-notices.yml
│
├── app/
│   ├── api/
│   │   └── cron/
│   │       └── check-notices/
│   │           └── route.ts
│   │
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts
│   │
│   ├── dashboard/
│   ├── login/
│   ├── signup/
│   ├── forgot-password/
│   ├── reset-password/
│   └── page.tsx
│
├── lib/
│   └── supabase.ts
│
├── scripts/
│   ├── check-notices.ts
│   └── check-results.ts
│
├── public/
│
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

## 🔄 How Automatic Notice Checking Works

The monitoring system runs through GitHub Actions.

```text
GitHub Actions
      │
      ▼
Run scheduled workflow
      │
      ▼
check-notices.ts
      │
      ▼
Fetch WUSL notices page
      │
      ▼
Extract notice information
      │
      ▼
Check Supabase
      │
      ├── Existing notice
      │       ↓
      │     Ignore
      │
      └── New notice
              ↓
        Save to Supabase
              ↓
        Find subscribers
              ↓
        Send email
```

The same approach is used for checking university results.

## ⏰ Automated Workflow

The GitHub Actions workflow is defined in:

```text
.github/workflows/check-notices.yml
```

The workflow automatically executes the notice and result checking scripts according to the configured cron schedule.

> GitHub Actions scheduled workflows are not guaranteed to start at the exact second or minute specified by the cron expression. They may experience small delays depending on GitHub Actions availability.

## 🗄️ Supabase Database

The system uses Supabase to manage application data.

### Main tables

```text
public
│
├── notices
│   ├── id
│   ├── title
│   ├── url
│   ├── published_date
│   └── created_at
│
├── results
│
├── subscribers
│
└── notification_logs
```

### `notices`

Stores detected university notices and prevents the same notice from being processed repeatedly.

### `results`

Stores detected university results.

### `subscribers`

Stores users who have registered for notifications and their notification preferences.

### `notification_logs`

Records notification activity and helps prevent duplicate notifications.

## 📧 Email Notification Process

When a new notice is detected:

```text
New Notice
    │
    ▼
Supabase
    │
    ▼
Find subscribed users
    │
    ▼
Generate email
    │
    ▼
SMTP / Nodemailer
    │
    ▼
Student receives notification
```

## 🔐 Security

Sensitive configuration values are stored using environment variables and GitHub Secrets.

Examples include:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASSWORD
CRON_SECRET
```

> Never commit `.env.local`, passwords, SMTP credentials, Supabase service-role keys, or other secrets to GitHub.

## 💻 Local Development

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

Create a `.env.local` file and configure the required environment variables.

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## 🧪 Running the Notice Checker

To run the notice checker manually:

```bash
npx tsx scripts/check-notices.ts
```

To run the results checker:

```bash
npx tsx scripts/check-results.ts
```

## 🌐 Deployment

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

## 📌 Project Evolution

This project evolved from an earlier Python-based university notice monitoring prototype.

### Earlier version

```text
Python
   ↓
BeautifulSoup
   ↓
WUSL website
   ↓
TXT files
   ↓
Gmail SMTP
   ↓
GitHub Actions
```

### Current version

```text
Next.js + TypeScript
        ↓
     Cheerio
        ↓
   WUSL website
        ↓
     Supabase
        ↓
Subscribers + Notification Logs
        ↓
   SMTP / Nodemailer
        ↓
      Email
```

The current version expands the original idea into a complete web-based university notification platform with authentication, subscriptions, database storage, notification preferences, and automated monitoring.

## 🎯 Future Improvements

Planned improvements include:

* 📱 Progressive Web App support
* 🔔 Browser push notifications
* 📲 Mobile application
* 🧠 Intelligent notice categorization
* 🔎 Advanced notice search
* 📅 Examination and event reminders
* 📊 Notification analytics
* 👨‍💼 Administrative dashboard
* 📚 Personalized academic notifications
* 🏫 Support for additional university faculties

## 👨‍💻 Developer

**Lahiru Madhushan**

Wayamba University of Sri Lanka
Faculty of Applied Sciences

GitHub: [lahiru-ai](https://github.com/lahiru-ai)

## 📄 License

This project is developed as an academic and educational project.

---

⭐ **Smart University Notice Alert System**

Automatically bringing important university announcements to students instead of making students repeatedly search for them.
