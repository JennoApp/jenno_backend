import { Controller, Headers, Get, Post, RawBodyRequest, Req, Body, Param } from "@nestjs/common";
import { OrdersService } from './orders.service'
import { UsersService } from '../users/users.service'
import { ProductsService } from "src/products/products.service";
import { OrderDto } from "./dto/order.dto";


const endpointSecret = "whsec_k0B1zmtOLhlvDI7TWq48Crwty89rEIIu"

@Controller('orders')
export class OrdersController {
  constructor(    
    private productsService: ProductsService,
    private ordersService: OrdersService,
    private usersService: UsersService
  ) {}

  @Post('/webhook')
  webhook(@Req() req: RawBodyRequest<Request>, @Headers('stripe-signature') sig) {
    const body = req.rawBody
    
    return this.ordersService.webhook(body, sig, endpointSecret)
  }

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
    const numberOfSales = this.ordersService.getNumberOfSales(userId)
    return numberOfSales
  }

  @Post()
  async createOrder(@Body() order: OrderDto) {
    const newOrder = {
      product: order.product,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      buyerName: order.buyerName,
      buyerProfileImg: order.buyerProfileImg,
      amount: order.amount,
      status: order.status
    }

    const saveOrder = await this.ordersService.createOrder(newOrder)

    // guarda Id de Orden en usuario que vende
    const userSeller: any = await this.usersService.getUser(order?.sellerId) 
    userSeller.orders = [saveOrder._id, ...userSeller.orders]
    userSeller.save()

    // obtiene el producto y resta la cantidad de la orden
    const product: any = await this.productsService.getProduct(order.product?._id)
    product.quantity -= order.amount
    product.save()

    // guarda Id de Orden en usuario que compra
    const userBuyer: any = await this.usersService.getUser(order?.buyerId)
    userBuyer.shopping = [saveOrder._id, ...userBuyer.shopping]
    userBuyer.save()
  

    return {
      msg: 'Order created',
      order: saveOrder,
      sellerId: order.product?.user
    }
  }
}
