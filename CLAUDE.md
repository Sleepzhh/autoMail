# autoMail

Email automation tool for moving emails between accounts automatically.

## Project Overview

This project enables automated email movement between different mail accounts (IMAP and Microsoft OAuth). Users configure mail accounts and create automation flows that move emails from one mailbox to another based on triggers (e.g., intervals).

## Architecture

- **Backend** (`/backend`): Express.js server (TypeScript) - handles all automation logic, account management, and email operations. Data stored in SQLite.
- **Frontend** (`/frontend`): React + Vite + Tailwind - configuration UI only, no business logic.

## Core Concepts

- **Mail Accounts**: IMAP (password-based) or Microsoft (OAuth2)
- **Automation Flows**: Source account/mailbox -> Target account/mailbox
- **Triggers**: Interval-based execution of flows

## Reusable Code

The `/fromOtherProject` folder contains code from another project to reuse:

- `routes/mailAccounts.ts` - CRUD for mail accounts (IMAP + OAuth)
- `routes/oauth/` - Full OAuth2 flow (authorize, callback, refresh, status)
- `routes/messages/moveMessage.ts` - Move emails within or between accounts

## Tech Stack

- Backend: Express 5, TypeScript, SQLite (via Prisma in reused code), ts-node
- Frontend: React 19, Vite 7, Tailwind CSS 4, TypeScript

## Commands

```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev
```
