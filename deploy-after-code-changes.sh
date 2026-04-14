#!/bin/bash

# VinTraxx Deployment Script - Run after code changes
# Deploys all 3 services (backend, frontend, admin) using PM2

set -e  # Exit on any error

echo "=========================================="
echo "  VinTraxx Deployment Script"
echo "  ========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if PM2 is running
check_pm2() {
    print_status "Checking PM2 status..."
    if ! pm2 list > /dev/null 2>&1; then
        print_error "PM2 is not installed or not running"
        exit 1
    fi
    print_status "PM2 is running"
}

# Check disk space
check_disk_space() {
    local available=$(df / | awk 'NR==2 {print $4}')
    local min_required=524288  # 512MB in KB
    
    if [ "$available" -lt "$min_required" ]; then
        print_warning "Low disk space detected ($(df -h / | awk 'NR==2 {print $4}') available)"
        print_status "Cleaning up old build artifacts..."
        
        # Clean old .next directories
        rm -rf /home/ec2-user/vintraxxsmartscan/vintraxxFrontend/.next 2>/dev/null
        rm -rf /home/ec2-user/vintraxxsmartscan/vintraxxAdmin/.next 2>/dev/null
        
        # Clean npm cache
        npm cache clean --force 2>/dev/null
        
        print_status "Cleanup complete"
    fi
}

# Build and deploy backend
deploy_backend() {
    print_status "Building backend..."
    cd /home/ec2-user/vintraxxsmartscan/vintraxxBackend
    
    # Install dependencies if node_modules is missing
    if [ ! -d "node_modules" ]; then
        print_status "Installing backend dependencies..."
        npm install
    fi
    
    # Build backend
    if npm run build; then
        print_status "Backend build successful"
    else
        print_error "Backend build failed"
        exit 1
    fi
    
    # Restart backend service
    if pm2 restart vintraxx-backend --update-env; then
        print_status "Backend service restarted"
    else
        print_error "Failed to restart backend service"
        exit 1
    fi
    
    print_status "Backend deployed successfully"
}

# Build and deploy frontend
deploy_frontend() {
    print_status "Building frontend..."
    cd /home/ec2-user/vintraxxsmartscan/vintraxxFrontend
    
    # Install dependencies if node_modules is missing or next not found
    if [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/next" ]; then
        print_status "Installing frontend dependencies..."
        npm install
    fi
    
    # Build frontend
    if npm run build; then
        print_status "Frontend build successful"
    else
        print_error "Frontend build failed"
        exit 1
    fi
    
    # Copy public folder and static assets to standalone build
    print_status "Copying static assets..."
    cp -r public .next/standalone/ 2>/dev/null || true
    cp -r .next/static .next/standalone/.next/ 2>/dev/null || true
    
    # Restart frontend service (delete and start fresh to ensure correct mode)
    pm2 delete vintraxx-frontend 2>/dev/null || true
    if pm2 start /home/ec2-user/vintraxxsmartscan/ecosystem.config.js --only vintraxx-frontend; then
        print_status "Frontend service restarted"
    else
        print_error "Failed to restart frontend service"
        exit 1
    fi
    
    print_status "Frontend deployed successfully"
}

# Build and deploy admin
deploy_admin() {
    print_status "Building admin..."
    cd /home/ec2-user/vintraxxsmartscan/vintraxxAdmin
    
    # Install dependencies if node_modules is missing or next not found
    if [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/next" ]; then
        print_status "Installing admin dependencies..."
        npm install
    fi
    
    # Build admin
    if npm run build; then
        print_status "Admin build successful"
    else
        print_error "Admin build failed"
        exit 1
    fi
    
    # Copy public folder and static assets to standalone build
    print_status "Copying static assets..."
    cp -r public .next/standalone/ 2>/dev/null || true
    cp -r .next/static .next/standalone/.next/ 2>/dev/null || true
    
    # Restart admin service (delete and start fresh to ensure correct mode)
    pm2 delete vintraxx-admin 2>/dev/null || true
    if pm2 start /home/ec2-user/vintraxxsmartscan/ecosystem.config.js --only vintraxx-admin; then
        print_status "Admin service restarted"
    else
        print_error "Failed to restart admin service"
        exit 1
    fi
    
    print_status "Admin deployed successfully"
}

# Test services
test_services() {
    print_status "Testing services..."
    
    # Check PM2 status
    pm2 status
    
    # Check if all services are online
    backend_status=$(pm2 jlist | jq -r '.[] | select(.name == "vintraxx-backend") | .pm2_env.status' 2>/dev/null || echo "unknown")
    frontend_status=$(pm2 jlist | jq -r '.[] | select(.name == "vintraxx-frontend") | .pm2_env.status' 2>/dev/null || echo "unknown")
    admin_status=$(pm2 jlist | jq -r '.[] | select(.name == "vintraxx-admin") | .pm2_env.status' 2>/dev/null || echo "unknown")
    
    echo ""
    print_status "Service Status:"
    echo "  Backend:  $backend_status"
    echo "  Frontend: $frontend_status"
    echo "  Admin:    $admin_status"
    
    if [[ "$backend_status" == "online" && "$frontend_status" == "online" && "$admin_status" == "online" ]]; then
        print_status "All services are running successfully!"
    else
        print_warning "Some services may not be running properly"
    fi
}

# Save PM2 configuration
save_pm2_config() {
    print_status "Saving PM2 configuration..."
    pm2 save
    print_status "PM2 configuration saved"
}

# Main deployment flow
main() {
    echo "Starting deployment after code changes..."
    echo ""
    
    check_pm2
    echo ""
    
    check_disk_space
    echo ""
    
    deploy_backend
    echo ""
    
    deploy_frontend  
    echo ""
    
    deploy_admin
    echo ""
    
    test_services
    echo ""
    
    save_pm2_config
    echo ""
    
    echo "=========================================="
    print_status "Deployment completed successfully!"
    echo "=========================================="
    echo ""
    echo "Services:"
    echo "  Backend:  https://api.vintraxx.com"
    echo "  Frontend: https://dev.vintraxx.com"
    echo "  Admin:    https://admin.vintraxx.com"
    echo ""
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"
