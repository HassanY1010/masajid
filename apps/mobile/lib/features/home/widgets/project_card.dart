import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/app_theme.dart';
import '../../projects/models/project_model.dart';

class ProjectCard extends StatelessWidget {
  final ProjectModel project;
  final VoidCallback onTap;
  final VoidCallback onContribute;

  const ProjectCard({
    super.key,
    required this.project,
    required this.onTap,
    required this.onContribute,
  });

  String _getCategoryName(String cat) {
    switch (cat) {
      case 'SOLAR':
        return '☀️ طاقة شمسية';
      case 'WATER':
        return '💧 سقيا ومياه';
      case 'MAINTENANCE':
        return '🛠️ صيانة وترميم';
      case 'FURNISHING':
        return '🕌 فرش وتجهيز';
      case 'CONSTRUCTION':
        return '🏗️ بناء وتوسعة';
      default:
        return '🕌 خدمة مسجد';
    }
  }

  @override
  Widget build(BuildContext context) {
    final cover = project.coverImageUrl;
    final isFullyFunded = project.fundedShares >= project.totalShares;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(24),
      child: Container(
        decoration: BoxDecoration(
          color: AppTheme.cardDark,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: AppTheme.borderDark, width: 1.2),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.35),
              blurRadius: 16,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Image with Category badge
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                  child: cover != null && cover.isNotEmpty
                      ? CachedNetworkImage(
                          imageUrl: cover,
                          height: 180,
                          width: double.infinity,
                          fit: BoxFit.cover,
                          memCacheWidth: 600,
                          maxWidthDiskCache: 800,
                          placeholder: (context, url) => Container(
                            height: 180,
                            color: AppTheme.surfaceDark,
                            child: const Center(
                              child: CircularProgressIndicator(color: AppTheme.primary),
                            ),
                          ),
                          errorWidget: (context, url, error) => Container(
                            height: 180,
                            color: AppTheme.surfaceDark,
                            child: const Center(
                              child: Icon(Icons.mosque, size: 48, color: AppTheme.textMuted),
                            ),
                          ),
                        )
                      : Container(
                          height: 180,
                          color: AppTheme.surfaceDark,
                          child: const Center(
                            child: Icon(Icons.mosque, size: 48, color: AppTheme.textMuted),
                          ),
                        ),
                ),
                Positioned(
                  top: 12,
                  right: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppTheme.bgDark.withValues(alpha: 0.85),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppTheme.borderDark),
                    ),
                    child: Text(
                      _getCategoryName(project.category),
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                  ),
                ),
              ],
            ),

            // Content
            Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Mosque Name & Location
                  Row(
                    children: [
                      const Icon(Icons.location_on, size: 16, color: AppTheme.primaryLight),
                      const SizedBox(width: 4),
                      Text(
                        '${project.governorate} - ${project.district}',
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppTheme.primaryLight,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),

                  Text(
                    project.mosqueName,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),

                  Text(
                    project.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 14,
                      color: AppTheme.textSecondary,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Progress Bar
                  Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'تم جمع ${project.fundedAmount.toInt()} من ${project.estimatedCost.toInt()} ${project.currency}',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppTheme.textSecondary,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            '${project.fundingPercentage}%',
                            style: const TextStyle(
                              fontSize: 13,
                              color: AppTheme.primaryLight,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: LinearProgressIndicator(
                          value: (project.fundingPercentage / 100).clamp(0.0, 1.0),
                          minHeight: 8,
                          backgroundColor: AppTheme.surfaceDark,
                          valueColor: AlwaysStoppedAnimation<Color>(
                            isFullyFunded ? Colors.amber : AppTheme.primaryLight,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Shares Info & CTA Button
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'المتبقي: ${project.remainingShares} سهم',
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.textPrimary,
                            ),
                          ),
                          Text(
                            'قيمة السهم: ${project.shareValue.toInt()} ${project.currency}',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppTheme.textMuted,
                            ),
                          ),
                        ],
                      ),
                      ElevatedButton(
                        onPressed: isFullyFunded ? null : onContribute,
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                          backgroundColor: isFullyFunded ? AppTheme.surfaceDark : AppTheme.primary,
                        ),
                        child: Text(
                          isFullyFunded ? 'مكتمل' : 'ساهم الآن',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
