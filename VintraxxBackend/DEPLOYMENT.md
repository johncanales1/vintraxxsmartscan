# Production Deployment Guide

## Environment Setup

1. **Set Environment Variables**
   ```bash
   cp .env.production .env
   # Update .env with your production values
   ```

2. **Database Setup**
   ```bash
   # Run database migrations
   npm run prisma:migrate:prod
   ```

3. **Build Application**
   ```bash
   npm run build:prod
   ```

4. **Start Production Server**
   ```bash
   npm run start:prod
   ```

## Required Production Services

- **PostgreSQL Database**: Update `DATABASE_URL` in `.env`
- **SendGrid API Key**: For email functionality
- **OpenAI API Key**: For AI-powered diagnostics

## Security Notes

- Generate secure JWT secrets (minimum 32 characters)
- Ensure database credentials are strong
- Use HTTPS in production
- Configure firewall rules appropriately

## Deployment Options

### Docker (Recommended)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build:prod
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

### Platform-as-a-Service
- Railway, Render, or Heroku
- Connect PostgreSQL add-on
- Set environment variables in platform dashboard

## Health Check
- `GET /api/v1/health` returns server status
