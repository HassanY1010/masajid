import 'package:flutter_test/flutter_test.dart';
import 'package:masajid_mobile/core/search/arabic_search_engine.dart';
import 'package:masajid_mobile/features/projects/models/project_model.dart';

void main() {
  group('Smart Arabic Search Engine Tests', () {
    test('Normalizes Arabic letters and diacritics correctly', () {
      expect(ArabicSearchEngine.normalize('مَسْجِدُ الإيمَانِ'), 'مسجد الايمان');
      expect(ArabicSearchEngine.normalize('صيانة وترميم - مَكَّة'), 'صيانه وترميم مكه');
      expect(ArabicSearchEngine.normalize('بُنِيَ عَلَى تَقْوَى'), 'بني علي تقوي');
    });

    test('Finds projects with diacritics and letter variants (أ / إ / آ / ا)', () {
      final p1 = ProjectModel(
        id: '1',
        title: 'مشروع صيانة وترميم',
        mosqueName: 'جامع الإيمان الكبير',
        governorate: 'حضرموت',
        district: 'المكلا',
        locationText: 'حي السلام',
        description: 'صيانة مكيفات الحرم',
        needDescription: 'تركيب 4 مكيفات سبليت',
        category: 'AIR_CONDITIONING',
        estimatedCost: 10000,
        currency: 'SAR',
        totalShares: 1000,
        shareValue: 10,
        fundedShares: 200,
        fundedAmount: 2000,
        status: 'FUNDING',
        remainingShares: 800,
        remainingAmount: 8000,
        fundingPercentage: 20,
        images: [],
        updates: [],
      );

      final p2 = ProjectModel(
        id: '2',
        title: 'مشروع حفر بئر وسقيا',
        mosqueName: 'مسجد النور والتقوى',
        governorate: 'عدن',
        district: 'المنصورة',
        locationText: 'الشارع العام',
        description: 'توفير مياه نقية للمصلين',
        needDescription: 'حفر بئر ارتوازي وخزان',
        category: 'WATER',
        estimatedCost: 15000,
        currency: 'SAR',
        totalShares: 1500,
        shareValue: 10,
        fundedShares: 500,
        fundedAmount: 5000,
        status: 'FUNDING',
        remainingShares: 1000,
        remainingAmount: 10000,
        fundingPercentage: 33,
        images: [],
        updates: [],
      );

      final list = [p1, p2];

      // Search with variant: "الايمان" without Hamza
      final res1 = ArabicSearchEngine.filterAndRank(list, 'الايمان');
      expect(res1.length, 1);
      expect(res1.first.id, '1');

      // Search with Tashkeel: "مَسْجِدُ النُّور"
      final res2 = ArabicSearchEngine.filterAndRank(list, 'مَسْجِدُ النُّور');
      expect(res2.length, 1);
      expect(res2.first.id, '2');

      // Search by District: "المكلا"
      final res3 = ArabicSearchEngine.filterAndRank(list, 'المكلا');
      expect(res3.length, 1);
      expect(res3.first.id, '1');

      // Search by need/description: "مكيفات"
      final res4 = ArabicSearchEngine.filterAndRank(list, 'مكيفات');
      expect(res4.length, 1);
      expect(res4.first.id, '1');
    });
  });
}
