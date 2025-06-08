import { TypeOf, z } from 'zod';

export const oauthProviderSchema = z.enum(['GOOGLE', 'KAKAO', 'NAVER']);
export type OAuthProviderType = TypeOf<typeof oauthProviderSchema>;

export const oauthProviderParamSchema = z.object({
  provider: z.preprocess(
    (val) => (typeof val === 'string' ? val.toUpperCase() : val),
    oauthProviderSchema,
  ),
});

export const OAuthUserInfoSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
});

export type OAuthUserInfoType = TypeOf<typeof OAuthUserInfoSchema>;

export const oauthUserInputSchema = z.object({
  email: z.string(),
  nickname: z.string(),
});

export type OAuthUserInputType = TypeOf<typeof oauthUserInputSchema>;
