import { Controller, Get, Query, Res } from '@nestjs/common';
import { MarketingService } from './marketing.service';
import type { Response } from 'express';

@Controller('marketing')
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get('google-auth-url')
  getAuthUrl() {
    return { url: this.marketingService.getGoogleOAuthUrl() };
  }


  @Get('googlecallback')
  async handleGoogleCallback(
    @Query('code') code: string,
    @Query('state') storeId: string,
    @Res() res: Response
  ) {
    const tokens = await this.marketingService.exchangeCodeForToken(code);

    // Guarda los tokens en el usuario/tienda
    await this.marketingService.saveTokensForStore(storeId, tokens);

    // Redirige de nuevo al frontend
    return res.redirect(this.marketingService.getFrontendRedirectUrl());
  }
}
