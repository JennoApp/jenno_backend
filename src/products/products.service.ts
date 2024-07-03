import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose'
import { Product } from './interfaces/Product'
import { ProductDto } from './dto/product.dto';
import { PaginatedDto } from './dto/paginated.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel('Product') private productModel: Model<Product>
  ) { }

  // return all products in database
  async getProducts(page: number, limit: number, country?: string) {
    const query: any = {
      visibility: true
    }

    if (country) {
      query.country = { $in: [country] }
    }

    const itemsCount = await this.productModel.countDocuments(query)

    const products = await this.productModel
      .aggregate([
        { $match: query },
        { $sample: { size: Math.min(Number(limit), itemsCount) } },
        { $skip: (page - 1) * Number(limit) },
        { $limit: Number(limit) }
      ])
      .exec()

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

  // return all products for single user
  async getProductsbyUser(userId: string, page: number, limit: number, country?: string) {
    const idCast = new mongoose.Types.ObjectId(userId)
    const query: any = { 
      user: idCast,
      visibility: true
    }

    if (country) {
      query.country = { $in: [country] }
    }

    const itemsCount = await this.productModel.countDocuments(query)

    const products = await this.productModel
      .aggregate([
        { $match: query },
        { $sample: { size: Math.min(Number(limit), itemsCount) } },
        { $skip: (page - 1) * Number(limit) },
        { $limit: Number(limit) }
      ])
      .exec()

    return new PaginatedDto(products, page, limit, itemsCount)
  }

  // return all products for single user in paginated order
  async getProductsbyUserOrdered(userId: string, page: number, limit: number, country?: string) {
    const idCast = new mongoose.Types.ObjectId(userId)
    const query: any = { user: idCast }

    if (country) {
      query.country = { $in: [country] }
    }

    const itemsCount = await this.productModel.countDocuments(query)

    const products = await this.productModel
      .find(query)
      // .sort({ _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec()

    return new PaginatedDto(products, page, limit, itemsCount)
  }

  // return 4 products random for user
  async getProductsRandombyUser(userId: string) {
    const productsCount = await this.productModel.countDocuments({ user: userId })

    if (productsCount <= 4) {
      const products = await this.productModel.find({ user: userId, visibility: true }).limit(4)
      return products
    } else {
      const idCast = new mongoose.Types.ObjectId(userId)
      const products = await this.productModel
        .aggregate([
          { $match: { user: idCast, visibility: true } },
          { $sample: { size: 4 } }
        ])
        .exec()

      return products
    }
  }

  async searchProductsbyUser(username: string, query: string, page: number, limit: number) {
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
