import 'package:flutter/foundation.dart';
import '../../features/projects/models/project_model.dart';

/// Professional High-Performance Arabic Text Normalizer & Fuzzy Matcher
class ArabicSearchEngine {
  /// Comprehensive Arabic character normalization (Alif variants, Taa Marbuta, Yaa, Tashkeel, Tatweel)
  static String normalize(String text) {
    if (text.isEmpty) return '';

    var result = text.trim().toLowerCase();

    // 1. Remove Arabic Diacritics (Tashkeel)
    result = result.replaceAll(RegExp(r'[\u064B-\u065F\u0670]'), '');

    // 2. Remove Tatweel (Kashida)
    result = result.replaceAll('\u0640', '');

    // 3. Normalize Alif variants (أ، إ، آ، ٱ -> ا)
    result = result.replaceAll(RegExp(r'[أإآٱ]'), 'ا');

    // 4. Normalize Taa Marbuta and Haa (ة -> ه)
    result = result.replaceAll('ة', 'ه');

    // 5. Normalize Yaa and Alif Maqsura (ى -> ي)
    result = result.replaceAll('ى', 'ي');

    // 6. Normalize Waw with Hamza (ؤ -> و) and Yaa with Hamza (ئ -> ي)
    result = result.replaceAll('ؤ', 'و').replaceAll('ئ', 'ي');

    // 7. Strip extraneous punctuations and symbols
    result = result.replaceAll(RegExp(r'[^\w\s\u0600-\u06FF]'), ' ');

    // 8. Collapse multiple spaces into single space
    result = result.replaceAll(RegExp(r'\s+'), ' ').trim();

    return result;
  }

  /// Fast Multi-Token Fuzzy Score
  /// Returns 0.0 to 100.0 relevance score (0 = no match)
  static double scoreProject(ProjectModel project, String normalizedQuery, List<String> queryTokens) {
    if (normalizedQuery.isEmpty) return 100.0;

    final normalizedTitle = normalize(project.title);
    final normalizedMosque = normalize(project.mosqueName);
    final normalizedGov = normalize(project.governorate);
    final normalizedDist = normalize(project.district);
    final normalizedLocation = normalize(project.locationText);
    final normalizedDesc = normalize(project.description);
    final normalizedNeed = normalize(project.needDescription);

    // Exact full query match boosts
    if (normalizedMosque.contains(normalizedQuery)) return 100.0;
    if (normalizedTitle.contains(normalizedQuery)) return 95.0;
    if (normalizedGov.contains(normalizedQuery) || normalizedDist.contains(normalizedQuery)) return 85.0;

    double totalScore = 0.0;
    int matchedTokens = 0;

    for (final token in queryTokens) {
      if (token.isEmpty) continue;

      bool tokenMatched = false;

      // Mosque Name match (Highest weight: 40)
      if (normalizedMosque.contains(token)) {
        totalScore += 40;
        tokenMatched = true;
      }
      // Project Title match (Weight: 30)
      else if (normalizedTitle.contains(token)) {
        totalScore += 30;
        tokenMatched = true;
      }
      // Governorate or District (Weight: 20)
      else if (normalizedGov.contains(token) || normalizedDist.contains(token) || normalizedLocation.contains(token)) {
        totalScore += 20;
        tokenMatched = true;
      }
      // Need description or full description (Weight: 10)
      else if (normalizedNeed.contains(token) || normalizedDesc.contains(token)) {
        totalScore += 10;
        tokenMatched = true;
      }

      if (tokenMatched) {
        matchedTokens++;
      }
    }

    // Require all or majority of multi-word tokens to match
    if (matchedTokens == 0) return 0.0;
    if (queryTokens.length > 1 && matchedTokens < (queryTokens.length / 2).ceil()) {
      return 0.0;
    }

    return totalScore;
  }

  /// Instant In-Memory Filter & Relevance Sorter
  static List<ProjectModel> filterAndRank(List<ProjectModel> projects, String rawQuery) {
    final cleanQuery = normalize(rawQuery);
    if (cleanQuery.isEmpty) return projects;

    final queryTokens = cleanQuery.split(' ').where((t) => t.isNotEmpty).toList();

    final scoredList = <MapEntry<ProjectModel, double>>[];

    for (final p in projects) {
      final score = scoreProject(p, cleanQuery, queryTokens);
      if (score > 0) {
        scoredList.add(MapEntry(p, score));
      }
    }

    // Sort by relevance score descending
    scoredList.sort((a, b) => b.value.compareTo(a.value));

    return scoredList.map((e) => e.key).toList();
  }
}
