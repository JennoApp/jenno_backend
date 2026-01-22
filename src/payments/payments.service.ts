import Stripe from 'stripe';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment } from './interfaces/Payment';
import {
  MercadoPagoConfig,
  Preference,
  Payment as MpPayment,
} from 'mercadopago';
import { OrdersService } from '../orders/orders.service';
import { ConfigService } from '@nestjs/config';

// api key of stripe
const stripe = new Stripe(
  'sk_test_51OwBS403Ci0grIYp0SpTaQX8L2K7dYLMLc6OBcVFgOMfx7848THFeaVXWI2HoaVDyjKIJHivaqLfq2SGZE1HUFhU00FqyBwntr',
);

@Injectable()
export class PaymentsService {
  private mpClient: MercadoPagoConfig;
  private mpPreference: Preference;
  private mpPayment: MpPayment;

  constructor(
    @InjectModel('Payment') private paymentModel: Model<Payment>,
    private readonly ordersService: OrdersService,
    private readonly configService: ConfigService,
  ) {
    this.mpClient = new MercadoPagoConfig({
      accessToken: this.configService.get<string>(
        'PRIVATE_MERCADOPAGO_ACCESS_TOKEN',
      ),
    });
    this.mpPreference = new Preference(this.mpClient);
    this.mpPayment = new MpPayment(this.mpClient);
  }

  /* ===========================
   * STRIPE (opcional)
   * =========================== */
  async createStripeSession(items: any[]) {
    return stripe.checkout.sessions.create({
      line_items: items,
      mode: 'payment',
      success_url:
        'http://localhost:5173/cart/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:5173',
    });
  }

  /* ===========================
   * MERCADO PAGO
   * =========================== */

  /**
   * Crea snapshot Payment + preferencia MercadoPago
   */

  async createPreference(dto: any) {
    const externalReference = `mp_${Date.now()}_${Math.floor(
      Math.random() * 10000,
    )}`;

    // 1. Snapshot local
    const payment = await this.paymentModel.create({
      externalReference,
      status: 'pending',
      items: dto.items,
      buyer: dto.buyer,
    });

    console.log('MP URLS =>', {
      success: this.configService.get('MP_BACK_SUCCESS'),
      pending: this.configService.get('MP_BACK_PENDING'),
      failure: this.configService.get('MP_BACK_FAILURE'),
    });

    const successUrl = this.configService.get<string>('MP_BACK_SUCCESS');
    const pendingUrl = this.configService.get<string>('MP_BACK_PENDING');
    const failureUrl = this.configService.get<string>('MP_BACK_FAILURE');

    if (!successUrl || !pendingUrl || !failureUrl) {
      throw new Error('MercadoPago back_urls no están configuradas');
    }

    // 2. Preferencia MercadoPago
    const preference = await this.mpPreference.create({
      body: {
        external_reference: externalReference,
        items: dto.items.map((it) => ({
          id: it.id,
          title: it.title,
          description: it.description ?? it.title,
          quantity: Number(it.quantity ?? 1),
          currency_id: 'COP',
          unit_price: Math.round(Number(it.unit_price)),
        })),
        payer: {
          email: dto.buyer?.email,
        },
        back_urls: {
          success: `${successUrl}?external=${externalReference}`,
          pending: `${pendingUrl}?external=${externalReference}`,
          failure: `${failureUrl}?external=${externalReference}`,
        },
        auto_return: 'approved',
      },
    });

    // 3. Guardar datos MP
    payment.preferenceId = String(preference.id);
    payment.initPoint = preference.init_point;
    await payment.save();

    return {
      paymentId: payment._id.toString(),
      externalReference,
      preferenceId: payment.preferenceId,
      initPoint: payment.initPoint,
    };
  }

  /**
   * Webhook MercadoPago
   */
  async handleNotification(body: any) {
    const mpPaymentId = body?.data?.id || body?.id;
    if (!mpPaymentId) return null;

    // 1. Consultar pago real a MP
    const mpPayment = await this.mpPayment.get({
      id: mpPaymentId,
    });

    const externalReference = mpPayment.external_reference;
    if (!externalReference) return null;

    // 2. Buscar snapshot local
    const payment = await this.paymentModel.findOne({ externalReference });
    if (!payment) return null;

    payment.rawResponse = mpPayment;
    payment.providerPaymentId = String(mpPayment.id);

    // 3. Mapear estado
    switch (mpPayment.status) {
      case 'approved':
        payment.status = 'approved';
        break;
      case 'pending':
      case 'in_process':
        payment.status = 'pending';
        break;
      case 'cancelled':
      case 'rejected':
      case 'refunded':
        payment.status = 'rejected';
        break;
      default:
        payment.status = mpPayment.status as any;
    }

    // 4. Crear órdenes si se aprueba
    if (
      payment.status === 'approved' &&
      (!payment.orderIds || payment.orderIds.length === 0)
    ) {
      const orderIds: string[] = [];

      for (const it of payment.items) {
        const order = await this.ordersService.createOrder({
          product: {
            _id: it.id,
            productname: it.title,
            price: it.unit_price,
            imgs: it.imgs ?? [],
            user: it.sellerId ?? null,
          },
          buyerId: payment.buyer?._id ?? null,
          sellerId: it.sellerId ?? null,
          buyerName: payment.buyer?.username ?? '',
          buyerProfileImg: payment.buyer?.profileImg ?? '',
          amount: it.quantity ?? 1,
          status: 'pending',
          selectedOptions:
            it.selectedOptions ?? it.selectedVariant?.options ?? [],
        });

        orderIds.push(String(order._id));
      }

      payment.orderIds = orderIds;
    }

    await payment.save();
    return payment;
  }

  /**
   * Consultar estado
   */
  async getStatus(idOrExternal: string) {
    return (
      (await this.paymentModel.findById(idOrExternal).lean()) ??
      (await this.paymentModel
        .findOne({ externalReference: idOrExternal })
        .lean())
    );
  }
}
