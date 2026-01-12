import { Request, Response, RequestHandler } from "express";
import { HTTP_STATUS } from "../../constants";
import { getAuthorizationUrl } from "../../services/tokenManager";
import { isValidProvider } from "../../config/oauthProviders";
import { generateStateToken } from "./stateToken";

/**
 * GET /api/oauth/:provider/authorize
 * Initiate OAuth authorization flow
 */
export const authorizeHandler = ((req: Request, res: Response) => {
  const provider = req.params.provider as string;

  if (!isValidProvider(provider)) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json({ error: "Invalid OAuth provider" });
  }

  // Generate JWT state token for CSRF protection
  const state = generateStateToken();

  // Get redirect URI from environment
  const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`;
  const redirectUri = `${backendUrl}/api/oauth/${provider}/callback`;

  try {
    const authUrl = getAuthorizationUrl(provider, redirectUri, state);
    res.json({ authUrl, state });
  } catch (error) {
    console.error("Error generating authorization URL:", error);
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ error: "Failed to generate authorization URL" });
  }
}) as RequestHandler;
