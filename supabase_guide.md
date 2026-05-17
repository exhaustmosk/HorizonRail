# Supabase Setup Guide — HorizonRail

## Step 1 — Create Your Supabase Project

1. Go to **[https://supabase.com](https://supabase.com)** and sign in
2. Click **"New Project"**
3. Fill in:
   - **Name**: `horizonrail`
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Pick the closest to you
4. Click **"Create new project"** — wait ~2 minutes for it to boot

---

## Step 2 — Configure Authentication

Go to your project → **Authentication** → **Settings**:

### Site URL
Set to your dev URL:
```
http://localhost:5173
```

### Redirect URLs (Allowed)
Add these:
```
http://localhost:5173/**
http://localhost:5173/auth/callback
```

### Email Confirmation
- ✅ **Enable email confirmations** should be ON by default
- Under **Email Templates** → **Confirm signup**, you can customize the email (optional)

### SMTP (for real emails in production)
For development, Supabase provides a built-in SMTP that sends to **Inbucket** (test inbox). 
To see test emails: Project → **Authentication** → **Email logs**, or go to the **Inbucket URL** shown in your dashboard settings.

> [!TIP]
> During development you can **disable email confirmation** under Authentication → Settings → "Enable email confirmations" → toggle OFF. This lets you test instantly without email. Re-enable before going live!

---

## Step 3 — Run the SQL Schema

Go to your project → **SQL Editor** → **New Query**

Copy the entire contents of `supabase.sql` from your project root and paste it in, then click **Run (Ctrl+Enter)**.

This creates all 10 tables, indexes, triggers, RLS policies, and helper functions.

---

## Step 4 — Get Your API Keys

Go to **Settings** → **API**:

- **Project URL**: Copy it (looks like `https://xxxx.supabase.co`)
- **anon / public key**: Copy the `anon` key

Create a file at `d:\Portfolio\.env.local`:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

> [!IMPORTANT]
> `.env.local` is already in `.gitignore`. Never commit your keys to git.

---

## Step 5 — Install Supabase JS SDK

In your frontend project terminal:
```bash
npm install @supabase/supabase-js
```

---

## How Email Confirmation Works

1. User fills in Sign Up form → we call `supabase.auth.signUp()`
2. Supabase sends a confirmation email to the user
3. User clicks the link → gets redirected back to your app at `http://localhost:5173`
4. Supabase SDK auto-detects the token in the URL and triggers `onAuthStateChange`
5. Our app catches the `SIGNED_IN` event and logs the user in

The flow in the app:
```
Sign Up → "Check your email!" screen 
    → User clicks email link
        → Redirected to app
            → onAuthStateChange fires
                → Profile created in DB
                    → Redirected to /onboarding or /dashboard
```

---

## Supabase Auth vs Old SQLite Auth

| Feature | Old SQLite Backend | Supabase Auth |
|---------|-------------------|---------------|
| Password storage | bcrypt in DB | Supabase handles it (argon2) |
| JWT tokens | Manual JWT generation | Supabase auto-manages |
| Email confirmation | Not implemented | Built-in |
| Password reset | Not implemented | Built-in |
| Session persistence | localStorage manual | Supabase auto |
| Magic links | Not implemented | Built-in |
