import { Injectable } from "@nestjs/common";
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

  async createOrder(order: OrderDto) {
    const newOrder = new this.orderModel(order)
    return await newOrder.save()
  }
}
