import { OAuthProvider } from "@prisma/client";
import { TypeOf, z } from "zod";

export const beginOAuthProviderSchema = z.object({
    provider: z.nativeEnum(OAuthProvider),  
});

export type BeginOAuthProvider = TypeOf<typeof beginOAuthProviderSchema>;
