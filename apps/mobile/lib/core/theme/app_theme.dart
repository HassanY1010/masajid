import 'package:flutter/material.dart';

class AppTheme {
  // Brand Islamic Emerald Colors
  static const Color primary = Color(0xFF059669);
  static const Color primaryDark = Color(0xFF047857);
  static const Color primaryLight = Color(0xFF10B981);
  static const Color primaryBg = Color(0xFFECFDF5);

  // Gold Accents
  static const Color gold = Color(0xFFD97706);
  static const Color goldLight = Color(0xFFF59E0B);

  // Background & Surface Dark Theme
  static const Color bgDark = Color(0xFF090E17);
  static const Color surfaceDark = Color(0xFF131B2B);
  static const Color cardDark = Color(0xFF1B2438);
  static const Color borderDark = Color(0xFF26334D);

  // Error & Status
  static const Color rose = Color(0xFFF43F5E);

  // Text Colors
  static const Color textPrimary = Color(0xFFF8FAFC);
  static const Color textSecondary = Color(0xFF94A3B8);
  static const Color textMuted = Color(0xFF64748B);

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: bgDark,
      colorScheme: const ColorScheme.dark(
        primary: primary,
        secondary: gold,
        surface: surfaceDark,
        error: rose,
      ),
      fontFamily: 'Tajawal',
      appBarTheme: const AppBarTheme(
        backgroundColor: surfaceDark,
        foregroundColor: textPrimary,
        elevation: 0,
        centerTitle: true,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          elevation: 4,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            fontFamily: 'Tajawal',
          ),
        ),
      ),
    );
  }
}
