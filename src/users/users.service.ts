import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './interfaces/User';
import { CreateUserDto } from './dto/createuser.dto';
import * as bcrypt from 'bcrypt';
import { PaginatedDto } from './dto/paginated.dto';
import { WalletService } from '../wallet/wallet.service'
import { AwsService } from 'src/aws/aws.service';
import { BankAccountDto } from '../wallet/dto/bankaccount.dto';
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from "@nestjs/config";
import { OAuth2Client } from 'google-auth-library'


@Injectable()
export class UsersService {
  private googleClient: OAuth2Client;

  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    private readonly config: ConfigService,
    readonly walletService: WalletService,
    private awsService: AwsService,
    private jwtService: JwtService
  ) {
    this.googleClient = new OAuth2Client(this.config.get('GOOGLE_CLIENT_ID'))
  }

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

  async getUserByEmail(email: string) {
    return await this.userModel.findOne({ email });
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
      const { username, displayname, email, name, lastname, taxid, password, accountType, currency, country } = user;
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
          bio: "",
          password: hashedPassword,
          accountType: accountType,
          country: country,
          authProvider: 'local'
        });
      } else if (accountType === 'business') {
        newUser = new this.userModel({
          username: username,
          displayname: displayname,
          profileImg: "",
          email: email,
          bio: "",
          name: name,
          lastname: lastname,
          taxid: taxid,
          password: hashedPassword,
          accountType: accountType,
          country: country,
          authProvider: 'local',
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
          withdrawalPendingBalance: 0,
          withdrawalTotalBalance: 0,
          withdrawals: [],
          bankAccounts: [],
        })

        createUser.walletId = wallet._id
        await createUser.save()
      }

      return createUser;
    } catch (error) {
      console.error(error);
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

  async updateShippingInfo(userId, info: { completeName, document, country, address, city, state, postalCode, phoneNumber }) {
    const shippingInfo = {
      completeName: info.completeName,
      document: info.document,
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
      const salesOrders = await this.userModel
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

      if (!salesOrders) {
        throw new NotFoundException('User not Found')
      }

      const salesOrdersCount = await this.userModel
        .findById(userId)
        .populate({
          path: 'orders',
          match: { status: { $ne: 'completed' } },
          select: '_id status createdAt',
        })
      const ordersCount = salesOrdersCount?.orders.length

      const orderList = salesOrders.orders.map((order: { _id: string }) => order?._id)


      console.log({ orderList, page, limit, ordersCount })

      return new PaginatedDto(orderList, page, limit, ordersCount)
    } catch (error) {
      console.error('Error to get order List:', error)
      throw new InternalServerErrorException('Failed to get order List')
    }
  }

  async getOrdersCompleted(id: string, page: number, limit: number) {
    try {
      const salesOrdersCompleted = await this.userModel
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

      if (!salesOrdersCompleted) {
        throw new NotFoundException('User not Found');
      }

      const orderIds = salesOrdersCompleted.orders.map((order: { _id: string }) => order?._id);

      const salesOrdersCompletedCount = await this.userModel
        .findById(id)
        .populate({
          path: 'orders',
          match: { status: 'completed' },
          select: '_id status createdAt',
        })
      const ordersCount = salesOrdersCompletedCount?.orders.length

      console.log({ orderIds, page, limit, ordersCount })

      return new PaginatedDto(orderIds, page, limit, ordersCount);
    } catch (error) {
      console.error('Error retrieving completed orders:', error);
      throw new InternalServerErrorException('Failed to retrieve completed orders');
    }
  }


  async getShopping(id: string, page: number, limit: number) {
    try {
      const shoppingOrders = await this.userModel
        .findById(id)
        .populate({
          path: 'shopping',
          match: { status: { $ne: 'completed' } },
          select: '_id status createdAt',
          options: {
            limit: limit,
            skip: (page - 1) * limit
          }
        })
        .exec();

      if (!shoppingOrders) {
        throw new NotFoundException('User not Found');
      }

      const totalShoppingCount = await this.userModel
        .findById(id)
        .populate({
          path: 'shopping',
          match: { status: { $ne: 'completed' } },
          select: '_id status createdAt',
        })

      const shoppingIds = shoppingOrders.shopping.map((order: { _id: string }) => order?._id);

      const count = totalShoppingCount?.shopping.length

      console.log({ shoppingIds, page, limit, count });

      return new PaginatedDto(shoppingIds, page, limit, count);
    } catch (error) {
      console.error('Error to get Shopping List:', error);
      throw new InternalServerErrorException('Failed to get Shopping List');
    }
  }

  async getShoppingWithoutReview(id, page: number, limit: number) {
    try {
      const shoppingOrdersWithReviews = await this.userModel
        .findById(id)
        .populate({
          path: 'shopping',
          match: { status: 'completed' },
          select: '_id reviews status createdAt',
          options: {
            sort: { createdAt: -1 },
            limit: limit,
            skip: (page - 1) * limit
          }
        })
        .exec()

      if (!shoppingOrdersWithReviews) {
        throw new NotFoundException('User not Found')
      }

      const shoppingOrdersIds = shoppingOrdersWithReviews.shopping.map((order: { _id: string }) => order?._id);

      const shoppingOrdersCompletedCount = await this.userModel
        .findById(id)
        .populate({
          path: 'shopping',
          match: { status: 'completed' },
          select: '_id status createdAt',
        })

      const shoppingOrdersCount = shoppingOrdersCompletedCount?.shopping.length

      return new PaginatedDto(shoppingOrdersIds, page, limit, shoppingOrdersCount)
    } catch (error) {
      console.error('Error retrieving shopping without review:', error)
      throw new InternalServerErrorException('Failed to retrieve shopping without review')
    }
  }

  async getShoppingCompleted(id: string, page: number, limit: number) {
    try {
      // Obtener el usuario con las órdenes completadas
      const shoppingOrdersCompletedOrders = await this.userModel
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

      if (!shoppingOrdersCompletedOrders) {
        throw new NotFoundException('User not found');
      }

      // Obtener los IDs de las órdenes completadas
      const completedOrderIds = shoppingOrdersCompletedOrders.shopping.map((order: { _id: string }) => order._id);

      const shoppingOrdersCompletedCount = await this.userModel
        .findById(id)
        .populate({
          path: 'shopping',
          match: { status: 'completed' },
          select: '_id status createdAt',
        })
      const shoppingOrdersCount = shoppingOrdersCompletedCount?.shopping.length


      console.log({ completedOrderIds, page, limit, shoppingOrdersCount });

      return new PaginatedDto(completedOrderIds, page, limit, shoppingOrdersCount);
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

  // update Paypal Account
  async updatePaypalAccount(userId: string, updatePayplaDto: { paypalAccount: string }) {
    const user = await this.userModel.findById(userId)
    if (!user) {
      throw new NotFoundException('Usuario no encontrado')
    }

    // @ts-ignore
    user.paypalAccount = updatePayplaDto.paypalAccount
    return user.save()
  }

  // remove Paypal Account
  async removePaypalAccount(userId: string) {
    const user = await this.userModel.findById(userId)

    if (!user) {
      throw new NotFoundException('Usuario no encontrado')
    }

    // @ts-ignore
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
      // @ts-ignore
      account: user?.paypalAccount
    }
  }


  // Marcar las notificaciones como leidas
  async markNotificationsAsRead(userId: string) {
    if (!userId) {
      throw new BadRequestException('UserId is required')
    }

    try {
      const user = await this.userModel.findById(userId)

      if (!user || !Array.isArray(user.notifications)) {
        throw new BadRequestException('Usuario no encontrado o no tiene notificaciones');
      }

      // Actualizamos las notificaciones
      const result = await this.userModel.updateOne(
        { _id: userId, 'notifications.read': false },
        { $set: { 'notifications.$[].read': true } }
      )

      if (result.modifiedCount === 0) {
        throw new BadRequestException('No se encontraron notificaciones no leídas para marcar')
      }

      return {
        status: 200,
        message: 'Notificaciones marcadas como leídas correctamente.',
      };
    } catch (error) {
      console.error('Error al marcar las notificaciones como leídas:', error);
      return {
        status: 500,
        message: 'Error al marcar las notificaciones como leídas.',
        error,
      };
    }
  }

  /**
   * Actualiza los tokens de Google Ads para el usuario (tienda) dado.
   */
  async updateGoogleMarketingTokens(
    userId: string,
    data: {
      clientId: string;
      accessToken: string;
      refreshToken: string;
      expiresIn: number; // en segundos
    }
  ) {
    const tokenExpiry = new Date(Date.now() + data.expiresIn * 1000);

    return this.userModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          'marketing.google.clientId': data.clientId,
          'marketing.google.accessToken': data.accessToken,
          'marketing.google.refreshToken': data.refreshToken,
          'marketing.google.tokenExpiry': tokenExpiry,
        },
      },
      { new: true }
    );
  }

  // crear cuenta con Google
  async createGoogleUser(user: {
    username: string;
    displayname: string;
    email: string;
    profileImg: string;
    googleId: string;
    accountType: 'personal' | 'business';
    country?: string;
  }) {
    const existing = await this.userModel.findOne({ email: user.email });
    if (existing) throw new ConflictException('Email ya registrado');

    const newUser = new this.userModel({
      username: user.username,
      displayname: user.displayname,
      email: user.email,
      profileImg: user.profileImg,
      googleId: user.googleId,
      authProvider: 'google',
      accountType: user.accountType,
      country: user.country || 'Colombia',
    });

    const savedUser = await newUser.save();

    if (user.accountType === 'business') {
      const wallet = await this.walletService.createWallet(savedUser._id as string, {
        totalEarned: 0,
        availableBalance: 0,
        pendingBalance: 0,
        currency: 'COP',
        withdrawalPendingBalance: 0,
        withdrawalTotalBalance: 0,
        withdrawals: [],
        bankAccounts: [],
      });

      savedUser.walletId = wallet._id as string
      await savedUser.save();
    }

    return savedUser;
  }



  async loginWithGoogle(idToken: string) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: this.config.get('GOOGLE_CLIENT_ID'),
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email_verified) {
      throw new UnauthorizedException('Token de Google no válido');
    }

    const { sub: googleId, email, name, picture } = payload;

    let user = await this.getUserByEmail(email);

    if (!user) {
      user = await this.createGoogleUser({
        username: name,
        displayname: name,
        email,
        profileImg: picture,
        googleId,
        accountType: 'personal',
      });
    }

    const tokenPayload = {
      username: user.username,
      sub: user._id,
      accountType: user.accountType,
      country: user.country,
    };

    return {
      access_token: this.jwtService.sign(tokenPayload),
    };
  }

}
