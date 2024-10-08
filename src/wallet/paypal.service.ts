import { Injectable, HttpException, HttpStatus } from '@nestjs/common'


@Injectable()
export class PaypalService {
  private clientId: string
  private clientSecret: string
  private apiUrl: string

  constructor() {
    this.clientId = ""
    this.clientSecret = ""
    this.apiUrl = ""
  }

  // Funcion para obtener el token de acceso
  private async getPaypalAccessToken() {
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')

    const response = await fetch(`${this.apiUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`
      },

      body: 'grant_type=client_credentials'
    })

    const data = await response.json()
    if (!response.ok) {
      throw new HttpException(data, response.status)
    }

    return data.access_token
  }

  // Funcion para realizar el payout
  async createPayout(email: string, amount: number, currency: string = 'USD') {
    const accessToken = await this.getPaypalAccessToken()

    const payoutBody = {
      sender_batch_header: {
        sender_batch_id: new Date().getTime().toString(),
        email_subject: 'You have a payout!',
      },
      items: [
        {
          recipient_type: 'EMAIL',
          amount: {
            value: amount,
            currency: currency,
          },
          receiver: email,
          note: 'Thanks for your business!',
          sender_item_id: new Date().getTime().toString(),
        }
      ]
    }

    const response = await fetch(`${this.apiUrl}/v1/payments/payouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(payoutBody)
    })

    const data = await response.json()
    if (!response.ok) {
      throw new HttpException(data, response.status)
    }

    return data
  }
}
