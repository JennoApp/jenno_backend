import { Controller, Get, Query } from '@nestjs/common';
import { MarketingService } from './marketing.service';

@Controller('marketing')
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get('google-auth-url')
  getAuthUrl() {
    return { url: this.marketingService.getGoogleOAuthUrl() };
  }

  @Get('google-callback')
  async handleGoogleCallback(@Query('code') code: string) {
    const tokens = await this.marketingService.exchangeCodeForToken(code);
    return tokens;
  }
}
