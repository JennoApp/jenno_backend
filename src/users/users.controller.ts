import { Controller, Get, Post, Put, Body, Param, NotFoundException, HttpStatus, UseGuards, Request, Query, Patch, Delete, UseInterceptors, UploadedFile } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Express } from 'express'
import { FileInterceptor } from '@nestjs/platform-express';
import { AwsService } from 'src/aws/aws.service';



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

  // @Get('order/:id')
  // async getOrderPrice(@Param('id') id) {
  //   const order = await this.usersService.findOne()
  // }

  @Get('/shopping/:id')
  getShopping(@Param('id') id, @Query('page') page: number, @Query('limit') limit: number) {
    return this.usersService.getShopping(id, page, limit)
  }

  @Get('/shoppingwithoutreviews/:userid')
  getShoppingWithoutReview(@Param('userid') userid, @Query('page') page: number, @Query('limit') limit: number) {
    return this.usersService.getShoppingWithoutReview(userid, page, limit)
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
  @Post('/following/:id')
  following(@Param('id') id: string, @Request() req) {
    return this.usersService.following(id, req?.user?.userId)
  }

  @Put('/shipping/:id')
  updateShippingInfo(@Param('id') id: string, @Body() shippingInfo) {
    return this.usersService.updateShippingInfo(id, shippingInfo)
  }

  @Post('/forgotpassword')
  sendForgotPasswordEmail(@Body() body: any) {
    const email = body.email
    console.log(email)
    return this.usersService.sendForgotPasswordEmail(email)
  }

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
}
