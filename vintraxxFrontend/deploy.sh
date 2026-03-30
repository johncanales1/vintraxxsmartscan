#!/bin/bash

# Vintraxx Frontend Deployment Script
# Deploys to https://dev.vintraxx.com/

set -e

echo "🚀 Starting Vintraxx Frontend Deployment..."

# Navigate to frontend directory
cd "$(dirname "$0")"

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building Next.js application..."
npm run build

echo "🔄 Restarting PM2 process..."
pm2 restart vintraxxFrontend || PORT=3002 pm2 start npm --name "vintraxxFrontend" -- start

echo "💾 Saving PM2 configuration..."
pm2 save

echo "✅ Deployment complete!"
echo "🌐 Site is live at: https://dev.vintraxx.com/"
