# 🚀 FreelanceFlow

FreelanceFlow is a premium, production-ready, full-stack SaaS application built as an **AI-powered business management platform** tailored specifically for freelancers. It provides a central workspace to handle clients, manage project milestones, track billable time, generate clean PDF invoices, run AI-assisted proposals, and protect forms with secure authentication and bot validation.

---

## 🌟 Core Feature Overview

### 🔐 Authentication & Security
*   **Google One Tap & OAuth**: Seamless onboarding and sign-in using Google accounts.
*   **Secure JWT Authentication**: Stateless session management with rotating access tokens and HTTP-only cookie-stored refresh tokens.
*   **Google reCAPTCHA v2 (Checkbox)**: Bot protection enabled on signup, login, and forgot-password endpoints.
*   **Email Verification Flow**: Account activation system powered by Nodemailer.
    *   *Developer Tip*: In local development mode, verification and password reset links are printed directly to the backend terminal console for fast verification.

### 💼 Profile & Specialization
*   **Industry Selection**: Ability for freelancers to select one or more industries / specializations (e.g., *Web Development*, *Mobile Development*, *UI/UX Design*, *Data Science*, etc.) at registration or manage them directly from the profile settings.

### 👥 Client & Project Management
*   **Client Database**: Track client profiles, contacts, and contract terms.
*   **Milestone Tracking**: Manage projects with milestones, deadlines, and current progress.

### ⏱️ Time Tracking & Invoicing
*   **Time Tracker**: Log time spent on various projects with manual entry logs.
*   **PDF Invoicing**: Generate professional PDF invoices directly from billable milestones and download them immediately.
*   **Automatic Overdue Scans**: A background cron scheduler automatically checks and alerts clients about overdue invoices.

### 🧠 AI Assistant
*   **Proposal Writer**: Automatically drafts personalized project proposals using OpenAI.
*   **Rate Advisor**: Analyzes project complexity and recommends optimal freelance rates.
*   **Health Scorer**: Computes a project health score based on active parameters.

---

## 🛠️ Technology Stack

### Backend API (`/backend`)
*   **Core**: Express.js, Node.js, TypeScript
*   **Database**: MongoDB & Mongoose ORM
*   **Testing**: Jest + Supertest (comprehensive endpoint test suites)
*   **Security**: Helmet (secure HTTP headers), CORS, express-rate-limit
*   **Logging**: Winston Logger (generates logs to `logs/combined.log` and `logs/error.log`)

### Frontend Web App (`/frontend`)
*   **Core**: Next.js 15 (App Router), React, TypeScript
*   **Styling**: Vanilla CSS with modern aesthetics (Outfit, Inter, custom glassmorphism components)
*   **Form Management**: react-hook-form + Zod Resolver
*   **Animation**: Framer Motion

---

## 📁 Project Structure

```text
FreelanceFlow/
├── backend/            # Express.js + TypeScript API
│   ├── config/         # Database connection configuration (Mongoose)
│   ├── controllers/    # API controllers containing core business logic
│   ├── logs/           # Winston runtime log files
│   ├── middleware/     # Auth, error, rate-limiting, and reCAPTCHA middleware
│   ├── models/         # MongoDB schema definitions (User, Client, Project, TimeEntry, Invoice)
│   ├── routes/         # Express API routers
│   ├── services/       # External integrations (Mail service, OpenAI API)
│   ├── tests/          # Jest + Supertest integration tests
│   ├── validators/     # Zod input validation schemas
│   └── package.json
├── frontend/           # Next.js 15 App
│   ├── app/            # App Router pages (Dashboard, Settings, Invoices, Time Tracking)
│   ├── components/     # Reusable layout and custom UI components
│   ├── context/        # React Context stores (Authentication, UI states)
│   ├── hooks/          # Custom React Hooks
│   ├── lib/            # Axios API client instances and zod validators
│   └── package.json
└── README.md           # Project Documentation (This File)
```

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have the following installed on your system:
*   [Node.js](https://nodejs.org/) (v18 or higher)
*   [MongoDB](https://www.mongodb.com/) (either running locally or a free MongoDB Atlas cluster)

---

### 2. Configuration Setup

Configure your environment variables before booting the application.

#### Backend Configuration (`/backend/.env`)
Create a `.env` file in the `backend` folder and configure the following variables:
```env
PORT=5000
NODE_ENV=development

# Database Connection
MONGODB_URI=mongodb://[username]:[password]@host:port/freelaceflow?ssl=true&authSource=admin

# JWT Authentication Secrets
JWT_SECRET=your_jwt_access_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key

# Email (SMTP) Configuration (e.g. Brevo, Sendgrid, Mailtrap)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
SMTP_FROM=your_verified_sender_email@domain.com

# AI Integration (OpenAI API)
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini

# reCAPTCHA Credentials
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

#### Frontend Configuration (`/frontend/.env.local`)
Create a `.env.local` file in the `frontend` folder:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

---

### 3. Installation

Install the required node modules in both directories:

```bash
# Install backend packages
cd backend
npm install

# Install frontend packages
cd ../frontend
npm install
```

---

### 4. Running the App Locally

Start the development servers simultaneously in separate terminals:

#### Run Backend API:
```bash
cd backend
npm run dev
```
*   Server runs at: `http://localhost:5000`

#### Run Frontend Web App:
```bash
cd frontend
npm run dev
```
*   Client runs at: `http://localhost:3000`

---

## 🧪 Running Automated Tests

A suite of integration tests is included to verify all backend API endpoints. Run the following command inside the `backend` folder:

```bash
cd backend
npm run test
```

This runs Jest across all endpoints (Authentication, Clients, Projects, and Invoices) and outputs the results in the terminal.

---

## 📈 Maintaining & Extending

1.  **Adding new database collections**:
    *   Create a schema in `/backend/models/`.
    *   Ensure any incoming payload is validated using Zod in `/backend/validators/`.
2.  **Modifying UI pages**:
    *   Next.js pages are inside `/frontend/app/`.
    *   Custom layout components and design system variables are in `/frontend/components/` and `/frontend/app/globals.css`.
3.  **Local API changes**:
    *   All Axios calls are managed under `/frontend/lib/api/`. Make sure to update the interfaces there when modifying backend return parameters.
