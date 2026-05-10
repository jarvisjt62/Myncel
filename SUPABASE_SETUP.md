# 🗄️ Sentinel — Supabase Authentication Setup Guide

## Step 1: Create Your Supabase Project (5 minutes)

1. Go to **https://supabase.com** and sign up (free)
2. Click **"New Project"**
3. Fill in:
   - **Name:** sentinel-app
   - **Database Password:** (save this somewhere safe)
   - **Region:** US East (or closest to your users)
4. Click **"Create new project"** — takes ~2 minutes to provision

---

## Step 2: Get Your API Keys

1. In your Supabase dashboard, go to **Settings → API**
2. Copy these two values:
   - **Project URL** (looks like: `https://xxxx.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)

---

## Step 3: Add Environment Variables

Create a file called `.env.local` in your project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

⚠️ Never commit `.env.local` to Git. Add it to `.gitignore`.

---

## Step 4: Install Supabase Client

```bash
npm install @supabase/supabase-js @supabase/ssr
```

---

## Step 5: Create Supabase Client Files

### `lib/supabase/client.ts` (for browser/client components)
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### `lib/supabase/server.ts` (for server components)
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

### `middleware.ts` (in project root — protects routes)
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Redirect unauthenticated users away from dashboard
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/signin', request.url))
  }

  // Redirect authenticated users away from auth pages
  if (user && (
    request.nextUrl.pathname === '/signin' ||
    request.nextUrl.pathname === '/signup'
  )) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/signin', '/signup'],
}
```

---

## Step 6: Update Sign Up Page with Real Supabase Auth

Replace the `handleSubmit` in `app/signup/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase/client'

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)
  setError('')

  const supabase = createClient()

  // 1. Sign up the user
  const { data, error } = await supabase.auth.signUp({
    email: form.email,
    password: form.password,
    options: {
      data: {
        full_name: form.name,
        company: form.company,
      }
    }
  })

  if (error) {
    setError(error.message)
    setLoading(false)
    return
  }

  // 2. Create organization for new user
  if (data.user) {
    await supabase.from('organizations').insert({
      name: form.company,
      industry: 'Manufacturing',
      plan: 'trial'
    })
  }

  setLoading(false)
  setDone(true)
}
```

---

## Step 7: Update Sign In Page with Real Supabase Auth

Replace the `handleSubmit` in `app/signin/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)
  setError('')

  const supabase = createClient()
  const router = useRouter()

  const { error } = await supabase.auth.signInWithPassword({
    email: form.email,
    password: form.password,
  })

  if (error) {
    setError('Invalid email or password. Please try again.')
    setLoading(false)
    return
  }

  router.push('/dashboard')
  router.refresh()
}
```

---

## Step 8: Run the Database Schema

1. In your Supabase dashboard, click **SQL Editor**
2. Click **"New query"**
3. Copy the entire contents of `supabase_schema.sql`
4. Paste it into the editor
5. Click **"Run"** — all tables, RLS policies, and seed data will be created

---

## Step 9: Enable Email Auth

1. Go to **Authentication → Providers**
2. Make sure **Email** is enabled
3. Under **Email Templates**, customize the confirmation email with Sentinel branding
4. For production: add your custom domain under **Authentication → URL Configuration**

---

## Step 10: Test Everything

```bash
npm run dev
```

1. Visit `http://localhost:3000/signup`
2. Create a test account
3. Check your email for confirmation
4. Sign in at `http://localhost:3000/signin`
5. You should be redirected to `/dashboard`
6. Try visiting `/dashboard` while logged out — you should be redirected to `/signin`

---

## 🎉 Auth is now fully working!

**Next steps after auth:**
- Replace hardcoded dashboard data with real Supabase queries
- Add equipment CRUD operations (add/edit/delete machines)
- Set up automated email reminders using Supabase Edge Functions + Resend
- Configure Stripe webhooks for subscription management