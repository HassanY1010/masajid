class AppConfig {
  static const String appName = 'مساجد';
  static const String appTagline = 'خدمة بيوت الله';

  // Live Cloud API URL on Render
  static const String baseUrl = 'https://masajid-1ggr.onrender.com/api';

  // Timeouts
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
}
