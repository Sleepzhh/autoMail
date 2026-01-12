import { apiRequest } from './client';

export interface OAuthProvider {
  id: string;
  name: string;
  scopes: string[];
}

export interface OAuthAuthorizeResponse {
  authUrl: string;
  state: string;
}

export interface OAuthTokenStatus {
  id: number;
  email: string;
  tokenExpiresAt: string | null;
  isExpired: boolean;
  isValid: boolean;
}

export async function getOAuthProviders(): Promise<{ providers: OAuthProvider[] }> {
  return apiRequest('/oauth/providers');
}

export async function startOAuthFlow(provider: string): Promise<OAuthAuthorizeResponse> {
  return apiRequest(`/oauth/${provider}/authorize`);
}

export async function refreshOAuthToken(provider: string, mailAccountId: number): Promise<{ success: boolean; expiresAt: string | null }> {
  return apiRequest(`/oauth/${provider}/refresh/${mailAccountId}`, {
    method: 'POST',
  });
}

export async function getOAuthTokenStatus(mailAccountId: number): Promise<OAuthTokenStatus> {
  return apiRequest(`/oauth/status/${mailAccountId}`);
}
