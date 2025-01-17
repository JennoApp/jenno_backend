import { Document } from 'mongoose';

export interface MessageStatus extends Document {
  messageId: string,
  userId: string,
  isRead: boolean
}
