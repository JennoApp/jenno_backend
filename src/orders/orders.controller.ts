import { BadRequestException, InternalServerErrorException, NotFoundException, Put, HttpException } from '@nestjs/common'
import { Controller, Headers, Get, Post, RawBodyRequest, Req, Body, Param } from "@nestjs/common";
import { OrdersService } from './orders.service'
import { UsersService } from '../users/users.service'
import { ProductsService } from "src/products/products.service";
import { OrderDto } from "./dto/order.dto";
import mongoose from 'mongoose';



@Controller('orders')
export class OrdersController {
  constructor(
    private productsService: ProductsService,
    private ordersService: OrdersService,
    private usersService: UsersService
  ) { }

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

  @Get('/count/completed')
  countAllCompleted() {
    return this.ordersService.countAllCompletedOrders();
  }

  @Get("/gmv/total")
  getTotalGMV() {
    return this.ordersService.getTotalGMV();
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

      const saveOrder: any = await this.ordersService.createOrder(newOrder)
      console.log('Orden creada con exito:', saveOrder)

      // Validar el ObjectId
      const orderId = mongoose.Types.ObjectId.isValid(saveOrder._id)
        ? saveOrder._id
        : new mongoose.Types.ObjectId(saveOrder._id)


      // Actualizar vendedor
      // guarda Id de Orden en usuario que vende
      const userSeller: any = await this.usersService.getUser(order.sellerId)
      if (!userSeller || !Array.isArray(userSeller.orders)) {
        throw new BadRequestException('Usuario vendedor inválido');
      }
      userSeller.orders.push(orderId)

      // Crear notificacion para el vendedor
      if (!Array.isArray(userSeller.notifications)) {
        userSeller.notifications = [];
      }

      userSeller.notifications.unshift({
        type: 'order',
        message: `Tienes una nueva venta de ${order.buyerName}. Por favor, revisa la página de ventas en el administrador.`,
        orderId: orderId,
        createdAt: new Date(),
        read: false,
      });


      await userSeller.save()

      // Actualizar producto,
      // obtiene el producto,
      // resta la cantidad de la orden,
      // actualiza el status segun sea necesario.
      const product: any = await this.productsService.getProduct(order.product?._id)
      product.quantity -= order.amount

      if (product.quantity <= 0) {
        product.quantity = 0;
        product.status = 'sould_out';
      }

      await product.save()

      // Actualizar comprador
      // guarda Id de Orden en usuario que compra
      const userBuyer: any = await this.usersService.getUser(order?.buyerId)
      if (!userBuyer || !Array.isArray(userBuyer.shopping)) {
        throw new BadRequestException('Usuario comprador inválido');
      }
      userBuyer.shopping.push(orderId)

      // Crear la notificación para el comprador
      if (!Array.isArray(userBuyer.notifications)) {
        userBuyer.notifications = [];
      }
      userBuyer.notifications.unshift({
        type: 'order',
        message: `Tu compra del producto "${product?.productname}" se ha realizado con éxito.`,
        orderId: orderId,
        createdAt: new Date(),
        read: false,
      });

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


  /**
   * Cliente solicita devolución o cambio
   */
  @Put('return-request/:orderId')
  async requestReturnOrExchange(
    @Param('orderId') orderId: string,
    @Body() body: { type: 'refund' | 'exchange'; reason: string; exchangeProductId?: string }
  ) {
    const rr = await this.ordersService.requestReturnOrExchange(orderId, body);
    return { message: 'Solicitud enviada', returnRequest: rr };
  }


  /**
   * Vendedor aprueba o rechaza la solicitud
   */
  @Put('return-request/:orderId/decision')
  async decideReturn(
    @Param('orderId') orderId: string,
    @Body() body: { approve: boolean }
  ) {
    const rr = await this.ordersService.decideReturn(orderId, body.approve);
    return { message: body.approve ? 'Aprobada' : 'Rechazada', returnRequest: rr };
  }

  /**
   * Marcar la devolución/cambio como completada
   */
  @Put('return-request/:orderId/complete')
  async completeReturn(@Param('orderId') orderId: string) {
    const order = await this.ordersService.completeReturn(orderId);
    return { message: 'Solicitud completada', order };
  }
}
