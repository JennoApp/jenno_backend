import { Controller, Headers, Get, Post, RawBodyRequest, Req, Body } from "@nestjs/common";
import { OrdersService } from './orders.service'
import { UsersService } from '../users/users.service'
import { OrderDto } from "./dto/order.dto";


const endpointSecret = "whsec_k0B1zmtOLhlvDI7TWq48Crwty89rEIIu"

@Controller('orders')
export class OrdersController {
  constructor(
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

  @Post()
  async createOrder(@Body() order: OrderDto) {
    const newOrder = {
      product: order.product,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      status: order.status
    }

    const saveOrder = await this.ordersService.createOrder(newOrder)
    const user: any = await this.usersService.getUser(order?.product?.user) 
    user.orders = user?.orders.concat(saveOrder._id)
    user.save()

    return {
      msg: 'Order created',
      order: saveOrder,
      sellerId: order.product?.user
    }
  }
}
