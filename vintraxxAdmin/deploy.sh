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

# Restart PM2 process
echo "🔄 Restarting PM2 process..."
pm2 restart vintraxxAdmin || PORT=3003 pm2 start npm --name "vintraxxAdmin" -- start

# Save PM2 configuration
echo "💾 Saving PM2 configuration..."
pm2 save

echo "✅ Admin deployment complete!"
echo "🌐 Admin panel is live at: http://localhost:3003"
