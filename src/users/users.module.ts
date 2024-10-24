import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from './schemas/user.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { WalletService } from '../wallet/wallet.service'
import { WalletModule } from 'src/wallet/wallet.module';
import { MailsService } from '../mails/mails.service'
import { AwsModule } from '../aws/aws.module'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema }
    ]), 
    WalletModule, 
    AwsModule
  ],
  controllers: [UsersController],
  providers: [UsersService, WalletService, MailsService],
  exports: [UsersService]
})
export class UsersModule { }
