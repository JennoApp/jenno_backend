export class WalletDto {
  userId?: string;
  totalEarned: number;
  availableBalance: number;
  pendingBalance: number;
  currency: string;
  bankAccountTokens: string[];  // Aquí almacenamos los tokens de Stripe
  transactionHistory: {
    amount: number;
    date: Date;
    type: string; // Puede ser 'deposit', 'withdrawal', 'transfer', etc.
    status: string; // Puede ser 'completed', 'pending', 'failed', etc.
  }[]
}
