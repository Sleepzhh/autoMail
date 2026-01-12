import { Router } from "express";
import { listProvidersHandler } from "./listProviders";
import { authorizeHandler } from "./authorize";
import { callbackHandler } from "./callback";
import { refreshHandler } from "./refresh";
import { statusHandler } from "./status";

const router = Router();

// List available OAuth providers
router.get("/providers", listProvidersHandler);

// Initiate OAuth authorization flow
router.get("/:provider/authorize", authorizeHandler);

// Manually refresh access token
router.post("/:provider/refresh/:mailAccountId", refreshHandler);

// Check OAuth token status
router.get("/status/:mailAccountId", statusHandler);

export default router;

// Public router for OAuth callback (called by OAuth provider, not frontend)
export const oauthPublicRouter = Router();
oauthPublicRouter.get("/:provider/callback", callbackHandler);
