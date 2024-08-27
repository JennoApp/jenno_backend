import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from '@nestjs/mongoose'
import { Model } from "mongoose";
import Stripe from 'stripe'
import { Order } from "./interfaces/Order";
import { OrderDto } from "./dto/order.dto";

// api key of stripe
const stripe = new Stripe('sk_test_51OwBS403Ci0grIYp0SpTaQX8L2K7dYLMLc6OBcVFgOMfx7848THFeaVXWI2HoaVDyjKIJHivaqLfq2SGZE1HUFhU00FqyBwntr')


@Injectable()
export class OrdersService {
  constructor(
    @InjectModel('Order') private orderModel: Model<Order>
  ) { }

  webhook(body, signature, endpointSecret) {
    let event

    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
    } catch (error) {
      console.log(error)
    }

    console.log(event)
  }

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
    return await newOrder.save()
  }

  async getTotalRevenue(userId) {
    const result = await this.orderModel.aggregate([
      { $match: { sellerId: userId, status: 'completed'} },
      { $group: {_id: null, totalRevenue: { $sum: { $multiply: ['$product.price', '$amount'] } }}}
    ])

    console.log({result})

    return result.length > 0 ? result[0].totalRevenue : 0
  }

  async getNumberOfSales(userId) {
    const result = await this.orderModel.aggregate([
      { $match: { sellerId: userId, status: 'completed' } },
      { $count: 'numberOfSales' }
    ])

    return result.length > 0 ? result[0].numberOfSales : 0
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
