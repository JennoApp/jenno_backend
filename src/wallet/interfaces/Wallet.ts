import { Document, Types } from "mongoose";

export interface BankAccount {
  accountNumber: string;
  name: string;
  accountType: 'AHORROS' | 'CORRIENTE';
  legalIdType: 'CC' | 'NIT';
  legalId: string;
  bankType: 'BANCOLOMBIA' | 'NEQUI';
}

export interface Withdrawal {
  bankId: string;
  amount: number;
  requestDate: Date;
  status: 'pending' | 'completed' | 'rejected';
  processedDate?: Date;
}

export interface Wallet extends Document {
  userId?: Types.ObjectId;
  totalEarned: number;
  availableBalance: number;
  pendingBalance: number;
  withdrawalPendingBalance: number;
  withdrawalTotalBalance: number;
  currency: string;
  bankAccounts: BankAccount[] | null;
  withdrawals: Withdrawal[];
}
