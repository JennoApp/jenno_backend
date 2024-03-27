import { Schema } from 'mongoose'

export const ConversationsSchema = new Schema({
  members: {
    type: Array
  } 
},
{
  timestamps: true
})

