import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'core/theme/app_theme.dart';
import 'features/home/presentation/home_screen.dart';
import 'features/project_details/presentation/project_details_screen.dart';
import 'features/contribution/presentation/contribution_screen.dart';
import 'features/submission_success/presentation/submission_success_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const HomeScreen(),
      ),
      GoRoute(
        path: '/project/:id',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return ProjectDetailsScreen(projectId: id);
        },
      ),
      GoRoute(
        path: '/project/:id/contribute',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return ContributionScreen(projectId: id);
        },
      ),
      GoRoute(
        path: '/submission-success',
        builder: (context, state) {
          final extra = (state.extra as Map<String, dynamic>?) ?? {};
          return SubmissionSuccessScreen(data: extra);
        },
      ),
    ],
  );
});

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    const ProviderScope(
      child: MasajidApp(),
    ),
  );
}

class MasajidApp extends ConsumerWidget {
  const MasajidApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'مساجد - خدمة بيوت الله',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      routerConfig: router,
      // Arabic RTL Configuration
      locale: const Locale('ar', 'SA'),
      supportedLocales: const [
        Locale('ar', 'SA'),
      ],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
    );
  }
}
