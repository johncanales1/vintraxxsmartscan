#!/bin/bash
echo "🚀 Deploying VinTraxx services..."

# Backend
cd /home/ec2-user/vintraxxsmartscan/vintraxxBackend
npm run build
pm2 restart vintraxx-backend

# Frontend  
cd /home/ec2-user/vintraxxsmartscan/vintraxxFrontend
npm run build
pm2 restart vintraxx-frontend

# Admin
cd /home/ec2-user/vintraxxsmartscan/vintraxxAdmin
npm run build
pm2 restart vintraxx-admin

echo "✅ All services deployed!"