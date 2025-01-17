import { Document } from 'mongoose'

export interface Conversations extends Document {
  members: string[],
  unreadCount: Map<string, number>
}
