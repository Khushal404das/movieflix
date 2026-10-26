# 🎬 ReelHouse Mobile (Flutter)

A cross-platform mobile application for **Android** and **iOS** with modern streaming platform aesthetics (Netflix / Prime Video style). Built using Flutter and Dart with full TMDB integration.

---

## ✨ Features

- **📱 Mobile-Friendly UI/UX**:
  - Deep OLED dark mode (`#0D0D0D`) with Netflix red accents (`#E50914`).
  - Immersive Hero Banner with smooth gradient backdrop and direct play/watchlist actions.
  - Horizontal scrolling media rails for Trending, Now Playing, Popular Movies, and Top Rated.
- **🏷️ Studios & OTT Platform Filter**:
  - Filter content across **Netflix, Disney+, Prime Video, Apple TV+, Max, Paramount+, Hulu, Sony Pictures, Warner Bros, Universal, and Lionsgate**.
  - Sort by Popularity, Top Rated, Newest, or Title.
  - Filter by Content Type (Movies, TV Shows, or All) and by Genres.
- **🔍 Instant Live Search**:
  - Real-time search debounce across movies and TV series with responsive poster grid cards.
- **📑 Detailed Media Screen**:
  - High-res poster and backdrop images.
  - Rating badge, release date, runtime/seasons, and genre chips.
  - Overview synopsis.
  - YouTube trailer preview integration (`url_launcher`).
  - Related/Similar recommendations carousel.
- **📌 Personal Watchlist**:
  - Save and track titles to watch later.
- **🚀 Cross-Platform Support**:
  - Native performance on both **Android** and **iOS** from a single shared codebase.

---

## 📁 Project Structure

```
reelhouse_flutter/
├── android/               # Native Android configuration & manifest
├── ios/                   # Native iOS configuration & Podfile
├── lib/
│   ├── main.dart          # Entry point with bottom navigation bar
│   ├── models/
│   │   └── media_item.dart    # MediaItem data model & JSON parser
│   ├── services/
│   │   └── tmdb_service.dart  # TMDB API client with fallback data
│   ├── theme/
│   │   └── app_theme.dart     # Dark theme tokens, colors, & typography
│   ├── widgets/
│   │   └── media_card.dart    # Reusable poster card with badges
│   └── screens/
│       ├── home_screen.dart       # Hero banner, rails, OTT filter
│       ├── browse_screen.dart     # Filter by studio, genre, sorting
│       ├── search_screen.dart     # Live search with debouncing
│       ├── detail_screen.dart     # Detailed media info & trailer
│       └── watchlist_screen.dart  # Saved watchlist items
├── pubspec.yaml           # Flutter dependencies & assets
└── README.md
```

---

## 🛠️ Prerequisites

- [Flutter SDK](https://docs.flutter.dev/get-started/install) (`>= 3.3.0`)
- **For Android**: Android Studio or Android SDK command-line tools.
- **For iOS**: macOS with Xcode and CocoaPods installed.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd reelhouse_flutter
flutter pub get
```

### 2. Run in Debug Mode

Connect an Android device / emulator or iOS simulator:

```bash
flutter run
```

### 3. Build Android APK / App Bundle

- **Debug APK**:
  ```bash
  flutter build apk --debug
  ```
- **Release APK**:
  ```bash
  flutter build apk --release
  ```
  *(The generated APK will be in `build/app/outputs/flutter-apk/app-release.apk`)*

- **App Bundle (for Google Play Store)**:
  ```bash
  flutter build appbundle --release
  ```

### 4. Build iOS App

```bash
cd ios
pod install
cd ..
flutter build ipa --no-codesign
```
Or open `ios/Runner.xcworkspace` in Xcode to configure code signing and deploy to a physical iPhone/iPad or TestFlight.

---

## 🔑 TMDB API Configuration

The app defaults to TMDB with local fallback data if an API key is not supplied. You can supply your TMDB API read token or key in `lib/services/tmdb_service.dart`.
