import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose'
import { Product } from './interfaces/Product'
import { ProductDto } from './dto/product.dto';
import { PaginatedDto } from './dto/paginated.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel('Product') private productModel: Model<Product>
  ) { }

  // return all products in database
  async getProducts(page: number, limit: number) {
    const products = await this.productModel.find().limit(limit).skip((page - 1) * limit).exec()
    const itemsCount = await this.productModel.countDocuments()

    return new PaginatedDto(products, page, limit, itemsCount)
  }

  async searchProducts(query: string, page: number, limit: number) {
    if (query.trim() === "") {
      return new PaginatedDto([], page, limit, 0)
    }

    const terms = query.split(" ").map(term => `(?=.*${term})`).join("")
    const regexQuery = new RegExp(terms, 'i')

    const products = await this.productModel
      .find({ productname: { $regex: regexQuery } })
      .limit(limit)
      .skip((page - 1) * limit)
      .exec()
    
    const itemCount = await this.productModel.countDocuments({ productname: { $regex: regexQuery } })

    return new PaginatedDto(products, page, limit, itemCount)
  }

  // found product by id
  async getProduct(id) {
    return await this.productModel.findById(id)
  }

  // return all products for single users
  async getProductsbyUser(userId: string, page: number, limit: number) {
    const products =  await this.productModel
      .find({ user: userId }).limit(limit).skip((page - 1) * limit).exec()
    const itemsCount = await this.productModel.find({ user: userId }).countDocuments()

    return new PaginatedDto(products, page, limit, itemsCount)
  }

  async searchProductsbyUser(username: string,query: string, page: number, limit: number) {
    if (query.trim() === "") {
      return new PaginatedDto([], page, limit, 0)
    }

    const terms = query.split(" ").map(term => `(?=.*${term})`).join("")
    const regexQuery = new RegExp(terms, 'i')

    const products = await this.productModel
      .find({ username: username, productname: { $regex: regexQuery } })
      .limit(limit)
      .skip((page - 1) * limit)
      .exec()
    
    const itemCount = await this.productModel.countDocuments({ productname: { $regex: regexQuery } })

    return new PaginatedDto(products, page, limit, itemCount)
  }

  // crate a new product
  async createProduct(product: ProductDto) {
    const newProduct = new this.productModel(product)
    return newProduct.save()
  }
}
