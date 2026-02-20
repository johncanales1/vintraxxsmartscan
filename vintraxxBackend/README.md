# VinTraxx SmartScan Backend

OBD-II Vehicle Diagnostic Report System Backend. Receives scan data from a React Native mobile app, processes it with OpenAI GPT-4o, generates PDF reports, and emails them to users.

## Tech Stack

- **Runtime:** Node.js 20+ with TypeScript (strict mode)
- **Framework:** Express.js
- **Database:** PostgreSQL with Prisma ORM
- **AI:** OpenAI GPT-4o (structured outputs)
- **PDF:** Puppeteer (HTML → PDF)
- **Email:** Nodemailer (SendGrid SMTP)
- **VIN Decoding:** NHTSA vPIC API (free)
- **Validation:** Zod
- **Auth:** JWT (access + refresh tokens)

## Setup

### Prerequisites

- Node.js 20+
- PostgreSQL database
- OpenAI API key
- SendGrid account (for email)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env
# Edit .env with your actual values

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Start development server
npm run dev
```

### Production

```bash
npm run build
npm start
```

## API Endpoints

### Auth (`/api/v1/auth`)

| Method | Endpoint        | Description              |
|--------|-----------------|--------------------------|
| POST   | /check-email    | Check if email exists    |
| POST   | /send-otp       | Send OTP to email        |
| POST   | /verify-otp     | Verify OTP code          |
| POST   | /register       | Register new user        |
| POST   | /login          | Login existing user      |

### Scan (`/api/v1/scan`) — Requires Auth

| Method | Endpoint          | Description                |
|--------|-------------------|----------------------------|
| POST   | /submit           | Submit OBD-II scan data    |
| GET    | /report/:scanId   | Get report (poll for completion) |
| GET    | /history          | Get user's scan history    |

### Health

| Method | Endpoint        | Description      |
|--------|-----------------|------------------|
| GET    | /api/v1/health  | Health check     |

## Processing Pipeline

1. **Receive** scan data → save to DB → return scanId immediately
2. **Decode VIN** via NHTSA API → extract year/make/model
3. **AI Analysis** via GPT-4o → structured diagnostic report
4. **Generate PDF** via Puppeteer → save to `./reports/`
5. **Email Report** via SendGrid SMTP → send PDF attachment
6. **Complete** → mobile app polls and receives full report

## Environment Variables

See `.env.example` for all required configuration values.

## License

Proprietary - VinTraxx Inc.
