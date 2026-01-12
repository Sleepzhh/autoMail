import { Response, RequestHandler } from "express";
import prisma from "../../database.js";
import { AuthenticatedRequest } from "../../middleware/authMiddleware.js";
import { HTTP_STATUS } from "../../constants/index.js";
import { isTokenExpired } from "../../services/tokenManager.js";

/**
 * GET /api/oauth/status/:mailAccountId
 * Check OAuth token status for a mail account
 */
export const statusHandler = (async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { mailAccountId } = req.params;

  const id = Number(mailAccountId);
  if (isNaN(id)) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json({ error: "Invalid mail account ID" });
  }

  try {
    const mailAccount = await prisma.mailAccount.findUnique({
      where: { id, userId: req.userId },
      select: {
        id: true,
        authType: true,
        provider: true,
        tokenExpiresAt: true,
        imapUser: true,
      },
    });

    if (!mailAccount) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json({ error: "Mail account not found" });
    }

    if (mailAccount.authType !== "oauth2") {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ error: "Not an OAuth2 mail account" });
    }

    const expired = isTokenExpired(mailAccount.tokenExpiresAt);

    res.json({
      id: mailAccount.id,
      provider: mailAccount.provider,
      imapUser: mailAccount.imapUser,
      tokenExpiresAt: mailAccount.tokenExpiresAt,
      isExpired: expired,
      isValid: !expired,
    });
  } catch (error) {
    console.error("Error checking token status:", error);
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ error: "Failed to check token status" });
  }
}) as RequestHandler;
