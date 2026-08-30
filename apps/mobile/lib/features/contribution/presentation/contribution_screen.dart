import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import 'package:dio/dio.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/network/api_client.dart';
import '../../projects/providers/project_providers.dart';
import '../../projects/models/project_model.dart';

class ContributionScreen extends ConsumerStatefulWidget {
  final String projectId;

  const ContributionScreen({super.key, required this.projectId});

  @override
  ConsumerState<ContributionScreen> createState() => _ContributionScreenState();
}

class _ContributionScreenState extends ConsumerState<ContributionScreen> {
  int _sharesCount = 10;
  String? _selectedBank;
  File? _receiptFile;
  String? _receiptFileName;
  bool _isSubmitting = false;
  String? _errorMessage;

  final TextEditingController _donorNameController = TextEditingController(text: 'فاعل خير');
  final TextEditingController _donorPhoneController = TextEditingController();

  Future<void> _pickReceiptImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
    );
    if (picked != null) {
      setState(() {
        _receiptFile = File(picked.path);
        _receiptFileName = picked.name;
        _errorMessage = null;
      });
    }
  }

  Future<void> _pickReceiptFile() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
    );
    if (result != null && result.files.single.path != null) {
      setState(() {
        _receiptFile = File(result.files.single.path!);
        _receiptFileName = result.files.single.name;
        _errorMessage = null;
      });
    }
  }

  void _copyToClipboard(String text, String label) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('تم نسخ $label: $text'),
        backgroundColor: AppTheme.primary,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  Future<void> _submitContribution(ProjectModel project) async {
    if (_sharesCount <= 0) {
      setState(() => _errorMessage = 'يرجى تحديد عدد أسهم صالح');
      return;
    }

    if (_receiptFile == null) {
      setState(() => _errorMessage = 'يرجى إرفاق صورة أو مستند سند التحويل البنكي');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    try {
      final double totalAmount = _sharesCount * project.shareValue;

      final formData = FormData.fromMap({
        'projectId': widget.projectId,
        'amount': totalAmount.toString(),
        'currency': project.currency,
        'paymentMethod': _selectedBank ?? 'تحويل بنكي',
        'donorName': _donorNameController.text.trim(),
        'donorPhone': _donorPhoneController.text.trim(),
        'receipt': await MultipartFile.fromFile(
          _receiptFile!.path,
          filename: _receiptFileName ?? 'receipt.jpg',
        ),
      });

      final response = await ApiClient.dio.post(
        '/contributions',
        data: formData,
      );

      final contributionData = response.data['data'];

      if (mounted) {
        context.go(
          '/submission-success',
          extra: {
            'mosqueName': project.mosqueName,
            'title': project.title,
            'amount': totalAmount,
            'shares': _sharesCount,
            'currency': project.currency,
            'contributionId': contributionData?['id'] ?? 'REF-NEW',
          },
        );
      }
    } catch (e) {
      setState(() {
        _isSubmitting = false;
        _errorMessage = 'تعذر إرسال المساهمة. يرجى التأكد من اتصال الإنترنت وصحة السند.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final projectAsync = ref.watch(projectDetailsProvider(widget.projectId));
    final bankAccountsAsync = ref.watch(bankAccountsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('ساهم في خدمة المسجد'),
      ),
      body: projectAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppTheme.primary)),
        error: (err, stack) => const Center(child: Text('تعذر تحميل بيانات المشروع')),
        data: (project) {
          final totalAmount = _sharesCount * project.shareValue;

          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              // Mosque Card Header
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.cardDark,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppTheme.borderDark),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.primary.withValues(alpha: 0.3)),
                      ),
                      child: const Center(child: Text('🕌', style: TextStyle(fontSize: 24))),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            project.mosqueName,
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            project.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Step 1: Shares & Amount Calculator
              const Text(
                '1. حدد عدد الأسهم التمويلية',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceDark,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: AppTheme.borderDark),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('قيمة السهم الواحد:', style: TextStyle(color: AppTheme.textSecondary, fontSize: 14)),
                        Text(
                          '${project.shareValue.toInt()} ${project.currency}',
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.primaryLight),
                        ),
                      ],
                    ),
                    const Divider(height: 28, color: AppTheme.borderDark),

                    // Counter
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        IconButton.filledTonal(
                          onPressed: _sharesCount > 1
                              ? () => setState(() => _sharesCount--)
                              : null,
                          icon: const Icon(Icons.remove),
                        ),
                        Container(
                          margin: const EdgeInsets.symmetric(horizontal: 24),
                          child: Column(
                            children: [
                              Text(
                                '$_sharesCount',
                                style: const TextStyle(fontSize: 36, fontWeight: FontWeight.w900, color: AppTheme.textPrimary),
                              ),
                              const Text('سهم', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                            ],
                          ),
                        ),
                        IconButton.filledTonal(
                          onPressed: () => setState(() => _sharesCount++),
                          icon: const Icon(Icons.add),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Quick buttons
                    Wrap(
                      spacing: 8,
                      children: [5, 10, 25, 50, 100].map((count) {
                        return ChoiceChip(
                          label: Text('$count أسهم'),
                          selected: _sharesCount == count,
                          onSelected: (selected) {
                            if (selected) setState(() => _sharesCount = count);
                          },
                        );
                      }).toList(),
                    ),
                    const Divider(height: 28, color: AppTheme.borderDark),

                    // Total Calculation
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('المبلغ المطلوب تحويله:', style: TextStyle(color: AppTheme.textPrimary, fontSize: 15, fontWeight: FontWeight.bold)),
                        Text(
                          '${totalAmount.toInt()} ${project.currency}',
                          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppTheme.goldLight),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 28),

              // Step 2: Transfer Bank Accounts
              const Text(
                '2. حسابات التحويل البنكية المعتمدة',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
              ),
              const SizedBox(height: 6),
              const Text(
                'انسخ رقم الحساب المناسب لك، وقم بالتحويل من تطبيقك البنكي خارج التطبيق:',
                style: TextStyle(fontSize: 13, color: AppTheme.textMuted),
              ),
              const SizedBox(height: 12),

              bankAccountsAsync.when(
                loading: () => const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator())),
                error: (err, stack) => const Text('تعذر تحميل الحسابات البنكية'),
                data: (accounts) {
                  return Column(
                    children: accounts.map((account) {
                      final isSelected = _selectedBank == account.displayName;
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: isSelected ? AppTheme.primary.withValues(alpha: 0.1) : AppTheme.surfaceDark,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: isSelected ? AppTheme.primaryLight : AppTheme.borderDark,
                            width: isSelected ? 1.5 : 1,
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  account.displayName,
                                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                                ),
                                OutlinedButton.icon(
                                  onPressed: () => _copyToClipboard(account.accountNumber, 'رقم الحساب'),
                                  icon: const Icon(Icons.copy, size: 14),
                                  label: const Text('نسخ', style: TextStyle(fontSize: 12)),
                                  style: OutlinedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'رقم الحساب: ${account.accountNumber}',
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: AppTheme.primaryLight, letterSpacing: 1),
                            ),
                            if (account.accountName.isNotEmpty) ...[
                              const SizedBox(height: 2),
                              Text(
                                'باسم: ${account.accountName}',
                                style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                              ),
                            ],
                          ],
                        ),
                      );
                    }).toList(),
                  );
                },
              ),
              const SizedBox(height: 28),

              // Step 3: Receipt Upload
              const Text(
                '3. إرفاق سند التحويل',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
              ),
              const SizedBox(height: 6),
              const Text(
                'الرجاء رفع صورة إشعار التحويل أو مستند PDF للتحقق واعتماد الأسهم:',
                style: TextStyle(fontSize: 13, color: AppTheme.textMuted),
              ),
              const SizedBox(height: 12),

              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceDark,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: _receiptFile != null ? AppTheme.primaryLight : AppTheme.borderDark,
                    width: _receiptFile != null ? 1.5 : 1,
                  ),
                ),
                child: Column(
                  children: [
                    if (_receiptFile != null) ...[
                      const Icon(Icons.check_circle, size: 44, color: AppTheme.primaryLight),
                      const SizedBox(height: 8),
                      Text(
                        _receiptFileName ?? 'تم اختيار السند بنجاح',
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 12),
                      TextButton(
                        onPressed: () => setState(() {
                          _receiptFile = null;
                          _receiptFileName = null;
                        }),
                        child: const Text('تغيير السند المرفق', style: TextStyle(color: AppTheme.rose)),
                      ),
                    ] else ...[
                      const Icon(Icons.receipt_long_outlined, size: 48, color: AppTheme.textMuted),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          ElevatedButton.icon(
                            onPressed: _pickReceiptImage,
                            icon: const Icon(Icons.photo_camera, size: 18),
                            label: const Text('صورة من المعرض'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.cardDark,
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            ),
                          ),
                          const SizedBox(width: 12),
                          OutlinedButton.icon(
                            onPressed: _pickReceiptFile,
                            icon: const Icon(Icons.attach_file, size: 18),
                            label: const Text('مستند PDF'),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Optional Donor Details
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceDark,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppTheme.borderDark),
                ),
                child: Column(
                  children: [
                    TextField(
                      controller: _donorNameController,
                      decoration: const InputDecoration(
                        labelText: 'اسم المساهم (اختياري)',
                        hintText: 'فاعل خير',
                        border: InputBorder.none,
                      ),
                    ),
                    const Divider(color: AppTheme.borderDark),
                    TextField(
                      controller: _donorPhoneController,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(
                        labelText: 'رقم الهاتف للتواصل (اختياري)',
                        hintText: '966500000000',
                        border: InputBorder.none,
                      ),
                    ),
                  ],
                ),
              ),

              if (_errorMessage != null) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.rose.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.rose.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: AppTheme.rose, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _errorMessage!,
                          style: const TextStyle(color: AppTheme.rose, fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: 32),

              // Submit Button
              ElevatedButton(
                onPressed: _isSubmitting ? null : () => _submitContribution(project),
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size.fromHeight(56),
                  backgroundColor: AppTheme.primary,
                ),
                child: _isSubmitting
                  ? const CircularProgressIndicator(color: Colors.white)
                  : Text(
                      'إرسال المساهمة (${totalAmount.toInt()} ${project.currency})',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900),
                    ),
              ),
              const SizedBox(height: 24),
            ],
          );
        },
      ),
    );
  }
}
