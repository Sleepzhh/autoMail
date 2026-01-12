import { Request, Response, RequestHandler } from "express";
import { OAUTH_PROVIDERS } from "../../config/oauthProviders";

/**
 * GET /api/oauth/providers
 * List available OAuth providers
 */
export const listProvidersHandler = ((req: Request, res: Response) => {
  const providers = Object.entries(OAUTH_PROVIDERS).map(([key, config]) => ({
    id: key,
    name: config.name,
    scopes: config.scopes,
  }));

  res.json({ providers });
}) as RequestHandler;
