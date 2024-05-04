import Stripe from 'stripe'
import { Injectable } from "@nestjs/common";

// api key of stripe
const stripe = new Stripe('sk_test_51OwBS403Ci0grIYp0SpTaQX8L2K7dYLMLc6OBcVFgOMfx7848THFeaVXWI2HoaVDyjKIJHivaqLfq2SGZE1HUFhU00FqyBwntr')

@Injectable()
export class PaymentsService {
  

  async createSession(items: any[]) {
    const session = await stripe.checkout.sessions.create({
      line_items: items,
      mode: 'payment',
      success_url: 'http://localhost:5173/cart/success',
      cancel_url: 'http://localhost:5173/cart/cancelorder'
    }) 

    return session
  }

}


