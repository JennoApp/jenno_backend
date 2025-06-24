import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from './schemas/user.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { WalletService } from '../wallet/wallet.service'
import { WalletModule } from 'src/wallet/wallet.module';
import { AwsModule } from '../aws/aws.module'
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema }
    ]),
    WalletModule,
    AwsModule,
    AuthModule
  ],
  controllers: [UsersController],
  providers: [UsersService, WalletService],
  exports: [UsersService]
})
export class UsersModule { }
