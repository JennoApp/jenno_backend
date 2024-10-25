import { Document, ObjectId } from 'mongoose'

export interface Product extends Document {
  productname: String,
  imgs: string[],
  price: Number,
  quantity: Number,
  location: String,
  SKU: String,
  duration: String,
  requirements: String,
  policies: String,
  description: String,
  category: String,
  attributes: [String],
  weight: Number,
  dimensions: String,
  status: [String],
  visibility: Boolean,
  country: string[]
  Tags: [String],
  score: Number,
  reviews: any[],
  discounts: [String],
  user: ObjectId,
  username: String,
  userProfileImg: String
}
