import { Controller, Get, Post, Delete, Request, Body, UseGuards, Param, Query } from '@nestjs/common'
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
  getProducts(@Query('page') page: number, @Query('limit') limit: number, @Query('country') country: string) {
    return this.productsService.getProducts(page, limit, country)
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
  getProductsbyUser(@Param('userId') userId, @Query('page') page: number, @Query('limit') limit: number, @Query('country') country: string) {
    return this.productsService.getProductsbyUser(userId, page, limit, country)
  }

  @Get('/admin/user/:userId')
  getProductsbyUserOrdered(@Param('userId') userId, @Query('page') page: number, @Query('limit') limit: number, @Query('country') country: string) {
    return this.productsService.getProductsbyUserOrdered(userId, page, limit, country)
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
    if (product.productId !== null || product.productId !== undefined) {
      // Actualizar producto
      const updateProduct = {
        productId: product.productId,
        productname: product.productname,
        description: product.description,
        imgs: product.imgs,
        price: product.price,
        quantity: product.quantity,
        SKU: product.SKU,
        category: product.category,
        shippingfee: product.shippingfee,
        weight: product.weight,
        /// dimensions
        dimensions: {
          length: product.dimensions.length,
          width: product.dimensions.width,
          height: product.dimensions.height,
        }, 
        /// 
        status: product.status,
        user: req.user.userId,
        username: req.user.username,
        country: product.country && Array.isArray(product.country) && product.country.length > 0
          ? product.country
          : [req.user.country],
        ///
        options: product.options,
        especifications: product.especifications
      }

      await this.productsService.updateProduct(product.productId, updateProduct)

      return {
        msg: 'Product updated',
        user: req.user.userId
      }

    } else {
      // Crear producto
      const newProduct = {
        productname: product.productname,
        description: product.description,
        imgs: product.imgs,
        price: product.price,
        quantity: product.quantity,
        SKU: product.SKU,
        category: product.category,
        shippingfee: product.shippingfee,
        weight: product.weight,
        /// dimensions
        dimensions: {},
        length: product.dimensions.length,
        width: product.dimensions.width,
        height: product.dimensions.height,
        /// 
        status: product.status,
        user: req.user.userId,
        username: req.user.username,
        country: product.country && Array.isArray(product.country) && product.country.length > 0
          ? product.country
          : [req.user.country],
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

  @Delete(':productid')
  deleteProduct(@Param('productid') productid) {
    return this.productsService.deleteProduct(productid)
  }
}
