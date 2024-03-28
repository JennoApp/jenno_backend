import { Schema } from 'mongoose'

export const UserSocketioSchema = new Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  socketId: {
    type: String,
    required: true
  }
})
