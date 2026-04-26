# Myncel Vercel Setup Guide

Your Myncel application has been successfully deployed! Now let's configure it properly.

## Step 1: Add Environment Variables in Vercel

Go to your Vercel Project Settings → Environment Variables and add these:

### Required Environment Variables:

1. **NEXTAUTH_URL**
   - Value: `https://myncel.vercel.app` (or your actual deployed URL)
   - Environments: Production, Preview, Development

2. **NEXTAUTH_SECRET**
   - Value: `QPnf/PSyrKmS5bbQs7PxGtsP2AFDyRffu9kVV4ITw3Y=`
   - Environments: Production, Preview, Development

3. **DATABASE_URL**
   - Value: (Will be provided after setting up Vercel Postgres in Step 2)
   - Environments: Production, Preview, Development

4. **RESEND_API_KEY** (Optional - for email functionality)
   - Value: Your Resend API key
   - Environments: Production, Preview, Development

## Step 2: Set Up Vercel Postgres Database

1. Go to your Vercel Project Dashboard
2. Click on "Storage" tab
3. Click "Create Database"
4. Select "Postgres" and choose a region closest to your users
5. Click "Create"

Vercel will provide you with:
- **DATABASE_URL** - Copy this and add it to your environment variables
- **Direct Database URL** - For local development

## Step 3: Run Database Migrations

Once you have the DATABASE_URL set up, you need to run the Prisma migrations:

### Option A: Using Vercel CLI (Recommended)
```bash
vercel env pull .env.production
npx prisma migrate deploy
```

### Option B: Using Vercel Dashboard
1. Go to your project settings
2. Look for theDATABASE_URL in your environment variables
3. Run the migration command in your terminal with the production URL

## Step 4: Connect Your Custom Domain

1. Go to your Vercel Project → Settings → Domains
2. Click "Add Domain"
3. Enter `myncel.com` and click "Add"
4. Follow the DNS configuration instructions provided by Vercel
5. Also add `www.myncel.com` as an alias

## Step 5: Test Your Application

1. Visit your deployed URL
2. Test user registration
3. Test authentication flow
4. Verify dashboard functionality
5. Check that all features work correctly

## Important Notes:

- ⚠️ **Never commit `.env` files to Git**
- 🔒 **Keep your API keys and secrets secure**
- 🔄 **Environment variables changes require redeployment**
- 📊 **Monitor your database usage in Vercel Storage**

## Troubleshooting:

If you encounter any issues:
1. Check Vercel deployment logs
2. Verify all environment variables are set
3. Ensure database migrations ran successfully
4. Check database connection in Vercel Storage

For more help, refer to:
- [Vercel Postgres Documentation](https://vercel.com/docs/storage/vercel-postgres)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Prisma Documentation](https://www.prisma.io/docs)

---

## Quick Reference: Generated Values

**NEXTAUTH_SECRET:** `QPnf/PSyrKmS5bbQs7PxGtsP2AFDyRffu9kVV4ITw3Y=`

**Deployed URL:** Check your Vercel dashboard for the exact URL

**Next Steps:** Start with Step 1 and work through each step sequentially.