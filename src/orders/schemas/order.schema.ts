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

  PaymentId: {
    type: String,
  },

  status: {
    type: String,
    enum: ['pending', 'sending', 'completed', 'cancelled', 'returned', 'refunded', 'payment_failed', 'on_hold'],
    default: 'pending'
  },

  // Nuevo campo para solicitudes de devolución o cambio
  returnRequest: {
    type: {
      type: String, // 'refund' | 'exchange'
      enum: ['refund', 'exchange'],
      required: false
    },
    reason: { type: String },
    requestedAt: { type: Date },
    approved: { type: Boolean },
    approvedAt: { type: Date },
    processedAt: { type: Date },

    // Para reembolsos
    refundAmount: { type: Number },
    mpRefundId: { type: String }, // ID de reembolso de MercadoPago

    // Para cambios
    exchangeProductId: { type: String }, // producto por el que se hará el cambio
    exchangeShippingCoveredBy: {
      type: String,
      enum: ['buyer', 'seller']
    },

    // Estado
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'processing', 'completed'],
      default: 'pending'
    }
  }

}, {
  timestamps: true
})
