import { Schema } from 'mongoose'

export const UserSchema = new Schema({
  username: {         // name for Personal and Businness name for Business
    type: String,
    required: true,
    minLength: [3, "Username must be at least 3 characters"],
    maxLength: [30, "Username must be at most 30 characters"]
  },
  displayname: {
    type: String,
    required: true,
    minLength: [3, "Username must be at least 3 characters"],
    maxLength: [30, "Username must be at most 30 characters"]
  },
  profileImg: {
    type: String,
    required: false
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  bio: {
    
    type: String,
    required: false
  },
  country: {
    type: String,
    required: false
  },
  products: [{
    type: Schema.Types.ObjectId,
    ref: 'Product'
  }],
  services: [{
    type: Schema.Types.ObjectId,
    ref: 'Service'
  }], 
  followers: [String],
  following: [String],
  cart: [{
    type: Schema.Types.ObjectId,
    ref: 'Cart'
  }],
  // Shipping info
  shippingInfo: {
    country: String, 
    address: String,
    city:  String,
    state: String,
    postalCode: String,
    phoneNumber: Number
  },
  // Orders
  orders:[{
    type: Schema.Types.ObjectId,
    ref: 'Order'
  }],
  // Shopping
  shopping: [{
    type: Schema.Types.ObjectId,
    ref: 'Order'
  }], 
  // Legal information
  legalname: {
    type: String
  },
  legallastname: {
    type: String
  },
  taxid: {
    type: String
  },
  accountType: {
    type: String,
    enum: ['personal', 'business'],
    required: true
  },
  // Wallet
  walletId: {
    type: Schema.Types.ObjectId,
    ref: 'Wallet'
  },
  paypalAccount: {
    type: String,
    required: false
  },
  paypalWithdrawals: [],
  createAt: {
    type: Date,
    default: Date.now
  }
})
