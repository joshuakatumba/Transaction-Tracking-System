# Lennox POS -- Cross-Border Money Transfer System

Lennox is a web-based point-of-sale platform built for managing cross-border money transfers between regional branch offices. It enables branch operators to initiate transfers at one location and have them claimed at another, with a centralized admin panel for oversight.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Database Schema](#database-schema)
- [User Roles and Access Control](#user-roles-and-access-control)
- [Core Workflows](#core-workflows)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Database Setup](#database-setup)
- [Deployment](#deployment)

---

## Overview

Lennox solves a specific problem: facilitating money transfers between two geographically separate branches (Uganda and Sudan). A customer walks into one branch, deposits money, and receives a unique transfer code printed on a receipt. At the destination branch, a different operator enters that code to release the funds to the recipient.

The system tracks every transaction, logs every user action, and notifies relevant parties in real time.

---

## Architecture

The application follows a three-portal architecture:

```
                    +-------------------+
                    |   Supabase Cloud  |
                    | (Auth + Postgres) |
                    +--------+----------+
                             |
              +--------------+--------------+
              |              |              |
     +--------+---+  +------+------+  +----+--------+
     | Uganda     |  | Sudan       |  | Admin       |
     | Branch     |  | Branch      |  | Portal      |
     | Portal     |  | Portal      |  |             |
     +------------+  +-------------+  +-------------+
```

- **Branch Portals** (Uganda and Sudan) are used by frontline branch operators to send and receive money.
- **Admin Portal** is used by system administrators to manage users, monitor transactions, and review audit logs.
- **Supabase** provides authentication, the PostgreSQL database, and real-time event broadcasting.

All three portals share a single Next.js application, separated by route groups (`/uganda/*`, `/sudan/*`, `/admin/*`), each with its own layout, theme, and access restrictions.

---

## Technology Stack

| Layer        | Technology                          |
|--------------|-------------------------------------|
| Framework    | Next.js 16.2.3 (App Router, Turbopack) |
| Language     | TypeScript                          |
| UI           | React 19, Vanilla CSS, Lucide Icons |
| Font         | Inter (Google Fonts)                |
| Auth         | Supabase Auth (email/password)      |
| Database     | PostgreSQL via Supabase             |
| Real-time    | Supabase Realtime (notifications)   |
| Deployment   | Node.js (`npm run build && npm start`) |

---

## Database Schema

The database consists of five tables:

### branches

Stores the branch offices that operate within the system.

| Column     | Type        | Description                  |
|------------|-------------|------------------------------|
| id         | UUID (PK)   | Auto-generated identifier    |
| name       | TEXT UNIQUE | Branch display name          |
| created_at | TIMESTAMPTZ | Record creation timestamp    |

Seeded with two rows: `Uganda Branch` and `Sudan Branch`.

### users

Stores user profiles, linked to Supabase Auth via the `id` column.

| Column     | Type        | Description                          |
|------------|-------------|--------------------------------------|
| id         | UUID (PK)   | References `auth.users(id)`          |
| role       | ENUM        | `admin`, `branch_user`, or `pending` |
| branch_id  | UUID (FK)   | References `branches(id)`, nullable  |
| full_name  | TEXT        | Constructed from first + last name   |
| first_name | TEXT        | User first name                      |
| last_name  | TEXT        | User last name                       |
| contact    | TEXT        | Phone number                         |
| email      | TEXT        | Email address                        |
| created_at | TIMESTAMPTZ | Record creation timestamp            |

A database trigger (`handle_new_user`) automatically creates a row in this table whenever a new user registers through Supabase Auth. The trigger extracts the user metadata (name, contact) from the auth payload and inserts a profile with role `pending`.

### transactions

Stores every money transfer initiated in the system.

| Column         | Type        | Description                                  |
|----------------|-------------|----------------------------------------------|
| id             | UUID (PK)   | Auto-generated identifier                    |
| code           | TEXT UNIQUE | Human-readable transfer code (e.g., `UG-5BMWZ750`) |
| amount         | NUMERIC     | Transfer amount in USD                       |
| sender_name    | TEXT        | Name of the person depositing money          |
| sender_contact | TEXT        | Sender phone number                          |
| sender_address | TEXT        | Sender physical address                      |
| status         | ENUM        | `PENDING` or `CLAIMED`                       |
| branch_origin  | UUID (FK)   | Branch where the transfer was initiated      |
| branch_claimed | UUID (FK)   | Branch where the transfer was claimed        |
| created_by     | UUID (FK)   | User who created the transaction             |
| claimed_by     | UUID (FK)   | User who claimed the transaction             |
| created_at     | TIMESTAMPTZ | When the transfer was initiated              |
| claimed_at     | TIMESTAMPTZ | When the transfer was claimed                |

### logs

Stores an audit trail of every significant action in the system.

| Column     | Type        | Description                          |
|------------|-------------|--------------------------------------|
| id         | UUID (PK)   | Auto-generated identifier            |
| user_id    | UUID (FK)   | The user who performed the action    |
| action     | TEXT        | Action type (e.g., `CREATE_TRANSACTION`, `CLAIM_TRANSACTION`, `UPDATE_USER`, `DELETE_USER`) |
| details    | JSONB       | Structured metadata about the action |
| created_at | TIMESTAMPTZ | When the action occurred             |

### notifications

Stores in-app notifications delivered to users.

| Column     | Type        | Description                                |
|------------|-------------|--------------------------------------------|
| id         | UUID (PK)   | Auto-generated identifier                  |
| user_id    | UUID (FK)   | The recipient of the notification          |
| type       | TEXT        | Notification category                      |
| title      | TEXT        | Short heading                              |
| message    | TEXT        | Notification body text                     |
| metadata   | JSONB       | Additional structured data                 |
| is_read    | BOOLEAN     | Whether the user has seen it               |
| created_at | TIMESTAMPTZ | When the notification was generated        |

Notifications are generated automatically by database triggers when:
- A new user signs up (notifies all admins)
- A user role is updated from `pending` (notifies the user)
- A transaction is created (notifies the creator and all admins)
- A transaction is claimed (notifies the original creator)

---

## User Roles and Access Control

The system enforces three distinct roles:

### pending

Every new user starts with this role. They cannot access any portal. An admin must promote them to `branch_user` and assign them to a branch before they can use the system.

### branch_user

Frontline operators at a branch office. They can:
- Initiate money transfers (create transactions)
- Claim incoming transfers using a transfer code
- View their branch transaction history
- View their dashboard with summary statistics
- Receive real-time notifications

Branch users are restricted to their assigned branch portal. A user assigned to the Uganda branch accesses `/uganda/*` routes.

### admin

System administrators who manage the entire platform. They can:
- View and manage all registered users
- Promote or demote user roles
- Assign users to branches
- Delete user accounts
- View all transactions across all branches
- Review the complete audit log
- Receive notifications about new signups and transactions

---

## Core Workflows

### 1. User Registration and Activation

```
Customer registers via /signup
         |
         v
Supabase Auth creates auth.users row
         |
         v
Database trigger creates public.users row (role = 'pending')
         |
         v
Notification trigger alerts all admins
         |
         v
Admin opens /admin/users, sets role to 'branch_user', assigns a branch
         |
         v
User can now log in and access their branch portal
```

### 2. Sending Money (Creating a Transaction)

```
Branch operator at Branch A navigates to /[branch]/create
         |
         v
Fills in sender name, contact, address, and amount
         |
         v
Server action generates a unique transfer code (e.g., UG-5BMWZ750)
         |
         v
Transaction row inserted with status = 'PENDING', branch_origin = Branch A
         |
         v
Action logged to the logs table
         |
         v
Notification sent to the creator and all admins
         |
         v
Receipt displayed on screen with QR code and transfer code
         |
         v
Operator prints receipt for the customer (PDF saved as "Receipt - [Sender Name]")
```

### 3. Receiving Money (Claiming a Transaction)

```
Branch operator at Branch B navigates to /[branch]/claim
         |
         v
Enters the transfer code provided by the customer
         |
         v
Server action validates:
  - Code exists
  - Status is PENDING (not already claimed)
  - Claiming branch differs from origin branch (cross-branch only)
         |
         v
Transaction preview displayed (amount, sender, origin branch)
         |
         v
Operator confirms the claim
         |
         v
Transaction updated: status = 'CLAIMED', branch_claimed = Branch B, claimed_at = now
         |
         v
Action logged, notification sent to the original creator
```

### 4. Admin User Management

```
Admin navigates to /admin/users
         |
         v
Sees a table of all users with name, email, role, and branch
         |
         v
Clicks a user name to open their profile modal
         |
         v
Can change role (pending / branch_user / admin)
Can assign a branch (Uganda Branch / Sudan Branch)
Can delete the user account
         |
         v
Every action is logged with the admin's user ID and the target user details
```

---

## Project Structure

```
src/
  app/
    actions/
      admin.ts          -- Server actions: fetchUsers, updateUser, deleteUser, fetchLogs, fetchBranches
      auth.ts           -- Server actions: login, signup, signout
      notifications.ts  -- Server actions: fetchNotifications, markAllAsRead
      transactions.ts   -- Server actions: createTransaction, previewClaim, claimTransaction, fetchTransactions
    admin/
      dashboard/page.tsx   -- Admin dashboard with statistics
      layout.tsx           -- Admin layout with navigation and access guard
      logs/page.tsx        -- Audit log viewer
      transactions/page.tsx -- All-transactions viewer
      users/
        page.tsx           -- User management page
        UserTable.tsx      -- Interactive user table with profile modal
    denied/page.tsx        -- Access denied page
    login/
      page.tsx             -- Branch user login
      admin/page.tsx       -- Admin login
    signup/page.tsx        -- User registration
    sudan/
      claim/page.tsx       -- Claim a transfer
      create/page.tsx      -- Initiate a transfer
      dashboard/page.tsx   -- Branch dashboard
      history/page.tsx     -- Transaction history
      layout.tsx           -- Sudan layout with navigation and access guard
    uganda/
      claim/page.tsx       -- Claim a transfer
      create/page.tsx      -- Initiate a transfer
      dashboard/page.tsx   -- Branch dashboard
      history/page.tsx     -- Transaction history
      layout.tsx           -- Uganda layout with navigation and access guard
    globals.css            -- Global styles, theme variables, responsive design
    layout.tsx             -- Root layout
    page.tsx               -- Landing/routing page
  components/
    LayoutNavigation.tsx   -- Responsive sidebar navigation (desktop + mobile drawer)
    NotificationBell.tsx   -- Notification dropdown with real-time updates and toast alerts
  utils/
    NavLink.tsx            -- Active-state navigation link helper
    supabase/
      client.ts            -- Browser-side Supabase client
      proxy.ts             -- Supabase proxy configuration
      server.ts            -- Server-side Supabase client with cookie handling
supabase/
  migrations/
    01_init.sql            -- Tables, enums, and schema
    02_security.sql        -- Row-level security policies
    03_triggers.sql        -- User onboarding trigger
    04_seed.sql            -- Branch seed data
    05_permissions.sql     -- Table permissions
    06_notifications.sql   -- Notifications table, triggers, and RLS
```

---

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

These values are available from your Supabase project dashboard under Settings > API.

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm
- A Supabase project (free tier is sufficient)

### Installation

```bash
git clone https://github.com/joshuakatumba/r.git
cd r
npm install
```

### Configure Environment

```bash
cp .env.example .env.local
# Edit .env.local with your Supabase project URL and anon key
```

### Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

---

## Database Setup

Run the migration files in order against your Supabase project. This can be done through the Supabase SQL Editor in the dashboard.

1. `01_init.sql` -- Creates the core tables (branches, users, transactions, logs)
2. `02_security.sql` -- Enables Row-Level Security and creates access policies
3. `03_triggers.sql` -- Creates the user onboarding trigger that auto-populates the users table on signup
4. `04_seed.sql` -- Inserts the two branch records (Uganda Branch, Sudan Branch)
5. `05_permissions.sql` -- Grants necessary table permissions
6. `06_notifications.sql` -- Creates the notifications table, RLS policies, and all notification triggers

After running the migrations, the first user who registers with the email `kabcal04@gmail.com` will be automatically assigned the `admin` role by the onboarding trigger. All other users will start as `pending`.

---

## Deployment

### Build for Production

```bash
npm run build
npm start
```

### Notes

- The application requires a stable connection to Supabase. If you encounter `EAI_AGAIN` or network-related errors, verify your DNS configuration and internet connection.
- The notification system uses Supabase Realtime. Ensure that the `notifications` table is added to the `supabase_realtime` publication in your Supabase project if real-time toast alerts are not appearing.
- Receipts include a dynamically generated QR code via the qrserver.com API. An active internet connection is required for QR codes to render on printed receipts.
- The mobile navigation uses a drawer-style sidebar that slides in from the left. On desktop, the sidebar is always visible.
