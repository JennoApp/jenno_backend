import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UsersService } from "../users/users.service";
import { GoogleAdsApi } from 'google-ads-api'
import axios from "axios";

@Injectable()
export class MarketingService {
  private googleAdsClient: GoogleAdsApi;
  private readonly metaBaseUrl: string;
  private readonly MetaAccessToken: string;
  private readonly MetaAdAccountId: string;

  constructor(
    private readonly config: ConfigService,
    readonly usersService: UsersService,
  ) {
    this.googleAdsClient = new GoogleAdsApi({
      client_id: this.config.get('GOOGLE_CLIENT_ID'),
      client_secret: this.config.get('GOOGLE_CLIENT_SECRET'),
      developer_token: this.config.get('GOOGLE_DEVELOPER_TOKEN'),
    })

    const MetaGraphVersion = this.config.get('META_GRAPH_VERSION');
    this.MetaAccessToken = this.config.get('META_ACCESS_TOKEN');
    this.MetaAdAccountId = this.config.get('META_AD_ACCOUNT_ID');
    this.metaBaseUrl = `https://graph.facebook.com/${MetaGraphVersion}`;
  }

  getFrontendRedirectUrl(): string {
    return this.config.get('FRONTEND_URL') + '/admin/marketing/integrations';
  }

  async getMarkteingGoogleStatus(userId: string) {
    const user = await this.usersService.findById(userId)
    // @ts-ignore
    const googleConnected = !!user?.marketing?.google?.refreshToken;
    return {
      googleConnected,
      storeId: user._id
    }
  }


  getGoogleOAuthUrl(storeId: string): string {
    const params = new URLSearchParams({
      client_id: this.config.get('GOOGLE_CLIENT_ID'),
      redirect_uri: this.config.get('GOOGLE_REDIRECT_URI'),
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/adwords',
      access_type: 'offline',
      prompt: 'consent',
      state: storeId,
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

  async listGoogleAdsAccountsForStore(userId: string) {
    const user = await this.usersService.findById(userId);

    // @ts-ignore
    if (!user?.marketing?.google?.refreshToken) {
      throw new Error('Usuario no tiene refreshToken configurado');
    }

    const customer = this.googleAdsClient.Customer({
      customer_id: this.config.get('GOOGLE_MANAGER_ID'), // MCC ID
      // @ts-ignore
      refresh_token: user.marketing.google.refreshToken,
    });

    // Consulta básica como prueba
    const query = `
      SELECT customer.id, customer.descriptive_name
      FROM customer
      LIMIT 10
    `;

    const accounts = await customer.query(query);
    return accounts;
  }


  /// META ADS ///

  async getAdAccountInfo() {
      try {
          const url = `${this.metaBaseUrl}/${this.MetaAdAccountId}`;
          const params = {
              fields: 'id,name,account_status,currency,timezone_name',
              access_token: this.MetaAccessToken,
          }

          const { data } = await axios.get(url, { params });
          return data;

      } catch (error) {
          throw new HttpException(
              error.message,
              HttpStatus.BAD_REQUEST
          );
      }
  }


  async getCampaigns() {
      try {
        const url = `${this.metaBaseUrl}/${this.MetaAdAccountId}/campaigns`;
        const params = {
          fields: 'id,name,status,effective_status',
          access_token: this.MetaAccessToken,
        };

        const { data } = await axios.get(url, { params });
        return data;
      } catch (error) {
        throw new HttpException(
          error.response?.data || 'Error fetching campaigns',
          HttpStatus.BAD_REQUEST,
        );
      }
    }
}
