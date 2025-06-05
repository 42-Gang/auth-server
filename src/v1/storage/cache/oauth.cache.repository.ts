import { FastifyRedis } from '@fastify/redis';
import { OAuthProviderType } from '../../apis/oauth/schema/oauth.schema.js';

export default class OAuthCacheRepository {
  private readonly TTL = 300;

  constructor(private readonly redisClient: FastifyRedis) {}

  private getStateKey(provider: OAuthProviderType, state: string) {
    return `oauth:${provider}:state:${state}`;
  }

  async setState(provider: OAuthProviderType, state: string): Promise<void> {
    const key = this.getStateKey(provider, state);
    await this.redisClient.set(key, 'true', 'EX', this.TTL); // 5 minutes TTL
  }

  async isExistsState(provider: OAuthProviderType, state: string): Promise<boolean> {
    const key = this.getStateKey(provider, state);
    return (await this.redisClient.exists(key)) === 1;
  }
}
