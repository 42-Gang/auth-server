import { GotClient } from '../../../../plugins/http.client.js';
import { OAuthUserInputType } from '../oauth.schema.js';
import { HttpException } from '../../../common/exceptions/core.error.js';

export default class OAuthUserService {
  constructor(private readonly httpClient: GotClient) {}

  async createOAuthUser(userData: OAuthUserInputType) {
    const response = await this.httpClient.request<{
      message: string;
      data: {
        userId: number;
      };
    }>({
      method: 'POST',
      url: `http://${process.env.USER_SERVER_URL}/api/v1/users/oauth`,
      headers: {
        'X-Internal': 'true',
      },
      body: {
        email: userData.email,
        nickname: userData.nickname,
      },
    });

    if (response.statusCode !== 201) {
      throw new HttpException(response.statusCode, response.body.message);
    }

    return response.body.data;
  }

  async getOAuthUserByEmail(userData: OAuthUserInputType) {
    const response = await this.httpClient.request<{
      message: string;
      data: {
        userId?: number;
        exists: boolean;
      };
    }>({
      method: 'POST',
      url: `http://${process.env.USER_SERVER_URL}/api/v1/users/oauth/existence`,
      headers: {
        'X-Internal': 'true',
      },
      body: {
        email: userData.email,
      },
    });

    if (response.statusCode !== 200) {
      throw new HttpException(response.statusCode, response.body.message);
    }

    return response.body.data;
  }
}
