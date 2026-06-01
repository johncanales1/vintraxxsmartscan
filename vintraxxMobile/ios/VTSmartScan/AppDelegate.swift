import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import GoogleSignIn
import FirebaseCore
import GoogleMaps

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {

    // Google Maps SDK — must be initialized before any MapView is rendered.
    // The iOS key should come from Info.plist:
    // <key>GOOGLE_MAPS_API_KEY</key>
    // <string>$(GOOGLE_MAPS_API_KEY)</string>
    let plistApiKey = Bundle.main.object(forInfoDictionaryKey: "GOOGLE_MAPS_API_KEY") as? String
    let envApiKey = ProcessInfo.processInfo.environment["GOOGLE_MAPS_API_KEY"]
    let apiKey = plistApiKey ?? envApiKey

    if let apiKey = apiKey,
       !apiKey.isEmpty,
       apiKey != "$(GOOGLE_MAPS_API_KEY)",
       apiKey != "YOUR_GOOGLE_MAPS_API_KEY" {

      print("✅ Google Maps API key loaded for iOS")
      print("✅ Google Maps API key prefix: \(apiKey.prefix(8))...")
      GMSServices.provideAPIKey(apiKey)

    } else {
      print("❌ Google Maps API key missing or not substituted")
      print("plistApiKey: \(plistApiKey ?? "nil")")
      print("envApiKey exists: \(envApiKey != nil)")
    }

    FirebaseApp.configure()

    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "VTSmartScan",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }

  func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return GIDSignIn.sharedInstance.handle(url)
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}