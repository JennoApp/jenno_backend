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
  goods: [{
    type: Schema.Types.ObjectId,
    ref: 'Goods'
  }],
  followers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  cart: [{
    type: Schema.Types.ObjectId,
    ref: 'Goods'
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