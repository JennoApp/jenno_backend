import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from '@nestjs/mongoose'
import { Model } from "mongoose";
// import Stripe from 'stripe'
import { Order } from "./interfaces/Order";
import { OrderDto } from "./dto/order.dto";
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { WalletService } from "../wallet/wallet.service";

// api key of stripe
// const stripe = new Stripe('sk_test_51OwBS403Ci0grIYp0SpTaQX8L2K7dYLMLc6OBcVFgOMfx7848THFeaVXWI2HoaVDyjKIJHivaqLfq2SGZE1HUFhU00FqyBwntr')


@Injectable()
export class OrdersService {
  constructor(
    @InjectModel('Order') private orderModel: Model<Order>,
    @InjectQueue('autoCompleteOrder') private readonly autoCompleteOrder: Queue,
    private readonly walletService: WalletService
  ) { }

  // webhook(body, signature, endpointSecret) {
  //   let event

  //   try {
  //     event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
  //   } catch (error) {
  //     console.log(error)
  //   }

  //   console.log(event)
  // }

  async getOrders() {
    return await this.orderModel.find()
  }

  async getOrder(id) {
    const order = await this.orderModel.findById(id)
    if(!order) {
      throw new NotFoundException('Order not found')
    }
    return order
  }

  async createOrder(order: OrderDto) {
    const newOrder = new this.orderModel(order)
    const savedOrder =  await newOrder.save()

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
      { delay: 60 * 3000 }
    )

    console.log(`job added to queue for orderId: ${savedOrder._id}`)

    return savedOrder
  }

  async getTotalRevenue(userId) {
    const result = await this.orderModel.aggregate([
      { $match: { sellerId: userId, status: 'completed'} },
      { $group: {_id: null, totalRevenue: { $sum: { $multiply: ['$product.price', '$amount'] } }}}
    ])

    return {totalRevenue: result.length > 0 ? result[0].totalRevenue : 0}
  }

  async getNumberOfSales(userId) {
    const result = await this.orderModel.aggregate([
      { $match: { sellerId: userId, status: 'completed' } },
      { $count: 'numberOfSales' }
    ])

    return { numberOfSales: result.length > 0 ? result[0].numberOfSales : 0}
  }

  async updateStatus(id: string, status: string) {
    const order = await this.orderModel.findById(id)

    if (!order) {
      throw new NotFoundException('Order not found')
    }

    order.status = status
    order.save()

    return order
  }
}
