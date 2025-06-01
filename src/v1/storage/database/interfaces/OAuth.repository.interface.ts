import { OAuthProvider, Prisma, UserOAuth } from "@prisma/client";
import { BaseRepositoryInterface } from "./base.repository.interface.js";

export interface OAuthRepositoryInterface 
    extends BaseRepositoryInterface<UserOAuth, Prisma.UserOAuthCreateInput, Prisma.UserOAuthUpdateInput> {
          findByProviderAndProviderId(
            provider: OAuthProvider,
            providerUserId: string
          ): Promise<UserOAuth | null>;
    }