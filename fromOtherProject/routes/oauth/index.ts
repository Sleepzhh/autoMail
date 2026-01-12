import { Router, RequestHandler } from "express";
import { authenticateToken } from "../../middleware/authMiddleware.js";
import { listProvidersHandler } from "./listProviders.js";
import { authorizeHandler } from "./authorize.js";
import { callbackHandler } from "./callback.js";
import { refreshHandler } from "./refresh.js";
import { statusHandler } from "./status.js";

const router = Router();
const authMiddleware = authenticateToken as RequestHandler;

// List available OAuth providers
router.get("/providers", listProvidersHandler);

// Initiate OAuth authorization flow
router.get("/:provider/authorize", authMiddleware, authorizeHandler);

// Handle OAuth callback
router.get("/:provider/callback", callbackHandler);

// Manually refresh access token
router.post("/:provider/refresh/:mailAccountId", authMiddleware, refreshHandler);

// Check OAuth token status
router.get("/status/:mailAccountId", authMiddleware, statusHandler);

export default router;
