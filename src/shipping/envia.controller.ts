import { Controller, Get, Param } from '@nestjs/common';
import { EnviaService } from './envia.service';

@Controller('shipping')
export class EnviaController {
  constructor(private readonly enviaService: EnviaService) {}

  @Get('envia/carriers')
  async getCarriers() {
    return await this.enviaService.getCarriers();
  }

  @Get('envia/carrier/:carrierId')
  async getCarrier(@Param('carrierId') carrierId: number) {
    return await this.enviaService.getCarrier(carrierId);
  }
}
