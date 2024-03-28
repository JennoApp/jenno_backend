import { Document } from 'mongoose';

export interface UserSocketio extends Document {
  userId: string,
  socketId: string
}
