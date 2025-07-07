import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { EnviaService } from './envia.service'
import { EnviaController } from './envia.controller'

@Module({
  imports: [HttpModule],
  controllers: [EnviaController],
  providers: [EnviaService]
})

export class ShippingModule {}
