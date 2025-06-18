import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UsersService } from "../users/users.service";

@Injectable()
export class MarketingService {
  constructor(
    private readonly config: ConfigService,
    readonly usersService: UsersService,
  ) { }

  getFrontendRedirectUrl(): string {
    return this.config.get('FRONTEND_URL') + '/admin/marketing/integrations';
  }

  async getMarkteingGoogleStatus(userId: string) {
    const user = await this.usersService.findById(userId)
    const googleConnected = !!user?.marketing?.google?.refreshToken;
    return {
      googleConnected,
      storeId: user._id
    }
  }


  getGoogleOAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.get('GOOGLE_CLIENT_ID'),
      redirect_uri: this.config.get('GOOGLE_REDIRECT_URI'),
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/adwords',
      access_type: 'offline',
      prompt: 'consent',
    })

    return `https://accounts.google.com/o/oauth2/auth?${params.toString()}`;
  }


  async exchangeCodeForToken(code: string) {
    const response = await fetch(this.config.get('GOOGLE_TOKEN_URI'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.config.get('GOOGLE_CLIENT_ID'),
        client_secret: this.config.get('GOOGLE_CLIENT_SECRET'),
        redirect_uri: this.config.get('GOOGLE_REDIRECT_URI'),
        grant_type: 'authorization_code',
      }),
    });

    return response.json(); // { access_token, refresh_token, expires_in, token_type… }
  }

  async saveTokensForStore(storeId: string, tokens: any) {
    await this.usersService.updateGoogleMarketingTokens(storeId, {
      clientId: this.config.get('GOOGLE_CLIENT_ID'),
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
    });
  }

}
