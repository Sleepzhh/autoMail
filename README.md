<p align="center">
  <img src="other/icon.svg" alt="autoMail Logo" width="80" height="80">
</p>

<h1 align="center">autoMail</h1>

<p align="center">
  <strong>Automate your Mailbox</strong><br>
  Email automation tool for moving emails between accounts
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Express-5-000000?style=flat&logo=express" alt="Express">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License">
</p>

---

autoMail connects your IMAP and Microsoft mail accounts, letting you create automation flows that move emails between mailboxes on a schedule. Self-hosted, simple web UI, your data stays on your machine.

## Features

- **Multi-account support** — IMAP (password-based) and Microsoft OAuth
- **Automation flows** — Source mailbox to target mailbox routing
- **Scheduled triggers** — Interval-based execution
- **Self-hosted** — Your data stays on your machine
- **Simple UI** — Clean web interface for configuration

## Quick Start

### Docker Compose (recommended)

Create a `docker-compose.yml`:

```yaml
services:
  backend:
    image: ghcr.io/sleepzhh/automail/backend:latest
    environment:
      - NODE_ENV=production
      - PORT=4000
      - BACKEND_URL=http://localhost:4000
      - FRONTEND_URL=http://localhost
      - MICROSOFT_CLIENT_ID=${MICROSOFT_CLIENT_ID}
      - MICROSOFT_CLIENT_SECRET=${MICROSOFT_CLIENT_SECRET}
      - JWT_SECRET=${JWT_SECRET}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
    volumes:
      - automail-data:/app/data
    networks:
      - automail-network
    restart: unless-stopped

  frontend:
    image: ghcr.io/sleepzhh/automail/frontend:latest
    ports:
      - "80:80"
    environment:
      - BACKEND_URL=http://backend:4000
    depends_on:
      - backend
    networks:
      - automail-network
    restart: unless-stopped

volumes:
  automail-data:

networks:
  automail-network:
    driver: bridge
```

Create a `.env` file:

```bash
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret
JWT_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)
```

Start the application:

```bash
docker compose up -d
```

Visit `http://localhost`

## Configuration

| Variable | Description |
|----------|-------------|
| `MICROSOFT_CLIENT_ID` | Azure OAuth client ID |
| `MICROSOFT_CLIENT_SECRET` | Azure OAuth client secret |
| `JWT_SECRET` | 32-byte hex key for JWT tokens |
| `ENCRYPTION_KEY` | 32-byte hex key for token encryption |
| `BACKEND_URL` | Public URL of backend (for OAuth callbacks) |
| `FRONTEND_URL` | Public URL of frontend (for redirects) |

### Production

Update URLs to your domain:

```yaml
environment:
  - BACKEND_URL=https://api.yourdomain.com
  - FRONTEND_URL=https://yourdomain.com
```

### Microsoft OAuth Setup

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to Azure Active Directory > App registrations
3. Create a new registration
4. Add redirect URI: `{BACKEND_URL}/api/oauth/microsoft/callback`
5. Create a client secret
6. Copy the Application (client) ID and secret to your `.env`

## Tech Stack

Backend: Express 5, TypeScript, SQLite
Frontend: React 19, Vite 7, Tailwind CSS 4
Infrastructure: Docker

## Development

```bash
cd backend && npm run dev   # Start backend
cd frontend && npm run dev  # Start frontend
```

## License

MIT
