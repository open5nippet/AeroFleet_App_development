// Purpose: Application Entry Point
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/theme/app_theme.dart';
import 'routes/route_generator.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        // Add your providers here
        Provider(create: (_) => 'Example Provider'),
      ],
      child: const AeroBotApp(),
    ),
  );
}

class AeroBotApp extends StatelessWidget {
  const AeroBotApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'AeroBot',
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system, // Supports dark theme
      routerConfig: RouteGenerator.router, // Uses GoRouter
    );
  }
}
