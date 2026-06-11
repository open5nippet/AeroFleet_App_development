// Purpose: App Route Generator using GoRouter
import 'package:go_router/go_router.dart';
import '../features/auth/screens/login_screen.dart';
import '../features/dashboard/screens/dashboard_screen.dart';
import '../features/driver_monitoring/screens/driver_monitoring_screen.dart';
import '../features/gps/screens/gps_tracking_screen.dart';
import '../features/alerts/screens/alerts_screen.dart';
import '../features/robot/screens/robot_screen.dart';
import '../features/settings/screens/settings_screen.dart';
import 'app_routes.dart';

class RouteGenerator {
  static final router = GoRouter(
    initialLocation: AppRoutes.home,
    routes: [
      GoRoute(
        path: AppRoutes.home,
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: AppRoutes.login,
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: AppRoutes.dashboard,
        builder: (context, state) => const DashboardScreen(),
      ),
      GoRoute(
        path: AppRoutes.driverMonitoring,
        builder: (context, state) => const DriverMonitoringScreen(),
      ),
      GoRoute(
        path: AppRoutes.gps,
        builder: (context, state) => const GpsTrackingScreen(),
      ),
      GoRoute(
        path: AppRoutes.alerts,
        builder: (context, state) => const AlertsScreen(),
      ),
      GoRoute(
        path: AppRoutes.robot,
        builder: (context, state) => const RobotScreen(),
      ),
      GoRoute(
        path: AppRoutes.settings,
        builder: (context, state) => const SettingsScreen(),
      ),
    ],
  );
}
