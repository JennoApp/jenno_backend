import { Schema } from 'mongoose'

export const UserSchema = new Schema({
  username: {         // name for Personal and Businness name for Business
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
    ref: 'Products'
  }],
  services: [{
    type: Schema.Types.ObjectId,
    ref: 'Services'
  }],
  followers: [String],
  following: [String],
  cart: [{
    type: Schema.Types.ObjectId,
    ref: 'Cart'
  }],
  accountType: {
    type: String,
    enum: ['personal', 'business'],
    required: true
  },
  createAt: {
    type: Date,
    default: Date.now
  }
})
