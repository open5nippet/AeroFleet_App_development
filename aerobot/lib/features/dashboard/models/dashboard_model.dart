// Purpose: Dashboard Model
class DashboardModel {
  final String status;

  DashboardModel({required this.status});

  factory DashboardModel.fromJson(Map<String, dynamic> json) {
    return DashboardModel(
      status: json['status'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'status': status,
    };
  }
}
