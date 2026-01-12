import { Router, Request, Response } from 'express';
import db, { AutomationFlow, MailAccount, FlowWithAccounts } from '../utils/db';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants';

const router = Router();

// Helper to get flow with joined accounts
function getFlowWithAccounts(flowId: number): FlowWithAccounts | undefined {
  const flow = db.prepare('SELECT * FROM automation_flows WHERE id = ?').get(flowId) as AutomationFlow | undefined;
  if (!flow) return undefined;

  const sourceMailAccount = db.prepare('SELECT * FROM mail_accounts WHERE id = ?').get(flow.sourceMailAccountId) as MailAccount;
  const targetMailAccount = db.prepare('SELECT * FROM mail_accounts WHERE id = ?').get(flow.targetMailAccountId) as MailAccount;

  return { ...flow, sourceMailAccount, targetMailAccount };
}

// Get all automation flows
router.get('/', async (req: Request, res: Response) => {
  try {
    const flows = db.prepare('SELECT * FROM automation_flows ORDER BY createdAt DESC').all() as AutomationFlow[];

    // Join with mail accounts
    const flowsWithAccounts = flows.map((flow) => {
      const sourceMailAccount = db.prepare('SELECT * FROM mail_accounts WHERE id = ?').get(flow.sourceMailAccountId) as MailAccount;
      const targetMailAccount = db.prepare('SELECT * FROM mail_accounts WHERE id = ?').get(flow.targetMailAccountId) as MailAccount;
      return { ...flow, sourceMailAccount, targetMailAccount };
    });

    res.status(HTTP_STATUS.OK).json(flowsWithAccounts);
  } catch (error) {
    console.error('Error fetching automation flows:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch flows' });
  }
});

// Get single automation flow
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const flow = getFlowWithAccounts(id);

    if (!flow) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: ERROR_MESSAGES.FLOW_NOT_FOUND });
    }

    res.status(HTTP_STATUS.OK).json(flow);
  } catch (error) {
    console.error('Error fetching automation flow:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch flow' });
  }
});

// Create automation flow
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      name,
      sourceMailAccountId,
      sourceMailbox,
      targetMailAccountId,
      targetMailbox,
      enabled,
      intervalMinutes,
    } = req.body;

    // Validation
    if (!name || !sourceMailAccountId || !sourceMailbox || !targetMailAccountId || !targetMailbox) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Missing required fields' });
    }

    // Verify accounts exist
    const sourceAccount = db.prepare('SELECT id FROM mail_accounts WHERE id = ?').get(sourceMailAccountId);
    const targetAccount = db.prepare('SELECT id FROM mail_accounts WHERE id = ?').get(targetMailAccountId);

    if (!sourceAccount || !targetAccount) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Invalid account IDs' });
    }

    // Calculate next run time
    const now = new Date();
    const nextRun = new Date(now.getTime() + (intervalMinutes || 60) * 60000);

    const stmt = db.prepare(`
      INSERT INTO automation_flows (name, sourceMailAccountId, sourceMailbox, targetMailAccountId, targetMailbox, enabled, intervalMinutes, nextRun, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      name,
      sourceMailAccountId,
      sourceMailbox,
      targetMailAccountId,
      targetMailbox,
      enabled !== undefined ? (enabled ? 1 : 0) : 1,
      intervalMinutes || 60,
      nextRun.toISOString(),
      now.toISOString(),
      now.toISOString()
    );

    const flow = getFlowWithAccounts(result.lastInsertRowid as number);
    res.status(HTTP_STATUS.CREATED).json(flow);
  } catch (error) {
    console.error('Error creating automation flow:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Failed to create flow' });
  }
});

// Update automation flow
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const {
      name,
      sourceMailAccountId,
      sourceMailbox,
      targetMailAccountId,
      targetMailbox,
      enabled,
      intervalMinutes,
    } = req.body;

    const existing = db.prepare('SELECT * FROM automation_flows WHERE id = ?').get(id) as AutomationFlow | undefined;
    if (!existing) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: ERROR_MESSAGES.FLOW_NOT_FOUND });
    }

    // Verify accounts exist if changed
    if (sourceMailAccountId !== existing.sourceMailAccountId) {
      const sourceAccount = db.prepare('SELECT id FROM mail_accounts WHERE id = ?').get(sourceMailAccountId);
      if (!sourceAccount) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Invalid source account ID' });
      }
    }

    if (targetMailAccountId !== existing.targetMailAccountId) {
      const targetAccount = db.prepare('SELECT id FROM mail_accounts WHERE id = ?').get(targetMailAccountId);
      if (!targetAccount) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Invalid target account ID' });
      }
    }

    const now = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE automation_flows
      SET name = ?, sourceMailAccountId = ?, sourceMailbox = ?, targetMailAccountId = ?, targetMailbox = ?, enabled = ?, intervalMinutes = ?, updatedAt = ?
      WHERE id = ?
    `);
    stmt.run(
      name,
      sourceMailAccountId,
      sourceMailbox,
      targetMailAccountId,
      targetMailbox,
      enabled !== undefined ? (enabled ? 1 : 0) : existing.enabled,
      intervalMinutes || existing.intervalMinutes,
      now,
      id
    );

    const flow = getFlowWithAccounts(id);
    res.status(HTTP_STATUS.OK).json(flow);
  } catch (error) {
    console.error('Error updating automation flow:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Failed to update flow' });
  }
});

// Delete automation flow
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);

    const existing = db.prepare('SELECT id FROM automation_flows WHERE id = ?').get(id);
    if (!existing) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: ERROR_MESSAGES.FLOW_NOT_FOUND });
    }

    db.prepare('DELETE FROM automation_flows WHERE id = ?').run(id);

    res.status(HTTP_STATUS.OK).json({ message: 'Flow deleted successfully' });
  } catch (error) {
    console.error('Error deleting automation flow:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Failed to delete flow' });
  }
});

// Run automation flow manually
router.post('/:id/run', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const flow = getFlowWithAccounts(id);

    if (!flow) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: ERROR_MESSAGES.FLOW_NOT_FOUND });
    }

    // Import automation service
    const { runAutomationFlow } = await import('../services/automation');

    // Run the flow
    await runAutomationFlow(flow);

    res.status(HTTP_STATUS.OK).json({ message: 'Flow executed successfully' });
  } catch (error) {
    console.error('Error running automation flow:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Failed to run flow' });
  }
});

export default router;
