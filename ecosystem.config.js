// PM2 Ecosystem Config — Sentinel
// Usage: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'sentinel',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/var/www/sentinel',

      // Instances & clustering
      instances: 'max',       // Use all CPU cores
      exec_mode: 'cluster',   // Cluster mode for load balancing

      // Environment
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // Auto-restart settings
      autorestart: true,
      watch: false,           // Never watch files in production
      max_restarts: 10,
      restart_delay: 3000,    // Wait 3s between restarts
      min_uptime: '10s',      // Must run 10s to be considered started

      // Memory management
      max_memory_restart: '512M',

      // Logging
      log_file: '/var/log/sentinel/combined.log',
      out_file: '/var/log/sentinel/out.log',
      error_file: '/var/log/sentinel/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 8000,
      shutdown_with_message: true,

      // Next.js specific
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '127.0.0.1',  // Only listen on localhost (Nginx handles external)
      },
    },
  ],

  // Deployment config (optional — for pm2 deploy)
  deploy: {
    production: {
      user: 'root',
      host: '147.93.40.212',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/sentinel.git',
      path: '/var/www/sentinel',
      'pre-deploy-local': '',
      'post-deploy': 'npm ci && npx prisma migrate deploy && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt-get install -y git',
    },
  },
};