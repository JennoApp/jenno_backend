import { Schema } from 'mongoose'

export const OrderSchema = new Schema({
  product: {
    type: Object,
  },
  price: {
    type: Number
  },
  buyerId: {
    type: String,
    required: true
  }, 
  sellerId: {
    type: String,
    required: true
  },
  buyerName: {
    type: String,
    required: true
  },
  buyerProfileImg: {
    type: String,
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'sending', 'completed', 'cancelled', 'returned', 'refunded', 'payment_failed', 'on_hold'],
    default: 'pending'
  }
}, {
  timestamps: true
})
