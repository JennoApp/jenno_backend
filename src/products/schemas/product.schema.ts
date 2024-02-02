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
  category: {
    type: String,
    enum: [
      'electronics',
      'sports',
      'beaty',
      'book'
    ]
  },
  attributes: {
    talla: {
      type: String,
      enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
    }
  },
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
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  username: String,
  /*
  createAt: {
    type: Date,
    default: Date.now
  }*/
}, {
  timestamps: true
})
