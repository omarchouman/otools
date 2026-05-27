# OTools — Dashboard & Authentication Design

**Date:** 2026-05-28
**Status:** Approved

---

## Overview

Add Supabase-backed authentication (email/password + Google OAuth) and a full dashboard shell (sidebar + top nav) to the OTools Next.js 16 / React 19 project. The dashboard hosts four tool categories: Password Generator, Marketing, Analysis, and AI Tools. A profile/settings page allows users to update their display name and avatar.

---

## Architecture

### Approach

**Supabase Auth + Next.js Middleware (Option A)**

Sessions are managed entirely via cookies using `@supabase/ssr`. A Next.js middleware file verifies and refreshes the session on every dashboard request server-side, preventing any flash of unauthenticated content. Supabase Row Level Security is preserved for future user-scoped tool data.

### Key packages

- `@supabase/ssr` — cookie-based session management for Next.js App Router
- `@supabase/supabase-js` — Supabase client
- `shadcn/ui` — UI component library (Tailwind-based)
- `lucide-react` — icons

---

## File & Route Structure

```
app/
├── (auth)/
│   ├── login/page.tsx              # Email+password login + Google OAuth button
│   ├── signup/page.tsx             # Email+password signup
│   └── auth/callback/route.ts      # OAuth + email confirmation callback handler
├── (dashboard)/
│   ├── layout.tsx                  # Sidebar + top nav shell (Server Component)
│   ├── page.tsx                    # /dashboard home/overview
│   ├── password-generator/page.tsx # Stub
│   ├── marketing/page.tsx          # Stub
│   ├── analysis/page.tsx           # Stub
│   ├── ai-tools/page.tsx           # Stub
│   └── settings/page.tsx           # Profile: avatar, display name, password
├── layout.tsx                      # Root layout (ThemeProvider, fonts)
└── globals.css

middleware.ts                       # Protects all (dashboard) routes, refreshes session

lib/
└── supabase/
    ├── server.ts                   # createServerClient() for Server Components + Server Actions
    └── client.ts                   # createBrowserClient() for Client Components
```

`(auth)` and `(dashboard)` are route groups — they control layout inheritance without affecting URLs (e.g. `/login`, not `/auth/login`).

---

## Authentication Flow

### Signup
1. User submits email + password on `/signup`
2. Calls Supabase `signUp()` — Supabase sends confirmation email
3. User clicks confirmation link → redirected to `/auth/callback`
4. Callback exchanges code for session, sets cookie, redirects to `/dashboard`

### Login — Email/Password
1. User submits credentials on `/login`
2. Calls `signInWithPassword()` → session cookie set → redirect to `/dashboard`

### Login — Google OAuth
1. User clicks "Sign in with Google" on `/login`
2. Calls `signInWithOAuth({ provider: 'google', redirectTo: '/auth/callback' })`
3. Google consent screen → redirected back to `/auth/callback`
4. Callback sets session cookie → redirect to `/dashboard`

### Session Protection (middleware.ts)
- Runs on every request matching `(dashboard)` routes
- Calls `supabase.auth.getUser()` — invalid/missing session redirects to `/login`
- Refreshes the session token on each request to prevent mid-session expiry

### Logout
- Server Action called from top nav user dropdown
- Calls `supabase.auth.signOut()`, clears cookie, redirects to `/login`

### Profile / Settings (`/settings`)
- User can update display name and avatar
- Updates go through `supabase.auth.updateUser()` writing to `auth.users` metadata
- Avatar upload targets a Supabase Storage bucket (`avatars`), public URL stored in user metadata

---

## Dashboard Shell UI

### Theme
- `ThemeProvider` wraps the app at the root layout level
- Reads OS preference server-side, applies `class` to `<html>` — no flash of wrong theme
- User can toggle light/dark via a button in the top nav

### Sidebar (fixed, ~240px wide)
- **Top:** OTools logo/wordmark
- **Middle:** Nav items with Lucide icons + labels
  - Home
  - Password Generator
  - Marketing
  - Analysis
  - AI Tools
- Active item highlighted via `cn()` matching the current route
- Collapse toggle to shrink to icon-only mode on desktop
- **Bottom:** User avatar + display name + link to Settings

### Top Nav
- Left: Dynamic page title reflecting the current section
- Right: Theme toggle button + user dropdown menu
  - Shows user avatar + display name
  - Links: Settings
  - Action: Log out

### Content Area
- Scrollable main area to the right of the sidebar
- Each tool category page starts as a stub (title + "Coming soon" placeholder)

### Shadcn Components Used
- Auth pages: `Button`, `Input`, `Label`, `Form`, `Card`
- Shell: `DropdownMenu`, `Avatar`, `Separator`, `Tooltip` (collapsed sidebar), `Button`
- Dashboard home: `Card`
- Settings page: `Input`, `Label`, `Form`, `Avatar`, `Button`

---

## Data Flow

```
Browser Request
    └── middleware.ts
            ├── No session → redirect /login
            └── Valid session → refresh cookie → render (dashboard)/layout.tsx
                    ├── Sidebar (Server Component, reads user from session)
                    ├── Top Nav (Server Component)
                    └── Page content (tool stub or settings)
```

Auth actions (login, signup, logout, update profile) are implemented as **Next.js Server Actions** — no API routes needed. The browser client (`lib/supabase/client.ts`) is only used where real-time or client-side reactivity is needed.

---

## Error Handling

- Invalid login credentials → inline form error message (no full-page redirect)
- OAuth failure → redirect to `/login?error=oauth_failed` with a visible error banner
- Expired session → middleware catches and redirects to `/login`
- Avatar upload failure → toast notification, no state change

---

## Out of Scope (this spec)

- Actual tool implementations (Password Generator, Marketing, etc.)
- Billing / subscription gating
- Team/organization accounts
- Email templates customization
- Rate limiting on auth endpoints
