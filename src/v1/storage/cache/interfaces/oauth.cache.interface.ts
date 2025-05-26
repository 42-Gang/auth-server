import { UserOAuth } from "@prisma/client";
import { BaseCacheInterface } from "./base.cache.interface.js";
import { BeginOAuthProvider } from "src/v1/apis/oauth/schemas/beginOAuth.schema.js";

export interface OAuthCacheInterface extends BaseCacheInterface<UserOAuth> {
    setState(key: string, value: BeginOAuthProvider, ttlSeconds?: number): Promise<void>;
}