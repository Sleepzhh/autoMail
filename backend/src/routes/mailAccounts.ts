import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants';
import { encryptPassword, decryptPassword } from '../utils/crypto';

const router = Router();

// Get all mail accounts
router.get('/', async (req: Request, res: Response) => {
  try {
    const accounts = await prisma.mailAccount.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Decrypt passwords for IMAP accounts
    const accountsWithDecryptedPasswords = accounts.map((account) => {
      if (account.type === 'imap' && account.password) {
        return {
          ...account,
          password: decryptPassword(account.password),
        };
      }
      return account;
    });

    res.status(HTTP_STATUS.OK).json(accountsWithDecryptedPasswords);
  } catch (error) {
    console.error('Error fetching mail accounts:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch accounts' });
  }
});

// Get single mail account
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const account = await prisma.mailAccount.findUnique({
      where: { id },
    });

    if (!account) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: ERROR_MESSAGES.ACCOUNT_NOT_FOUND });
    }

    // Decrypt password for IMAP accounts
    if (account.type === 'imap' && account.password) {
      account.password = decryptPassword(account.password);
    }

    res.status(HTTP_STATUS.OK).json(account);
  } catch (error) {
    console.error('Error fetching mail account:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch account' });
  }
});

// Create mail account
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, type, email, imapHost, imapPort, password, accessToken, refreshToken, tokenExpiry } = req.body;

    // Validation
    if (!name || !type || !email) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Missing required fields' });
    }

    if (type === 'imap' && (!imapHost || !imapPort || !password)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'IMAP accounts require host, port, and password' });
    }

    if (type === 'microsoft' && (!accessToken || !refreshToken)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Microsoft accounts require tokens' });
    }

    // Encrypt password for IMAP accounts
    const accountData: any = {
      name,
      type,
      email,
    };

    if (type === 'imap') {
      accountData.imapHost = imapHost;
      accountData.imapPort = imapPort;
      accountData.password = encryptPassword(password);
    } else if (type === 'microsoft') {
      accountData.accessToken = accessToken;
      accountData.refreshToken = refreshToken;
      accountData.tokenExpiry = tokenExpiry ? new Date(tokenExpiry) : null;
    }

    const account = await prisma.mailAccount.create({
      data: accountData,
    });

    res.status(HTTP_STATUS.CREATED).json(account);
  } catch (error) {
    console.error('Error creating mail account:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Failed to create account' });
  }
});

// Update mail account
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const { name, type, email, imapHost, imapPort, password, accessToken, refreshToken, tokenExpiry } = req.body;

    const existing = await prisma.mailAccount.findUnique({ where: { id } });
    if (!existing) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: ERROR_MESSAGES.ACCOUNT_NOT_FOUND });
    }

    const updateData: any = {
      name,
      type,
      email,
    };

    if (type === 'imap') {
      updateData.imapHost = imapHost;
      updateData.imapPort = imapPort;
      if (password) {
        updateData.password = encryptPassword(password);
      }
      // Clear OAuth fields
      updateData.accessToken = null;
      updateData.refreshToken = null;
      updateData.tokenExpiry = null;
    } else if (type === 'microsoft') {
      updateData.accessToken = accessToken;
      updateData.refreshToken = refreshToken;
      updateData.tokenExpiry = tokenExpiry ? new Date(tokenExpiry) : null;
      // Clear IMAP fields
      updateData.imapHost = null;
      updateData.imapPort = null;
      updateData.password = null;
    }

    const account = await prisma.mailAccount.update({
      where: { id },
      data: updateData,
    });

    res.status(HTTP_STATUS.OK).json(account);
  } catch (error) {
    console.error('Error updating mail account:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Failed to update account' });
  }
});

// Delete mail account
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);

    const existing = await prisma.mailAccount.findUnique({ where: { id } });
    if (!existing) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: ERROR_MESSAGES.ACCOUNT_NOT_FOUND });
    }

    await prisma.mailAccount.delete({
      where: { id },
    });

    res.status(HTTP_STATUS.OK).json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting mail account:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Failed to delete account' });
  }
});

// Get mailboxes for an account
router.get('/:id/mailboxes', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const account = await prisma.mailAccount.findUnique({ where: { id } });

    if (!account) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: ERROR_MESSAGES.ACCOUNT_NOT_FOUND });
    }

    // Import here to avoid circular dependencies
    const { withImapClient } = await import('../utils/imapClient');
    const { decryptPassword } = await import('../utils/crypto');

    const credentials: any = {
      host: account.imapHost!,
      port: account.imapPort!,
      user: account.email,
    };

    if (account.type === 'imap') {
      credentials.password = decryptPassword(account.password!);
    } else if (account.type === 'microsoft') {
      // Use token manager to get valid (refreshed if needed) access token
      const { getValidAccessToken } = await import('../services/tokenManager');
      credentials.accessToken = await getValidAccessToken(id);
    }

    const mailboxes = await withImapClient(credentials, async (client) => {
      const list = await client.list();
      return list.map((mailbox: any) => ({
        path: mailbox.path,
        name: mailbox.name,
        specialUse: mailbox.specialUse || null,
      }));
    });

    res.status(HTTP_STATUS.OK).json(mailboxes);
  } catch (error) {
    console.error('Error fetching mailboxes:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch mailboxes' });
  }
});

export default router;
