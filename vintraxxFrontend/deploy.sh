#!/bin/bash

# Deployment script for vintraxxFrontend to dev.vintraxx.com
echo "🚀 Deploying vintraxxFrontend to dev.vintraxx.com..."

# 1. Build the application
echo "📦 Building the application..."
cd /home/ec2-user/vintraxxsmartscan/vintraxxFrontend
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"

# 2. Copy public directory to standalone build
echo "📁 Copying public directory to standalone build..."
cp -r /home/ec2-user/vintraxxsmartscan/vintraxxFrontend/public /home/ec2-user/vintraxxsmartscan/vintraxxFrontend/.next/standalone/

# 3. Copy static files to standalone build (required for CSS/JS)
echo "📁 Copying .next/static to standalone build..."
mkdir -p /home/ec2-user/vintraxxsmartscan/vintraxxFrontend/.next/standalone/.next
cp -r /home/ec2-user/vintraxxsmartscan/vintraxxFrontend/.next/static /home/ec2-user/vintraxxsmartscan/vintraxxFrontend/.next/standalone/.next/

# 4. Stop any existing process on port 3002
echo "🛑 Stopping any existing process on port 3002..."
pm2 stop vintraxx-frontend || true
pm2 delete vintraxx-frontend || true

# 5. Start the application with PM2
echo "🔄 Starting the application with PM2..."
cd /home/ec2-user/vintraxxsmartscan/vintraxxFrontend/.next/standalone
PORT=3002 HOSTNAME=0.0.0.0 pm2 start server.js --name "vintraxx-frontend"

if [ $? -ne 0 ]; then
    echo "❌ Failed to start application!"
    exit 1
fi

echo "✅ Application started successfully!"

# 6. Save PM2 configuration
pm2 save

# 7. Setup PM2 to start on boot
pm2 startup

echo "✅ PM2 configuration saved!"

# 8. Test the application locally
echo "🧪 Testing the application locally..."
sleep 3
if curl -f -s http://127.0.0.1:3002/ > /dev/null; then
    echo "✅ Application is running correctly on port 3002!"
else
    echo "❌ Application is not responding!"
    exit 1
fi

echo ""
echo "🎉 Frontend deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Configure nginx reverse proxy (requires sudo):"
echo "   sudo cp /home/ec2-user/vintraxxsmartscan/vintraxxFrontend/nginx-dev.vintraxx.com.conf /etc/nginx/sites-available/dev.vintraxx.com"
echo "   sudo ln -s /etc/nginx/sites-available/dev.vintraxx.com /etc/nginx/sites-enabled/"
echo "   sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "2. Update SSL certificate paths in nginx config"
echo "3. Test the deployment: https://dev.vintraxx.com/"
echo ""
echo "📊 PM2 Status:"
pm2 status
