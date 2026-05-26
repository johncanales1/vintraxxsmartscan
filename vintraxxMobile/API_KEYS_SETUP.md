# API Keys Configuration

This document explains how to configure the Google Maps API keys for iOS and Android.

## Security Note

**The hardcoded API keys have been removed from the repository.** You need to configure them locally using the methods below. These configuration files are gitignored and will not be committed to the repository.

## Android Configuration

### Step 1: Get your Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project or select an existing one
3. Enable "Maps SDK for Android"
4. Create an API key with appropriate restrictions
5. Copy the API key

### Step 2: Configure local.properties

The file `android/local.properties` is already created and gitignored. Add your API key:

```properties
GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key_here
```

### Step 3: Configure Keystore (for release builds)

If you need to build release APKs, also configure the keystore properties in `android/local.properties`:

```properties
MYAPP_RELEASE_STORE_FILE=vintraxx-release.keystore
MYAPP_RELEASE_KEY_ALIAS=vintraxx-key
MYAPP_RELEASE_STORE_PASSWORD=your_keystore_password
MYAPP_RELEASE_KEY_PASSWORD=your_key_password
```

## iOS Configuration

### Step 1: Get your Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project or select an existing one
3. Enable "Maps SDK for iOS"
4. Create an API key with appropriate restrictions
5. Copy the API key

### Step 2: Configure Secrets.xcconfig

The file `ios/VTSmartScan/Secrets.xcconfig` is already created and gitignored. Add your API key:

```xcconfig
GOOGLE_MAPS_API_KEY = your_actual_google_maps_api_key_here
```

### Step 3: Add to Xcode Project

To use the Secrets.xcconfig file in Xcode:

1. Open `ios/VTSmartScan.xcodeproj` in Xcode
2. Select the project in the navigator
3. Select the "VTSmartScan" target
4. Go to the "Build Settings" tab
5. Search for "Configurations"
6. Add "Secrets.xcconfig" to your build configurations (Debug and Release)

Alternatively, you can set the API key as an environment variable in your Xcode scheme:
1. Product > Scheme > Edit Scheme
2. Select "Run" > "Environment Variables"
3. Add `GOOGLE_MAPS_API_KEY` with your API key as the value

## Alternative: Environment Variables

Both iOS and Android support reading the API key from environment variables:

- **iOS**: Set `GOOGLE_MAPS_API_KEY` environment variable in Xcode scheme or your CI/CD pipeline
- **Android**: Set `GOOGLE_MAPS_API_KEY` in your environment before running gradle commands

## Verification

After configuration, rebuild your app and verify that:
- Maps render correctly in the Android app
- Maps render correctly in the iOS app

## Troubleshooting

If maps don't appear:
1. Verify the API key is correct
2. Check that the API key has the correct Google Maps SDK enabled (Android or iOS)
3. Ensure the API key has proper restrictions set (if any)
4. Check the console logs for specific error messages

## Files Modified

The following files were modified to remove hardcoded secrets:
- `ios/VTSmartScan/AppDelegate.swift` - Removed hardcoded API key
- `android/app/src/main/AndroidManifest.xml` - Removed hardcoded API key
- `android/gradle.properties` - Removed hardcoded keystore passwords
- `.gitignore` - Added secret configuration files to ignore list
