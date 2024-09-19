import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WalletSchema } from './schema/wallet.schema'
import { WalletControler } from './wallet.controller'
import { WalletService } from './wallet.service'

@Module({
  imports: [
    MongooseModule.forFeature([
    { name: 'Wallet', schema: WalletSchema }
    ]),
  ],
  controllers: [WalletControler],
  providers: [WalletService],
  exports: [WalletService, MongooseModule]
})
export class WalletModule { }
