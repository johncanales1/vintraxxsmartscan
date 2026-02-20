#!/bin/bash

# Fix Android launch issue for VinTraxx SmartScan
echo "🔧 Fixing Android launch issue..."

# Clean Android build
echo "🧹 Cleaning Android build..."
cd android
./gradlew clean
cd ..

# Clear Metro cache
echo "🧹 Clearing Metro cache..."
npx react-native start --reset-cache &
METRO_PID=$!
sleep 3
kill $METRO_PID 2>/dev/null

# Clear npm cache
echo "🧹 Clearing npm cache..."
npm cache clean --force

# Reinstall node modules
echo "📦 Reinstalling node modules..."
rm -rf node_modules package-lock.json
npm install

# Rebuild Android
echo "🔨 Rebuilding Android..."
npx react-native run-android

echo "✅ Fix complete! The app should now launch properly."
