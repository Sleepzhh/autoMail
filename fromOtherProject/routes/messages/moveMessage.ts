import { Response, RequestHandler } from "express";
import { AuthenticatedRequest } from '../../middleware/authMiddleware.js';
import { withImapClient } from '../../utils/imapClient.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../../constants/index.js';
import { getImapCredentials, getMultipleImapCredentials } from '../../middleware/oauthRefresh.js';
import {
  BulkMoveMessagesRequest,
  BulkMoveMessagesResult,
  BulkMoveMessagesResponse,
  AccountError,
} from './types.js';

// Helper: Resolve mailbox path, handling special-use identifiers (e.g., \Trash, \Sent)
const resolveMailboxPath = async (
  client: any,
  mailboxPath: string
): Promise<string | null> => {
  if (mailboxPath.startsWith("\\")) {
    const mailboxes = await client.list();
    for (const mailbox of mailboxes) {
      if (mailbox.specialUse === mailboxPath) {
        return mailbox.path;
      }
    }
    return null;
  }
  return mailboxPath;
};

// Helper: Move messages within the same account
const moveMessagesWithinAccount = async (
  mailAccountId: number,
  credentials: { host: string; port: number; user: string; accessToken?: string; password?: string },
  sourceMailboxPath: string,
  targetMailboxPath: string,
  messageUids: number[]
): Promise<BulkMoveMessagesResult & { error?: string }> => {
  try {
    const result = await withImapClient(credentials, async (client) => {
      const resolvedSourcePath = await resolveMailboxPath(client, sourceMailboxPath);
      if (!resolvedSourcePath) {
        throw new Error(`Source mailbox not found: ${sourceMailboxPath}`);
      }

      const resolvedTargetPath = await resolveMailboxPath(client, targetMailboxPath);
      if (!resolvedTargetPath) {
        throw new Error(`Target mailbox not found: ${targetMailboxPath}`);
      }

      await client.mailboxOpen(resolvedSourcePath);

      // Process UIDs as a comma-separated range for efficiency
      const uidRange = messageUids.join(",");
      await client.messageMove(uidRange, resolvedTargetPath, { uid: true });

      return { successCount: messageUids.length, failedUids: [] as number[] };
    });

    return { mailAccountId, ...result };
  } catch (error: any) {
    console.error(`Error moving messages for account ${mailAccountId}:`, error);
    return {
      mailAccountId,
      successCount: 0,
      failedUids: messageUids,
      error: error.message || "Unknown error",
    };
  }
};

// Helper: Move messages to a different account (fetch, append, delete)
const moveMessagesCrossAccount = async (
  sourceMailAccountId: number,
  sourceCredentials: { host: string; port: number; user: string; accessToken?: string; password?: string },
  targetCredentials: { host: string; port: number; user: string; accessToken?: string; password?: string },
  sourceMailboxPath: string,
  targetMailboxPath: string,
  messageUids: number[]
): Promise<BulkMoveMessagesResult & { error?: string }> => {
  const failedUids: number[] = [];
  const successfulUids: number[] = [];

  try {
    // Fetch all messages from source account
    const messagesData = await withImapClient(sourceCredentials, async (sourceClient) => {
      const resolvedSourcePath = await resolveMailboxPath(sourceClient, sourceMailboxPath);
      if (!resolvedSourcePath) {
        throw new Error(`Source mailbox not found: ${sourceMailboxPath}`);
      }

      await sourceClient.mailboxOpen(resolvedSourcePath);

      const results: { uid: number; source: Buffer; flags: string[]; date: Date | null }[] = [];

      for (const uid of messageUids) {
        try {
          const message = await sourceClient.fetchOne(
            uid.toString(),
            {
              uid: true,
              flags: true,
              envelope: true,
              source: true,
            },
            { uid: true }
          );

          if (message && message.source) {
            results.push({
              uid,
              source: message.source,
              flags: Array.from(message.flags),
              date: message.envelope?.date || null,
            });
          } else {
            failedUids.push(uid);
          }
        } catch (err) {
          console.error(`Failed to fetch message ${uid}:`, err);
          failedUids.push(uid);
        }
      }

      return results;
    });

    // Append messages to target account
    await withImapClient(targetCredentials, async (targetClient) => {
      const resolvedTargetPath = await resolveMailboxPath(targetClient, targetMailboxPath);
      if (!resolvedTargetPath) {
        throw new Error(`Target mailbox not found: ${targetMailboxPath}`);
      }

      for (const msg of messagesData) {
        try {
          await targetClient.append(
            resolvedTargetPath,
            msg.source,
            msg.flags,
            msg.date ? new Date(msg.date) : undefined
          );
          successfulUids.push(msg.uid);
        } catch (err) {
          console.error(`Failed to append message ${msg.uid}:`, err);
          failedUids.push(msg.uid);
        }
      }
    });

    // Delete successfully moved messages from source account
    if (successfulUids.length > 0) {
      await withImapClient(sourceCredentials, async (sourceClient) => {
        const resolvedSourcePath = await resolveMailboxPath(sourceClient, sourceMailboxPath);
        if (resolvedSourcePath) {
          await sourceClient.mailboxOpen(resolvedSourcePath);
          const uidRange = successfulUids.join(",");
          await sourceClient.messageDelete(uidRange, { uid: true });
        }
      });
    }

    return {
      mailAccountId: sourceMailAccountId,
      successCount: successfulUids.length,
      failedUids,
    };
  } catch (error: any) {
    console.error(`Error moving messages cross-account from ${sourceMailAccountId}:`, error);
    return {
      mailAccountId: sourceMailAccountId,
      successCount: 0,
      failedUids: messageUids,
      error: error.message || "Unknown error",
    };
  }
};

// Move messages (supports multiple messages across multiple accounts)
export const moveMessageHandler = (async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { sourceMailboxPath, targetMailboxPath, messages, targetMailAccountId } = req.body as BulkMoveMessagesRequest;

  // Validation
  if (!sourceMailboxPath) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "sourceMailboxPath is required" });
  }

  if (!targetMailboxPath) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "targetMailboxPath is required" });
  }

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "messages array is required" });
  }

  // Validate each message entry
  for (const msg of messages) {
    if (!msg.mailAccountId || !msg.messageUids || !Array.isArray(msg.messageUids) || msg.messageUids.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: "Each message entry must have mailAccountId and non-empty messageUids array",
      });
    }
  }

  try {
    // Get credentials for all source accounts
    const mailAccountIds = messages.map((m) => m.mailAccountId);
    const accountCredentials = await getMultipleImapCredentials(mailAccountIds, req.userId!);

    // Create a map for quick lookup
    const credentialsMap = new Map(
      accountCredentials.map((ac) => [ac.mailAccountId, ac.credentials])
    );

    let results: (BulkMoveMessagesResult & { error?: string })[];

    // Case 1: Moving within the same accounts (no targetMailAccountId)
    if (!targetMailAccountId) {
      const promises = messages.map((msg) => {
        const credentials = credentialsMap.get(msg.mailAccountId)!;
        return moveMessagesWithinAccount(
          msg.mailAccountId,
          credentials,
          sourceMailboxPath,
          targetMailboxPath,
          msg.messageUids
        );
      });

      results = await Promise.all(promises);
    }
    // Case 2: Moving to a different account
    else {
      const targetCredentials = await getImapCredentials(targetMailAccountId, req.userId!);

      const promises = messages.map((msg) => {
        const sourceCredentials = credentialsMap.get(msg.mailAccountId)!;
        return moveMessagesCrossAccount(
          msg.mailAccountId,
          sourceCredentials,
          targetCredentials,
          sourceMailboxPath,
          targetMailboxPath,
          msg.messageUids
        );
      });

      results = await Promise.all(promises);
    }

    // Separate successful results from errors
    const successfulResults: BulkMoveMessagesResult[] = [];
    const errors: AccountError[] = [];

    for (const result of results) {
      if (result.error) {
        errors.push({ mailAccountId: result.mailAccountId, error: result.error });
      }
      successfulResults.push({
        mailAccountId: result.mailAccountId,
        successCount: result.successCount,
        failedUids: result.failedUids,
      });
    }

    const response: BulkMoveMessagesResponse = {
      success: errors.length === 0,
      results: successfulResults,
    };

    if (errors.length > 0) {
      response.errors = errors;
    }

    res.json(response);
  } catch (error: any) {
    console.error("Error moving messages:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: error.message || ERROR_MESSAGES.FAILED_TO_MOVE_MESSAGE,
    });
  }
}) as RequestHandler;
