// Purpose: Robot Model
class RobotModel {
  final String status;

  RobotModel({required this.status});

  factory RobotModel.fromJson(Map<String, dynamic> json) {
    return RobotModel(
      status: json['status'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'status': status,
    };
  }
}
