# 🌐 Sentinel — Domain & DNS Setup Guide

Complete guide to connecting your domain to your Hostinger VPS (IP: **147.93.40.212**).

---

## Step 1: Buy a Domain

### Recommended: Buy from Hostinger (easiest DNS management)

1. Go to [hostinger.com](https://hostinger.com)
2. Search for your domain (e.g. `sentinelhq.com`, `getsentinel.io`, `trySentinel.com`)
3. Add to cart and purchase
4. Domain will appear in **hPanel → Domains**

### Good domain name ideas for Sentinel:
- `sentinelhq.com` — clean, professional
- `getsentinel.io` — modern SaaS feel  
- `sentinelmaint.com` — descriptive
- `useSentinel.com` — action-oriented
- `sentinelpm.com` — PM = preventive maintenance

> **Tip:** `.com` is best for B2B SaaS. `.io` is fine too. Avoid hyphens.

---

## Step 2: Point Domain DNS to Your VPS

### If domain is registered at Hostinger:

1. Go to **hPanel** → **Domains** → click your domain
2. Click **DNS / Nameservers**
3. Click **Manage DNS Records**
4. **Delete** the default A record (if pointing to shared hosting)
5. **Add these DNS records:**

| Type  | Name            | Value            | TTL  |
|-------|-----------------|------------------|------|
| A     | `@`             | `147.93.40.212`  | 3600 |
| A     | `www`           | `147.93.40.212`  | 3600 |
| MX    | `@`             | (keep Hostinger mail MX) | — |

> Save changes. DNS propagation takes **5 minutes to 48 hours** (usually ~15 min with Hostinger).

---

### If domain is registered at Namecheap:

1. Log in → **Domain List** → click **Manage**
2. Go to **Advanced DNS** tab
3. Under **Host Records**, add:

| Type     | Host  | Value            | TTL       |
|----------|-------|------------------|-----------|
| A Record | `@`   | `147.93.40.212`  | Automatic |
| A Record | `www` | `147.93.40.212`  | Automatic |

4. Save changes

---

### If domain is registered at GoDaddy:

1. **My Products** → click **DNS** next to your domain
2. Edit the **A record** for `@` → change value to `147.93.40.212`
3. Add **A record** for `www` → `147.93.40.212`
4. Save

---

## Step 3: Verify DNS Propagation

Check if your DNS has propagated:

```bash
# From your local machine or any terminal:
nslookup yourdomain.com
dig yourdomain.com A

# Or use online tools:
# https://dnschecker.org
# https://www.whatsmydns.net
```

You should see `147.93.40.212` in the results.

---

## Step 4: SSH Into Your VPS

```bash
# From your local machine:
ssh root@147.93.40.212

# If you set up SSH key authentication:
ssh -i ~/.ssh/id_rsa root@147.93.40.212
```

---

## Step 5: Run VPS Setup Script

Once SSH'd into your VPS:

```bash
# Upload setup script (from your local machine):
scp deploy/setup-vps.sh root@147.93.40.212:/root/

# Then on the VPS:
chmod +x /root/setup-vps.sh

# Edit the DOMAIN variable first:
nano /root/setup-vps.sh
# Change:  DOMAIN=""
# To:      DOMAIN="yourdomain.com"

# Run the setup:
bash /root/setup-vps.sh
```

This installs: Node.js 20, PostgreSQL 16, Nginx, PM2, Certbot (SSL), UFW firewall.

---

## Step 6: Upload Your App to VPS

### Option A: Git (recommended)

```bash
# On VPS — clone your repo
cd /var/www
git clone https://github.com/yourusername/sentinel.git sentinel
cd sentinel

# Copy .env.production (created by setup-vps.sh)
cp /var/www/sentinel/.env.production .env.production

# Edit SMTP credentials
nano .env.production
```

### Option B: rsync (if no git)

```bash
# From your LOCAL machine:
rsync -avz --exclude='node_modules' --exclude='.next' --exclude='.git' \
  ./maintainai/ root@147.93.40.212:/var/www/sentinel/
```

---

## Step 7: Deploy the App

```bash
# On your VPS, in /var/www/sentinel:
bash deploy/deploy.sh
```

This will:
1. Run `npm ci` (install dependencies)
2. Run `npx prisma migrate deploy` (set up database tables)
3. Run `npm run build` (build Next.js)
4. Start with PM2 (with auto-restart + cluster mode)
5. Reload Nginx

---

## Step 8: Install SSL Certificate

SSL is installed automatically by `setup-vps.sh` if you set `DOMAIN`.

To install manually after DNS propagates:

```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com \
  --non-interactive --agree-tos \
  --email admin@yourdomain.com \
  --redirect
```

Then update `.env.production`:
```bash
NEXTAUTH_URL=https://yourdomain.com
```

And redeploy:
```bash
bash deploy/deploy.sh
```

---

## Step 9: Set Up Email (Hostinger)

1. Go to **hPanel** → **Emails** → **Email Accounts**
2. Click **Create Email Account**
3. Create: `noreply@yourdomain.com`
4. Set a strong password
5. Update `.env.production`:

```env
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your_email_password
SMTP_FROM="Sentinel <noreply@yourdomain.com>"
```

6. Redeploy: `bash deploy/deploy.sh`

---

## Useful Commands on VPS

```bash
# App status
pm2 status

# Live logs
pm2 logs sentinel

# Restart app
pm2 restart sentinel

# Reload without downtime
pm2 reload sentinel

# View Nginx error logs
tail -f /var/log/nginx/error.log

# View app logs
tail -f /var/log/sentinel/error.log

# Database connection test
sudo -u postgres psql -d sentinel_db -c "SELECT COUNT(*) FROM \"User\";"

# Check SSL certificate expiry
certbot certificates

# Renew SSL manually (auto-renews via cron)
certbot renew --dry-run
```

---

## Troubleshooting

### App not starting?
```bash
pm2 logs sentinel --lines 50
# Look for "Error:" lines
```

### Database connection failed?
```bash
# Test connection
psql "postgresql://sentinel_user:PASSWORD@localhost:5432/sentinel_db"
# Should open psql prompt
```

### Nginx 502 Bad Gateway?
```bash
# Check if app is running
pm2 status
pm2 restart sentinel

# Check Nginx config
nginx -t
```

### SSL certificate errors?
```bash
# Check DNS first — must propagate before certbot works
dig yourdomain.com A
# Must show 147.93.40.212

# Then re-run certbot
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Forgot your DB password?
```bash
# It was saved in /var/www/sentinel/.env.production
cat /var/www/sentinel/.env.production | grep DATABASE_URL
```

---

## Security Checklist

- [ ] SSH key authentication enabled (disable password auth)
- [ ] Root login disabled (create admin user instead)
- [ ] UFW firewall enabled (only ports 22, 80, 443)
- [ ] Fail2Ban running
- [ ] SSL certificate installed
- [ ] `.env.production` has `chmod 600` permissions
- [ ] Database not exposed to internet (localhost only)
- [ ] Strong `NEXTAUTH_SECRET` (32+ random chars)
- [ ] Strong database password (32+ random chars)

### Disable SSH password auth (after setting up SSH keys):
```bash
nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
# Set: PermitRootLogin prohibit-password
systemctl restart sshd
```

---

## Architecture Overview

```
Internet
    │
    ▼
Cloudflare (optional CDN/DDoS protection)
    │
    ▼
Hostinger VPS: 147.93.40.212
    │
    ├── UFW Firewall (ports 22, 80, 443 only)
    │
    ├── Nginx :80 / :443
    │     ├── SSL termination (Let's Encrypt)
    │     ├── Rate limiting
    │     ├── Gzip compression
    │     └── Reverse proxy → localhost:3000
    │
    ├── PM2 (cluster mode, auto-restart)
    │     └── Next.js :3000 (multiple instances)
    │
    └── PostgreSQL :5432
          └── sentinel_db (localhost only)
```

---

*Generated by Sentinel setup scripts. For support, check the `/docs` folder.*