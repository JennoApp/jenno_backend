import { Schema } from 'mongoose'

export const ConversationsSchema = new Schema({
  members: {
    type: Array,
    required: true
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  }
},
  {
    timestamps: true
  })

