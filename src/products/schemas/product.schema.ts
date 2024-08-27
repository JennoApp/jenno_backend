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
    required: true
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
