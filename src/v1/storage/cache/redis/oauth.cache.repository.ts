import { UserOAuth } from "@prisma/client";
import { OAuthCacheInterface } from "../interfaces/oauth.cache.interface.js";
import { FastifyRedis } from "@fastify/redis";
import { BeginOAuthProvider } from "src/v1/apis/oauth/schemas/beginOAuth.schema.js";

export default class OAuthCacheRepository implements OAuthCacheInterface {
    constructor(private readonly redisClient: FastifyRedis) {}

    async get(key: string): Promise<UserOAuth | null> {
        const data = await this.redisClient.get(key);
        if (!data) return null;
        return JSON.parse(data);
    }

    async set(key: string, value: UserOAuth, ttlSeconds?: number): Promise<void> {
        await this.redisClient.set(key, JSON.stringify(value));
    }

    async delete(key: string): Promise<void> {
        await this.redisClient.del(key);
    }

    async exists(key: string): Promise<boolean> {
        return (await this.redisClient.exists(key)) === 1;
    }

    async setState(key: string, value: BeginOAuthProvider, ttlSeconds?: number): Promise<void> {
        await this.redisClient.set(key, JSON.stringify(value));
    }
}
