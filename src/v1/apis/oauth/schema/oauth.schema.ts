import { TypeOf, z } from 'zod';

export const oauthProviderSchema = z.enum(['google', 'kakao', 'naver']);
export type OAuthProviderType = TypeOf<typeof oauthProviderSchema>;

export const oauthProviderParamSchema = z.object({
  provider: oauthProviderSchema,
});

export const OAuthUserInfoSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
}); //google 한정

export type OAuthUserInfoType = TypeOf<typeof OAuthUserInfoSchema>;

export const oauthUserInputSchema = z.object({
  email: z.string(),
  nickname: z.string(),
});

export type OAuthUserInputType = TypeOf<typeof oauthUserInputSchema>;
