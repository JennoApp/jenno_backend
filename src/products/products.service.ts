import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose'
import { Product } from './interfaces/Product'
import { ProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel('Product') private productModel: Model<Product>
  ) { }

  // return all products in database
  async getProducts() {
    return await this.productModel.find()
  }

  // found product by id
  async getProduct(id) {
    return await this.productModel.findById(id)
  }

  // return all products for single users
  async getProductsbyUser(userId: string) {
    return await this.productModel
      .find({ user: userId })
      .select('productname price quantity')
  }

  // crate a new product
  async createProduct(product: ProductDto) {
    const newProduct = new this.productModel(product)
    return newProduct.save()
  }
}
