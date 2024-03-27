import { Document } from 'mongoose'

export interface Message extends Document {
  conversationId: String,
  sender: String,
  text: String
}
