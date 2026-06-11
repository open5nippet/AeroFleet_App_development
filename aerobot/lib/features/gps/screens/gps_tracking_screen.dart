// Purpose: GPS Tracking Screen
import 'package:flutter/material.dart';

class GpsTrackingScreen extends StatelessWidget {
  const GpsTrackingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('GPS Tracking')),
      body: const Center(child: Text('GPS Tracking Screen')),
    );
  }
}
