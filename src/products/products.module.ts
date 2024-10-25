import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ProductSchema } from './schemas/product.schema'
import { ProductsService } from './products.service'
import { ProductsController } from './products.controller'
import { UsersModule } from 'src/users/users.module'
import { AwsModule } from '../aws/aws.module'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Product', schema: ProductSchema }
    ]),
    UsersModule,
    AwsModule
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService]
})

export class ProductsModule { }

