# MovieFlix iOS Native App

The official MovieFlix app for Apple iOS (iPhone, iPad & Mac Catalyst), built with Swift and WebKit.

## App Specifications
- **App Name**: MovieFlix
- **Bundle Identifier**: `com.movieflix.app`
- **Target OS**: iOS 15.0+ (iPhone, iPad, Mac Catalyst)
- **App URL**: `https://movieflix.movie-flix.workers.dev/home`
- **Streaming Engine**: Vidbolt Pro with Multi-Audio (Hindi, English, Tamil, Telugu, etc.)
- **Background Playback**: Enabled (`audio`, `processing`, `remote-notification`)

## Project Structure
```
ios-native/
├── ReelStream.xcodeproj/     # Xcode Project (Builds MovieFlix target)
├── ReelStream.xcworkspace/   # Xcode Workspace
├── Podfile                   # CocoaPods dependencies
├── ReelStream/               # Swift source code & assets
│   ├── AppDelegate.swift
│   ├── SceneDelegate.swift
│   ├── ViewController.swift
│   ├── WebView.swift
│   ├── Settings.swift        # App URL & allowed origins
│   ├── Info.plist            # Permissions & capabilities
│   └── Assets.xcassets/      # App icons & launch screens
└── README.md
```

## How to Build & Run with Xcode

1. **Prerequisites**:
   - macOS with Xcode 15+ installed
   - CocoaPods (`sudo gem install cocoapods`)

2. **Install Pods**:
   ```bash
   cd ios-native
   pod install
   ```

3. **Open Project**:
   ```bash
   open ReelStream.xcworkspace
   ```

4. **Signing & Capabilities**:
   - Select the **MovieFlix** target in Xcode.
   - Go to **Signing & Capabilities**.
   - Select your **Apple Developer Team** or personal Apple ID for free sideloading.

5. **Run**:
   - Connect your iPhone/iPad or select an iOS Simulator.
   - Press **Cmd + R** to build and run.

## Sideloading (No Mac Required)
You can archive the project into a `.ipa` file and install it directly via:
- **AltStore** (Windows / macOS)
- **Sideloadly** (Windows / macOS)
- **TrollStore** (iOS 15.0 - 17.0)
