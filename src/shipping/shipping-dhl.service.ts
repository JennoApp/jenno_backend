import { Injectable } from "@nestjs/common";
import { HttpService } from '@nestjs/axios'

@Injectable()
export class ShippingDhlService {
  constructor(private readonly httpService: HttpService) {}

  find() {
    
  }
}
