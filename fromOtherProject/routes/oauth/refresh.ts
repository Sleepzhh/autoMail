import { Response, RequestHandler } from "express";
import prisma from "../../database.js";
import { AuthenticatedRequest } from "../../middleware/authMiddleware.js";
import { HTTP_STATUS } from "../../constants/index.js";
import { getValidAccessToken } from "../../services/tokenManager.js";
import { isValidProvider } from "../../config/oauthProviders.js";

/**
 * POST /api/oauth/:provider/refresh/:mailAccountId
 * Manually refresh access token for a mail account
 */
export const refreshHandler = (async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { provider, mailAccountId } = req.params;

  if (!isValidProvider(provider)) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json({ error: "Invalid OAuth provider" });
  }

  const id = Number(mailAccountId);
  if (isNaN(id)) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json({ error: "Invalid mail account ID" });
  }

  try {
    // Refresh token if needed
    await getValidAccessToken(id);

    // Get updated account info
    const mailAccount = await prisma.mailAccount.findUnique({
      where: { id, userId: req.userId },
      select: {
        id: true,
        tokenExpiresAt: true,
      },
    });

    res.json({
      success: true,
      expiresAt: mailAccount?.tokenExpiresAt,
    });
  } catch (error) {
    console.error("Error refreshing token:", error);
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ error: "Failed to refresh access token" });
  }
}) as RequestHandler;
