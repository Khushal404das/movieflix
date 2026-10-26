import 'package:flutter/material.dart';

class AppTheme {
  static const Color background    = Color(0xFF050505);
  static const Color surface       = Color(0xFF111111);
  static const Color card          = Color(0xFF181818);
  static const Color primary       = Color(0xFFE50914);
  static const Color textPrimary   = Color(0xFFFFFFFF);
  static const Color textSecondary = Color(0xFFB3B3B3);
  static const Color textMuted     = Color(0xFF808080);
  static const Color divider       = Color(0xFF2A2A2A);
  static const Color shimmerBase   = Color(0xFF1E1E1E);
  static const Color shimmerHigh   = Color(0xFF2A2A2A);

  static ThemeData get dark => ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: background,
    fontFamily: 'Roboto',
    colorScheme: const ColorScheme.dark(
      primary: primary,
      surface: surface,
      onPrimary: textPrimary,
      onSurface: textPrimary,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: Color(0xFF0A0A0A),
      foregroundColor: textPrimary,
      elevation: 0,
      centerTitle: false,
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: Color(0xFF0D0D0D),
      selectedItemColor: textPrimary,
      unselectedItemColor: Color(0xFF808080),
      type: BottomNavigationBarType.fixed,
    ),
    textTheme: const TextTheme(
      displayLarge:   TextStyle(color: textPrimary,   fontSize: 32, fontWeight: FontWeight.w800),
      headlineLarge:  TextStyle(color: textPrimary,   fontSize: 22, fontWeight: FontWeight.w700),
      headlineMedium: TextStyle(color: textPrimary,   fontSize: 18, fontWeight: FontWeight.w600),
      titleLarge:     TextStyle(color: textPrimary,   fontSize: 16, fontWeight: FontWeight.w600),
      titleMedium:    TextStyle(color: textSecondary, fontSize: 14, fontWeight: FontWeight.w500),
      bodyLarge:      TextStyle(color: textPrimary,   fontSize: 15),
      bodyMedium:     TextStyle(color: textSecondary, fontSize: 13),
      bodySmall:      TextStyle(color: textMuted,     fontSize: 11),
    ),
  );
}
