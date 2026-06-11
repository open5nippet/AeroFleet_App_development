// Purpose: Feature-specific Alert Model
class FeatureAlertModel {
  final String id;
  final String message;

  FeatureAlertModel({required this.id, required this.message});

  factory FeatureAlertModel.fromJson(Map<String, dynamic> json) {
    return FeatureAlertModel(
      id: json['id'],
      message: json['message'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'message': message,
    };
  }
}
