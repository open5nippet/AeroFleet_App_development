// Purpose: Shared GPS Model
class GpsModel {
  final double latitude;
  final double longitude;

  GpsModel({required this.latitude, required this.longitude});

  factory GpsModel.fromJson(Map<String, dynamic> json) {
    return GpsModel(
      latitude: json['latitude'],
      longitude: json['longitude'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'latitude': latitude,
      'longitude': longitude,
    };
  }
}
