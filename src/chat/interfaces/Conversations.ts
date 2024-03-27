import { Document } from 'mongoose'

export interface Conversations extends Document {
  members: []
}
