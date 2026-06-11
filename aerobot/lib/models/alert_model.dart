// Purpose: Shared Alert Model
class AlertModel {
  final String id;
  final String message;

  AlertModel({required this.id, required this.message});

  factory AlertModel.fromJson(Map<String, dynamic> json) {
    return AlertModel(
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
