import { Injectable } from "@nestjs/common";
import Stripe from 'stripe'

// api key of stripe
const stripe = new Stripe('sk_test_51OwBS403Ci0grIYp0SpTaQX8L2K7dYLMLc6OBcVFgOMfx7848THFeaVXWI2HoaVDyjKIJHivaqLfq2SGZE1HUFhU00FqyBwntr')


@Injectable()
export class OrdersService {
  constructor() {}

  webhook(body, signature, endpointSecret) {
    let event

    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
    } catch (error) {
      console.log(error)
    }
    
    console.log(event)
  }

}
