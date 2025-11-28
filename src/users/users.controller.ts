import { Controller, Get, Post, Put, Body, Param, NotFoundException, HttpStatus, UseGuards, Request, Query, Patch, Delete, UseInterceptors, UploadedFile, BadRequestException, InternalServerErrorException, Req, HttpException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Express } from 'express'
import { FileInterceptor } from '@nestjs/platform-express';
import { AwsService } from 'src/aws/aws.service';
import { PaginatedDto } from './dto/paginated.dto';
import { BankAccountDto } from '../wallet/dto/bankaccount.dto'



@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private awsService: AwsService
  ) { }

  @Get()
  getUsers() {
    return this.usersService.getUsers();
  }

  @Get(':id')
  getUser(@Param('id') id) {
    return this.usersService.getUser(id)
  }

  @Get('countByAccountType')
  countByAccountType(@Query('accountType') accountType: "personal" | "business") {
      return this.usersService.countUsersByAccountType(accountType);
  }

  @Get('/getUserId/:username')
  getUserId(@Param('username') username: string) {
    return this.usersService.getUserId(username)
  }

  @Get('/getusername/:id')
  getUsername(@Param('id') id) {
    return this.usersService.getUsername(id)
  }

  @Get('/followers/:id')
  getFollowers(@Param('id') id, @Query('page') page: number, @Query('limit') limit: number) {
    return this.usersService.getFollowers(id, page, limit)
  }

  @Get('/orders/:userid')
  getOrders(@Param('userid') userid, @Query('page') page: number, @Query('limit') limit: number) {
    return this.usersService.getOrders(userid, page, limit)
  }

  @Get('/orderscompleted/:id')
  getOrdersCompleted(@Param('id') id, @Query('page') page: number, @Query('limit') limit: number) {
    return this.usersService.getOrdersCompleted(id, page, limit)
  }

  @Get('/shopping/:id')
  getShopping(@Param('id') id, @Query('page') page: number, @Query('limit') limit: number) {
    return this.usersService.getShopping(id, page, limit)
  }

  @Get('/shoppingwithoutreviews/:userid')
  getShoppingWithoutReview(@Param('userid') userid, @Query('page') page: number, @Query('limit') limit: number) {
    return this.usersService.getShoppingWithoutReview(userid, page, limit)
  }

  @Get('/shoppingcompleted/:id')
  getShoppingCompleted(@Param('id') id, @Query('page') page: number, @Query('limit') limit: number) {
    return this.usersService.getShoppingCompleted(id, page, limit)
  }

  @Get('/getprofileimg/:id')
  getProfileImg(@Param('id') id) {
    return this.usersService.getProfileImg(id)
  }

  @Get('/findOne/:username')
  getUserByUsername(@Param('username') username: string) {
    return this.usersService.findOne(username)
  }

  @Get('/findOnePersonal/:userId')
  getUserByIdForPersonal(@Param('userId') userId: string) {
    return this.usersService.findOnePersonal(userId)
  }

  @Get('/shippingInfo/:userId')
  getShippingInfo(@Param('userId') userId) {
    return this.usersService.getShippingInfo(userId)
  }


  @Post()
  createUser(@Body() user: any) {
    return this.usersService.createUser(user)
  }

  @UseGuards(JwtAuthGuard)
  @Post('/updateProfileImg')
  @UseInterceptors(FileInterceptor('file'))
  async updateProfileImg(@UploadedFile() file: Express.Multer.File, @Request() req) {
    console.log(req.user)
    console.log(file)
    //console.log({imgUrl})
    try {
      // Subir la imagen a Aws S3
      const { publicUrl } = await this.awsService.uploadFile(file, 'profile')

      // Actuializar la imagen de perfil
      const updatedUser = await this.usersService.updateUserImg(req?.user?.userId, publicUrl)
      if (!updatedUser) {
        throw new NotFoundException(`Usuario con ID ${req?.user?.userId} no encontrado.`);
      }

      return {
        message: "Imagen de perfil actualizada correctamente",
        user: updatedUser,
        status: HttpStatus.OK
      }
    } catch (error) {
      console.error(error)
      return {
        message: "Error al actualizar la imagen de perfil",
        status: HttpStatus.INTERNAL_SERVER_ERROR
      }
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('/updateuser')
  updateUser(@Body() user, @Request() req) {
    return this.usersService.updateUser(req?.user?.userId, user)
  }


  @UseGuards(JwtAuthGuard)
  @Post('following/:customerid')
  following(@Param('customerid') customerid: string, @Request() req) {
    return this.usersService.following(customerid, req?.user?.userId)
  }

  @Put('/shipping/:id')
  updateShippingInfo(@Param('id') id: string, @Body() shippingInfo) {
    return this.usersService.updateShippingInfo(id, shippingInfo)
  }

  // Deprecated
  @Patch('paypalaccount/:userid')
  updatePaypalAccount(@Param('userid') userid: string, @Body() updatePayplaDto: { paypalAccount: string }) {
    return this.usersService.updatePaypalAccount(userid, updatePayplaDto)
  }

  @Delete('removepaypalaccount/:userid')
  removePaypalAccount(@Param('userid') userid: string) {
    return this.usersService.removePaypalAccount(userid)
  }

  @Get('getpaypal/:userid')
  getPaypalAccount(@Param('userid') userid: string) {
    if (!userid) {
      throw new Error('El Id de usuario es requerido')
    }

    return this.usersService.getPaypalAccount(userid)
  }
  ////////

  @Get('notifications/:userId')
  async getNotifications(
    @Param('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    try {
      const user = await this.usersService.getUser(userId);
      if (!user || !Array.isArray(user.notifications)) {
        throw new BadRequestException('Usuario no encontrado o no tiene notificaciones.');
      }

      // Ordenar notificaciones por fecha (descendente)
      const sortedNotifications = user.notifications.sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      // Contar el total de notificaciones
      const totalNotifications = sortedNotifications.length;

      // Paginación
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedNotifications = sortedNotifications.slice(startIndex, endIndex);

      // Retornar el resultado en la estructura PaginatedDto
      return new PaginatedDto(paginatedNotifications, page, limit, totalNotifications);
    } catch (error) {
      console.error('Error al obtener las notificaciones:', error);
      throw new InternalServerErrorException('Error al obtener las notificaciones.');
    }
  }

  @Get('notifications/count/:userId')
  async getUnreadNotificationCount(@Param('userId') userId: string) {
    try {
      const user = await this.usersService.getUser(userId);
      if (!user || !Array.isArray(user.notifications)) {
        throw new BadRequestException('Usuario no encontrado o no tiene notificaciones.');
      }

      // Contar notificaciones no leídas
      const unreadCount = user.notifications.filter((notification: any) => !notification.read).length;

      return {
        unread: unreadCount,
      };
    } catch (error) {
      console.error('Error al obtener el conteo de notificaciones no leídas:', error);
      throw new InternalServerErrorException('Error al obtener el conteo de notificaciones no leídas.');
    }
  }

  @Post('notifications/markasread/:userId')
  async markNotificationsAsRead(@Param('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    const result = await this.usersService.markNotificationsAsRead(userId);
    return result;
  }

  @Post('/google/login')
  async loginWithGoogle(@Body('idToken') idToken: string) {
    return this.usersService.loginWithGoogle(idToken);
  }


  // Shipping Settings
  @Get('shipping-settings/:userId')
  async getPickup(@Param('userId') userId: string) {
    return await this.usersService.getPickupSettings(userId);
  }

  @Post('shipping-settings/:userId')
  async updatePickup(@Param('userId') userId: string, @Body() body: any) {
    return await this.usersService.updatePickupSettings(userId, body);
  }
}
