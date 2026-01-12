import db, { AutomationFlow, MailAccount, FlowWithAccounts } from '../utils/db';
import { withImapClient } from '../utils/imapClient';
import { decryptPassword } from '../utils/crypto';
import { getValidAccessToken } from './tokenManager';

// Helper: Resolve mailbox path, handling special-use identifiers (e.g., \Trash, \Sent)
async function resolveMailboxPath(client: any, mailboxPath: string): Promise<string | null> {
  if (mailboxPath.startsWith('\\')) {
    const mailboxes = await client.list();
    for (const mailbox of mailboxes) {
      if (mailbox.specialUse === mailboxPath) {
        return mailbox.path;
      }
    }
    return null;
  }
  return mailboxPath;
}

// Get IMAP credentials for an account (async to support token refresh)
async function getImapCredentials(account: MailAccount) {
  const credentials: any = {
    host: account.imapHost!,
    port: account.imapPort!,
    user: account.email,
  };

  if (account.type === 'imap') {
    credentials.password = decryptPassword(account.password!);
  } else if (account.type === 'microsoft') {
    // Use token manager to get valid (refreshed if needed) access token
    credentials.accessToken = await getValidAccessToken(account.id);
  }

  return credentials;
}

// Move messages within the same account
async function moveMessagesWithinAccount(
  credentials: any,
  sourceMailboxPath: string,
  targetMailboxPath: string,
  messageUids: number[]
): Promise<{ successCount: number; failedUids: number[] }> {
  return await withImapClient(credentials, async (client) => {
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
    const uidRange = messageUids.join(',');
    await client.messageMove(uidRange, resolvedTargetPath, { uid: true });

    return { successCount: messageUids.length, failedUids: [] };
  });
}

// Move messages to a different account (fetch, append, delete)
async function moveMessagesCrossAccount(
  sourceCredentials: any,
  targetCredentials: any,
  sourceMailboxPath: string,
  targetMailboxPath: string,
  messageUids: number[]
): Promise<{ successCount: number; failedUids: number[] }> {
  const failedUids: number[] = [];
  const successfulUids: number[] = [];

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
            flags: message.flags ? Array.from(message.flags) : [],
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
        const uidRange = successfulUids.join(',');
        await sourceClient.messageDelete(uidRange, { uid: true });
      }
    });
  }

  return {
    successCount: successfulUids.length,
    failedUids,
  };
}

// Run a single automation flow
export async function runAutomationFlow(flow: FlowWithAccounts): Promise<void> {
  console.log(`Running automation flow: ${flow.name} (ID: ${flow.id})`);

  // Create execution record
  const now = new Date().toISOString();
  const execStmt = db.prepare(`
    INSERT INTO automation_executions (flowId, status, startedAt)
    VALUES (?, ?, ?)
  `);
  const execResult = execStmt.run(flow.id, 'running', now);
  const executionId = execResult.lastInsertRowid as number;

  try {
    const sourceCredentials = await getImapCredentials(flow.sourceMailAccount);
    const targetCredentials = await getImapCredentials(flow.targetMailAccount);

    // Fetch all messages from source mailbox
    const messageUids = await withImapClient(sourceCredentials, async (client) => {
      const resolvedSourcePath = await resolveMailboxPath(client, flow.sourceMailbox);
      if (!resolvedSourcePath) {
        throw new Error(`Source mailbox not found: ${flow.sourceMailbox}`);
      }

      await client.mailboxOpen(resolvedSourcePath);

      // Search for all messages
      const messages = await client.search({ all: true }, { uid: true });
      return Array.isArray(messages) ? messages : [];
    });

    if (!messageUids || messageUids.length === 0) {
      console.log(`No messages to move in flow: ${flow.name}`);

      const completedAt = new Date().toISOString();
      db.prepare(`
        UPDATE automation_executions SET status = ?, movedCount = ?, completedAt = ? WHERE id = ?
      `).run('success', 0, completedAt, executionId);

      db.prepare(`
        UPDATE automation_flows SET lastRun = ?, nextRun = ?, updatedAt = ? WHERE id = ?
      `).run(completedAt, new Date(Date.now() + flow.intervalMinutes * 60000).toISOString(), completedAt, flow.id);

      return;
    }

    // Move messages
    let result;
    if (flow.sourceMailAccountId === flow.targetMailAccountId) {
      // Same account
      result = await moveMessagesWithinAccount(
        sourceCredentials,
        flow.sourceMailbox,
        flow.targetMailbox,
        messageUids
      );
    } else {
      // Different accounts
      result = await moveMessagesCrossAccount(
        sourceCredentials,
        targetCredentials,
        flow.sourceMailbox,
        flow.targetMailbox,
        messageUids
      );
    }

    console.log(`Moved ${result.successCount} messages in flow: ${flow.name}`);

    // Update execution record
    const completedAt = new Date().toISOString();
    db.prepare(`
      UPDATE automation_executions SET status = ?, movedCount = ?, completedAt = ? WHERE id = ?
    `).run('success', result.successCount, completedAt, executionId);

    // Update flow last run and next run
    db.prepare(`
      UPDATE automation_flows SET lastRun = ?, nextRun = ?, updatedAt = ? WHERE id = ?
    `).run(completedAt, new Date(Date.now() + flow.intervalMinutes * 60000).toISOString(), completedAt, flow.id);

  } catch (error: any) {
    console.error(`Error running automation flow ${flow.name}:`, error);

    // Update execution record with error
    const completedAt = new Date().toISOString();
    db.prepare(`
      UPDATE automation_executions SET status = ?, errorMessage = ?, completedAt = ? WHERE id = ?
    `).run('error', error.message || 'Unknown error', completedAt, executionId);

    throw error;
  }
}

// Scheduler: Check and run automation flows
export async function runScheduler(): Promise<void> {
  console.log('Running automation scheduler...');

  try {
    const now = new Date().toISOString();

    // Find all enabled flows that are due to run
    const flows = db.prepare(`
      SELECT * FROM automation_flows
      WHERE enabled = 1 AND (nextRun IS NULL OR nextRun <= ?)
    `).all(now) as AutomationFlow[];

    console.log(`Found ${flows.length} flows to run`);

    for (const flow of flows) {
      try {
        // Get accounts for this flow
        const sourceMailAccount = db.prepare('SELECT * FROM mail_accounts WHERE id = ?').get(flow.sourceMailAccountId) as MailAccount;
        const targetMailAccount = db.prepare('SELECT * FROM mail_accounts WHERE id = ?').get(flow.targetMailAccountId) as MailAccount;

        if (sourceMailAccount && targetMailAccount) {
          await runAutomationFlow({ ...flow, sourceMailAccount, targetMailAccount });
        }
      } catch (error) {
        console.error(`Failed to run flow ${flow.name}:`, error);
        // Continue with other flows
      }
    }
  } catch (error) {
    console.error('Error in automation scheduler:', error);
  }
}

// Start the scheduler (runs every minute)
export function startScheduler(): NodeJS.Timeout {
  console.log('Starting automation scheduler...');

  // Run immediately
  runScheduler();

  // Then run every minute
  return setInterval(runScheduler, 60000);
}
