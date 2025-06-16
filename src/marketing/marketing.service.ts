import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";


@Injectable()
export class MarketingService {
  constructor(private readonly config: ConfigService) { }


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

    return response.json(); // Aquí viene access_token y refresh_token
  }
}
