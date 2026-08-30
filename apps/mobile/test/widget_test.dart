import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:masajid_mobile/main.dart';

void main() {
  testWidgets('MasajidApp initial render smoke test with ProviderScope', (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: MasajidApp(),
      ),
    );

    await tester.pumpAndSettle();
    expect(find.byType(MasajidApp), findsOneWidget);
    expect(find.text('مساجد'), findsWidgets);
  });
}
