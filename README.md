# FreelanceFlow

FreelanceFlow is a production-ready, full-stack SaaS application built as an AI-powered business management platform for freelancers.

## Monorepo Project Structure

```text
FreelanceFlow/
├── backend/            # Express.js + TypeScript API
│   ├── config/         # Mongoose & DB setup
│   ├── logs/           # Application log files (error.log, combined.log)
│   ├── middleware/     # Error handlers & rate limiters
│   ├── tests/          # Jest + Supertest suites
│   ├── utils/          # Winston loggers
│   ├── .env.example
│   ├── package.json
│   └── README.md
├── frontend/           # Next.js 15 App
│   ├── app/            # App router paths
│   ├── components/     # UI & Theme providers
│   ├── lib/            # Utilities (shadcn/ui setup)
│   ├── .env.example
│   ├── package.json
│   └── README.md
└── README.md           # Root Instructions
```

## Quick Start Setup

### 1. Prerequisites
- Node.js (v18+)
- npm (v9+)
- MongoDB Atlas cluster (or local MongoDB server)
- SMTP Server details (Mailtrap, SendGrid, Gmail, etc.)
- OpenAI API Key

### 2. Environment Configurations
First, configure your environment files:
- **Backend Setup**:
  1. Navigate to `/backend`
  2. Copy `.env.example` to `.env`
  3. Fill in details (especially `MONGODB_URI`, `JWT_SECRET`, `SMTP_*`, and `OPENAI_API_KEY`)
- **Frontend Setup**:
  1. Navigate to `/frontend`
  2. Copy `.env.example` to `.env.local`
  3. Change the API base URL if hosting differently than `http://localhost:5000/api`

### 3. Installation
Install project dependencies in both folders:
```bash
# Install backend
cd backend
npm install

# Install frontend
cd ../frontend
npm install
```

### 4. Running the Applications
Run development servers for both workspaces:
- **Backend Dev Server**:
  ```bash
  cd backend
  npm run dev
  ```
  Runs at `http://localhost:5000` (API endpoint at `/api`).
- **Frontend Dev Server**:
  ```bash
  cd frontend
  npm run dev
  ```
  Runs at `http://localhost:3000`.

### 5. Running Backend Tests
Execute the Jest testing pipeline:
```bash
cd backend
npm run test
```
