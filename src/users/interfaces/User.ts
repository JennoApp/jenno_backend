import { Document } from 'mongoose';

export interface User extends Document {
  username: string,
  displayname: string,
  email: string,
  profileImg: string,
  password: string,
  accountType: string,
  following: string[],
  followers: string[],
  orders: [],
  shopping: [],
  walletId: string
  paypalAccount: string,
  notifications: []
}
