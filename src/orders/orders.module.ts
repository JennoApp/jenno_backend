import { Module } from '@nestjs/common'
import { OrdersController } from './orders.controller'
import { OrdersService } from './orders.service'
import { MongooseModule } from '@nestjs/mongoose'
import { OrderSchema } from './schemas/order.schema'
import { UsersModule } from '../users/users.module'

@Module({
  imports: [MongooseModule.forFeature([
    { name: 'Order', schema: OrderSchema }
  ]), UsersModule],
  controllers: [OrdersController],
  providers: [ OrdersService]
})

export class OrdersModule {}
