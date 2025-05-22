import {z} from 'zod';

export const refreshClientTokenJWTSchema = z.object({
  refreshToken: z.string(),
});

export type RefreshClientTokenJWTEndpointParams = z.infer<
  typeof refreshClientTokenJWTSchema
>;

export interface RefreshClientTokenJWTEndpointResult {
  token: string;
  refreshToken?: string;
}
