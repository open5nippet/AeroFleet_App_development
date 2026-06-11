// Purpose: Shared Vehicle Model
class VehicleModel {
  final String id;

  VehicleModel({required this.id});

  factory VehicleModel.fromJson(Map<String, dynamic> json) {
    return VehicleModel(
      id: json['id'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
    };
  }
}
