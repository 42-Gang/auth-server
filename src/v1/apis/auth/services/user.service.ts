import { GotClient } from '../../../../plugins/http.client.js';
import {
  ConflictException,
  HttpException,
  UnAuthorizedException,
} from '../../../common/exceptions/core.error.js';
import { TypeOf } from 'zod';
import { signupInputSchema } from '../schemas/signup.schema.js';

export default class UserService {
  constructor(private httpClient: GotClient) {}

  async createUser(userData: TypeOf<typeof signupInputSchema>) {
    const response = await this.httpClient.request({
      method: 'POST',
      url: 'http://localhost:8080/api/v1/users',
      body: {
        email: userData.email,
        password: userData.password,
        nickname: userData.nickname,
      },
    });
    if (response.statusCode !== 201) {
      throw new HttpException(response.statusCode, '유저 생성에 실패했습니다.');
    }
  }

  async authenticateUser(email: string, password: string): Promise<number> {
    const response = await this.httpClient.request<{ data: { userId: number } }>({
      method: 'POST',
      url: 'http://localhost:8080/api/v1/users/authenticate',
      body: { email, password },
    });
    if (response.statusCode !== 200) {
      throw new UnAuthorizedException('Invalid credentials.');
    }
    return response.body.data.userId;
  }

  async validateDuplicatedEmail(email: string) {
    const response = await this.httpClient.request({
      method: 'GET',
      url: `http://localhost:8080/api/v1/users/check-email?email=${email}`,
    });
    if (response.statusCode !== 200) {
      throw new ConflictException('Email already exists.');
    }
  }
}
