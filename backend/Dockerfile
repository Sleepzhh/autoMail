FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and prisma schema
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Create data directory for SQLite
RUN mkdir -p /app/data

EXPOSE 4000

# Run migrations and start server
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
