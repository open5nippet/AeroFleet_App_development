# AeroFleet 🚀

![AeroFleet Banner](https://img.shields.io/badge/AeroFleet-AI_Dashcam_%26_Fleet_Safety-00D4FF?style=for-the-badge&logoColor=white) 
![React Native](https://img.shields.io/badge/React_Native-Expo_SDK_54-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

**AeroFleet** is a state-of-the-art **AI Dashcam & Fleet Safety Platform** designed specifically for professional drivers. Built as a high-performance React Native mobile application using Expo, it transforms a standard smartphone into a comprehensive automotive telemetry HUD, route planner, and AI dashcam.

---

## ✨ Design Aesthetic: "Space HUD"
The application features a fully custom **Space HUD** UI theme, abandoning standard templates for a distinctly premium feel:
- **Glassmorphism Overlay Style:** Soft frosted-glass cards, translucent gradient tops, and glowing inputs.
- **Deep Space Palette:** Deep space-black (`#060810`) canvases with electric cyan (`#00D4FF`) and violet (`#7C3AED`) visual accents.
- **Micro-Animations:** Fluid animated circular gauges, floating route panels, button press scaling, and spring-based screen transitions powered by `Animated` and `expo-haptics`.

---

## 🚀 Key Capabilities 

### 📟 Telemetry Dashboard
- **Animated Speed Gauge:** A responsive, glowing circular speedometer that scales dynamically with live GPS speed data.
- **Gyroscope Stability Tracker:** Actively monitors device orientation to gauge driving smoothness.
- **Live Session Strip:** Tracks active drive time, maximum speed obtained, and active safety event counts in real-time.

### 🗺️ Route Planner & Live Map
- **Mapbox Integration:** Real-time geocoding tuned specifically for precise destination lookups.
- **Live Traffic:** Native Google Maps (Android) and Apple Maps (iOS) integration with live traffic overlays (`showsTraffic`). 
- **Start Navigation:** Fluid "Point A to Point B" routing pipeline with distance and ETA calculation, complete with floating glassmorphism search panels.

### 📸 AI Dashcam
- **Configurable Recording:** Background video recording with quality toggles ranging from `480p` up to `4K`.
- **Live Alerts:** "Toast" slide-in notifications that appear the moment a safety event is logged (e.g. "⚠️ Harsh Brake Detected").
- **Camera Controls:** Front & Back camera flipping with an animated progress ring around the record button.

### 🚨 Safety Event Logging
- **Event Tracking:** Automatically (and manually) captures occurrences of SOS Emergencies, Harsh Braking, Sudden Accelerations, and Crashes.
- **Log Management:** Dedicated, scrollable filter tabs (All, SOS, Braking, Accel, Crash), animated summary cards, and a permanent "Clear All" database wipe utility.

### 👤 Profile & Driver Achievements
- **Live Stats Box:** Shows distance covered, video clips recorded, and total events triggered during the live session.
- **Gamified Safety Badges:** Unlockable driver achievements like *Safe Driver* (0 SOS events) and *Veteran* based on telemetry behavior.

---

## 📂 Project Structure

```text
├── apps/
│   ├── mobile/              # Expo React Native app
│   │   ├── app/             # Expo Router screens
│   │   │   ├── (tabs)/      # Bottom tab navigation (dashboard, camera, map, events, profile)
│   │   │   ├── index.tsx    # Auth redirect entry
│   │   │   └── login.tsx    # Secure driver login (glass inputs, animations)
│   │   ├── components/      # Shared UI (RNMapView, ErrorBoundary)
│   │   ├── constants/       # Color tokens and Space HUD themes
│   │   ├── context/         # Global State (Auth, Recording, Theme)
│   │   └── services/        # Mapbox geocoding & Map routing APIs
│   └── api-server/          # Express REST API backend (Work in Progress)
│       └── src/
├── packages/
│   ├── api-client-react/    # Auto-generated React Query API client
│   ├── api-zod/             # Shared Zod validation schemas
│   └── db/                  # Drizzle ORM schema and database setup
└── pnpm-workspace.yaml      # Monorepo configuration
```

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Core Framework** | React Native + Expo (SDK 54) |
| **Navigation** | Expo Router (File-based routing) |
| **Mapping & Routing**| Mapbox API, `react-native-maps` |
| **Camera Module** | `expo-camera` |
| **State Management** | React Context + Async Storage |
| **Animations** | React Native `Animated`, `expo-linear-gradient`, `expo-blur` |
| **Haptics** | `expo-haptics` |

---

## 💻 Getting Started

### Prerequisites
1. [Node.js 20+](https://nodejs.org/)
2. [pnpm](https://pnpm.io/) package manager (`npm install -g pnpm`)
3. The **Expo Go** app installed on your physical iOS or Android device.

### 1. Installation
Clone the repository and install all monorepo dependencies:
```bash
pnpm install
```

### 2. Environment Variables
To enable map search and routing, you are required to provide a Mapbox Access Token. Create a `.env` file inside `apps/mobile/`:
```env
# apps/mobile/.env
EXPO_PUBLIC_MAPBOX_KEY=your_mapbox_public_token_here
```

### 3. Run the Mobile App Locally
Fire up the Expo development server:
```bash
cd apps/mobile
pnpm dev
```
Once the server starts, **scan the QR code** using your phone's camera (iOS) or the Expo Go app (Android).

> ⚠️ **First run after any folder restructuring?** Clear the Metro cache:
> ```bash
> npx expo start -c
> ```

---

## 🚀 Building for Production

To build the standalone application for deployment to the Google Play Store or Apple App Store, we utilize Expo Application Services (EAS).

```bash
# 1. Install the EAS CLI globally
npm install -g eas-cli
eas login

# 2. Configure the project for EAS (First time only)
eas build:configure

# 3. Build the Android AAB / APK bundle
eas build --platform android --profile production

# 4. Submit directly to the Play Store
eas submit --platform android
```

---

*AeroFleet — The future of safe, monitored, and efficient driving.*
