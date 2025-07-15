import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from '@nestjs/mongoose'
import { Model } from "mongoose";
// import Stripe from 'stripe'
import { Order, type OrderStatus } from "./interfaces/Order";
import { OrderDto } from "./dto/order.dto";
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { WalletService } from "../wallet/wallet.service";


@Injectable()
export class OrdersService {
  constructor(
    @InjectModel('Order') private orderModel: Model<Order>,
    @InjectQueue('autoCompleteOrder') private readonly autoCompleteOrder: Queue,
    private readonly walletService: WalletService
  ) { }

  async getOrders() {
    return await this.orderModel.find()
  }

  async getOrder(id) {
    const order = await this.orderModel.findById(id)
    if (!order) {
      throw new NotFoundException('Order not found')
    }
    return order
  }

  async createOrder(order: OrderDto) {
    const newOrder = new this.orderModel(order)
    const savedOrder = await newOrder.save()

    // Calcula el total del precio del producto sin comision
    const productTotal = savedOrder.product.price * savedOrder.amount
    const totalAfterComission = productTotal * 0.9

    // Calcular el costo total de envio
    const totalShipping = savedOrder.product.shippingfee * savedOrder.amount

    // Actualizar el balance pendiente del wallet del vendedor
    await this.walletService.updatePendingBalance(order.sellerId, totalAfterComission + totalShipping)

    // Agregar trabajo a la cola para actualizar el estado en 3 dias
    await this.autoCompleteOrder.add(
      'completeOrder',
      { orderId: savedOrder._id },
      { delay: 3 * 24 * 60 * 60 * 1000 }
    )

    console.log(`job added to queue for orderId: ${savedOrder._id}`)

    return savedOrder
  }

  async getTotalRevenue(userId) {
    const result = await this.orderModel.aggregate([
      { $match: { sellerId: userId, status: 'completed' } },
      { $group: { _id: null, totalRevenue: { $sum: { $multiply: ['$product.price', '$amount'] } } } }
    ])

    return { totalRevenue: result.length > 0 ? result[0].totalRevenue : 0 }
  }

  async getNumberOfSales(userId) {
    const result = await this.orderModel.aggregate([
      { $match: { sellerId: userId, status: 'completed' } },
      { $count: 'numberOfSales' }
    ])

    return { numberOfSales: result.length > 0 ? result[0].numberOfSales : 0 }
  }



  async updateStatus(id: string, status: string) {
    const allowedStatuses: OrderStatus[] = [
      'pending',
      'sending',
      'completed',
      'cancelled',
      'returned',
      'refunded',
      'payment_failed',
      'on_hold'
    ];

    if (!allowedStatuses.includes(status as OrderStatus)) {
      throw new BadRequestException('Estado de orden inválido');
    }

    const order = await this.orderModel.findById(id)

    if (!order) {
      throw new NotFoundException('Order not found')
    }

    order.status = status as OrderStatus;
    order.save()

    return order
  }


  /**
  * Registra la solicitud de devolución o cambio en la orden.
  */
  async requestReturnOrExchange(
    orderId: string,
    dto: { type: 'refund' | 'exchange'; reason: string; exchangeProductId?: string }
  ) {
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException('Orden no encontrada');

    if (order.returnRequest?.status === 'pending' || order.returnRequest?.status === 'processing') {
      throw new BadRequestException('Ya existe una solicitud en curso.');
    }

    order.returnRequest = {
      type: dto.type,
      reason: dto.reason,
      requestedAt: new Date(),
      status: 'pending',
      exchangeProductId: dto.exchangeProductId || null,
      approved: false
    };
    await order.save();
    return order.returnRequest;
  }

  /**
   * El vendedor aprueba o rechaza la solicitud.
   */
  async decideReturn(
    orderId: string,
    approve: boolean
  ) {
    const order = await this.orderModel.findById(orderId);
    if (!order?.returnRequest) throw new NotFoundException('Solicitud no encontrada');

    if (order.returnRequest.status !== 'pending') {
      throw new BadRequestException('La solicitud ya fue procesada.');
    }

    order.returnRequest.status = approve ? 'approved' : 'rejected';
    order.returnRequest.approvedAt = approve ? new Date() : null;
    order.returnRequest.approved = approve;
    await order.save();
    return order.returnRequest;
  }

  /**
   * Marca la solicitud como completada (p.ej. producto devuelto o cambio enviado).
   */
  async completeReturn(orderId: string) {
    const order = await this.orderModel.findById(orderId);
    if (!order?.returnRequest || order.returnRequest.status !== 'approved') {
      throw new BadRequestException('No hay una solicitud aprobada.');
    }

    order.returnRequest.status = 'completed';
    order.returnRequest.processedAt = new Date();
    order.status = order.returnRequest.type === 'refund' ? 'refunded' : 'returned';
    await order.save();
    return order;
  }

}
