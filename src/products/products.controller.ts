import { Controller, Get, Post, Request, Body, UseGuards, Param } from '@nestjs/common'
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
  getProducts() {
    return this.productsService.getProducts()
  }

  @Get(':id')
  getProduct(@Param('id') id) {
    return this.productsService.getProduct(id)
  }

  @Get('/user/:userId')
  getProductsbyUser(@Param('userId') userId) {
    return this.productsService.getProductsbyUser(userId)
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createProduct(@Request() req, @Body() product: ProductDto) {
    const newProduct = {
      productname: product.productname,
      price: product.price,
      quantity: product.quantity,
      user: req.user.userId
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
