
export class BankAccountDto {
  accountNumber: string;
  name: string;
  accountType: 'AHORROS' | 'CORRIENTE';
  legalIdType: 'CC' | 'NIT';
  legalId: string;
  bankType: 'BANCOLOMBIA' | 'NEQUI';
}
