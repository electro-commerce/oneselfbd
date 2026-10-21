/**
 * PM2 Ecosystem Configuration for Oneself Monorepo
 * Use this if running directly on bare-metal / VPS without Docker.
 * Usage: pm2 start ecosystem.config.cjs
 */
module.exports = {
  apps: [
    {
      name: "oneself-server",
      script: "dist/server.js",
      cwd: "./apps/server",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "600M",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
    },
    {
      name: "oneself-front",
      // Next.js standalone output builds to .next/standalone
      script: "apps/front/server.js",
      cwd: "./apps/front/.next/standalone",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "700M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
      },
    },
    {
      name: "oneself-dashboard",
      // Next.js standalone output builds to .next/standalone
      script: "apps/dashboard/server.js",
      cwd: "./apps/dashboard/.next/standalone",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "700M",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        HOSTNAME: "0.0.0.0",
      },
    },
  ],
};
