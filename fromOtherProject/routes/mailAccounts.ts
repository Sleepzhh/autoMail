import { Router, Response, RequestHandler } from "express";
import prisma from '../database.js';
import {
  authenticateToken,
  AuthenticatedRequest,
} from '../middleware/authMiddleware.js';
import { HTTP_STATUS } from '../constants/index.js';
import { encryptPassword, decryptPassword } from '../utils/crypto.js';

const router = Router();

const authMiddleware = authenticateToken as RequestHandler;

router.delete("/:mailAccountId", authMiddleware, (async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const id = Number(req.params.mailAccountId);

  await prisma.mailAccount.delete({
    where: { id, userId: req.userId },
  });

  res.sendStatus(HTTP_STATUS.OK);
}) as RequestHandler);

router.get("/", authMiddleware, (async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const accounts = await prisma.mailAccount.findMany({
    where: { userId: req.userId },
  });

  // Decrypt passwords for password-based accounts
  const accountsWithDecryptedPasswords = accounts.map((account) => {
    if (account.authType === "password") {
      return {
        ...account,
        imapPassword: account.imapPassword ? decryptPassword(account.imapPassword) : null,
        smtpPassword: account.smtpPassword ? decryptPassword(account.smtpPassword) : null,
      };
    }
    return account;
  });

  res.status(HTTP_STATUS.OK).json(accountsWithDecryptedPasswords);
}) as RequestHandler);

router.patch("/:mailAccountId", authMiddleware, (async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const id = Number(req.params.mailAccountId);
  const {
    name,
    displayName,
    imapHost,
    imapPort,
    imapUser,
    imapPassword,
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPassword,
    signature,
  } = req.body;

  // Get the existing account to check auth type
  const existingAccount = await prisma.mailAccount.findUnique({
    where: { id, userId: req.userId },
  });

  if (!existingAccount) {
    return res
      .status(HTTP_STATUS.NOT_FOUND)
      .json({ error: "Mail account not found" });
  }

  // OAuth2 accounts can't be updated the same way
  if (existingAccount.authType === "oauth2") {
    // Only allow updating name, displayName, and signature for OAuth accounts
    const account = await prisma.mailAccount.update({
      where: { id, userId: req.userId },
      data: {
        name,
        displayName,
        signature,
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        authType: true,
        provider: true,
        imapUser: true,
        smtpUser: true,
        signature: true,
      },
    });

    return res.status(HTTP_STATUS.OK).json(account);
  }

  // For password-based accounts, update as before
  await prisma.mailAccount.update({
    where: { id, userId: req.userId },
    data: {
      name,
      displayName,
      imapHost,
      imapPort,
      imapUser,
      imapPassword: imapPassword ? encryptPassword(imapPassword) : undefined,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPassword: smtpPassword ? encryptPassword(smtpPassword) : undefined,
      signature,
    },
  });

  // Return account without sensitive data
  const updatedAccount = await prisma.mailAccount.findUnique({
    where: { id, userId: req.userId },
    select: {
      id: true,
      name: true,
      displayName: true,
      authType: true,
      provider: true,
      imapUser: true,
      smtpUser: true,
      signature: true,
    },
  });

  res.status(HTTP_STATUS.OK).json(updatedAccount);
}) as RequestHandler);

router.post("/", authMiddleware, (async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const {
    name,
    displayName,
    imapHost,
    imapPort,
    imapUser,
    imapPassword,
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPassword,
    signature,
  } = req.body;

  // Only allow creating password-based accounts through this endpoint
  // OAuth accounts are created through the OAuth callback
  const account = await prisma.mailAccount.create({
    data: {
      name,
      displayName,
      authType: "password",
      imapHost,
      imapPort,
      imapUser,
      imapPassword: encryptPassword(imapPassword),
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPassword: encryptPassword(smtpPassword),
      signature,
      userId: req.userId!,
    },
    select: {
      id: true,
      name: true,
      displayName: true,
      authType: true,
      provider: true,
      imapUser: true,
      smtpUser: true,
      signature: true,
    },
  });

  res.status(HTTP_STATUS.CREATED).json(account);
}) as RequestHandler);

export default router;
