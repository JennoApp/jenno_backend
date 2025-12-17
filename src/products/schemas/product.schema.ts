import { Schema } from 'mongoose'

interface Dimensions {
  length: Number,
  width: Number,
  height: Number
}

const dimensionsSchema = new Schema<Dimensions>({
  length: Number,
  width: Number,
  height: Number
})

const reviewSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    require: true
  },
  userProfileImg: {
    type: String,
  },
  stars: {
    type: Number,
    required: true
  },
  review: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  }
})

// Opciones Simples
const optionSchema = new Schema({
    name: String,
    values: [String]
})


const variantSchema = new Schema({
    sku: { type: String, index: true },
    price: { type: Number, required: true },
    quantity: { type: Number, default: 0 },
    imgs: { type: [String], default: [] },
    options: [{ name: String, value: String }],
    meta: Schema.Types.Mixed
})



export const ProductSchema = new Schema({
  productname: String,
  imgs: {
    type: [String],
    default: []
  },
  price: Number, // precio base (no obligatorio si usas variants)
  quantity: Number,
  location: String,
  SKU: String,
  duration: String,
  requirements: String,
  policies: String,
  description: String,
  additionalInfo: String,
  category: {
    type: String,
    required: true
  },
  shippingfee: Number,
  weight: Number,
  dimensions: {
    type: dimensionsSchema
  },
  status: {
    type: String,
    enum: ['in_stock', 'sold_out', 'on_sale', 'active', 'paused', 'inactive'],
    default: 'in_stock'
  },
  visibility: {
    type: Boolean,
    default: true
  },
  Tags: [String],
  score: Number,
  reviews: [reviewSchema],
  discounts: [
    {
      discountType: {
        type: String,
      },
      discountValue: {
        type: String,
      }
    }
  ],
  // Options for product like color, size, etc.
  options: [optionSchema],
  variants: [variantSchema],
  // Especifications for product or service
  especifications: [{
    title: String,
    content: String
  }],
  //
  info: {
    type: String
  },
  // user information
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  username: String,
  userProfileImg: String,
  country: {
    type: [String],
    default: []
  },

  // politicas de devolución y cambio
  returnPolicy: {
    acceptsReturns: { type: Boolean, default: true },
    acceptsExchanges: { type: Boolean, default: true },
    maxDays: { type: Number, default: 15 },
    restockingFee: { type: Number, default: 0 }, // %
    exchangeShippingCoveredBy: {
      type: String,
      enum: ['buyer', 'seller'],
      default: 'buyer'
    },
    conditions: {
      mustBeUnopened: { type: Boolean, default: false },
      mustIncludeOriginalPackaging: { type: Boolean, default: true }
    },
    instructions: { type: String } // texto libre del vendedor
  }

}, {
  timestamps: true
})
