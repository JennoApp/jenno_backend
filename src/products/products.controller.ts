import { Controller, Get, Post, Request, Body, UseGuards, Param, Query } from '@nestjs/common'
import { ProductsService } from './products.service';
import { ProductDto } from './dto/product.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UsersService } from 'src/users/users.service';

@Controller('products')
export class ProductsController {
  constructor(
    private productsService: ProductsService,
    private usersService: UsersService
  ) { }

  @Get()
  getProducts(@Query('page') page: number, @Query('limit') limit: number) {
    return this.productsService.getProducts(page, limit)
  }

  @Get('/search')
  getSearchProducts(@Query('query') query: string, @Query('page') page: number, @Query('limit') limit: number) {
    return this.productsService.searchProducts(query, page, limit)
  }

  @Get(':id')
  getProduct(@Param('id') id) {
    return this.productsService.getProduct(id)
  }

  @Get('/user/:userId')
  getProductsbyUser(@Param('userId') userId, @Query('page') page: number, @Query('limit') limit: number) {
    return this.productsService.getProductsbyUser(userId, page, limit)
  }

  @Get('/user/random/:userId')
  getProductsRandombyUser(@Param('userId') userId) {
    return this.productsService.getProductsRandombyUser(userId)
  }

  @Get('/searchbyuser/:username')
  getSearchProductsbyUser(@Param('username') username, @Query('query') query: string, @Query('page') page: number, @Query('limit') limit: number) {
    return this.productsService.searchProductsbyUser(username, query, page, limit) 
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createProduct(@Request() req, @Body() product: ProductDto) {
    const newProduct = {
      productname: product.productname,
      description: product.description,
      imgs: product.imgs,
      price: product.price,
      quantity: product.quantity,
      SKU: product.SKU,
      category: product.category,
      weight: product.weight,
      /// dimensions
      length: product.dimensions?.length,
      width: product.dimensions?.width,
      height: product.dimensions?.height,
      /// 
      status: product.status,
      user: req.user.userId,
      username: req.user.username,
      ///
      options: product.options,
      especifications: product.especifications
    }

    const saveProduct = await this.productsService.createProduct(newProduct)

    const user: any = await this.usersService.getUser(req.user.userId)
    user.products = user.products.concat(saveProduct._id)
    user.save()

    return {
      msg: 'Product created & add to user products list',
      user: req.user.userId
    }
  }
}
