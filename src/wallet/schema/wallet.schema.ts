import { Schema, Types } from 'mongoose'

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
  currency: {
    type: String,
    default: 'USD'
  },
  bankAccountTokens: [{ type: String }],
  transactionHistory: [
    {
      amount: {
        type: Number,
        require: true
      },
      date: {
        type: Date,
        default: Date.now
      },
      type: {
        type: String,
        required: true
      },
      status: {
        type: String,
        default: 'pending'
      }
    }
  ]
})
