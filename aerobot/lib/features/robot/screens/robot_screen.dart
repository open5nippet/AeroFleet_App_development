// Purpose: Robot Screen
import 'package:flutter/material.dart';

class RobotScreen extends StatelessWidget {
  const RobotScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Robot Control')),
      body: const Center(child: Text('Robot Screen')),
    );
  }
}
