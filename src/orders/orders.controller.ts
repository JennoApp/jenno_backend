import { Controller, Headers, Post, RawBodyRequest, Req } from "@nestjs/common";
import { OrdersService } from './orders.service'


const endpointSecret = "whsec_k0B1zmtOLhlvDI7TWq48Crwty89rEIIu"

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post('/webhook')
  webhook(@Req() req: RawBodyRequest<Request>, @Headers('stripe-signature') sig) {
    const body = req.rawBody
    
    return this.ordersService.webhook(body, sig, endpointSecret)
  }
}
