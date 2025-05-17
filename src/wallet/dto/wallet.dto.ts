export class WalletDto {
  userId?: string;
  totalEarned: number;
  availableBalance: number;
  pendingBalance: number;
  currency: string;
  withdrawalPendingBalance: number;
  withdrawalTotalBalance: number;
  withdrawals: [];
  bankAccounts: [];
}
