import { Body, Controller, Post } from "@nestjs/common";
import { PaymentsService } from './payments.service'


@Controller('payments')
export class PaymentsController {
  constructor (private paymentsService: PaymentsService) {}

  @Post('/stripe')
  createPayment(@Body() items: any[]) {
    return this.paymentsService.createSession(items)
  }
}
