import { Router, Request, Response } from 'express';
import db, { MailAccount } from '../utils/db';
import { getMigrationPreview, executeMigration, DEFAULT_EXCLUDED_FOLDERS } from '../services/migration';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants';

const router = Router();

// POST /api/migration/preview - Get migration preview (dry run)
router.post('/preview', async (req: Request, res: Response) => {
  try {
    const { sourceAccountId, excludedFolders } = req.body;

    if (!sourceAccountId) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'sourceAccountId is required',
      });
      return;
    }

    const sourceAccount = db.prepare('SELECT * FROM mail_accounts WHERE id = ?').get(sourceAccountId) as MailAccount | undefined;

    if (!sourceAccount) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        error: 'Source account not found',
      });
      return;
    }

    const folders = excludedFolders ?? DEFAULT_EXCLUDED_FOLDERS;
    const preview = await getMigrationPreview(sourceAccount, folders);

    res.json(preview);
  } catch (error: any) {
    console.error('Error getting migration preview:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: error.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
    });
  }
});

// POST /api/migration/execute - Execute migration
router.post('/execute', async (req: Request, res: Response) => {
  try {
    const { sourceAccountId, targetAccountId, excludedFolders } = req.body;

    if (!sourceAccountId || !targetAccountId) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'sourceAccountId and targetAccountId are required',
      });
      return;
    }

    if (sourceAccountId === targetAccountId) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'Source and target accounts must be different',
      });
      return;
    }

    const sourceAccount = db.prepare('SELECT * FROM mail_accounts WHERE id = ?').get(sourceAccountId) as MailAccount | undefined;
    const targetAccount = db.prepare('SELECT * FROM mail_accounts WHERE id = ?').get(targetAccountId) as MailAccount | undefined;

    if (!sourceAccount) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        error: 'Source account not found',
      });
      return;
    }

    if (!targetAccount) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        error: 'Target account not found',
      });
      return;
    }

    const folders = excludedFolders ?? DEFAULT_EXCLUDED_FOLDERS;
    const result = await executeMigration(sourceAccount, targetAccount, folders);

    res.json(result);
  } catch (error: any) {
    console.error('Error executing migration:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: error.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
    });
  }
});

// GET /api/migration/default-excluded-folders - Get default excluded folders
router.get('/default-excluded-folders', (_req: Request, res: Response) => {
  res.json({ excludedFolders: DEFAULT_EXCLUDED_FOLDERS });
});

export default router;
