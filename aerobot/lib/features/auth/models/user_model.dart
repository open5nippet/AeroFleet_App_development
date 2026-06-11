// Purpose: User Model for Auth
class AuthUserModel {
  final String id;
  final String name;

  AuthUserModel({required this.id, required this.name});

  factory AuthUserModel.fromJson(Map<String, dynamic> json) {
    return AuthUserModel(
      id: json['id'],
      name: json['name'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
    };
  }
}
