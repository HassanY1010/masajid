class BankAccountModel {
  final String id;
  final String name;
  final String displayName;
  final String accountName;
  final String accountNumber;
  final String? iban;
  final String currency;

  BankAccountModel({
    required this.id,
    required this.name,
    required this.displayName,
    required this.accountName,
    required this.accountNumber,
    this.iban,
    required this.currency,
  });

  factory BankAccountModel.fromJson(Map<String, dynamic> json) {
    return BankAccountModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      displayName: json['displayName'] ?? '',
      accountName: json['accountName'] ?? '',
      accountNumber: json['accountNumber'] ?? '',
      iban: json['iban'],
      currency: json['currency'] ?? 'SAR',
    );
  }
}
