import { Document } from 'mongoose';

export interface User extends Document {
  username: string,
  email: string,
  profileImg: string,
  password: string,
  accountType: string,
  following: string[],
  followers: string[]
}