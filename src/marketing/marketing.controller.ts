import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { MarketingService } from './marketing.service';
import type { Response } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('marketing')
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get('googleauthurl')
  getAuthUrl(@Query('storeId') storeId: string) {
    return { url: this.marketingService.getGoogleOAuthUrl(storeId) };
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

  @UseGuards(JwtAuthGuard)
  @Get('googlestatus')
  async getGoogleStatus(@Req() req: any) {
    const userId = req.user.userId
    return this.marketingService.getMarkteingGoogleStatus(userId);
  }

  @Get('metaAccount')
  getMetaAdAccountInfo() {
      return this.marketingService.getAdAccountInfo()
  }

  @Get('metaCampaigns')
  getMetaCampaigns() {
      return this.marketingService.getCampaigns()
  }
}
