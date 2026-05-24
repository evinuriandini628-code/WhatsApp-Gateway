#!/bin/bash
set -e

echo "=== WhatsApp Gateway Auto Deploy ==="
echo "$(date): Starting deployment..."

cd /home/wagateway/WhatsApp-Gateway

# Pull latest changes
echo "Pulling latest changes..."
git pull origin main

# Install dependencies
echo "Installing dependencies..."
pnpm install --frozen-lockfile

# Build
echo "Building project..."
pnpm run build

# Restart PM2 process
echo "Restarting server..."
pm2 restart wa-gateway || pm2 start server/dist/index.js --name wa-gateway

echo "$(date): Deployment complete!"
