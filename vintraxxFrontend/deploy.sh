#!/bin/bash

# Deployment script for vintraxxFrontend to dev.vintraxx.com
echo "🚀 Deploying vintraxxFrontend to dev.vintraxx.com..."

# 1. Clean up to prevent disk space issues
echo "🧹 Cleaning up to prevent disk space issues..."
rm -rf /home/ec2-user/vintraxxsmartscan/vintraxxFrontend/.next
npm cache clean --force

# 2. Build the backend first
echo "🔧 Building the backend..."
cd /home/ec2-user/vintraxxsmartscan/vintraxxBackend
npm install
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Backend build failed!"
    exit 1
fi

# Copy api-docs.html to root for backend
cp /home/ec2-user/vintraxxsmartscan/vintraxxBackend/api-docs.html /home/ec2-user/vintraxxsmartscan/

echo "✅ Backend build successful!"

# 3. Build the frontend application
echo "📦 Building the application..."
cd /home/ec2-user/vintraxxsmartscan/vintraxxFrontend
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"

# 3. Copy public directory to standalone build
echo "📁 Copying public directory to standalone build..."
cp -r /home/ec2-user/vintraxxsmartscan/vintraxxFrontend/public /home/ec2-user/vintraxxsmartscan/vintraxxFrontend/.next/standalone/

# 4. Copy static files to standalone build (required for CSS/JS)
echo "📁 Copying .next/static to standalone build..."
mkdir -p /home/ec2-user/vintraxxsmartscan/vintraxxFrontend/.next/standalone/.next
cp -r /home/ec2-user/vintraxxsmartscan/vintraxxFrontend/.next/static /home/ec2-user/vintraxxsmartscan/vintraxxFrontend/.next/standalone/.next/

# 5. Stop all PM2 processes and kill any processes using ports 3000/3002
echo "🛑 Stopping all PM2 processes and cleaning up ports..."
pm2 stop all || true
pm2 delete all || true

# Kill any processes using our ports to prevent EADDRINUSE
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3002 | xargs kill -9 2>/dev/null || true
sleep 1

cd /home/ec2-user/vintraxxsmartscan
pm2 start ecosystem.config.js

if [ $? -ne 0 ]; then
    echo "❌ Failed to start applications!"
    exit 1
fi

echo "✅ Applications started successfully!"

# 6. Wait for applications to fully start
echo "⏳ Waiting for applications to stabilize..."
sleep 5

echo "📊 PM2 Status (frontend should be ID 1):"
pm2 status

# 7. Save PM2 configuration
pm2 save

# 8. Setup PM2 to start on boot
pm2 startup

echo "✅ PM2 configuration saved!"

# 9. Configure nginx automatically
echo "🌐 Configuring nginx reverse proxy..."
sudo mkdir -p /etc/nginx/sites-available
sudo mkdir -p /etc/nginx/sites-enabled
sudo cp /home/ec2-user/vintraxxsmartscan/vintraxxFrontend/nginx-dev.vintraxx.com.conf /etc/nginx/sites-available/dev.vintraxx.com
sudo ln -sf /etc/nginx/sites-available/dev.vintraxx.com /etc/nginx/sites-enabled/

# 10. Test and reload nginx configuration
echo "🔧 Testing nginx configuration..."
if sudo nginx -t; then
    echo "✅ Nginx configuration is valid!"
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded successfully!"
else
    echo "❌ Nginx configuration error!"
    exit 1
fi

# 11. Test the application locally
echo "🧪 Testing the application locally..."
sleep 3
if curl -f -s http://127.0.0.1:3002/ > /dev/null; then
    echo "✅ Application is running correctly on port 3002!"
else
    echo "❌ Application is not responding!"
    exit 1
fi

# 12. Test external access
echo "🌍 Testing external access..."
sleep 2
if curl -f -s https://dev.vintraxx.com/ > /dev/null; then
    echo "✅ External access working correctly!"
else
    echo "⚠️  External access test failed - check SSL certificates"
fi

echo ""
echo "🎉 Frontend deployment completed successfully!"
echo ""
echo "📍 Your application is now available at:"
echo "   - Local: http://127.0.0.1:3002/"
echo "   - Public: https://dev.vintraxx.com/"
echo "   - Login: https://dev.vintraxx.com/login"
echo ""
echo "📊 PM2 Status:"
pm2 status
