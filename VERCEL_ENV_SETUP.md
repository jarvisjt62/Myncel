# 🚀 Sentinel — Vercel Deployment Guide

Complete guide to deploying Sentinel on Vercel with SSL, database, and email.

---

## Quick Start (5 minutes)

1. Push code to GitHub
2. Connect repo to Vercel
3. Set environment variables
4. Deploy → **Done!**

---

## Step 1: Get a Domain

### Option A: Buy through Vercel (Easiest)
1. Go to your Vercel project dashboard
2. Settings → Domains → **Add Domain**
3. Type your desired domain (e.g. `sentinelhq.com`)
4. Vercel will automatically handle DNS + SSL

### Option B: Buy separately (Namecheap, GoDaddy, Hostinger)
1. Buy domain: `sentinelpm.com`, `predictmaint.com`, or your choice
2. Add to Vercel: Settings → Domains → Add Domain
3. Update DNS at your registrar (Vercel will show you the CNAME records)

---

## Step 2: Set Up Database (Vercel Postgres)

### Why Vercel Postgres?
- **Built-in** with Vercel
- **Free tier** for small projects
- **Auto-scaling**
- **Direct connection to Prisma**
- **Edge-ready**

### Steps:

1. Go to [Vercel Storage](https://vercel.com/storage/postgres)
2. Click **Create Database**
3. Choose:
   - Region: `us-east-1` (or closest to you)
   - Plan: `Hobby` (Free - good for starting)
4. Click **Create**

5. Get the connection string:
   - Go to your project → Storage → Postgres
   - Click `.env.local` tab
   - Copy the `POSTGRES_URL` (not `POSTGRES_PRISMA_URL`)

---

## Step 3: Set Up Email (Recommended Options)

### Option A: Resend (Free tier + Easy)

1. Go to [resend.com](https://resend.com) — Sign up (free)
2. Go to API Keys → Create API Key
3. Get your API Key
4. Go to Domains → Add your domain → Verify DNS
5. Use these settings:

```bash
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=resend
SMTP_PASS=your_resend_api_key
SMTP_FROM="Sentinel <noreply@yourdomain.com>"
```

### Option B: SendGrid

1. Go to [sendgrid.com](https://sendgrid.com)
2. Create free account (100 free emails/day)
3. Get API Key
4. Add sender email domain
5. Settings:

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.your-api-key-here
SMTP_FROM="Sentinel <noreply@yourdomain.com>"
```

### Option C: Brevo (formerly Sendinblue)

1. Go to [brevo.com](https://brevo.com)
2. Free tier: 300 emails/day
3. Get SMTP credentials
4. Settings:

```bash
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_brevo_username
SMTP_PASS=your_brevo_smtp_key
SMTP_FROM="Sentinel <noreply@yourdomain.com>"
```

---

## Step 4: Deploy to Vercel

### Method A: Via Vercel Dashboard (Easiest)

1. Push code to GitHub
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. Go to [vercel.com/new](https://vercel.com/new)
3. **Import** your GitHub repository
4. Configure:
   - Project Name: `sentinel`
   - Framework Preset: `Next.js`
   - Root Directory: `maintainai` (if your repo has it at root, leave blank)
   - Build Command: `npm run build`
   - Output Directory: `.next`

5. Click **Deploy**

### Method B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd maintainai
vercel

# Follow prompts
# ✓ Project linked to your Vercel account
# ✓ Building...
# ✓ Production URL: https://sentinel-xyz.vercel.app
```

---

## Step 5: Add Environment Variables

### In Vercel Dashboard:

1. Go to your project → **Settings** → **Environment Variables**
2. Add each variable:

| Name | Value | Environments |
|------|-------|-------------|
| `NODE_ENV` | `production` | Production |
| `NEXTAUTH_URL` | `https://your-real-domain.com` | Production |
| `NEXTAUTH_SECRET` | [Generate below] | All |
| `DATABASE_URL` | [From Vercel Postgres] | All |
| `SMTP_HOST` | `smtp.resend.com` | All |
| `SMTP_PORT` | `587` | All |
| `SMTP_SECURE` | `false` | All |
| `SMTP_USER` | `resend` | All |
| `SMTP_PASS` | `your_api_key` | All |
| `SMTP_FROM` | `Sentinel <noreply@yourdomain.com>` | All |

### Generate NEXTAUTH_SECRET:

```bash
openssl rand -base64 32
```

**Important:** Set `NEXTAUTH_URL` to your **real domain** (e.g. `https://sentinelpm.com`), NOT the Vercel URL (`https://sentinel-xyz.vercel.app`)

---

## Step 6: Run Database Migrations

After deploy, migrate the database:

### Option A: Via Vercel Dashboard (Manual)

1. Go to your project → **Deployments** → Click your latest deployment
2. Click **...** → **Redeploy** → Check **"Build Environment Variables"**
3. Or use Vercel CLI:

```bash
vercel env pull .env.local
npx prisma migrate deploy
```

### Option B: Automatic (Recommended)

Vercel will automatically run Prisma migrations during deploy because we have this in your `package.json`:

```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

You can also add:

```json
{
  "scripts": {
    "vercel-build": "prisma generate && next build"
  }
}
```

---

## Step 7: Add Domain + SSL

### In Vercel Dashboard:

1. Go to project → **Settings** → **Domains**
2. **Add Domain** → Type your domain (e.g. `sentinelpm.com`)
3. Vercel will show you DNS records:
   ```dns
   Type: CNAME     Name: @      Value: cname.vercel-dns.com
   Type: CNAME     Name: www    Value: cname.vercel-dns.com
   ```
4. Go to your **domain registrar** (Namecheap/GoDaddy/Hostinger)
5. Add those CNAME records
6. Wait 5-30 minutes for DNS to propagate

7. Back in Vercel → Wait for SSL certificate (green checkmark)

**Done!** Your app is at `https://yourdomain.com` 🎉

---

## Step 8: Test Deployed App

1. Visit `https://yourdomain.com`
2. Check all pages load:
   - `/` — Landing page
   - `/signin` — Sign in form
   - `/signup` — Sign up form
   - `/dashboard` — Should redirect to `/signin` (protected)
3. Test signup flow:
   - Sign up with real email
   - Check inbox for verification email (if enabled)
   - Sign in
   - Should land on `/dashboard`

---

## Production Checklist

- [ ] Domain configured with CNAME records
- [ ] SSL certificate issued (green lock in browser)
- [ ] `NEXTAUTH_URL` set to real domain with `https://`
- [ ] `DATABASE_URL` from Vercel Postgres added
- [ ] `NEXTAUTH_SECRET` generated and added
- [ ] SMTP credentials configured (Resend/SendGrid)
- [ ] Database migrated: `npx prisma migrate deploy`
- [ ] Test sign up / sign in flows
- [ ] Test email delivery (reset password email)

---

## Useful Commands

```bash
# Pull env vars from Vercel to local
vercel env pull .env.local

# Push env vars to Vercel
vercel env push .env.local

# Redeploy latest commit
vercel --prod

# View real-time logs
vercel logs --follow

# Open production URL
vercel open
```

---

## Benefits of Vercel

| Feature | Vercel | Hostinger VPS |
|---------|--------|---------------|
| Setup time | 5 min | 30-60 min |
| SSL | Auto (free) | Manual (Certbot) |
| Deployments | git push | SSH + script |
| Scaling | Auto-infinite | Manual |
| Database | Vercel Postgres (easy) | Manual PostgreSQL |
| Logs | Built-in dashboard | Terminal/Grep |
| Cost | Free for Starter | $5-10/month VPS |

---

## Troubleshooting

### Database connection error
```bash
# Verify DATABASE_URL format
postgresql://user:pass@host-awsaws.compute.amazonaws.com:5432/verceldb?schema=public
```

### Auth callbacks failing
Check `NEXTAUTH_URL` matches your domain exactly:
```
✅ NEXTAUTH_URL=https://sentinelpm.com
❌ NEXTAUTH_URL=https://www.sentinelpm.com  (if no www configured)
```

### Emails not sending
1. Verify SMTP credentials are correct
2. Check if sender domain is verified (for Resend/SendGrid)
3. Check Vercel logs: `vercel logs --follow`

### Deployments failing
1. Check GitHub commit is pushed
2. Look at Vercel deploy logs for errors
3. Ensure `package.json` has `"postinstall": "prisma generate"`

---

*Generated for Sentinel Vercel deployment*