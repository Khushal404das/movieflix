# NetMirror APK — Full Reverse Engineering Report

> Generated: 2026-10-13
> Target: NetMirror.apk
> SHA-256: e78acd9ebabdfd765b7060f2b2f4fd46731baa3e501a978e7ddefde54417233d
> File Size: ~50 MB
> Tools: REA (rea-agents v6.4.0), apkanalyzer, Python zipfile/struct, HBC header parsing

---

## 1. Package Identity

| Field | Value |
|---|---|
| Package Name | app.netmirror.nmv2 |
| Version Name | 3.1 |
| Version Code | 1 |
| Min SDK | 24 (Android 7.0) |
| Target SDK | 35 (Android 15) |
| Build Tool | Android Gradle Plugin 8.8.2 |
| Application Class | app.netmirror.nmv2.MainApplication |
| Main Activity | app.netmirror.nmv2.MainActivity |
| VCS Info | NO_SUPPORTED_VCS_FOUND (git history stripped) |

---

## 2. Permissions

| Permission | Purpose |
|---|---|
| android.permission.INTERNET | Full network access |
| android.permission.ACCESS_NETWORK_STATE | Monitor connectivity |
| android.permission.ACCESS_WIFI_STATE | Monitor Wi-Fi state |
| android.permission.WRITE_SETTINGS | Modify system settings |
| com.google.android.finsky.permission.BIND_GET_INSTALL_REFERRER_SERVICE | Google Play install attribution |
| app.netmirror.nmv2.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION | Internal broadcast protection |

Security Flags:
- android:usesCleartextTraffic="true"  -- Unencrypted HTTP connections permitted
- android:allowBackup="false"          -- ADB backup disabled
- android:extractNativeLibs="false"    -- Native libs loaded from APK directly

---

## 3. Application Components

### Activities
| Component | Exported | Launch Mode |
|---|---|---|
| app.netmirror.nmv2.MainActivity | YES (LAUNCHER) | singleTask |

### Content Providers
| Component | Authority |
|---|---|
| com.reactnativecommunity.webview.RNCWebViewFileProvider | app.netmirror.nmv2.fileprovider |
| androidx.startup.InitializationProvider | app.netmirror.nmv2.androidx-startup |

KEY FINDING: RNCWebViewFileProvider confirms the primary UI and media playback
are rendered inside a WebView, NOT native Android components.

---

## 4. Runtime Architecture

### Framework: React Native + Hermes

Bundle: assets/index.android.bundle
- Size:             1,215,172 bytes (~1.2 MB)
- Magic:            0x1f1903c103bc1fc6
- HBC Version:      96  (React Native 0.73+)
- Function count:   7,168 compiled functions
- String count:     9,809 interned strings
- String storage:   132,000 bytes
- CJS Modules:      12,711

### Native Libraries (44 total)

Core React Native Runtime:
  libhermes.so              -- Hermes JS engine
  libjsi.so                 -- JavaScript Interface bridge
  libreactnative.so         -- React Native core
  libfbjni.so               -- Facebook JNI bridge
  libc++_shared.so          -- C++ standard library

UI & Gesture:
  libgesturehandler.so      -- React Native Gesture Handler
  librnscreens.so           -- React Native Screens

Media / Image:
  libimagepipeline.so       -- Fresco image pipeline
  libnative-imagetranscoder.so
  libnative-filters.so

App-Specific:
  libappmodules.so          -- Application native module bindings
  libhermestooling.so       -- Hermes debug/profiling tooling
  libhermes.so variants     -- Hermes runtime + tooling

---

## 5. JavaScript Bundle Analysis (Hermes String Evidence)

React Native Modules in use:
  RNCWebViewMessagingModule     -- WebView <-> JS message bridge
  RNCWebViewModule              -- WebView manager
  useWebViewLogic               -- Custom hook: core WebView logic
  RNDeviceInfo                  -- Device fingerprinting
  AsyncStorage                  -- Persistent key-value storage
  RNCNetInfo                    -- Network connectivity monitoring

Key identifiers found in string table:
  netmirror_beta                -- Internal beta feature flag
  useWebViewLogic               -- Core rendering hook
  anon_0_streamChunk            -- Streaming chunk handler function
  WebView: source.headers is not supported when using POST
  RNCWebView invalid state encountered: RNCWebViewMessagingModule
   WebView Finished Loading     -- (UTF-16) WebView lifecycle event
   Download button clicked in WebView!  -- (UTF-16) download interception

Deduced Behavior:
  1. useWebViewLogic() hook loads remote URLs into a full-screen RNCWebView.
  2. JS and WebView communicate via RNCWebViewMessagingModule (postMessage API).
  3. When the WebView fires "Download button clicked", the RN layer intercepts
     the download and handles it natively.
  4. anon_0_streamChunk suggests the app handles streaming data chunks,
     possibly for buffering feedback from the WebView player back to the RN UI.

---

## 6. Network Endpoints & Domains

### Confirmed Static Evidence

| Type | Value | How Found |
|---|---|---|
| Base64-encoded URL | aHR0cHM6Ly9tb2JpZGV0ZWN0cy5zdG9yZQ== -> https://mobidetects.store | HBC bundle scan |
| Attribution domain | https://mobidetect.click | HBC bundle scan |
| App backend | netmirror.app | String storage |
| Connectivity probe | https://clients3.google.com/generate_204 | String storage |

Attribution / Analytics:
  mobidetects.store   -- PRIMARY tracking server (base64-obfuscated to evade scanners)
  mobidetect.click    -- Secondary attribution domain

App Backend:
  netmirror.app       -- Main API / content catalog backend

---

## 7. Library Dependency Map

### Android (from META-INF versions)
  androidx.activity:          1.7.0
  androidx.appcompat:         1.7.0
  androidx.core/core-ktx:     1.13.1
  androidx.emoji2:            1.3.0
  androidx.fragment:          1.5.4
  androidx.profileinstaller:  1.3.1
  androidx.savedstate:        1.2.1
  androidx.startup-runtime:   1.1.1
  androidx.swiperefreshlayout:1.1.0
  androidx.viewpager:         1.0.0
  androidx.webkit:            1.4.0
  kotlinx.coroutines.android: 1.6.4
  kotlinx.coroutines.core:    1.6.4

### JavaScript / React Native (from bundle strings)
  @react-native-community/netinfo        -- network state
  @react-native-async-storage/async-storage -- persistence
  react-native-device-info               -- device fingerprinting
  react-native-webview (RNCWebView)      -- PRIMARY UI/player engine
  react-native-gesture-handler           -- gestures
  react-native-screens                   -- navigation
  react-native-vector-icons              -- icon fonts

---

## 8. DEX Layer

Total method references: 34,529
Total field references:  10,838
Total code size:         ~2.7 MB

App-Owned Classes (NOT obfuscated):
  app.netmirror.nmv2.MainApplication
  app.netmirror.nmv2.MainApplication$a   (ReactNativeHost inner class)
  app.netmirror.nmv2.MainActivity

All business logic is in the Hermes bundle. DEX is a thin shell.

Largest third-party package:
  com.facebook.react:  647,671 bytes (React Native runtime)

---

## 9. Architecture Flow

  Android Host (MainApplication / MainActivity)
           |
           v
  React Native Bridge (libfbjni + libjsi)
  Hermes Engine (libhermes.so)
  assets/index.android.bundle (HBC v96)
    - useWebViewLogic() custom hook
    - RNCNetInfo (network detection)
    - RNDeviceInfo (device fingerprinting)
    - AsyncStorage (session/preferences)
           |
           v
  RNCWebView (react-native-webview)
  Loads remote URLs full-screen
  Bidirectional JS messaging
           |
           v
  External Backend: netmirror.app
  Serves catalog metadata + embed player URLs
           |
           v
  Third-Party Video Hosts / CDNs
  HLS .m3u8 streams with multi-audio tracks

---

## 10. Findings Summary

CONFIRMED (from shipped artifact):
  - Thin React Native WebView shell; all content and playback are remote
  - Backend: netmirror.app
  - Tracking (obfuscated): mobidetects.store and mobidetect.click
  - Hermes HBC v96 — source code NOT recoverable without HBC decompiler
  - Device fingerprinting active via RNDeviceInfo
  - HTTP cleartext traffic explicitly allowed (some endpoints may be HTTP)
  - Download button interception implemented in JS

REQUIRES JADX or RUNTIME CAPTURE to determine:
  - Exact REST API endpoint paths and request/response format
  - Authentication mechanism (token type, session management)
  - URL construction logic inside useWebViewLogic
  - Native module registration in libappmodules.so

---

## 11. Output File Index

netmirror-re/
  REVERSE_ENGINEERING_REPORT.md   <- This file
  manifest/
    AndroidManifest.xml           <- Decoded manifest (human-readable)
    full-inventory.json           <- All 555 APK entries with sizes
  dex-analysis/
    all-packages.txt              <- All classes / methods / fields
    all-references.txt            <- Full DEX reference map
  native-libs/
    native-libs-list.txt          <- All 44 .so files with sizes
  assets/
    assets-list.txt               <- All asset entries
    fonts/                        <- Extracted icon TTFs
  hermes-bundle/
    index.android.bundle.raw      <- Raw Hermes bytecode binary
    bundle-metadata.txt           <- HBC header field values
  strings/
    all-strings.txt               <- All ASCII strings from bundle
    hermes-string-storage.txt     <- Decoded string storage region
    utf16-all-strings.txt         <- UTF-16LE strings
    term-search-results.txt       <- Keyword search with binary context
    screen-names.txt              <- Screen/component names
    react-native-modules.txt      <- RN module names
    npm-packages.txt              <- npm package references
  network-analysis/
    domains.txt                   <- Extracted domain candidates
    base64-decoded-urls.txt       <- Decoded obfuscated URLs
    network-related-strings.txt   <- Keyword-matched strings
    all-paths.txt                 <- URL paths and screen names
    app-strings-keywords.txt      <- App-specific keyword hits
  certificates/
    meta-inf-files.txt            <- All META-INF entries
    MANIFEST.MF.txt               <- JAR manifest
    version-control-info.txt      <- VCS info
    app-metadata.txt              <- Gradle build metadata
    library-versions.txt          <- All library versions
