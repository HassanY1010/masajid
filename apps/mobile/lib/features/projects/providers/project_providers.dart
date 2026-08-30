import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../models/project_model.dart';
import '../models/bank_account_model.dart';

final publicProjectsProvider = FutureProvider.family<List<ProjectModel>, String?>((ref, category) async {
  try {
    final response = await ApiClient.dio.get(
      '/projects',
      queryParameters: category != null && category.isNotEmpty ? {'category': category} : null,
    );
    final data = response.data['data']?['items'] as List<dynamic>? ?? [];
    return data.map((json) => ProjectModel.fromJson(json)).toList();
  } catch (e) {
    return [];
  }
});

final projectDetailsProvider = FutureProvider.family<ProjectModel, String>((ref, id) async {
  final response = await ApiClient.dio.get('/projects/$id');
  final data = response.data['data'] as Map<String, dynamic>;
  return ProjectModel.fromJson(data);
});

final bankAccountsProvider = FutureProvider<List<BankAccountModel>>((ref) async {
  final response = await ApiClient.dio.get('/bank-accounts');
  final data = response.data['data'] as List<dynamic>? ?? [];
  return data.map((json) => BankAccountModel.fromJson(json)).toList();
});
