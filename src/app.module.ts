import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { WebSocketModule } from './websockets/websocket.module'
import { ChatModule } from './chat/chat.module'
import { PaymentsModule } from './payments/payments.module'
import { OrdersModule } from './orders/orders.module'
import { WalletModule } from './wallet/wallet.module'
import { MailsModule } from './mails/mails.module'
import { MarketingModule } from './marketing/marketing.module'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { BullModule } from '@nestjs/bullmq'
import { ShippingModule } from './shipping/shipping.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get('MONGODB_URI')
      }),
      inject: [ConfigService]
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
        host: configService.get('REDIS_HOST'),
        port: configService.get<number>('REDIS_PORT'),
        username: configService.get('REDIS_USERNAME'),
        password: configService.get('REDIS_PASSWORD'),
        connectTimeout: 10000,
        retryStrategy(times) {
          const delay = Math.min(times * 50, 2000)
          console.log(`Retrying connection to Redis, attempt: ${times}, delay: ${delay}ms`)

          return delay
        },
        // tls: {
        //   rejectUnauthorized: false
        // }
      },

      defaultJobOptions: {
        removeOnComplete: configService.get<boolean>('REDIS_JOB_REMOVE_ON_COMPLETE') ?? true,
        removeOnFail: configService.get<boolean>('REDIS_JOB_REMOVE_ON_FAIL') ?? false,
        attempts: configService.get<number>('REDIS_JOB_ATTEMPTS') ?? 5
      }
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    ProductsModule,
    ChatModule,
    PaymentsModule,
    OrdersModule,
    WalletModule,
    WebSocketModule,
    MailsModule,
    MarketingModule,
    ShippingModule
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule { }
