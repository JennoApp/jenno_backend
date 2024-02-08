import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './interfaces/User';
import { CreateUserDto } from './dto/createuser.dto';
import * as bcrypt from 'bcrypt';


@Injectable()
export class UsersService {
  constructor(@InjectModel('User') private readonly userModel: Model<User>) { }

  async getUsers() {
    return await this.userModel.find();
  }

  async getUser(id: string) {
    return await this.userModel.findById(id)
  }

  async getProfileImg(id: string) {
    try {
      return await this.userModel
        .findById(id)
        .select(['profileImg'])
    } catch (error) {
      throw new Error(`Error al buscar la imagen de perfil del usuario: ${error.message}`)
    }
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
      if (userFound) {
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

  async findOne(username: string): Promise<any | null> {
    return await this.userModel.findOne({ username })
  }

  async findOneByEmail(email: string): Promise<any | null> {
    return await this.userModel.findOne({ email })
  }

  async updateUserImg(userId: string, newProfileImg: string): Promise<any | null> {
    try {
      const updatedUser = await this.userModel.findByIdAndUpdate(userId, { profileImg: newProfileImg }, { new: true })

      return updatedUser
    } catch (error) {
      throw new Error("Error al actualizar la image de perfil del usuario")
    }
  }

  // Agregar Id a la lista de Following
  async following(customerId: string, userId: string) {
    try {
      // Encuentra el usuario por su Id
      const user = await this.userModel.findById(userId)

      if (!user) {
        throw new Error("Usuario no encontrado")
      }

      // Agrega el customerId a la lista de following del usuario
      if (!user.following.includes(customerId)) {
        user.following.push(customerId)
        await user.save()
      }

      // Encuentra el cliente por su Id
      const customer = await this.userModel.findById(customerId)

      if (!customer) {
        throw new Error('Cliente no encontrado')
      }

      // Agregar el userId a la lista de followers del cliente
      if (!customer.followers.includes(userId)) {
       customer.followers.push(userId)
       await customer.save() 
      }

      return user
    } catch (error) {
      throw new Error(`Error al agregar el customerId y el userId: ${error.message}`)
    }
  }
}
