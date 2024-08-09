import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './interfaces/User';
import { CreateUserDto } from './dto/createuser.dto';
import * as bcrypt from 'bcrypt';
import { PaginatedDto } from './dto/paginated.dto';


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
      const { username, email, name, lastname, taxid, password, accountType } = user;
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

      let newUser
      if (accountType === 'personal') {
        newUser = new this.userModel({
          username: username,
          profileImg: "",
          email: email,
          password: hashedPassword,
          accountType: accountType,
        });
      } else if (accountType === 'business') {
        newUser = new this.userModel({
          username: username,
          profileImg: "",
          email: email,
          name: name,
          lastname: lastname,
          taxid: taxid,
          password: hashedPassword,
          accountType: accountType,
        });
      }

      const createUser = await newUser.save();
      return createUser;
    } catch (error) {
      console.log(error);
      throw new Error('Error al crear usuario');
    }
  }

  // busca un usuario con el tipo de cuanta business
  async findOne(username: string): Promise<any | null> {
    return await this.userModel.findOne({ username, accountType: "business" })
  }

  // busca un usuario con el tipo de cuenta personal
  async findOnePersonal(userId: string): Promise<any | null> {
    return await this.userModel.findOne({ _id: userId, accountType: "personal" })
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

  // Actualizar informacion del usuario
  async updateUser(userId: string, user: any) {
    try {
      const userInfo = await this.userModel.findByIdAndUpdate(userId, {
        username: user.username,
        email: user.email,
        bio: user.bio,
        country: user.country,
        legalname: user.legalname,
        legallastname: user.legallastname,
        taxid: user.taxid
      })

      return userInfo
    } catch (err) {
      throw new Error("Error al actualizar la informacion del usuario")
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

  async getFollowers(id: string, page: number, limit: number) {
    const { followers } = await this.userModel.findById(id).limit(limit).skip((page - 1) * limit).exec()
    const followersCount = await this.userModel.findById(id).countDocuments()

    return new PaginatedDto(followers, page, limit, followersCount)
  }

  async updateShippingInfo(userId, info: { country, address, city, state, postalCode, phoneNumber }) {
    const shippingInfo = {
      country: info.country,
      address: info.address,
      city: info.city,
      state: info.state,
      postalCode: info.postalCode,
      phoneNumber: info.phoneNumber
    }

    try {
      const updateInfo = await this.userModel.findByIdAndUpdate(
        { _id: userId },
        { $set: { shippingInfo: shippingInfo } },
        { new: true }
      )

      return updateInfo
    } catch (error) {
      console.error("Error al actualizar usuario:", error)
    }
  }

  async getOrders(id: string, page: number, limit: number) {
    const { orders } = await this.userModel.findById(id).limit(limit).skip((page - 1) * limit).exec()
    const ordersCount = await this.userModel.findById(id).countDocuments()

    return new PaginatedDto(orders, page, limit, ordersCount)
  }

  async getShopping(id: string, page: number, limit: number) {
    const { shopping } = await this.userModel.findById(id).limit(limit).skip((page - 1) * limit).exec()
    const shoppingCount = await this.userModel.findById(id).countDocuments()

    return new PaginatedDto(shopping, page, limit, shoppingCount)
  }

  async getShippingInfo(userId) {
    try {
      const shippingInfo = await this.userModel.findById(userId).select('shippingInfo')
      if (!shippingInfo) {
        throw new Error('Usuario no encontrado')
      }

      return shippingInfo
    } catch (error) {
      console.log('Error al obtener la informacion de envio:', error)
      throw error
    }
  }
}
