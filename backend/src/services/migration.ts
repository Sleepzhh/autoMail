import { MailAccount } from '../utils/db';
import { withImapClient, ImapCredentials } from '../utils/imapClient';
import { decryptPassword } from '../utils/crypto';
import { getValidAccessToken } from './tokenManager';

// Default folders to exclude from migration
export const DEFAULT_EXCLUDED_FOLDERS = ['\\Trash', '\\Junk', 'Junk', 'Trash', 'Deleted Items', 'Junk E-mail', 'Spam'];

export interface MigrationOptions {
  sourceAccountId: number;
  targetAccountId: number;
  excludedFolders?: string[];
  dryRun?: boolean;
}

export interface FolderInfo {
  path: string;
  name: string;
  specialUse?: string;
  messageCount: number;
}

export interface MigrationPreview {
  folders: FolderInfo[];
  totalMessages: number;
  excludedFolders: string[];
}

export interface MigrationResult {
  success: boolean;
  foldersCreated: string[];
  foldersCopied: { path: string; messageCount: number }[];
  totalMessagesCopied: number;
  errors: { folder: string; error: string }[];
}

// Get IMAP credentials for an account
async function getImapCredentials(account: MailAccount): Promise<ImapCredentials> {
  const credentials: ImapCredentials = {
    host: account.imapHost!,
    port: account.imapPort!,
    user: account.email,
  };

  if (account.type === 'imap') {
    credentials.password = decryptPassword(account.password!);
  } else if (account.type === 'microsoft') {
    credentials.accessToken = await getValidAccessToken(account.id);
  }

  return credentials;
}

// Check if a folder should be excluded
function shouldExcludeFolder(folder: { path: string; specialUse?: string }, excludedFolders: string[]): boolean {
  // Check if the folder path or special use matches any excluded folder
  for (const excluded of excludedFolders) {
    // Match by special use (e.g., \Trash, \Junk)
    if (excluded.startsWith('\\') && folder.specialUse === excluded) {
      return true;
    }
    // Match by path (case-insensitive)
    if (folder.path.toLowerCase() === excluded.toLowerCase()) {
      return true;
    }
    // Match by folder name (last segment of path)
    const folderName = folder.path.split('/').pop() || folder.path;
    if (folderName.toLowerCase() === excluded.toLowerCase()) {
      return true;
    }
  }
  return false;
}

// Get all folders from an account with message counts
export async function getFolders(credentials: ImapCredentials, excludedFolders: string[]): Promise<FolderInfo[]> {
  return await withImapClient(credentials, async (client) => {
    const mailboxes = await client.list();
    const folders: FolderInfo[] = [];

    for (const mailbox of mailboxes) {
      // Skip excluded folders
      if (shouldExcludeFolder({ path: mailbox.path, specialUse: mailbox.specialUse }, excludedFolders)) {
        continue;
      }

      // Skip non-selectable folders (like namespace roots)
      if (mailbox.flags?.has('\\Noselect') || mailbox.flags?.has('\\NonExistent')) {
        continue;
      }

      try {
        const status = await client.status(mailbox.path, { messages: true });
        folders.push({
          path: mailbox.path,
          name: mailbox.name,
          specialUse: mailbox.specialUse,
          messageCount: status.messages || 0,
        });
      } catch (err) {
        // Skip folders we can't access
        console.warn(`Could not get status for mailbox ${mailbox.path}:`, err);
      }
    }

    return folders;
  });
}

// Get migration preview (dry run)
export async function getMigrationPreview(
  sourceAccount: MailAccount,
  excludedFolders: string[] = DEFAULT_EXCLUDED_FOLDERS
): Promise<MigrationPreview> {
  const credentials = await getImapCredentials(sourceAccount);
  const folders = await getFolders(credentials, excludedFolders);
  const totalMessages = folders.reduce((sum, folder) => sum + folder.messageCount, 0);

  return {
    folders,
    totalMessages,
    excludedFolders,
  };
}

// Create folder on target account if it doesn't exist
async function ensureFolderExists(credentials: ImapCredentials, folderPath: string): Promise<boolean> {
  return await withImapClient(credentials, async (client) => {
    const mailboxes = await client.list();
    const exists = mailboxes.some((m) => m.path === folderPath);

    if (!exists) {
      await client.mailboxCreate(folderPath);
      return true; // Created
    }
    return false; // Already existed
  });
}

// Copy messages from one folder to another (cross-account)
async function copyFolderMessages(
  sourceCredentials: ImapCredentials,
  targetCredentials: ImapCredentials,
  sourceFolderPath: string,
  targetFolderPath: string
): Promise<number> {
  // Fetch all messages from source folder
  const messages = await withImapClient(sourceCredentials, async (client) => {
    await client.mailboxOpen(sourceFolderPath);

    // Get all message UIDs
    const uids = await client.search({ all: true }, { uid: true });
    if (!uids || uids.length === 0) {
      return [];
    }

    // Fetch message content
    const results: { source: Buffer; flags: string[]; date: Date | null }[] = [];
    for (const uid of uids) {
      try {
        const message = await client.fetchOne(
          uid.toString(),
          {
            uid: true,
            flags: true,
            envelope: true,
            source: true,
          },
          { uid: true }
        );

        if (!message) {
          continue;
        }

        if (message.source) {
          results.push({
            source: message.source,
            flags: message.flags ? Array.from(message.flags) : [],
            date: message.envelope?.date || null,
          });
        }
      } catch (err) {
        console.error(`Failed to fetch message ${uid} from ${sourceFolderPath}:`, err);
      }
    }

    return results;
  });

  if (messages.length === 0) {
    return 0;
  }

  // Append messages to target folder
  let copiedCount = 0;
  await withImapClient(targetCredentials, async (client) => {
    for (const msg of messages) {
      try {
        await client.append(targetFolderPath, msg.source, msg.flags, msg.date ? new Date(msg.date) : undefined);
        copiedCount++;
      } catch (err) {
        console.error(`Failed to append message to ${targetFolderPath}:`, err);
      }
    }
  });

  return copiedCount;
}

// Execute full migration
export async function executeMigration(
  sourceAccount: MailAccount,
  targetAccount: MailAccount,
  excludedFolders: string[] = DEFAULT_EXCLUDED_FOLDERS
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    foldersCreated: [],
    foldersCopied: [],
    totalMessagesCopied: 0,
    errors: [],
  };

  try {
    const sourceCredentials = await getImapCredentials(sourceAccount);
    const targetCredentials = await getImapCredentials(targetAccount);

    // Get folders to migrate
    const folders = await getFolders(sourceCredentials, excludedFolders);

    for (const folder of folders) {
      try {
        // Create folder on target if needed
        const created = await ensureFolderExists(targetCredentials, folder.path);
        if (created) {
          result.foldersCreated.push(folder.path);
        }

        // Copy messages
        if (folder.messageCount > 0) {
          const copiedCount = await copyFolderMessages(
            sourceCredentials,
            targetCredentials,
            folder.path,
            folder.path
          );

          result.foldersCopied.push({
            path: folder.path,
            messageCount: copiedCount,
          });
          result.totalMessagesCopied += copiedCount;
        }
      } catch (err: any) {
        console.error(`Error migrating folder ${folder.path}:`, err);
        result.errors.push({
          folder: folder.path,
          error: err.message || 'Unknown error',
        });
        result.success = false;
      }
    }
  } catch (err: any) {
    console.error('Migration failed:', err);
    result.success = false;
    result.errors.push({
      folder: 'general',
      error: err.message || 'Unknown error',
    });
  }

  return result;
}
