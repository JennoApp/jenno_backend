import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from './schemas/user.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { WalletService } from '../wallet/wallet.service'
import { WalletModule } from 'src/wallet/wallet.module';


@Module({
  imports: [MongooseModule.forFeature([
    { name: 'User', schema: UserSchema }
  ]), WalletModule],
  controllers: [UsersController],
  providers: [UsersService, WalletService],
  exports: [UsersService]
})
export class UsersModule { }
