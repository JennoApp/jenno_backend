import { Body, Controller, Get, HttpCode, Param, Post, Req } from '@nestjs/common';
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

  /**
   * Crear preferencia MercadoPago
   * Frontend llama este endpoint
   */
  @Post('mercadopago/preference')
  createMercadoPagoPreference(@Body() body: any) {
    return this.paymentsService.createPreference(body);
  }

  /**
   * Webhook MercadoPago
   * MP llama este endpoint automáticamente
   */
  @Post('mercadopago/webhook')
  @HttpCode(200)
  handleMercadoPagoWebhook(@Req() req: any) {
    return this.paymentsService.handleNotification(req.body);
  }

  /**
   * Consultar estado de un pago
   * (por paymentId o externalReference)
   */
  @Get(':idOrExternal')
  getPaymentStatus(@Param('idOrExternal') idOrExternal: string) {
    return this.paymentsService.getStatus(idOrExternal);
  }
}
