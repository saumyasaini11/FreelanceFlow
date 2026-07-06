# FreelanceFlow Backend

AI-powered business management platform for freelancers — Backend API Service built with Express and TypeScript.

## Tech Stack
- **Framework**: Express.js
- **Language**: TypeScript (ts-node, nodemon)
- **Database**: MongoDB & Mongoose
- **Security & Utilities**: Helmet, CORS, express-rate-limit
- **Logging**: Winston logger (logs to console and files in `/logs`)
- **Testing**: Jest + Supertest

## Setup Instructions

1. **Environment Variables**:
   Copy `.env.example` to `.env` and fill out the details:
   ```bash
   cp .env.example .env
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run Dev Server**:
   ```bash
   npm run dev
   ```
   Starts the backend service locally at `http://localhost:5000`.

4. **Run Tests**:
   ```bash
   npm run test
   ```
