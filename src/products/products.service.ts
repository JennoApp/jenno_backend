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

  async getProducts() {
    return await this.productModel.find()
  }

  async getProduct(id) {
    return await this.productModel.findById(id)
  }

  async createProduct(product: ProductDto) {
    const newProduct = new this.productModel(product)
    return newProduct.save()
  }
}
