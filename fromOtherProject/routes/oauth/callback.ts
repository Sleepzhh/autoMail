import { RequestHandler } from "express";
import prisma from "../../database.js";
import { HTTP_STATUS } from "../../constants/index.js";
import { encryptPassword } from "../../utils/crypto.js";
import {
  exchangeCodeForTokens,
  getUserInfo,
} from "../../services/tokenManager.js";
import { isValidProvider, getProvider } from "../../config/oauthProviders.js";
import { verifyStateToken } from "./stateToken.js";

/**
 * GET /api/oauth/:provider/callback
 * Handle OAuth callback and exchange code for tokens
 */
export const callbackHandler = (async (req, res) => {
  const { provider } = req.params;
  const { code, state, error, error_description } = req.query;

  // Handle OAuth errors
  if (error) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    return res.redirect(
      `${frontendUrl}/oauth/callback?error=${error}&description=${
        error_description || ""
      }`
    );
  }

  if (!isValidProvider(provider)) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json({ error: "Invalid OAuth provider" });
  }

  if (
    !code ||
    !state ||
    typeof code !== "string" ||
    typeof state !== "string"
  ) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json({ error: "Missing authorization code or state" });
  }

  // Verify JWT state token
  const stateData = verifyStateToken(state);
  if (!stateData) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json({ error: "Invalid or expired state token" });
  }

  const backendUrl =
    process.env.BETTER_AUTH_URL ||
    `http://localhost:${process.env.PORT || 3000}`;
  const redirectUri = `${backendUrl}/api/oauth/${provider}/callback`;

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(provider, code, redirectUri);

    // Validate that required scopes were granted
    const grantedScopes = tokens.scope?.split(" ") || [];

    // Check for the mail/IMAP scope based on provider
    const requiredMailScope = provider === "google"
      ? "https://mail.google.com/"
      : "https://outlook.office.com/IMAP.AccessAsUser.All";

    if (!grantedScopes.includes(requiredMailScope)) {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      return res.redirect(
        `${frontendUrl}/oauth/callback?error=missing_scope&description=Mail access permission was not granted. Please try again and allow mail access.`
      );
    }

    // Get provider config for IMAP/SMTP settings
    const providerConfig = getProvider(provider)!;

    // Get user info - try ID token first (for Microsoft), then fallback to API
    let userEmail: string;
    let userName: string | undefined;

    if (provider === "microsoft" && tokens.idTokenClaims) {
      // Extract email from ID token claims for Microsoft
      userEmail =
        tokens.idTokenClaims.email ||
        tokens.idTokenClaims.preferred_username ||
        tokens.idTokenClaims.upn;
      userName = tokens.idTokenClaims.name;

      if (!userEmail) {
        throw new Error("No email found in Microsoft ID token");
      }
    } else {
      // For Google or if no ID token, fetch from API
      const userInfo = await getUserInfo(provider, tokens.accessToken);
      userEmail = userInfo.email;
      userName = userInfo.name;
    }

    // Create mail account
    const mailAccount = await prisma.mailAccount.create({
      data: {
        name: `${providerConfig.name} (${userEmail})`,
        displayName: userName || userEmail,
        authType: "oauth2",
        provider: provider,
        imapHost: providerConfig.imap.host,
        imapPort: providerConfig.imap.port,
        imapUser: userEmail,
        smtpHost: providerConfig.smtp.host,
        smtpPort: providerConfig.smtp.port,
        smtpUser: userEmail,
        accessToken: encryptPassword(tokens.accessToken),
        refreshToken: encryptPassword(tokens.refreshToken),
        tokenExpiresAt: tokens.expiresAt,
        scope: tokens.scope,
        userId: stateData.userId,
      },
    });

    // Redirect to frontend with success
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(
      `${frontendUrl}/oauth/callback?success=true&provider=${provider}&accountId=${mailAccount.id}`
    );
  } catch (error) {
    console.error("Error in OAuth callback:", error);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(
      `${frontendUrl}/oauth/callback?error=exchange_failed&description=Failed to exchange authorization code`
    );
  }
}) as RequestHandler;
