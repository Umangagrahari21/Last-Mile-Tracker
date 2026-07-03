# 🚀 Last-Mile Delivery Tracker

A **full-stack last-mile logistics management platform** built with React, Node.js, Express, and PostgreSQL (via Prisma ORM). The system provides role-based portals for **Customers**, **Delivery Agents**, and **Administrators** with real-time tracking, automated agent assignment, and email notifications at every delivery milestone.

---

## 📋 Table of Contents
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#-environment-variables)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
- [Rate Calculation Engine](#-rate-calculation-engine)
- [Deployment](#-deployment)

---

## ✨ Features

### Customer Portal
- ✅ Register, login (Email + Google OAuth)
- ✅ Place orders with real-time **charge preview** (volumetric + billed weight, COD surcharge)
- ✅ Track orders via live timeline with status logs
- ✅ Reschedule failed deliveries with an auto-reassigned agent
- ✅ Email notifications at every delivery status change

### Admin Portal
- ✅ Separate secured admin login at `/admin/login`
- ✅ Dashboard with live analytics (order counts, agent statuses, zone heatmaps)
- ✅ Manage **Zones** and **Areas** (pincode-to-zone mapping)
- ✅ Configure **Rate Cards** (B2B/B2C intra/inter-zone rates + COD surcharge per zone pair)
- ✅ Create orders on behalf of any registered customer (3-step modal)
- ✅ Manually assign or **auto-assign** the nearest available delivery agent
- ✅ View and manage all orders with full filtering support

### Agent Portal
- ✅ View assigned deliveries
- ✅ Update delivery status in sequence (Picked Up → In Transit → Out for Delivery → Delivered / Failed)
- ✅ Each status update triggers a customer email notification

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS |
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL (Neon Cloud) via Prisma ORM |
| **Authentication** | JWT (JSON Web Tokens) + Google OAuth 2.0 |
| **Email** | Nodemailer (Gmail SMTP) |
| **Deployment** | Vercel (Frontend + Backend) |

---

## 📂 Project Structure

```
Last-Mile Delivery Tracker/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database models
│   │   ├── seed.js                # Seeds default admin, zones, rate cards
│   │   └── migrations/            # Prisma migration files
│   ├── src/
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT verification middleware
│   │   │   ├── role.js            # Role-based access control
│   │   │   └── errorHandler.js    # Global error handler
│   │   ├── routes/
│   │   │   ├── auth.routes.js     # Register, Login, Google Login
│   │   │   ├── order.routes.js    # Orders CRUD + assign + reschedule
│   │   │   ├── admin.routes.js    # Dashboard metrics + customer list
│   │   │   ├── agent.routes.js    # Agent management
│   │   │   ├── zone.routes.js     # Zone + Area management
│   │   │   └── ratecard.routes.js # Rate card configuration
│   │   ├── services/
│   │   │   ├── agentAssigner.js   # Auto-assign nearest available agent
│   │   │   ├── rateCalculator.js  # Volumetric weight + charge engine
│   │   │   ├── zoneDetector.js    # Pincode-to-zone resolution
│   │   │   └── notificationService.js # Nodemailer email templates
│   │   ├── app.js                 # Express app + CORS + routes
│   │   └── index.js               # Server entry point
│   ├── .env.example               # Environment variable template
│   ├── package.json
│   └── vercel.json                # Vercel serverless deployment config
│
├── frontend/
│   ├── src/
│   │   ├── api/                   # Axios API client functions
│   │   ├── components/            # Reusable UI components (Navbar, Cards, etc.)
│   │   ├── context/               # React Context (Auth, Theme)
│   │   ├── hooks/                 # Custom hooks (useAuth, useOrders)
│   │   ├── pages/
│   │   │   ├── auth/              # Login, Register, AdminLogin
│   │   │   ├── admin/             # Dashboard, Orders, Zones, RateCards, Agents
│   │   │   ├── agent/             # MyDeliveries, UpdateStatus
│   │   │   └── customer/          # PlaceOrder, MyOrders, TrackOrder
│   │   ├── App.jsx                # Routes + role-based navigation
│   │   ├── main.jsx               # React entry point
│   │   └── index.css              # Global design tokens + animations
│   ├── .env.example               # Frontend environment variable template
│   ├── vercel.json                # SPA route rewrite config for Vercel
│   ├── vite.config.js
│   └── package.json
│
├── .gitignore                     # Excludes node_modules, .env, dist, build
├── render.yaml                    # Render.com blueprint config
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+
- **npm** v9+
- A **PostgreSQL** database (Neon.tech free tier recommended)
- A **Gmail** account with an [App Password](https://myaccount.google.com/apppasswords) generated

---

### Backend Setup

```bash
# 1. Navigate to backend
cd backend

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env
# → Fill in DATABASE_URL, JWT_SECRET, GMAIL_USER, GMAIL_APP_PASSWORD

# 4. Run database migrations
npx prisma migrate dev --name init
npx prisma generate

# 5. Seed initial data (admin user, zones, areas, rate cards)
node prisma/seed.js

# 6. Start the server
node src/index.js
# → Backend runs on http://localhost:5000
```

---

### Frontend Setup

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env
# → Set VITE_API_BASE_URL=http://localhost:5000

# 4. Start development server
npm run dev
# → Frontend runs on http://localhost:5173
```

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (Neon/Supabase/local) |
| `JWT_SECRET` | ✅ | Random secret string (min 32 characters) |
| `GMAIL_USER` | ✅ | Gmail address used to send notification emails |
| `GMAIL_APP_PASSWORD` | ✅ | 16-character [Google App Password](https://myaccount.google.com/apppasswords) |
| `FRONTEND_URL` | ✅ | Your frontend URL for CORS (e.g. `http://localhost:5173`) |
| `PORT` | Optional | Server port (defaults to `5000`) |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | ✅ | Backend API URL (e.g. `http://localhost:5000`) |
| `VITE_GOOGLE_CLIENT_ID` | Optional | Google OAuth Client ID to enable Google Login |

---

## 🗄 Database Schema

| Model | Key Fields | Purpose |
|---|---|---|
| **User** | `id`, `name`, `email`, `passwordHash`, `role` | Stores credentials & roles (CUSTOMER / AGENT / ADMIN) |
| **Agent** | `userId`, `status`, `currentZoneId` | Delivery agent profile with availability status |
| **Zone** | `id`, `name` | Geographic delivery zones (North, South, East, West) |
| **Area** | `pincode`, `name`, `zoneId` | Pincode-to-zone mapping |
| **RateCard** | `zoneFromId`, `zoneToId`, `orderType`, `ratePerKg`, `codSurcharge` | Pricing matrix per zone pair and order segment |
| **Order** | `customerId`, `agentId`, `status`, `totalCharge`, `scheduledDate` | Core shipment record with full charge breakdown |
| **TrackingLog** | `orderId`, `status`, `actorId`, `note` | Immutable append-only status history |
| **Reschedule** | `orderId`, `newDate`, `reason` | Failed delivery reschedule records |

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register new CUSTOMER or AGENT |
| POST | `/api/auth/login` | Public | Login with email + password |
| POST | `/api/auth/google-login` | Public | Login or register via Google OAuth |

### Orders
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/orders/preview` | User | Preview charge without creating order |
| POST | `/api/orders` | Customer/Admin | Create new order |
| GET | `/api/orders` | User | List orders (role-filtered) |
| GET | `/api/orders/:id` | User | Get order with tracking timeline |
| POST | `/api/orders/:id/assign` | Admin | Manually assign agent |
| POST | `/api/orders/:id/auto-assign` | Admin | Auto-assign nearest agent |
| PATCH | `/api/orders/:id/status` | Agent/Admin | Update delivery status |
| POST | `/api/orders/:id/reschedule` | Customer | Reschedule failed delivery |

### Admin
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/dashboard` | Admin | Dashboard metrics |
| GET | `/api/admin/customers` | Admin | List all customers |

---

## 💰 Rate Calculation Engine

The shipping cost is computed by `backend/src/services/rateCalculator.js`:

1. **Volumetric Weight** = `(length × breadth × height) / 5000` kg
2. **Billed Weight** = `Math.max(actualWeight, volumetricWeight)`
3. **Zone Detection** → Resolves pickup and drop pincodes to zones
4. **Rate Card Lookup** → Finds price matrix for zone pair + B2B/B2C type
5. **Base Charge** = `billedWeight × ratePerKg`
6. **COD Surcharge** = `rateCard.codSurcharge` if `paymentType === 'COD'`, else `0`
7. **Total Charge** = `baseCharge + codSurcharge`

---

## 🌐 Deployment

The application is structured for full **Vercel** deployment (both frontend and backend):

- **Frontend**: Vite build with `vercel.json` SPA rewrites → deployed as Vercel static site
- **Backend**: Express.js wrapped as `@vercel/node` serverless function via `backend/vercel.json`

> **Note**: For production deployments, update `FRONTEND_URL` in the backend environment variables to your Vercel frontend domain.

---

## 👤 Default Admin Credentials

After running `node prisma/seed.js`, a default admin account is created:

| Field | Value |
|---|---|
| Email | `admin@lastmile.com` |
| Password | `admin123` |

> ⚠️ **Change these credentials immediately** in a production environment.

---

## 📧 Email Notifications

Customers receive automated HTML emails at each of these milestones:

| Status | Email Subject |
|---|---|
| CREATED | ✅ Order Confirmed |
| ASSIGNED | 🚚 Agent Assigned to Your Order |
| PICKED_UP | 📦 Package Picked Up |
| IN_TRANSIT | 🔄 Your Package is In Transit |
| OUT_FOR_DELIVERY | 🛵 Out for Delivery Today |
| DELIVERED | 🎉 Package Delivered Successfully |
| FAILED | ⚠️ Delivery Failed — Reschedule Required |
| RESCHEDULED | 📅 Delivery Rescheduled |
