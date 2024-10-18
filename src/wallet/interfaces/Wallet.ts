import { Document, Types } from "mongoose";

export interface Wallet extends Document {
  userId?: Types.ObjectId;
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
  }[];
  withdrawals: {
    payoutBatchId: string
  }[];
}
