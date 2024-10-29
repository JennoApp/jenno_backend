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
import { ConfigModule, ConfigService } from '@nestjs/config'
import { BullModule } from '@nestjs/bullmq'


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: `mongodb://${configService.get('MONGO_HOST')}:${configService.get('MONGO_PORT')}/${configService.get('MONGO_DATABASE')}`
      }),
      inject: [ConfigService]
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: { 
        host: configService.get('REDIS_HOST'),
        port: configService.get<number>('REDIS_PORT'),
      },
      defaultJobOptions: {
        removeOnComplete: configService.get<boolean>('REDIS_JOB_REMOVE_ON_COMPLETE'),
        removeOnFail: configService.get<boolean>('REDIS_JOB_REMOVE_ON_FAIL'),
        attempts: configService.get<number>('REDIS_JOB_ATTEMPTS')
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
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule { }
