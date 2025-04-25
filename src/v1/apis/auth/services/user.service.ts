import { GotClient } from '../../../../plugins/http.client.js';
import {
  ConflictException,
  HttpException,
  UnAuthorizedException,
} from '../../../common/exceptions/core.error.js';
import { TypeOf } from 'zod';
import { createUserInputSchema } from '../schemas/signup.schema.js';
import process from 'node:process';

export default class UserService {
  constructor(private httpClient: GotClient) {}

  async createUser(userData: TypeOf<typeof createUserInputSchema>) {
    const response = await this.httpClient.request<{
      message: string;
    }>({
      method: 'POST',
      url: `http://${process.env.USER_SERVER_URL}/api/v1/users`,
      headers: {
        'X-Internal': 'true',
      },
      body: {
        email: userData.email,
        password: userData.password,
        nickname: userData.nickname,
      },
    });
    if (response.statusCode !== 201) {
      throw new HttpException(response.statusCode, response.body.message);
    }
  }

  async authenticateUser(email: string, password: string): Promise<number> {
    const response = await this.httpClient.request<{ data: { userId: number } }>({
      method: 'POST',
      url: `http://${process.env.USER_SERVER_URL}/api/v1/users/authenticate`,
      headers: {
        'X-Internal': 'true',
      },
      body: { email, password },
    });
    if (response.statusCode !== 200) {
      throw new UnAuthorizedException('유효하지 않은 자격 증명입니다.');
    }
    return response.body.data.userId;
  }

  async validateDuplicatedEmail(email: string) {
    const response = await this.httpClient.request({
      method: 'GET',
      url: `http://${process.env.USER_SERVER_URL}/api/v1/users/check-email/${email}`,
      headers: {
        'X-Internal': 'true',
      },
    });
    if (response.statusCode !== 200) {
      throw new ConflictException('이미 가입한 이메일입니다.');
    }
  }
}
