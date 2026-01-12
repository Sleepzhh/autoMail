FROM node:20-alpine

# Install build dependencies for better-sqlite3 native module
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Install dependencies (including dev for ts-node)
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Create data directory for SQLite
RUN mkdir -p /app/data

EXPOSE 4000

CMD ["npm", "start"]
