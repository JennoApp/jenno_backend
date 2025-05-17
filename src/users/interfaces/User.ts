import { Document } from 'mongoose';

export interface User extends Document {
  username: string,
  displayname: string,
  email: string,
  profileImg: string,
  bio: string,
  password: string,
  accountType: string,
  following: string[],
  followers: string[],
  orders: [],
  shopping: [],
  walletId: string,
  notifications: [],
  country: string,
}
