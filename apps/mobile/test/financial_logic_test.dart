import 'package:flutter_test/flutter_test.dart';
import 'package:masajid_mobile/features/projects/models/project_model.dart';

void main() {
  group('Financial Logic & Model Integrity Tests', () {
    test('Formula verification: totalShares * shareValue == estimatedCost', () {
      final projectJson = {
        'id': 'test-123',
        'title': 'مشروع صيانة وتكييف',
        'mosqueName': 'مسجد التقوى',
        'governorate': 'حضرموت',
        'district': 'المكلا',
        'locationText': 'المكلا',
        'description': 'وصف المشروع',
        'needDescription': 'وصف الاحتياج',
        'category': 'MAINTENANCE',
        'estimatedCost': 20000.0,
        'currency': 'SAR',
        'totalShares': 2000,
        'shareValue': 10.0,
        'fundedShares': 500,
        'fundedAmount': 5000.0,
        'status': 'FUNDING',
        'remainingShares': 1500,
        'remainingAmount': 15000.0,
        'fundingPercentage': 25,
        'images': [],
        'updates': [],
      };

      final project = ProjectModel.fromJson(projectJson);

      expect(project.id, 'test-123');
      expect(project.totalShares * project.shareValue, project.estimatedCost);
      expect(project.remainingShares, 1500);
      expect(project.fundedAmount + project.remainingAmount, project.estimatedCost);
    });

    test('Fully funded state protection calculation', () {
      final projectJson = {
        'id': 'test-fully-funded',
        'title': 'مشروع مكتمل',
        'mosqueName': 'مسجد النور',
        'governorate': 'حضرموت',
        'district': 'سيئون',
        'locationText': 'سيئون',
        'description': 'مشروع مكتمل التمويل',
        'needDescription': 'احتياج',
        'category': 'SOLAR',
        'estimatedCost': 10000.0,
        'currency': 'SAR',
        'totalShares': 1000,
        'shareValue': 10.0,
        'fundedShares': 1000,
        'fundedAmount': 10000.0,
        'status': 'FULLY_FUNDED',
        'remainingShares': 0,
        'remainingAmount': 0.0,
        'fundingPercentage': 100,
        'images': [],
        'updates': [],
      };

      final project = ProjectModel.fromJson(projectJson);

      expect(project.remainingShares, 0);
      expect(project.fundingPercentage, 100);
      expect(project.status, 'FULLY_FUNDED');
    });
  });
}
