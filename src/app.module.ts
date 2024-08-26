import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { WebSocketModule } from './websockets/websocket.module'
import { ChatModule } from './chat/chat.module'
import { PaymentsModule } from './payments/payments.module'
import { OrdersModule } from './orders/orders.module'
import { WalletModule } from './wallet/wallet.module'

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://127.0.0.1/shop-database'),
    AuthModule,
    UsersModule,
    ProductsModule,
    ChatModule,
    PaymentsModule,
    OrdersModule,
    WalletModule,
    WebSocketModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
