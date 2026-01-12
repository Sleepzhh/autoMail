import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants';

const router = Router();

// Get all automation flows
router.get('/', async (req: Request, res: Response) => {
  try {
    const flows = await prisma.automationFlow.findMany({
      include: {
        sourceMailAccount: true,
        targetMailAccount: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(HTTP_STATUS.OK).json(flows);
  } catch (error) {
    console.error('Error fetching automation flows:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch flows' });
  }
});

// Get single automation flow
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const flow = await prisma.automationFlow.findUnique({
      where: { id },
      include: {
        sourceMailAccount: true,
        targetMailAccount: true,
      },
    });

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
    const sourceAccount = await prisma.mailAccount.findUnique({ where: { id: sourceMailAccountId } });
    const targetAccount = await prisma.mailAccount.findUnique({ where: { id: targetMailAccountId } });

    if (!sourceAccount || !targetAccount) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Invalid account IDs' });
    }

    // Calculate next run time
    const now = new Date();
    const nextRun = new Date(now.getTime() + (intervalMinutes || 60) * 60000);

    const flow = await prisma.automationFlow.create({
      data: {
        name,
        sourceMailAccountId,
        sourceMailbox,
        targetMailAccountId,
        targetMailbox,
        enabled: enabled !== undefined ? enabled : true,
        intervalMinutes: intervalMinutes || 60,
        nextRun,
      },
      include: {
        sourceMailAccount: true,
        targetMailAccount: true,
      },
    });

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

    const existing = await prisma.automationFlow.findUnique({ where: { id } });
    if (!existing) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: ERROR_MESSAGES.FLOW_NOT_FOUND });
    }

    // Verify accounts exist if changed
    if (sourceMailAccountId !== existing.sourceMailAccountId) {
      const sourceAccount = await prisma.mailAccount.findUnique({ where: { id: sourceMailAccountId } });
      if (!sourceAccount) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Invalid source account ID' });
      }
    }

    if (targetMailAccountId !== existing.targetMailAccountId) {
      const targetAccount = await prisma.mailAccount.findUnique({ where: { id: targetMailAccountId } });
      if (!targetAccount) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Invalid target account ID' });
      }
    }

    const flow = await prisma.automationFlow.update({
      where: { id },
      data: {
        name,
        sourceMailAccountId,
        sourceMailbox,
        targetMailAccountId,
        targetMailbox,
        enabled,
        intervalMinutes,
      },
      include: {
        sourceMailAccount: true,
        targetMailAccount: true,
      },
    });

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

    const existing = await prisma.automationFlow.findUnique({ where: { id } });
    if (!existing) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: ERROR_MESSAGES.FLOW_NOT_FOUND });
    }

    await prisma.automationFlow.delete({
      where: { id },
    });

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

    const flow = await prisma.automationFlow.findUnique({
      where: { id },
      include: {
        sourceMailAccount: true,
        targetMailAccount: true,
      },
    });

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
