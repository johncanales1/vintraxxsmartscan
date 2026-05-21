#!/bin/bash

# VinTraxx Admin Deployment Script
set -e

echo "🚀 Starting VinTraxx Admin Deployment..."

# Navigate to admin directory
cd "$(dirname "$0")"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build the application
echo "🔨 Building Next.js application..."
npm run build

# Copy static assets into standalone output (required for Next.js standalone builds)
echo "📁 Copying static assets to standalone directory..."
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

# Restart PM2 process
echo "🔄 Restarting PM2 process..."
pm2 restart vintraxx-admin || HOSTNAME=127.0.0.1 PORT=3002 pm2 start .next/standalone/server.js --name "vintraxx-admin"

# Save PM2 configuration
echo "💾 Saving PM2 configuration..."
pm2 save

echo "✅ Admin deployment complete!"
echo "🌐 Admin panel is live at: http://localhost:3003"
