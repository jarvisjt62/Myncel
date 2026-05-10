# 🚀 Myncel Deployment Steps — From Zero to Live

You bought `myncel.com` on Vercel. Here's exactly what to do:

---

## Step 1: Push Your Code to GitHub

First, your code needs to be on GitHub so Vercel can pull it.

```bash
# From your local machine (in the maintainai folder)
git init
git add .
git commit -m "Myncel initial deployment"
git remote add origin https://github.com/YOUR_USERNAME/myncel.git
git branch -M main
git push -u origin main
```

---

## Step 2: Connect Your Repo to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. **Import** your GitHub repository (`myncel`)
3. Configure the project:
   ```
   Project Name:        myncel
   Framework Preset:    Next.js
   Root Directory:      maintainai (or leave blank if root)
   Build Command:       npm run build
   Output Directory:    .next
   ```
4. Click **Deploy**

Wait 1-2 minutes — your app will be live at:
```
https://myncel-abc123.vercel.app
```

---

## Step 3: Add Your Custom Domain (`myncel.com`)

1. In Vercel dashboard → Go to your `myncel` project
2. **Settings** → **Domains**
3. Click **Add Domain** → Type: `myncel.com`
4. Click **Add**

Vercel will **automatically configure** everything since you bought the domain through them:
- ✅ DNS records (A + CNAME)
- ✅ SSL certificate
- ✅ Domain routing

Wait a few minutes for the green checkmark:

```
✓ myncel.com   ← Verified, SSL active
✓ www.myncel.com  ← Automatically configured
```

---

## Step 4: Set Up Environment Variables

Go to your project → **Settings** → **Environment Variables** → Add:

| Name | Value | Environment |
|------|-------|-------------|
| `NODE_ENV` | `production` | All |
| `NEXTAUTH_URL` | `https://myncel.com` | All |
| `NEXTAUTH_SECRET` | [Generate below] | All |
| `DATABASE_URL` | [From Vercel Postgres] | All |
| `SMTP_HOST` | `smtp.resend.com` | All |
| `SMTP_PORT` | `587` | All |
| `SMTP_SECURE` | `false` | All |
| `SMTP_USER` | `resend` | All |
| `SMTP_PASS` | [Your Resend API key] | All |
| `SMTP_FROM` | `Myncel <noreply@myncel.com>` | All |

### Generate NEXTAUTH_SECRET:

```bash
openssl rand -base64 32
```

Copy the output (64 chars) and paste into Vercel.

---

## Step 5: Set Up Database (Vercel Postgres)

1. Go to [Vercel Storage → Postgres](https://vercel.com/storage/postgres)
2. Click **Create Database**
3. Configure:
   ```
   Name:     myncel-db
   Region:   us-east-1 (or closest to you)
   Plan:     Hobby (Free)
   ```
4. Click **Create**

5. Get the connection string:
   - Go to your → Storage → Postgres
   - Click the **.env.local** tab
   - Copy the `POSTGRES_URL` NOT `POSTGRES_PRISMA_URL`
   - Paste it into Vercel env vars as `DATABASE_URL`

---

## Step 6: Set Up Email (Resend — Free)

1. Go to [resend.com](https://resend.com)
2. Sign up (free account)
3. Go to **API Keys** → **Create API Key**
4. Copy the API Key (starts with `re_`)

5. Add to Vercel env vars:
   ```
   SMTP_USER=resend
   SMTP_PASS=re_your-api-key-here
   ```

6. Verify your sender domain:
   - Go to **Domains** in Resend
   - Add `myncel.com`
   - Add the DNS records to Vercel (Resend will show you)
   - Wait for DNS verification

---

## Step 7: Redeploy with New Environment Variables

After adding env vars, redeploy:

**Option A: Vercel Dashboard**
- Go to project → **Deployments**
- Click latest deployment → **...** → **Redeploy**
- Check "Build Environment Variables"
- Click **Redeploy**

**Option B: Vercel CLI**
```bash
npm i -g vercel
vercel login
vercel --prod
```

---

## Step 8: Test Your Live App

After redeploy (1-2 minutes), test:

1. Visit `https://myncel.com` → Landing page ✅
2. Visit `/signin` → Sign in form ✅
3. Visit `/signup` → Sign up form ✅
4. Visit `/dashboard` → Should redirect to `/signin` (protected) ✅
5. Click browser lock → Shows SSL certificate ✅

---

## ✅ Done! Your App is Live!

```
🎉 Myncel is live at https://myncel.com
   ✓ Custom domain configured
   ✓ SSL certificate active
   ✓ Database connected
   ✓ Email configured
   ✓ App deployed
```

---

## 📊 What You'll Have (Free Tier)

| Service | Cost | Notes |
|---------|------|-------|
| Vercel Hosting | $0 | Hobby plan (100GB bandwidth) |
| Vercel Postgres | $0 | Hobby plan (512MB storage) |
| Resend Email | $0 | 3,000 emails/month |
| Domain (1st year) | ~$12 | Paid when buying |

**Total monthly cost: $0** 😊

---

## 🔧 Troubleshooting

### Domain not working after 10 minutes
1. Go to Vercel → Project → Settings → Domains
2. Check DNS configuration
3. Make sure you added `myncel.com` (not `www.myncel.com` first)

### Auth redirects not working
Check `NEXTAUTH_URL` in env vars:
```
✅ NEXTAUTH_URL=https://myncel.com
❌ NEXTAUTH_URL=https://www.myncel.com
```

### Database connection error
Verify `DATABASE_URL` format:
```
postgresql://user:pass@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&schema=public
```

### Deploys failing
Check build logs in Vercel → Deployments → Click deployment → Look for errors

---

## 📞 Next Steps

Once live, tell me if you want to:
- **A)** Add Stripe billing (subscription payments)
- **B)** Build more dashboard features
- **C)** Set up analytics (Google Analytics, PostHog)
- **D)** Work on the FTMO Tracker improvements

---

## 🗂️ Files Already Created for You

| File | Purpose |
|------|---------|
| `.env.production` | Production env template |
| `vercel.json` | Vercel configuration |
| `VERCEL_ENV_SETUP.md` | Full detailed guide |
| `DEPLOY_VERCEL.md` | Quick reference |

---

Ready to deploy? **Go to [vercel.com/new](https://vercel.com/new) now!** 🚀