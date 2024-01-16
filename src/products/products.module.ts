import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ProductSchema } from './schemas/product.schema'
import { ProductsService } from './products.service'
import { ProductsController } from './products.controller'
import { UsersModule } from 'src/users/users.module'


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Product', schema: ProductSchema }
    ]),
    UsersModule
  ],
  controllers: [ProductsController],
  providers: [ProductsService]
})

export class ProductsModule { }

