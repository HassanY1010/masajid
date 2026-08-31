import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/search/arabic_search_engine.dart';
import '../../projects/providers/project_providers.dart';
import '../widgets/project_card.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> with WidgetsBindingObserver {
  String? selectedCategory;
  final TextEditingController _searchController = TextEditingController();
  Timer? _autoRefreshTimer;

  final List<Map<String, String>> categories = const [
    {'id': '', 'label': 'الكل', 'icon': '🕌'},
    {'id': 'SOLAR', 'label': 'طاقة شمسية', 'icon': '☀️'},
    {'id': 'WATER', 'label': 'سقيا ومياه', 'icon': '💧'},
    {'id': 'MAINTENANCE', 'label': 'صيانة وترميم', 'icon': '🛠️'},
    {'id': 'FURNISHING', 'label': 'فرش وتجهيز', 'icon': '🕌'},
    {'id': 'CONSTRUCTION', 'label': 'بناء وتوسعة', 'icon': '🏗️'},
    {'id': 'RENOVATION', 'label': 'تجديد وتطوير', 'icon': '🏛️'},
    {'id': 'AIR_CONDITIONING', 'label': 'تكييف وتهوية', 'icon': '❄️'},
    {'id': 'SOUND_SYSTEM', 'label': 'صوتيات وأذان', 'icon': '🔊'},
    {'id': 'BATHROOMS', 'label': 'دورات ومواضئ', 'icon': '🚿'},
    {'id': 'LIGHTING', 'label': 'إنارة وتمديدات', 'icon': '💡'},
    {'id': 'CLEANING', 'label': 'نظافة وتعقيم', 'icon': '✨'},
    {'id': 'QURAN_SUPPLIES', 'label': 'مصاحف ودواليب', 'icon': '📖'},
    {'id': 'INSULATION', 'label': 'عزل أسطح', 'icon': '🛡️'},
    {'id': 'MINARET', 'label': 'مآذن وقباب', 'icon': '🕋'},
    {'id': 'DISABLED_ACCESS', 'label': 'كبار السن والإعاقة', 'icon': '♿'},
    {'id': 'WOMEN_SECTION', 'label': 'مصلى النساء', 'icon': '🧕'},
    {'id': 'LIBRARY', 'label': 'مكتبة وتحفيظ', 'icon': '📚'},
    {'id': 'SECURITY', 'label': 'كاميرات وحماية', 'icon': '📹'},
    {'id': 'OTHER', 'label': 'احتياجات أخرى', 'icon': '📦'},
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);

    // Auto-refresh data silently in the background every 5 seconds
    _startAutoRefreshTimer();
  }

  void _startAutoRefreshTimer() {
    _autoRefreshTimer?.cancel();
    _autoRefreshTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (mounted) {
        ref.invalidate(publicProjectsProvider(selectedCategory));
      }
    });
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      // Immediately refresh when user brings the app back to foreground
      if (mounted) {
        ref.invalidate(publicProjectsProvider(selectedCategory));
        _startAutoRefreshTimer();
      }
    } else if (state == AppLifecycleState.paused) {
      _autoRefreshTimer?.cancel();
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _autoRefreshTimer?.cancel();
    _searchController.dispose();
    super.dispose();
  }

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
          ref.invalidate(publicProjectsProvider(selectedCategory));
        },
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          children: [
            // Hero Banner
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppTheme.primaryDark, AppTheme.primary],
                  begin: Alignment.topRight,
                  end: Alignment.bottomLeft,
                ),
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.primary.withValues(alpha: 0.25),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
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

            // Smart Instant Search Bar
            Container(
              decoration: BoxDecoration(
                color: AppTheme.surfaceDark,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: _searchController.text.isNotEmpty ? AppTheme.primaryLight : AppTheme.borderDark,
                  width: _searchController.text.isNotEmpty ? 1.5 : 1.0,
                ),
                boxShadow: _searchController.text.isNotEmpty
                    ? [
                        BoxShadow(
                          color: AppTheme.primary.withValues(alpha: 0.15),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ]
                    : null,
              ),
              child: TextField(
                controller: _searchController,
                onChanged: (val) {
                  setState(() {});
                },
                style: const TextStyle(color: Colors.white, fontSize: 14),
                decoration: InputDecoration(
                  hintText: 'ابحث الذكي: اسم المسجد، الحي، المدينة، نوع الاحتياج...',
                  hintStyle: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
                  prefixIcon: const Icon(Icons.search_rounded, color: AppTheme.primaryLight),
                  suffixIcon: _searchController.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear_rounded, color: AppTheme.textMuted, size: 20),
                          onPressed: () {
                            _searchController.clear();
                            setState(() {});
                          },
                        )
                      : null,
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
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
                        ref.invalidate(publicProjectsProvider(selectedCategory));
                      },
                      child: const Text('إعادة المحاولة'),
                    ),
                  ],
                ),
              ),
              data: (projects) {
                final rawSearch = _searchController.text;
                final filteredProjects = ArabicSearchEngine.filterAndRank(projects, rawSearch);

                if (filteredProjects.isEmpty) {
                  return Container(
                    padding: const EdgeInsets.all(40),
                    alignment: Alignment.center,
                    child: Column(
                      children: [
                        const Icon(Icons.search_off_rounded, size: 54, color: AppTheme.textMuted),
                        const SizedBox(height: 12),
                        Text(
                          rawSearch.trim().isNotEmpty
                              ? 'لم يتم العثور على نتائج تطابق "$rawSearch"'
                              : 'لا توجد مشاريع متاحة في هذا القسم حالياً',
                          style: const TextStyle(color: AppTheme.textSecondary, fontSize: 14),
                          textAlign: TextAlign.center,
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
