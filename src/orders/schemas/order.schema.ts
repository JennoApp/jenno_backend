import { Schema } from 'mongoose'

export const OrderSchema = new Schema({
  product: {
    type: Object,
  },
  buyerId: {
    type: String,
    required: true
  }, 
  sellerId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  }
}, {
  timestamps: true
})
