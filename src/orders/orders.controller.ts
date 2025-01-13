import { BadRequestException, InternalServerErrorException, NotFoundException, Put, HttpException } from '@nestjs/common'
import { Controller, Headers, Get, Post, RawBodyRequest, Req, Body, Param } from "@nestjs/common";
import { OrdersService } from './orders.service'
import { UsersService } from '../users/users.service'
import { ProductsService } from "src/products/products.service";
import { OrderDto } from "./dto/order.dto";


// const endpointSecret = "whsec_k0B1zmtOLhlvDI7TWq48Crwty89rEIIu"

@Controller('orders')
export class OrdersController {
  constructor(
    private productsService: ProductsService,
    private ordersService: OrdersService,
    private usersService: UsersService
  ) { }

  // @Post('/webhook')
  // webhook(@Req() req: RawBodyRequest<Request>, @Headers('stripe-signature') sig) {
  //   const body = req.rawBody

  //   return this.ordersService.webhook(body, sig, endpointSecret)
  // }

  @Get()
  getOrders() {
    return this.ordersService.getOrders()
  }

  @Get(':id')
  getOrder(@Param('id') id) {
    return this.ordersService.getOrder(id)
  }

  @Get('/totalrevenue/:userid')
  getTotalRevenue(@Param('userid') userid) {
    return this.ordersService.getTotalRevenue(userid)
  }

  @Get('numberofsales/:userId')
  getNumberOfSales(@Param('userId') userId) {
    return this.ordersService.getNumberOfSales(userId)
  }

  @Post('createOrder')
  async createOrder(@Body() order: OrderDto) {

    try {
      console.log('Datos recibidos:', order)

      if (!order.product || !order.buyerId || !order.sellerId) {
        throw new BadRequestException('Faltan datos obligatorios en la orden')

      }

      const newOrder = {
        product: order.product,
        buyerId: order.buyerId,
        sellerId: order.sellerId,
        buyerName: order.buyerName,
        buyerProfileImg: order.buyerProfileImg,
        amount: order.amount,
        status: order.status,
        selectedOptions: order.selectedOptions
      }

      const saveOrder = await this.ordersService.createOrder(newOrder)
      console.log('Orden creada con exito:', saveOrder)

      // Actualizar vendedor
      // guarda Id de Orden en usuario que vende
      const userSeller: any = await this.usersService.getUser(order.sellerId)
      if (!userSeller || !Array.isArray(userSeller.orders)) {
        throw new BadRequestException('Usuario vendedor inválido');
      }
      userSeller.orders.push(saveOrder._id)
      await userSeller.save()

      // Actualizar producto
      // obtiene el producto y resta la cantidad de la orden
      const product: any = await this.productsService.getProduct(order.product?._id)
      product.quantity -= order.amount
      await product.save()

      // Actualizar comprador
      // guarda Id de Orden en usuario que compra
      const userBuyer: any = await this.usersService.getUser(order?.buyerId)
      if (!userBuyer || !Array.isArray(userBuyer.shopping)) {
        throw new BadRequestException('Usuario comprador inválido');
      }
      userBuyer.shopping.push(saveOrder._id)
      await userBuyer.save()

      return {
        msg: 'Order created',
        order: saveOrder,
        sellerId: order.product.user
      }
    } catch (error) {
      console.error('Error en createOrder:', error);
      throw error instanceof HttpException
        ? error
        : new InternalServerErrorException('An unexpected error occurred');
    }
  }

  @Put('status/:id')
  updateOrderStatus(@Param('id') id: string, @Body('status') status: string) {
    const updateOrder = this.ordersService.updateStatus(id, status)

    if (!updateOrder) {
      throw new NotFoundException('Order not found')
    }

    return updateOrder
  }
}
