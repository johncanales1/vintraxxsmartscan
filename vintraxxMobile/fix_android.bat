@echo off
echo ========================================
echo Android Launch Fix - VinTraxx SmartScan
echo ========================================
echo.

echo Step 1: Uninstalling old app from emulator...
adb uninstall com.vtsmartscan
echo.

echo Step 2: Cleaning Android build...
cd android
call gradlew clean
cd ..
echo.

echo Step 3: Rebuilding and installing app...
npx react-native run-android
echo.

echo ========================================
echo Fix complete! App should now launch.
echo ========================================
pause
