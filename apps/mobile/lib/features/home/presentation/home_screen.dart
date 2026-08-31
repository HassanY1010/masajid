import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../projects/providers/project_providers.dart';
import '../widgets/project_card.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  String? selectedCategory;
  final TextEditingController _searchController = TextEditingController();

  final List<Map<String, String>> categories = const [
    {'id': '', 'label': 'الكل', 'icon': '🕌'},
    {'id': 'SOLAR', 'label': 'طاقة شمسية', 'icon': '☀️'},
    {'id': 'WATER', 'label': 'سقيا ومياه', 'icon': '💧'},
    {'id': 'MAINTENANCE', 'label': 'صيانة وترميم', 'icon': '🛠️'},
    {'id': 'FURNISHING', 'label': 'فرش وتجهيز', 'icon': '🪑'},
    {'id': 'CONSTRUCTION', 'label': 'بناء وتوسعة', 'icon': '🏗️'},
  ];

  @override
  Widget build(BuildContext context) {
    final projectsAsync = ref.watch(publicProjectsProvider(selectedCategory));

    return Scaffold(
      appBar: AppBar(
        title: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('🕌', style: TextStyle(fontSize: 22)),
            SizedBox(width: 8),
            Text(
              'مساجد',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w900,
                letterSpacing: 0.5,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.info_outline, color: AppTheme.textSecondary),
            onPressed: () {
              showAboutDialog(
                context: context,
                applicationName: 'منصة مساجد',
                applicationVersion: '1.0.0 (Production)',
                applicationLegalese: 'منصة رقمية موجهة لخدمة بيوت الله وتسهيل مساهمات الأسهم التمويلية.',
              );
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        color: AppTheme.primary,
        onRefresh: () async {
          await ref.refresh(publicProjectsProvider(selectedCategory).future);
        },
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          children: [
            // Hero Banner
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF047857), Color(0xFF064E3B)],
                  begin: Alignment.topRight,
                  end: Alignment.bottomLeft,
                ),
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.primary.withValues(alpha: 0.3),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Text(
                          '﴿ وَأَنَّ الْمَسَاجِدَ لِلَّهِ ﴾',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'ساهم في عمارة وخدمة بيوت الله',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'اختر احتياج المسجد، احسب أسهمك، وحول عبر الحسابات البنكية المعتمدة مباشرة',
                    style: TextStyle(
                      color: Color(0xFFD1FAE5),
                      fontSize: 13,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Search Bar
            Container(
              decoration: BoxDecoration(
                color: AppTheme.surfaceDark,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: AppTheme.borderDark),
              ),
              child: TextField(
                controller: _searchController,
                onChanged: (val) {
                  setState(() {});
                },
                decoration: const InputDecoration(
                  hintText: 'ابحث عن اسم المسجد أو المحافظة...',
                  hintStyle: TextStyle(color: AppTheme.textMuted, fontSize: 14),
                  prefixIcon: Icon(Icons.search, color: AppTheme.textMuted),
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Categories Horizontal Scroll
            SizedBox(
              height: 44,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: categories.length,
                separatorBuilder: (context, index) => const SizedBox(width: 8),
                itemBuilder: (context, index) {
                  final cat = categories[index];
                  final isSelected = selectedCategory == cat['id'] ||
                      (selectedCategory == null && cat['id'] == '');
                  return InkWell(
                    onTap: () {
                      setState(() {
                        selectedCategory = cat['id']!.isEmpty ? null : cat['id'];
                      });
                    },
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      decoration: BoxDecoration(
                        color: isSelected ? AppTheme.primary : AppTheme.surfaceDark,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isSelected ? AppTheme.primaryLight : AppTheme.borderDark,
                        ),
                      ),
                      child: Row(
                        children: [
                          Text(cat['icon']!, style: const TextStyle(fontSize: 14)),
                          const SizedBox(width: 6),
                          Text(
                            cat['label']!,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: isSelected ? Colors.white : AppTheme.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 20),

            // Section Title
            const Text(
              'مشاريع المساجد المتاحة',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 12),

            // Project List
            projectsAsync.when(
              loading: () => const Center(
                child: Padding(
                  padding: EdgeInsets.all(40),
                  child: CircularProgressIndicator(color: AppTheme.primary),
                ),
              ),
              error: (err, stack) => Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceDark,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppTheme.borderDark),
                ),
                child: Column(
                  children: [
                    const Icon(Icons.wifi_off, size: 48, color: AppTheme.textMuted),
                    const SizedBox(height: 12),
                    const Text(
                      'تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً',
                      style: TextStyle(color: AppTheme.textSecondary, fontSize: 14),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () {
                        ref.refresh(publicProjectsProvider(selectedCategory));
                      },
                      child: const Text('إعادة المحاولة'),
                    ),
                  ],
                ),
              ),
              data: (projects) {
                final searchQuery = _searchController.text.trim().toLowerCase();
                final filteredProjects = searchQuery.isEmpty
                    ? projects
                    : projects.where((p) {
                        return p.title.toLowerCase().contains(searchQuery) ||
                            p.mosqueName.toLowerCase().contains(searchQuery) ||
                            p.governorate.toLowerCase().contains(searchQuery) ||
                            p.district.toLowerCase().contains(searchQuery);
                      }).toList();

                if (filteredProjects.isEmpty) {
                  return Container(
                    padding: const EdgeInsets.all(40),
                    alignment: Alignment.center,
                    child: Column(
                      children: [
                        const Icon(Icons.mosque, size: 54, color: AppTheme.textMuted),
                        const SizedBox(height: 12),
                        Text(
                          searchQuery.isNotEmpty
                              ? 'لا توجد نتائج مطابقة لبحثك'
                              : 'لا توجد مشاريع متاحة في هذا القسم حالياً',
                          style: const TextStyle(color: AppTheme.textSecondary, fontSize: 14),
                        ),
                      ],
                    ),
                  );
                }

                return ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: filteredProjects.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 16),
                  itemBuilder: (context, index) {
                    final p = filteredProjects[index];
                    return ProjectCard(
                      project: p,
                      onTap: () => context.push('/project/${p.id}'),
                      onContribute: () => context.push('/project/${p.id}/contribute'),
                    );
                  },
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
