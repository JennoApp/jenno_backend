import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { ShippingDhlService } from './shipping-dhl.service'

@Module({
  imports: [HttpModule],
  providers: [ShippingDhlService]
})

export class ShippingModule {}
