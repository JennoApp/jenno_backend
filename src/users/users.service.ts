import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './interfaces/User';
import { CreateUserDto } from './dto/createuser.dto';
import * as bcrypt from 'bcrypt';


@Injectable()
export class UsersService {
  constructor(@InjectModel('User') private readonly userModel: Model<User>) {}

  async getUsers() {
    return await this.userModel.find();
  }

  async createUser(user: CreateUserDto) {
    try {
      const { username, email, password, accountType } = user;
      if (!password || password.length < 6) {
        return {
          message: 'Password must be at least 6 characters',
          status: 400,
        };
      }

      const userFound = await this.userModel.findOne({ email });
      if(userFound) {
        return {
          message: 'Email already exist',
          status: 400,
        };
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const newUser = new this.userModel({
        username: username,
        profileImg: "",
        email: email,
        password: hashedPassword,
        accountType: accountType,
      });
      const createUser = await newUser.save();
      return createUser;
    } catch (error) {
      console.log(error);
      throw new Error('Error al crear usuario');
    }
  }
}
