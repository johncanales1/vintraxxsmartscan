#!/bin/bash

# VinTraxx Backend Deployment Script
set -e

echo "🚀 Starting VinTraxx Backend Deployment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js >= 18.0.0"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be >= 18.0.0. Current version: $(node -v)"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production=false

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations (production)
echo "🗄️ Running database migrations..."
npx prisma migrate deploy || echo "⚠️ Migration deploy failed, trying reset..."
if ! npx prisma migrate deploy; then
    echo "🔄 Resetting database and reapplying migrations..."
    npx prisma migrate reset --force --skip-seed
fi

# Build the application
echo "🔨 Building application..."
npm run build

# Set production environment
export NODE_ENV=production

# Start the application
echo "🌟 Starting production server..."
npm run start:prod
