import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './interfaces/User';
import { CreateUserDto } from './dto/createuser.dto';
import * as bcrypt from 'bcrypt';
import { PaginatedDto } from './dto/paginated.dto';
import { WalletService } from '../wallet/wallet.service'
import { MailsService } from '../mails/mails.service'
import { AwsService } from 'src/aws/aws.service';
// import brevo from '@getbrevo/brevo'

// const apiInstance = new brevo.TransactionalEmailsApi()

// apiInstance.setApiKey(
//   brevo.TransactionalEmailsApiApiKeys.apiKey,
//   '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'
// )

@Injectable()
export class UsersService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    readonly walletService: WalletService,
    readonly mailsService: MailsService,
    private awsService: AwsService
    // apiInstance = new brevo.TransactionalEmailsApi()
  ) { }

  async getUsers() {
    return await this.userModel.find();
  }

  async getUser(id: string) {
    return await this.userModel.findById(id)
  }

  async getUserId(username: string) {
    const user = await this.userModel.findOne({ username }).select('_id').exec()
    if (!user) {
      throw new NotFoundException('Usuario no encontrado')
    }

    return {
      id: user._id
    }
  }

  async getUsername(id: string) {
    const { username } = await this.userModel.findById(id)
    return {
      username
    }
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
      const { username, displayname, email, name, lastname, taxid, password, accountType, currency } = user;
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
          displayname: displayname,
          profileImg: "",
          email: email,
          password: hashedPassword,
          accountType: accountType,
        });
      } else if (accountType === 'business') {
        newUser = new this.userModel({
          username: username,
          displayname: displayname,
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

      if (accountType === 'business') {
        console.log('Creating wallet for user...')
        const wallet = await this.walletService.createWallet(createUser._id, {
          totalEarned: 0,
          availableBalance: 0,
          pendingBalance: 0,
          currency: currency,
          bankAccountTokens: [],
          transactionHistory: []
        })

        console.log('Wallet created: ', wallet)

        createUser.walletId = wallet._id
        await createUser.save()
        console.log('User updated with wallet: ', createUser)
      }

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

  findById(userId: string) {
    return this.userModel.findById(userId)
  }

  // busca un usuario con el tipo de cuenta personal
  async findOnePersonal(userId: string): Promise<any | null> {
    return await this.userModel.findOne({ _id: userId, accountType: "personal" })
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return await this.userModel.findOne({ email }).exec()
  }

  async updateUserImg(userId: string, newProfileImgUrl: string): Promise<any | null> {
    try {
      // Validar que los parámetros no estén vacíos
      if (!userId || !newProfileImgUrl) {
        throw new BadRequestException('UserId y newProfileImgUrl son requeridos');
      }

      // Buscar el usuario
      const user = await this.userModel.findById(userId)
      if (!user) {
        throw new NotFoundException('Usuario no encontrado')
      }

      try {
        // Si el usuario tiene una imagen previa, eliminarla de AWS S3
        if (user.profileImg) {
          await this.awsService.deleteFileFromS3(user.profileImg);
        }
      } catch (deleteError) {
        // Log del error pero continuamos con la actualización
        console.error('Error al eliminar imagen anterior:', deleteError);
        // Opcionalmente, podrías querer manejar este error de otra manera
      }

      // // Si el usuario tiene una imagen previa eliminarla de Aws S3
      // if (user.profileImg) {
      //   await this.awsService.deleteFileFromS3(user.profileImg)
      // }

      // Actualizar la Url de la imagen de perfil
      user.profileImg = newProfileImgUrl

      // return user.save()

      // Guardar y retornar el usuario actualizado
      const updatedUser = await user.save();
      return updatedUser;
    } catch (error) {
      console.error('Error en updateUserImg:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error; // Re-lanzar errores específicos
      }
      throw new Error("Error al actualizar la image de perfil del usuario")
    }
  }

  // Actualizar informacion del usuario
  async updateUser(userId: string, user: any) {
    try {
      // Verificar si el username ya está en uso por otro usuario
      const existingUser = await this.userModel.findOne({ username: user.username });
      if (existingUser && existingUser._id.toString() !== userId) {
        throw new Error(`El nombre de usuario "${user.username}" ya está en uso.`);
      }

      const userInfo = await this.userModel.findByIdAndUpdate(userId, {
        username: user.username,
        displayname: user.displayname,
        email: user.email,
        bio: user.bio,
        country: user.country,
        legalname: user.legalname,
        legallastname: user.legallastname,
        taxid: user.taxid
      }, { new: true })

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

  async getOrders(userId: string, page: number, limit: number) {
    try {
      const user = await this.userModel
        .findById(userId)
        .populate({
          path: 'orders',
          match: { status: { $ne: 'completed' } },
          select: '_id',
          options: {
            limit: limit,
            skip: (page - 1) * limit
          }
        })
        .exec()

      if (!user) {
        throw new NotFoundException('User not Found')
      }

      const orderList = user.orders.map((order: { _id: string }) => order?._id)

      const ordersCount = orderList.length

      console.log({ orderList, page, limit, ordersCount })

      return new PaginatedDto(orderList, page, limit, ordersCount)
    } catch (error) {
      console.error('Error to get order List:', error)
      throw new InternalServerErrorException('Failed to get order List')
    }
  }

  async getOrdersCompleted(id: string, page: number, limit: number) {
    try {
      const userWithOrders = await this.userModel
        .findById(id)
        .populate({
          path: 'orders',
          match: { status: 'completed' },
          select: '_id createdAt',
          options: {
            sort: { createdAt: -1 },
            limit: limit,
            skip: (page - 1) * limit
          }
        })
        .exec();

      if (!userWithOrders) {
        throw new NotFoundException('User not Found');
      }

      const orderIds = userWithOrders.orders.map((order: { _id: string }) => order?._id);

      const ordersCount = orderIds.length;

      console.log({ orderIds });

      return new PaginatedDto(orderIds, page, limit, ordersCount);
    } catch (error) {
      console.error('Error retrieving completed orders:', error);
      throw new InternalServerErrorException('Failed to retrieve completed orders');
    }
  }


  async getShopping(id: string, page: number, limit: number) {
    try {
      const userWithOrders = await this.userModel
        .findById(id)
        .populate({
          path: 'orders',
          match: { status: { $ne: 'completed' } },
          select: '_id',
          options: {
            limit: limit,
            skip: (page - 1) * limit
          }
        })
        .exec();
      if (!userWithOrders) {
        throw new NotFoundException('User not Found');
      }

      const orderIds = userWithOrders.orders.map((order: { _id: string }) => order?._id);
      const ordersCount = orderIds.length;

      console.log({ orderIds, page, limit, ordersCount });

      return new PaginatedDto(orderIds, page, limit, ordersCount);
    } catch (error) {
      console.error('Error to get Shopping List:', error);
      throw new InternalServerErrorException('Failed to get Shopping List');
    }
  }

  async getShoppingWithoutReview(id, page: number, limit: number) {
    try {
      const userWithShopping = await this.userModel
        .findById(id)
        .populate({
          path: 'orders',
          match: { status: 'completed' },
          select: '_id reviews createdAt',
          options: {
            sort: { createdAt: -1 },
            limit: limit,
            skip: (page - 1) * limit
          }
        })
        .exec()

      if (!userWithShopping) {
        throw new NotFoundException('User not Found')
      }

      // filtrar los productos que no tienen review del usuario
      const shoppingWithoutReview = userWithShopping.shopping.filter((product: any) => {
        return !product.reviews || product.reviews.length === 0 || !product.reviews.some((review: any) => review.user.toString() === id)
      })

      const shoppingCount = shoppingWithoutReview.length

      console.log({ shoppingWithoutReview })

      return new PaginatedDto(shoppingWithoutReview, page, limit, shoppingCount)
    } catch (error) {
      console.error('Error retrieving shopping without review:', error)
      throw new InternalServerErrorException('Failed to retrieve shopping without review')
    }
  }

  async getShoppingCompleted(id: string, page: number, limit: number) {
    try {
      // Obtener el usuario con las órdenes completadas
      const userWithCompletedOrders = await this.userModel
        .findById(id)
        .populate({
          path: 'shopping',
          match: { status: 'completed' },
          select: '_id createdAt',
          options: {
            sort: { createdAt: -1 },
            limit: limit,
            skip: (page - 1) * limit
          }
        })
        .exec();

      if (!userWithCompletedOrders) {
        throw new NotFoundException('User not found');
      }

      // Obtener los IDs de las órdenes completadas
      const completedOrderIds = userWithCompletedOrders.shopping.map((order: { _id: string }) => order._id);
      const ordersCount = completedOrderIds.length;

      console.log({ completedOrderIds, page, limit, ordersCount });

      return new PaginatedDto(completedOrderIds, page, limit, ordersCount);
    } catch (error) {
      console.error('Error retrieving completed shopping orders:', error);
      throw new InternalServerErrorException('Failed to retrieve completed shopping orders');
    }
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

  async sendForgotPasswordEmail(email) {
    try {
      const user = await this.findOneByEmail(email)
      if (!user) {
        throw new Error('Usuario no encontrado')
      }
      console.log({ user })

      await this.mailsService.sendPasswordReset(user)

      return { success: true, message: 'Email de recuperación enviado con éxito' };
    } catch (error) {
      console.error('Error al enviar el correo de recueracion de contraseña:', error)
      throw new Error('No se pudo enviar el correo de recuperación de contraseña')
    }
  }

  // update Paypal Account
  async updatePaypalAccount(userId: string, updatePayplaDto: { paypalAccount: string }) {
    const user = await this.userModel.findById(userId)
    if (!user) {
      throw new NotFoundException('Usuario no encontrado')
    }

    user.paypalAccount = updatePayplaDto.paypalAccount
    return user.save()
  }

  // remove Paypal Account
  async removePaypalAccount(userId: string) {
    const user = await this.userModel.findById(userId)

    if (!user) {
      throw new NotFoundException('Usuario no encontrado')
    }

    user.paypalAccount = null
    return user.save()
  }

  async getPaypalAccount(userId: any) {
    if (!userId) {
      throw new Error('El Id de usuario es requerido')
    }

    const user = await this.userModel.findById(userId)
    if (!user) {
      throw new NotFoundException('Usuario no encontrado')
    }

    return {
      account: user.paypalAccount
    }
  }
}
