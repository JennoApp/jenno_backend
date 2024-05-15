import { Module } from '@nestjs/common'
import { OrdersController } from './orders.controller'
import { OrdersService } from './orders.service'
import { MongooseModule } from '@nestjs/mongoose'
import { OrderSchema } from './schemas/order.schema'
import { UsersModule } from '../users/users.module'
import { ProductsModule } from '../products/products.module'

@Module({
  imports: [MongooseModule.forFeature([
    { name: 'Order', schema: OrderSchema }
  ]), UsersModule, ProductsModule],
  controllers: [OrdersController],
  providers: [ OrdersService]
})

export class OrdersModule {}
