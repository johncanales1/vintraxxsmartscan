#!/bin/bash

# Frontend deployment script for dev.vintraxx.com
echo "🚀 Starting frontend deployment to dev.vintraxx.com..."

# Set variables
PROJECT_DIR="/home/ec2-user/vintraxxsmartscan/vintraxxFrontend"
DEPLOY_DIR="/var/www/dev.vintraxx.com"
PORT=3002
PID_FILE="/tmp/frontend-dev.pid"

# Function to stop existing process
stop_existing() {
    if [ -f "$PID_FILE" ]; then
        echo "🛑 Stopping existing frontend process..."
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            kill "$PID"
            sleep 2
            # Force kill if still running
            if kill -0 "$PID" 2>/dev/null; then
                kill -9 "$PID"
            fi
        fi
        rm -f "$PID_FILE"
    fi
}

# Function to start the application
start_app() {
    echo "🔄 Starting frontend application on port $PORT..."
    cd "$PROJECT_DIR"
    
    # Check if port is already in use
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $PORT is already in use. Killing existing process..."
        sudo lsof -ti:$PORT | xargs kill -9
        sleep 2
    fi
    
    # Start the application in background
    nohup npm start -- --port $PORT > /var/log/frontend-dev.log 2>&1 &
    PID=$!
    echo $PID > "$PID_FILE"
    
    echo "✅ Frontend started with PID: $PID"
    echo "📋 Logs available at: /var/log/frontend-dev.log"
}

# Function to check if application is running
check_health() {
    echo "🔍 Checking application health..."
    sleep 5
    
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            echo "✅ Application is running (PID: $PID)"
            
            # Check if port is responding
            if curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT | grep -q "200\|404"; then
                echo "✅ Application is responding on port $PORT"
                return 0
            else
                echo "❌ Application is not responding on port $PORT"
                return 1
            fi
        else
            echo "❌ Application process is not running"
            return 1
        fi
    else
        echo "❌ PID file not found"
        return 1
    fi
}

# Main deployment process
echo "📦 Building application..."
cd "$PROJECT_DIR"
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
    
    # Stop existing process
    stop_existing
    
    # Start new process
    start_app
    
    # Health check
    if check_health; then
        echo "🎉 Frontend deployed successfully!"
        echo "🌐 Available at: https://dev.vintraxx.com"
        echo "📊 Nginx is configured to proxy to localhost:$PORT"
    else
        echo "❌ Deployment failed - application not responding"
        exit 1
    fi
else
    echo "❌ Build failed"
    exit 1
fi

echo "✨ Deployment complete!"
