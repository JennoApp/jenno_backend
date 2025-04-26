import { Schema, Types } from 'mongoose'

const BankAccountSchema = new Schema({
  accountNumber: {
    type: String,
    required: true, // Número de cuenta o número celular para Nequi
  },
  name: {
    type: String,
    required: true, // Nombre del titular de la cuenta
  },
  accountType: {
    type: String,
    enum: ['AHORROS', 'CORRIENTE'],
    required: true,
  },
  legalIdType: {
    type: String,
    enum: ['CC', 'NIT'],
    required: true, // Tipo de identificación
  },
  legalId: {
    type: String,
    required: true, // Número de cédula o NIT
  },
  bankType: {
    type: String,
    enum: ['BANCOLOMBIA', 'NEQUI'],
    required: true,
  }
})


export const WalletSchema = new Schema({
  userId: {
    type: Types.ObjectId,
    ref: 'User',
    require: true
  },
  totalEarned: {
    type: Number,
    default: 0
  },
  availableBalance: {
    type: Number,
    default: 0
  },
  pendingBalance: {
    type: Number,
    default: 0
  },
  withdrawalPendingBalance: {
    type: Number,
    default: 0
  },
  withdrawalTotalBalance: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'COP'
  },
  bankAccounts: {
    type: [BankAccountSchema],
    default: []
  },
  withdrawals: [
    {
      bankId: {
        type: String,
        require: true
      },
      amount: {
        type: Number,
        required: true
      },
      requestDate: {
        type: Date,
        default: Date.now
      },
      // Estados: "pending", "completed", "rejected"
      status: {
        type: String,
        default: 'pending'
      },
      processedDate: {
        type: Date
      }
    }
  ]
})
