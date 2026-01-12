# autoMail

Email automation tool for moving emails between accounts automatically.

## Features

- Connect IMAP and Microsoft OAuth mail accounts
- Create automation flows to move emails between mailboxes
- Schedule automations with interval-based triggers
- Simple web UI for configuration

## Deployment

### Using Docker Compose (Recommended)

1. Create a `docker-compose.yml` file:

```yaml
services:
  backend:
    image: ghcr.io/sleepzhh/automail/backend:latest
    ports:
      - "4000:4000"
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
    restart: unless-stopped

  frontend:
    image: ghcr.io/sleepzhh/automail/frontend:latest
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  automail-data:
```

2. Create a `.env` file with your secrets:

```bash
# Microsoft OAuth (get from Azure Portal)
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret

# Security keys (generate with: openssl rand -hex 32)
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
```

3. Start the application:

```bash
docker compose up -d
```

4. Access the web UI at `http://localhost`

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MICROSOFT_CLIENT_ID` | Azure OAuth client ID | Yes (for Microsoft accounts) |
| `MICROSOFT_CLIENT_SECRET` | Azure OAuth client secret | Yes (for Microsoft accounts) |
| `JWT_SECRET` | 32-byte hex key for JWT tokens | Yes |
| `ENCRYPTION_KEY` | 32-byte hex key for token encryption | Yes |
| `BACKEND_URL` | Public URL of backend (for OAuth callbacks) | Yes |
| `FRONTEND_URL` | Public URL of frontend (for redirects) | Yes |

### Production Deployment

For production, update the URLs to your domain:

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

## Development

```bash
# Install dependencies
npm install

# Run both frontend and backend
npm run dev

# Or run separately
cd backend && npm run dev
cd frontend && npm run dev
```

## License

MIT
