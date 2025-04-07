import { Injectable, HttpException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'


@Injectable()
export class PaypalService {
  private clientId: string
  private clientSecret: string
  private apiUrl: string

  constructor(private configService: ConfigService) {
    this.clientId = this.configService.get<string>('PAYPAL_CLIENT_ID')
    this.clientSecret = this.configService.get<string>('PAYPAL_CLIENT_SECRET')
    this.apiUrl = this.configService.get<string>('PAYPAL_API_URL')
  }

  // Funcion para obtener el token de acceso
  private async getPaypalAccessToken() {
    if (!this.clientId || !this.clientSecret || !this.apiUrl) {
      throw new Error('Faltan credenciales de PayPal o la URL de la API');
    }

    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')
    console.log('Auth:', auth)

    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');

    const response = await fetch(`${this.apiUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`
      },

      body: params.toString()
    })

    const data = await response.json()
    if (!response.ok) {
      throw new HttpException(data, response.status)
    }

    console.log('Access Token:', data.access_token)

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

  async getPaypalDetails(batchId) {
    const accessToken = await this.getPaypalAccessToken()

    const response = await fetch(`${this.apiUrl}/v1/payments/payouts/${batchId}?page=1&page_size=5&total_required=true`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },

    })

    const data = await response.json()
    if (!response.ok) {
      throw new HttpException(data, response.status)
    }

    return data
  }
}
