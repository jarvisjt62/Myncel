# 🚀 Sentinel — Quick Vercel Deploy Guide

The fastest path to production with Sentinel.

---

## Prerequisites

- [ ] GitHub account
- [ ] Vercel account (free)
- [ ] `.env` file prepared (see below)
- [ ] Domain name (optional — can use `sentinel-xyz.vercel.app` initially)

---

## Step 1: Push to GitHub

```bash
cd /workspace/maintainai
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/sentinel.git
git branch -M main
git push -u origin main
```

---

## Step 2: Connect to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. **Import** your `sentinel` repository
3. Keep defaults:
   - **Framework Preset**: Next.js
   - **Root Directory**: `maintainai` (or leave blank)
4. Click **Deploy**

After 1-2 minutes → **Live at `https://sentinel-xyz.vercel.app`**

---

## Step 3: Add Environment Variables

Go to your project → **Settings** → **Environment Variables** → Add:

```bash
NODE_ENV=production

NEXTAUTH_URL=https://your-real-domain.com
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

DATABASE_URL=postgresql://user:pass@host:port/db?schema=public
# Get this from: Vercel Storage → Postgres → .env.local

SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=resend
SMTP_PASS=your_resend_api_key
SMTP_FROM="Sentinel <noreply@yourdomain.com>"
```

---

## Step 4: Set Up Database

### Vercel Postgres (Recommended)

1. Go to [Vercel Storage](https://vercel.com/storage/postgres)
2. Click **Create Database**
3. Choose `Hobby` (Free)
4. After creation → Go to project → Storage → Postgres → `.env.local` tab
5. Copy `DATABASE_URL` → Add to **Environment Variables**

---

## Step 5: Run Migrations

After adding env vars, redeploy:

```bash
# Via Vercel CLI
vercel redeploy --yes
```

Or trigger from Vercel dashboard → **Deployments** → **Redeploy**

---

## Step 6: Add Custom Domain

1. Go to project → **Settings** → **Domains**
2. **Add Domain** → Type `yourdomain.com`
3. Vercel shows DNS records:
   ```
   CNAME     @      →    cname.vercel-dns.com
   CNAME     www    →    cname.vercel-dns.com
   ```
4. Add these records at your domain registrar (Namecheap/GoDaddy/Hostinger)
5. Wait for green checkmark → SSL auto-installed!

---

## 🎉 Done!

Your app is live at **https://yourdomain.com**

---

## Test Checklist

- [ ] Visit `https://yourdomain.com` → Page loads
- [ ] Visit `/signin` → Form appears
- [ ] Visit `/signup` → Form appears
- [ ] Visit `/dashboard` → Redirects to `/signin` (protected) ✓

---

## Free Email Provider: Resend

1. Go to [resend.com](https://resend.com)
2. Sign up (free) → Get API Key
3. Verify your sender domain
4. Use these env vars:
   ```bash
   SMTP_HOST=smtp.resend.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=resend
   SMTP_PASS=re_AaBbCc123...
   SMTP_FROM="Sentinel <noreply@yourdomain.com>"
   ```

---

## Costs

| Service | Price |
|---------|-------|
| Vercel Hosting | Free (Hobby) → $20/month Pro |
| Vercel Postgres | Free (Hobby) → $20/month Pro |
| Domain | $10-15/year |
| Resend Email | 3,000 emails/month free |

**Total**: ~$0/month initially + $10-15/year for domain

---

## Commands

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Pull env vars
vercel env pull .env.local

# Real-time logs
vercel logs --follow
```

---

Need help? See full guide: [`VERCEL_ENV_SETUP.md`](./VERCEL_ENV_SETUP.md)