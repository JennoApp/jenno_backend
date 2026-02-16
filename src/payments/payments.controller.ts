import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  /* =========================
   * STRIPE (opcional)
   * ========================= */
  @Post('/stripe')
  createStripeSession(@Body() items: any[]) {
    return this.paymentsService.createStripeSession(items);
  }

  /* =========================
   * MERCADO PAGO
   * ========================= */

  @Post('mercadopago/preference')
  createMercadoPagoPreference(@Body() body: any) {
    return this.paymentsService.createPreference(body);
  }

  /**
   * WEBHOOK MP
   */
  @Post('mercadopago/webhook')
  @HttpCode(200)
  async handleMercadoPagoWebhook(@Req() req: any) {
    console.log('Webhook recibido:', req.body);

    // Procesar async sin bloquear respuesta
    this.paymentsService
      .handleNotification(req.body)
      .catch((err) => console.error('Webhook error:', err));

    return { received: true };
  }

  /**
   * STATUS CHECK
   */
  @Get('status/:idOrExternal')
  getPaymentStatus(@Param('idOrExternal') idOrExternal: string) {
    return this.paymentsService.getStatus(idOrExternal);
  }
}
