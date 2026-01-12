import { Response, RequestHandler } from "express";
import { AuthenticatedRequest } from "../../middleware/authMiddleware.js";
import { HTTP_STATUS } from "../../constants/index.js";
import { getAuthorizationUrl } from "../../services/tokenManager.js";
import { isValidProvider } from "../../config/oauthProviders.js";
import { generateStateToken } from "./stateToken.js";

/**
 * GET /api/oauth/:provider/authorize
 * Initiate OAuth authorization flow
 */
export const authorizeHandler = (async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { provider } = req.params;

  if (!isValidProvider(provider)) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json({ error: "Invalid OAuth provider" });
  }

  // Generate JWT state token for CSRF protection
  const state = generateStateToken(req.userId!);

  // Get redirect URI from environment or use default
  const backendUrl =
    process.env.BETTER_AUTH_URL ||
    `http://localhost:${process.env.PORT || 3000}`;
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
