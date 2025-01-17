import { Schema } from 'mongoose'

export const MessageSchema = new Schema({
  conversationId: String,
  sender: String,
  text: String,
  isRead: Boolean
},
{
  timestamps: true
})
