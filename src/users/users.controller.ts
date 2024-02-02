import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';

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

  @Get('/findOne/:username')
  getUserByUsername(@Param('username') username: string) {
    return this.usersService.findOne(username)
  }

  @Post()
  createUser(@Body() user: any) {
    return this.usersService.createUser(user)
  }
}
