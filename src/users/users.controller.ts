import { Controller, Get, Post, Put, Body, Param, NotFoundException, HttpStatus, UseGuards, Request, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) { }

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

  @Get('/orders/:id')
  getOrders(@Param('id') id, @Query('page') page: number, @Query('limit') limit: number) {
    return this.usersService.getOrders(id, page, limit)
  }

  @Get('/shopping/:id')
  getShopping(@Param('id') id, @Query('page') page: number, @Query('limit') limit: number) {
    return this.usersService.getShopping(id, page, limit)
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

  @Post()
  createUser(@Body() user: any) {
    return this.usersService.createUser(user)
  }

  @UseGuards(JwtAuthGuard)
  @Post('/updateProfileImg')
  async updateProfileImg(@Body() imgUrl, @Request() req) {
    console.log(req.user)
    //console.log({imgUrl}) 
    try {
      const updatedUser = await this.usersService.updateUserImg(req?.user?.userId, imgUrl?.profileImg)
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
}
