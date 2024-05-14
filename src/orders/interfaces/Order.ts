import { Document } from 'mongoose'

export interface Order extends Document {
  product: Object,
  buyerId: String,
  sellerId: String,
  buyerName: String,
  buyerProfileImg: String,
  amount: Number,
  status: String
}
