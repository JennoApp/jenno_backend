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

export const ProductSchema = new Schema({
  productname: String,
  imgs: [String],
  price: Number,
  quantity: Number,
  location: String,
  SKU: String,
  duration: String,
  requirements: String,
  policies: String,
  description: String,
  category: String,
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
  reviews: [String],
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
  options: [{
    name: String,
    optionslist: []
  }],
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
  country: [String], 
}, {
  timestamps: true
})
