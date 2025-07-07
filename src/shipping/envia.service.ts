import { Injectable } from "@nestjs/common";
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class EnviaService {
  private readonly apiBaseUrl = 'https://api-test.envia.com';
  private readonly queriesBaseUrl = 'https://queries-test.envia.com';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) { }

  async getCarriers() {
    const headers = {
      Authorization: `Bearer ${this.configService.get<string>('ENVIA_API_KEY')}`,
      'Content-Type': 'application/json',
    }

    const response$ = this.httpService.get(`${this.queriesBaseUrl}/carrier?country_code=CO`, {
      headers
    })

    const response = await firstValueFrom(response$)

    // @ts-ignore
    return response.data
  }

  async getCarrier(carrierId: number) {
    const headers = {
      Authorization: `Bearer ${this.configService.get<string>('ENVIA_API_KEY')}`,
      'Content-Type': 'application/json',
    }

    const response$ = this.httpService.get(`${this.queriesBaseUrl}/carrier/${carrierId}`, {
      headers
    })

    const response = await firstValueFrom(response$)

    // @ts-ignore
    return response.data
  }

}
