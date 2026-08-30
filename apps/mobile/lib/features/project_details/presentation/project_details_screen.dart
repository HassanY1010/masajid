import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:share_plus/share_plus.dart';
import '../../../core/theme/app_theme.dart';
import '../../projects/providers/project_providers.dart';

class ProjectDetailsScreen extends ConsumerWidget {
  final String projectId;

  const ProjectDetailsScreen({super.key, required this.projectId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final projectAsync = ref.watch(projectDetailsProvider(projectId));

    return Scaffold(
      body: projectAsync.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppTheme.primary),
        ),
        error: (err, stack) => Scaffold(
          appBar: AppBar(title: const Text('تفاصيل المشروع')),
          body: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 48, color: AppTheme.rose),
                const SizedBox(height: 12),
                const Text('تعذر تحميل تفاصيل المشروع'),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => ref.invalidate(projectDetailsProvider(projectId)),
                  child: const Text('إعادة المحاولة'),
                ),
              ],
            ),
          ),
        ),
        data: (project) {
          final isFullyFunded = project.fundedShares >= project.totalShares;
          final cover = project.coverImageUrl;

          return CustomScrollView(
            slivers: [
              // Sliver App Bar with Mosque Image
              SliverAppBar(
                expandedHeight: 280,
                pinned: true,
                backgroundColor: AppTheme.surfaceDark,
                actions: [
                  IconButton(
                    icon: const Icon(Icons.share, color: Colors.white),
                    onPressed: () {
                      Share.share(
                        'ساهم في ${project.title} - ${project.mosqueName}\nالمحافظة: ${project.governorate}\nالمتبقي: ${project.remainingShares} سهم\nعبر تطبيق مساجد لخدمة بيوت الله.',
                      );
                    },
                  ),
                ],
                flexibleSpace: FlexibleSpaceBar(
                  title: Text(
                    project.mosqueName,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                    ),
                  ),
                  background: Stack(
                    fit: StackFit.expand,
                    children: [
                      if (cover != null && cover.isNotEmpty)
                        CachedNetworkImage(
                          imageUrl: cover,
                          fit: BoxFit.cover,
                        )
                      else
                        Container(color: AppTheme.surfaceDark),
                      const DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.transparent,
                              Colors.black87,
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Details Content
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Location Tag
                      Row(
                        children: [
                          const Icon(Icons.location_on, size: 18, color: AppTheme.primaryLight),
                          const SizedBox(width: 6),
                          Text(
                            '${project.governorate} - ${project.district}',
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.primaryLight,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        project.locationText,
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppTheme.textMuted,
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Title
                      Text(
                        project.title,
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                          color: AppTheme.textPrimary,
                          height: 1.3,
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Financial Progress Box
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: AppTheme.cardDark,
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(color: AppTheme.borderDark),
                        ),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('التكلفة المقدرة', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                                    const SizedBox(height: 2),
                                    Text(
                                      '${project.estimatedCost.toInt()} ${project.currency}',
                                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                                    ),
                                  ],
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    const Text('المتبقي للجمع', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                                    const SizedBox(height: 2),
                                    Text(
                                      '${project.remainingAmount.toInt()} ${project.currency}',
                                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.goldLight),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),

                            // Progress Bar
                            ClipRRect(
                              borderRadius: BorderRadius.circular(10),
                              child: LinearProgressIndicator(
                                value: (project.fundingPercentage / 100).clamp(0.0, 1.0),
                                minHeight: 12,
                                backgroundColor: AppTheme.surfaceDark,
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  isFullyFunded ? Colors.amber : AppTheme.primaryLight,
                                ),
                              ),
                            ),
                            const SizedBox(height: 14),

                            // Shares Breakdown
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceAround,
                              children: [
                                _ShareMetric(
                                  title: 'إجمالي الأسهم',
                                  value: '${project.totalShares}',
                                ),
                                _ShareMetric(
                                  title: 'الأسهم المكتتبة',
                                  value: '${project.fundedShares}',
                                  highlight: true,
                                ),
                                _ShareMetric(
                                  title: 'قيمة السهم',
                                  value: '${project.shareValue.toInt()} ${project.currency}',
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Description Section
                      const Text(
                        'عن حاجة المسجد',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        project.description,
                        style: const TextStyle(fontSize: 15, color: AppTheme.textSecondary, height: 1.6),
                      ),
                      const SizedBox(height: 20),

                      // Need Specs
                      const Text(
                        'المواصفات والاحتياجات الفنية',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppTheme.surfaceDark,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppTheme.borderDark),
                        ),
                        child: Text(
                          project.needDescription,
                          style: const TextStyle(fontSize: 14, color: AppTheme.textSecondary, height: 1.5),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Updates / Completion Progress (if any)
                      if (project.updates.isNotEmpty) ...[
                        const Text(
                          'تحديثات المشروع والإنجاز',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                        ),
                        const SizedBox(height: 12),
                        ...project.updates.map((update) => Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: AppTheme.surfaceDark,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: AppTheme.borderDark),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    update.title,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: AppTheme.primaryLight,
                                      fontSize: 15,
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    update.description,
                                    style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                                  ),
                                ],
                              ),
                            )),
                        const SizedBox(height: 24),
                      ],

                      const SizedBox(height: 80),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
      bottomNavigationBar: projectAsync.hasValue
          ? Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: AppTheme.surfaceDark,
                border: Border(top: BorderSide(color: AppTheme.borderDark)),
              ),
              child: SafeArea(
                child: ElevatedButton(
                  onPressed: projectAsync.value!.fundedShares >= projectAsync.value!.totalShares
                      ? null
                      : () => context.push('/project/$projectId/contribute'),
                  style: ElevatedButton.styleFrom(
                    minimumSize: const Size.fromHeight(56),
                    backgroundColor: AppTheme.primary,
                  ),
                  child: Text(
                    projectAsync.value!.fundedShares >= projectAsync.value!.totalShares
                        ? 'المشروع مكتمل التمويل بفضل الله'
                        : 'ساهم في خدمة المسجد الآن (${projectAsync.value!.shareValue.toInt()} ${projectAsync.value!.currency}/سهم)',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900),
                  ),
                ),
              ),
            )
          : null,
    );
  }
}

class _ShareMetric extends StatelessWidget {
  final String title;
  final String value;
  final bool highlight;

  const _ShareMetric({
    required this.title,
    required this.value,
    this.highlight = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(title, style: const TextStyle(color: AppTheme.textMuted, fontSize: 11)),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w900,
            color: highlight ? AppTheme.primaryLight : AppTheme.textPrimary,
          ),
        ),
      ],
    );
  }
}
