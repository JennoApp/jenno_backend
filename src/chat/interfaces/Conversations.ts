import { Document } from 'mongoose'

export interface Conversations extends Document {
  members: [],
  unreadCount: { [userId: string]: number }
}
