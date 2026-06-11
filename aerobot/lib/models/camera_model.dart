// Purpose: Shared Camera Model
class CameraModel {
  final String id;

  CameraModel({required this.id});

  factory CameraModel.fromJson(Map<String, dynamic> json) {
    return CameraModel(
      id: json['id'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
    };
  }
}
