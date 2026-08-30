class ProjectImageModel {
  final String id;
  final String url;
  final String type;

  ProjectImageModel({
    required this.id,
    required this.url,
    required this.type,
  });

  factory ProjectImageModel.fromJson(Map<String, dynamic> json) {
    return ProjectImageModel(
      id: json['id'] ?? '',
      url: json['url'] ?? '',
      type: json['type'] ?? 'GALLERY',
    );
  }
}

class ProjectUpdateModel {
  final String id;
  final String title;
  final String description;
  final List<String> images;
  final DateTime createdAt;

  ProjectUpdateModel({
    required this.id,
    required this.title,
    required this.description,
    required this.images,
    required this.createdAt,
  });

  factory ProjectUpdateModel.fromJson(Map<String, dynamic> json) {
    return ProjectUpdateModel(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      images: List<String>.from(json['images'] ?? []),
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
    );
  }
}

class ProjectModel {
  final String id;
  final String title;
  final String mosqueName;
  final String governorate;
  final String district;
  final String locationText;
  final String description;
  final String needDescription;
  final String category;
  final double estimatedCost;
  final String currency;
  final int totalShares;
  final double shareValue;
  final int fundedShares;
  final double fundedAmount;
  final String status;
  final int remainingShares;
  final double remainingAmount;
  final int fundingPercentage;
  final List<ProjectImageModel> images;
  final List<ProjectUpdateModel> updates;

  ProjectModel({
    required this.id,
    required this.title,
    required this.mosqueName,
    required this.governorate,
    required this.district,
    required this.locationText,
    required this.description,
    required this.needDescription,
    required this.category,
    required this.estimatedCost,
    required this.currency,
    required this.totalShares,
    required this.shareValue,
    required this.fundedShares,
    required this.fundedAmount,
    required this.status,
    required this.remainingShares,
    required this.remainingAmount,
    required this.fundingPercentage,
    required this.images,
    required this.updates,
  });

  factory ProjectModel.fromJson(Map<String, dynamic> json) {
    return ProjectModel(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      mosqueName: json['mosqueName'] ?? '',
      governorate: json['governorate'] ?? '',
      district: json['district'] ?? '',
      locationText: json['locationText'] ?? '',
      description: json['description'] ?? '',
      needDescription: json['needDescription'] ?? '',
      category: json['category'] ?? 'MAINTENANCE',
      estimatedCost: (json['estimatedCost'] as num?)?.toDouble() ?? 0.0,
      currency: json['currency'] ?? 'SAR',
      totalShares: json['totalShares'] ?? 0,
      shareValue: (json['shareValue'] as num?)?.toDouble() ?? 0.0,
      fundedShares: json['fundedShares'] ?? 0,
      fundedAmount: (json['fundedAmount'] as num?)?.toDouble() ?? 0.0,
      status: json['status'] ?? 'DRAFT',
      remainingShares: json['remainingShares'] ?? 0,
      remainingAmount: (json['remainingAmount'] as num?)?.toDouble() ?? 0.0,
      fundingPercentage: json['fundingPercentage'] ?? 0,
      images: (json['images'] as List<dynamic>?)
              ?.map((e) => ProjectImageModel.fromJson(e))
              .toList() ??
          [],
      updates: (json['updates'] as List<dynamic>?)
              ?.map((e) => ProjectUpdateModel.fromJson(e))
              .toList() ??
          [],
    );
  }

  String? get coverImageUrl {
    if (images.isEmpty) return null;
    final cover = images.firstWhere(
      (img) => img.type == 'COVER',
      orElse: () => images.first,
    );
    return cover.url;
  }
}
