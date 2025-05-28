import { OAuthProvider } from "@prisma/client";
import { createResponseSchema } from "src/v1/common/schema/core.schema.js";
import { TypeOf, z } from "zod";

export const oAuthProviderSchema = z.object({
    provider: z.nativeEnum(OAuthProvider),  
});

export type BeginOAuthProvider = TypeOf<typeof oAuthProviderSchema>;

export const handleOAuthRequestSchema = z.union([
    // 정상
    z.object({ code: z.string(), state: z.string() }),
    // 에러
    z.object({ error: z.string(), state: z.string() }),
]);

export const handleOAuthResponseSchema = createResponseSchema(
    z.object({
        accessToken: z.string()
    }),
);

export type HandleOAuthRequest = TypeOf<typeof handleOAuthRequestSchema>;

export const googleUserInfoSchema = z.object({
    id: z.string(),
    email: z.string(),
});

export type GoogleUserInfo = TypeOf<typeof googleUserInfoSchema>;