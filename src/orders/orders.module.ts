import { Module } from '@nestjs/common'
import { OrdersController } from './orders.controller'
import { OrdersService } from './orders.service'
import { MongooseModule } from '@nestjs/mongoose'
import { OrderSchema } from './schemas/order.schema'
import { UsersModule } from '../users/users.module'
import { ProductsModule } from '../products/products.module'
import { BullModule } from '@nestjs/bullmq'
import { OrdersProcessor } from './orders.processor'
import { WalletModule } from '../wallet/wallet.module'

@Module({
  imports: [
    MongooseModule.forFeature([
    { name: 'Order', schema: OrderSchema }
    ]),
    BullModule.registerQueue({
      name: 'autoCompleteOrder',
      connection: {
        // host: 'redis-mexo.railway.internal',
        port: 6379
      }
    }),
    // BullModule.registerQueue({
    //   name: 'autoCompleteOrder',
    //   connection: {
    //     host: 'redis.railway.internal',
    //     port: 6379
    //   }
    // }),
    UsersModule, 
    ProductsModule,
    WalletModule,
  ],
  controllers: [OrdersController],
  providers: [ OrdersService, OrdersProcessor ],
  exports: [ OrdersService ]
})

export class OrdersModule {}
