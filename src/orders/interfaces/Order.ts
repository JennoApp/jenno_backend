import { Document } from 'mongoose'

interface Product {
  price: number,
  shippingfee: number,
  amount: number
}


export interface Order extends Document {
  product: Product,
  buyerId: string,
  sellerId: string,
  buyerName: string,
  buyerProfileImg: string,
  status: string,
  amount: number
}
