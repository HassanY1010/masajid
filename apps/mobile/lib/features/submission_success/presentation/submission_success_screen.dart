import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';

class SubmissionSuccessScreen extends StatelessWidget {
  final Map<String, dynamic> data;

  const SubmissionSuccessScreen({super.key, required this.data});

  @override
  Widget build(BuildContext context) {
    final mosqueName = data['mosqueName'] ?? 'المسجد';
    final amount = data['amount'] ?? 0;
    final shares = data['shares'] ?? 0;
    final currency = data['currency'] ?? 'SAR';

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const Spacer(),

              // Success Icon Animation container
              Container(
                width: 90,
                height: 90,
                decoration: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                  border: Border.all(color: AppTheme.primaryLight, width: 2),
                ),
                child: const Center(
                  child: Icon(Icons.check_circle_rounded, size: 54, color: AppTheme.primaryLight),
                ),
              ),
              const SizedBox(height: 24),

              const Text(
                'تقبّل الله منكم وجزاكم خيراً',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  color: AppTheme.textPrimary,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),

              const Text(
                'تم إرسال سند المساهمة بنجاح وسيتم تدقيقه من إدارة المنصة لإدراج الأسهم في تمويل المسجد.',
                style: TextStyle(
                  fontSize: 14,
                  color: AppTheme.textSecondary,
                  height: 1.5,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 28),

              // Summary Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceDark,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: AppTheme.borderDark),
                ),
                child: Column(
                  children: [
                    _RowItem(label: 'المسجد المبارك', value: mosqueName.toString()),
                    const Divider(height: 20, color: AppTheme.borderDark),
                    _RowItem(label: 'عدد الأسهم المساهم بها', value: '$shares سهم'),
                    const Divider(height: 20, color: AppTheme.borderDark),
                    _RowItem(label: 'إجمالي المبلغ', value: '$amount $currency', highlight: true),
                    const Divider(height: 20, color: AppTheme.borderDark),
                    const _RowItem(label: 'حالة المساهمة', value: 'قيد مراجعة السند'),
                  ],
                ),
              ),

              const Spacer(),

              // Back Home CTA
              ElevatedButton(
                onPressed: () => context.go('/'),
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size.fromHeight(56),
                  backgroundColor: AppTheme.primary,
                ),
                child: const Text(
                  'العودة للمشاريع الرئيسية',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RowItem extends StatelessWidget {
  final String label;
  final String value;
  final bool highlight;

  const _RowItem({
    required this.label,
    required this.value,
    this.highlight = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 13, color: AppTheme.textMuted)),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: highlight ? AppTheme.goldLight : AppTheme.textPrimary,
          ),
        ),
      ],
    );
  }
}
