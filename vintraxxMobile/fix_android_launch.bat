@echo off
echo 🔧 Fixing Android launch issue for VinTraxx SmartScan...

REM Clean Android build
echo 🧹 Cleaning Android build...
cd android
gradlew clean
cd ..

REM Clear Metro cache
echo 🧹 Clearing Metro cache...
npx react-native start --reset-cache
timeout /t 3 /nobreak >nul
taskkill /f /im node.exe 2>nul

REM Clear npm cache
echo 🧹 Clearing npm cache...
npm cache clean --force

REM Reinstall node modules
echo 📦 Reinstalling node modules...
rmdir /s /q node_modules 2>nul
del package-lock.json 2>nul
npm install

REM Rebuild Android
echo 🔨 Rebuilding Android...
npx react-native run-android

echo ✅ Fix complete! The app should now launch properly.
pause
