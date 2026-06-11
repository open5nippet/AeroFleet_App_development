// Purpose: Driver Status Model
class DriverStatusModel {
  final bool isDrowsy;

  DriverStatusModel({required this.isDrowsy});

  factory DriverStatusModel.fromJson(Map<String, dynamic> json) {
    return DriverStatusModel(
      isDrowsy: json['isDrowsy'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'isDrowsy': isDrowsy,
    };
  }
}
