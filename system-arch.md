# AeroBot Flutter Architecture & Team Development Guide

## Project Overview

AeroBot is an AI-powered Driver Monitoring and Fleet Safety System.

The application integrates:

* Raspberry Pi
* ESP32-CAM
* GPS Tracking
* Driver Monitoring
* Drowsiness Detection
* Voice Assistant
* Alert System
* Fleet Dashboard

---

# Project Architecture

```text
lib/
│
├── core/
├── features/
├── models/
├── routes/
├── services/
├── shared/
└── main.dart
```

---

# Folder Explanation

## core/

Contains application-wide configurations.

### constants/

Stores all constant values.

#### app_colors.dart

Contains all application colors.

Example:

```dart
AppColors.primary
AppColors.background
AppColors.success
AppColors.error
```

Never use:

```dart
Colors.blue
Colors.red
Colors.green
```

directly inside screens.

Always use AppColors.

---

#### app_strings.dart

Stores reusable text.

Example:

```dart
AppStrings.appName
AppStrings.loginTitle
```

---

#### api_endpoints.dart

Stores API URLs.

Example:

```dart
baseUrl
loginEndpoint
gpsEndpoint
```
## Additional Design System Files

These files ensure every developer follows the same design language.

Without them:

* Screens will look different.
* Buttons will have different sizes.
* Different paddings will be used.
* Different icon styles will appear.
* UI consistency will break.

---

### app_spacing.dart

Location:

```text
lib/core/constants/app_spacing.dart
```

Purpose:

Stores all spacing values used throughout the application.

Example:

```dart
class AppSpacing {
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 16;
  static const double lg = 24;
  static const double xl = 32;
}
```

Usage:

```dart
Padding(
  padding: EdgeInsets.all(AppSpacing.md),
)
```

Instead of:

```dart
Padding(
  padding: EdgeInsets.all(16),
)
```

Benefits:

* Consistent spacing everywhere.
* Easy redesign.
* Better readability.

Rule:

Never hardcode:

```dart
8
12
16
24
32
```

Always use AppSpacing.

---

### app_radius.dart

Location:

```text
lib/core/constants/app_radius.dart
```

Purpose:

Stores all border radius values.

Example:

```dart
class AppRadius {
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 20;
  static const double xl = 30;
}
```

Usage:

```dart
BorderRadius.circular(AppRadius.md)
```

Instead of:

```dart
BorderRadius.circular(12)
```

Benefits:

* Same rounded corners throughout app.
* Consistent card design.
* Consistent button design.

Rule:

Never hardcode border radius values.

Always use AppRadius.

---

### app_icons.dart

Location:

```text
lib/core/constants/app_icons.dart
```

Purpose:

Stores all application icons.

Example:

```dart
class AppIcons {
  static const dashboard = Icons.dashboard;
  static const gps = Icons.location_on;
  static const alerts = Icons.warning;
  static const settings = Icons.settings;
  static const robot = Icons.smart_toy;
}
```

Usage:

```dart
Icon(AppIcons.dashboard)
```

Instead of:

```dart
Icon(Icons.dashboard)
```

Benefits:

* Easier icon replacement.
* Centralized icon management.
* Consistent icon selection.

Example:

If project changes:

```dart
Icons.warning
```

to:

```dart
Icons.notification_important
```

only one file changes.

---

## Design System Hierarchy

Every developer must use:

```text
AppColors
↓
AppTheme
↓
AppSpacing
↓
AppRadius
↓
AppIcons
↓
Shared Widgets
```

Never bypass the design system.

---

# Golden UI Rule

Do NOT write:

```dart
Colors.blue
EdgeInsets.all(16)
BorderRadius.circular(12)
Icons.dashboard
```

Use:

```dart
AppColors.primary
AppSpacing.md
AppRadius.md
AppIcons.dashboard
```

This guarantees every screen built by different team members looks like it was created by one designer.

---

### theme/

Contains application theme.

#### app_theme.dart

Controls:

* Dark Theme
* Light Theme
* Colors
* Typography
* Buttons
* Cards
* Input Fields

Every screen must use this theme.

---

### utils/

Helper functions.

Example:

* Validators
* Formatting
* Date conversion

---

# features/

Every feature has its own folder.

Rule:

Each feature contains:

```text
screens/
widgets/
services/
models/
```

---

## auth/

Handles login and signup.

### screens/

Contains full pages.

Example:

```dart
login_screen.dart
signup_screen.dart
```

---

### widgets/

Reusable components.

Example:

```dart
login_form.dart
auth_button.dart
```

---

### services/

Business logic.

Example:

```dart
auth_service.dart
```

API calls go here.

Never place API calls inside screens.

---

### models/

Data structures.

Example:

```dart
UserModel
```

---

## dashboard/

Displays:

* Vehicle Status
* Driver Status
* Camera Status
* GPS Status
* Alert Count

---

## driver_monitoring/

Displays:

* Driver Face Tracking
* Drowsiness Detection
* Phone Usage Detection
* Driver Risk Score

---

## gps/

Displays:

* Live Tracking
* Vehicle Location
* Route History

---

## alerts/

Displays:

* Drowsiness Alerts
* Accident Alerts
* Emergency Alerts

---

## robot/

Displays:

* Camera Status
* Servo Status
* Speaker Status
* Microphone Status

---

## settings/

Displays:

* Theme Settings
* Notifications
* Voice Assistant Settings

---

# models/

Global data models.

Example:

```dart
VehicleModel
GpsModel
AlertModel
```

Each model contains:

```dart
fromJson()
toJson()
```

---

# services/

Global services.

## api_service.dart

Backend communication.

---

## websocket_service.dart

Real-time updates.

Used for:

* GPS
* Alerts
* Live Status

---

## storage_service.dart

Local storage.

---

## notification_service.dart

Push notifications.

---

# routes/

Navigation system.

Contains:

```dart
GoRouter
```

All routes must be defined here.

Never hardcode navigation paths.

---

# shared/

Reusable widgets used across the entire application.

Example:

```dart
CustomButton
CustomTextField
LoadingWidget
```

If a widget is used by 2 or more features, move it here.

---

# Theme Rules (VERY IMPORTANT)

All developers must follow these rules.

---

## Rule 1

Never write:

```dart
Colors.blue
Colors.red
Colors.green
```

Use:

```dart
AppColors.primary
AppColors.error
AppColors.success
```

---

## Rule 2

Never create custom text styles inside screens.

Wrong:

```dart
TextStyle(
 fontSize: 18,
 fontWeight: FontWeight.bold,
)
```

Use:

```dart
Theme.of(context).textTheme
```

---

## Rule 3

Never create custom buttons repeatedly.

Use:

```dart
CustomButton
```

from shared/widgets.

---

## Rule 4

Never hardcode spacing.

Create:

```dart
AppSpacing.small
AppSpacing.medium
AppSpacing.large
```

inside core/constants.

---

## Rule 5

Never hardcode border radius.

Use:

```dart
AppRadius.small
AppRadius.medium
AppRadius.large
```

---

## Rule 6

Never create feature-specific colors.

All colors must be added in:

```dart
core/constants/app_colors.dart
```

---

# Team Responsibilities

## Member 1

Auth Feature

* Login
* Signup

---

## Member 2

Dashboard Feature

* Status Cards
* Vehicle Monitoring

---

## Member 3

GPS Feature

* Maps
* Tracking

---

## Member 4

Driver Monitoring

* Drowsiness
* Phone Detection

---

## Member 5

Alerts + Settings

* Notifications
* Preferences

---

# Development Workflow

1. Create feature branch.
2. Implement feature.
3. Follow theme rules.
4. Test locally.
5. Create Pull Request.
6. Review before merge.

---

# Golden Rule

Never hardcode:

* Colors
* Fonts
* Padding
* Radius
* API URLs

Everything must come from centralized files.

This guarantees the entire AeroBot application has one consistent design system.
