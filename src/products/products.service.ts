import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose'
import { Product } from './interfaces/Product'
import { UsersService } from '../users/users.service'
import { ReviewData } from './interfaces/Review'
import { ProductDto } from './dto/product.dto';
import { PaginatedDto } from './dto/paginated.dto';
import { AwsService } from '../aws/aws.service'

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel('Product') private productModel: Model<Product>,
    readonly usersService: UsersService,
    private awsService: AwsService
  ) { }

  // return all products in database
  async getProducts(page: number, limit: number, country?: string, category?: string) {
    const query: any = {
      visibility: true
    }

    if (country) {
      query.country = { $in: [country] }
    }

    // Añadir filtro por categoría si existe
    if (category) {
      query.category = category;
    }

    const itemsCount = await this.productModel.countDocuments(query)

    const products = await this.productModel
      .aggregate([
        { $match: query },
        { $addFields: { randField: { $rand: {} } } },
        { $sort: { randField: 1 } },
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
      .find({
        productname: { $regex: regexQuery },
        visibility: true
      })
      .limit(limit)
      .skip((page - 1) * limit)
      .exec()

    const itemCount = await this.productModel.countDocuments({
      productname: { $regex: regexQuery },
      visibility: true
    })

    return new PaginatedDto(products, page, limit, itemCount)
  }

  // found product by id
  async getProduct(id) {
    return await this.productModel.findById(id)
  }


  async getProductsByCategory(category: string, page: number, limit: number, country?: string) {
    const query: any = {
      category: category,
      visibility: true
    }

    if (country) {
      query.country = { $in: [country] }
    }

    const itemsCount = await this.productModel.countDocuments(query);

    const products = await this.productModel
      .aggregate([
        { $match: query },
        { $addFields: { randField: { $rand: {} } } },
        { $sort: { randField: 1 } },
        { $skip: (page - 1) * Number(limit) },
        { $limit: Number(limit) }
      ])
      .exec();

    return new PaginatedDto(products, page, limit, itemsCount);
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
        { $addFields: { randField: { $rand: {} } } },
        { $sort: { randField: 1 } },
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

  async getRandomProductsFromFollowedShops(userId: string, page: number, limit: number, country?: string) {
    // const idCast = new mongoose.Types.ObjectId(userId)

    const user = await this.usersService.findById(userId)
      .select('following')
      .exec()

    if (!user || !user.following.length) {
      return new PaginatedDto([], page, limit, 0)
    }

    const query: any = {
      user: { $in: [country] }
    }

    const itemsCount = await this.productModel.countDocuments(query)

    if (itemsCount === 0) {
      return new PaginatedDto([], page, limit, 0)
    }

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


  async getRandomCategories(limit: number) {
    try {
      const randomCategories = await this.productModel.aggregate([
        { $match: { category: { $exists: true, $ne: null } } },
        { $group: { _id: "$category" } },
        { $sample: { size: limit } },
        { $project: { _id: 0, category: "$_id" } }
      ]).exec();

      return randomCategories.map(item => item.category)
    } catch (error) {
      throw new BadRequestException(`Error al obtener categorías: ${error.message}`);
    }
  }


  async searchProductsbyUser(userId: string, query: string, page: number, limit: number) {
    if (query.trim() === "") {
      return new PaginatedDto([], page, limit, 0)
    }

    const objectIDUserId = new mongoose.Types.ObjectId(userId)

    const escapeRegex = (term: string) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const terms = query.split(" ").map(term => `(?=.*${escapeRegex(term)})`).join("")
    const regexQuery = new RegExp(terms, 'i')

    console.log("Regex Query:", regexQuery)

    const products = await this.productModel
      .find({
        user: objectIDUserId,
        productname: { $regex: regexQuery },
        visibility: true
      })
      .limit(limit)
      .skip((page - 1) * limit)
      .exec()

    console.log("Productos encontrados:", products)

    const itemCount = await this.productModel.countDocuments({
      user: objectIDUserId,
      productname: { $regex: regexQuery },
      visibility: true
    })

    return new PaginatedDto(products, page, limit, itemCount)
  }

  // crate a new product
  async createProduct(product: ProductDto) {
    const newProduct = new this.productModel(product)
    return newProduct.save()
  }

  // update product
  async updateProduct(id, product: ProductDto) {
    const updated = await this.productModel.findByIdAndUpdate(id, product)
    return updated.save()
  }

  // Delete Product
  async deleteProduct(id) {
    const productDeleted = await this.productModel.findByIdAndDelete(id)
    return {
      productDeleted,
      msg: 'product deleted'
    }
  }

  async addReviewToProduct(productId: string, reviewData: ReviewData) {
    const product = await this.productModel.findById(productId).exec()
    console.log({ product })

    if (!product) {
      throw new NotFoundException('Product not found')
    }

    if (!reviewData.userId || !reviewData.userName || reviewData.stars === undefined || !reviewData.review) {
      throw new BadRequestException('Invalid review data');
    }

    product.reviews.push(reviewData)
    await product.save()

    return product
  }

  ensureUniqueCountries(existingCountries: string[], newCountries: string[]) {
    const combinedCountries = [...existingCountries]
    newCountries.forEach(country => {
      if (!combinedCountries.includes(country)) {
        combinedCountries.push(country)
      }
    })

    return combinedCountries
  }

  async updateVisibility(productId: string, visibility: boolean) {
    const product = await this.productModel.findById(productId)

    if (!product) {
      throw new NotFoundException('Producto no encontrado')
    }

    product.visibility = visibility
    await product.save()

    return product
  }
}
