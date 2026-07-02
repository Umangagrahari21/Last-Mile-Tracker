# Last-Mile Delivery Tracker

A comprehensive logistics tracking platform featuring role-based portals for customers, delivery agents, and system administrators.

---

## Setup — Backend

Follow these steps to run the Node.js + Express + Prisma backend locally:

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in the values:
   ```bash
   cp .env.example .env
   ```
   Provide valid values for:
   - `DATABASE_URL` (PostgreSQL Connection String)
   - `JWT_SECRET` (A strong random secret)
   - `GMAIL_USER` (Nodemailer Gmail username)
   - `GMAIL_APP_PASSWORD` (Gmail 16-character App Password)
4. **Deploy Database Schema**:
   Run the Prisma migration to set up database tables:
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```
5. **Seed the Database**:
   Populate initial zones, areas/pincodes, rate cards, and the default admin user:
   ```bash
   node prisma/seed.js
   ```
6. **Start the server**:
   ```bash
   node src/index.js
   ```

---

## Setup — Frontend

Follow these steps to run the Vite + React client locally:

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in the values:
   ```bash
   cp .env.example .env
   ```
   Set the API endpoint:
   - `VITE_API_BASE_URL=http://localhost:5000`
4. **Start the development server**:
   ```bash
   npm run dev
   ```

---

## DB Schema

The PostgreSQL database models are defined below:

| Model Name | Fields | Description |
| :--- | :--- | :--- |
| **User** | `id`, `name`, `email`, `passwordHash`, `role` (`CUSTOMER` / `AGENT` / `ADMIN`), `createdAt` | Stores user credentials, profiles, and roles. |
| **Agent** | `id`, `userId`, `status` (`AVAILABLE` / `BUSY` / `OFFLINE`), `currentZoneId` | Represents delivery driver profiles mapped to users. |
| **Zone** | `id`, `name` | Geographic shipping zones (North, South, East, West). |
| **Area** | `id`, `pincode` (Unique), `name`, `zoneId` | Individual pincode locations mapped to a parent Zone. |
| **RateCard** | `id`, `zoneFromId`, `zoneToId`, `orderType` (`B2C`/`B2B`), `ratePerKg`, `codSurcharge` | Price metrics mapping zones pairs and customer segments. |
| **Order** | `id`, `customerId`, `agentId`, `agentProfileId`, `pickupAddress`, `pickupPincode`, `dropAddress`, `dropPincode`, `pickupZoneId`, `dropZoneId`, `length`, `breadth`, `height`, `actualWeight`, `volumetricWeight`, `billedWeight`, `ratePerKg`, `baseCharge`, `codSurcharge`, `totalCharge`, `orderType`, `paymentType`, `status`, `scheduledDate`, `createdAt` | Core shipment records detailing paths, weights, and charges. |
| **TrackingLog** | `id`, `orderId`, `status`, `actorId`, `note`, `createdAt` | Append-only immutable log for delivery status changes. |
| **Reschedule** | `id`, `orderId`, `newDate`, `reason`, `createdAt` | Records rescheduled dates and reasons for failed attempts. |

---

## API Docs

The following routes are available in the Express API:

### Auth Endpoints

| Method | Path | Auth | Request Body | Response | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Public | `{ name, email, password, role }` | `{ token, user: { id, name, email, role } }` | Registers user. If `role` is `AGENT`, creates agent profile. |
| **POST** | `/api/auth/login` | Public | `{ email, password }` | `{ token, user: { id, name, email, role } }` | Logs in and issues JWT. |

### Orders & Logistics Endpoints (Section 3.7 + 3.10)

| Method | Path | Auth | Request Body | Response | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/orders/preview` | Verified User | `{ pickupPincode, dropPincode, length, breadth, height, actualWeight, orderType, paymentType }` | `{ volumetricWeight, billedWeight, ratePerKg, baseCharge, codSurcharge, totalCharge, pickupZoneId, dropZoneId }` | Runs calculations. Does not write to DB. |
| **POST** | `/api/orders` | Customer / Admin | Same as preview + `{ pickupAddress, dropAddress, customerId? }` | Complete `Order` object | Creates new order, writes tracking log, sends mail. |
| **GET** | `/api/orders` | Verified User | Query params: `?status=&zoneId=&agentId=` | Array of `Order` objects | Role-aware list. Customer reads own, Agent reads assigned, Admin reads all. |
| **GET** | `/api/orders/:id` | Verified User | None | Detailed `Order` with `trackingLogs` & `reschedules` | Returns details for authorized users. |
| **GET** | `/api/orders/:id/tracking` | Verified User | None | Array of `TrackingLog` objects | Returns status log list sorted by date desc. |
| **POST** | `/api/orders/:id/assign` | Admin Only | `{ agentId }` | `{ message }` | Manually assigns agent, sets agent busy, updates status. |
| **POST** | `/api/orders/:id/auto-assign` | Admin Only | None | `{ message, agentName }` | Auto-assigns nearest agent. |
| **PATCH** | `/api/orders/:id/status` | Agent / Admin | `{ status, note?, rescheduleDate? }` | Updated `Order` object | Updates status after validating transitions. Frees agent on delivery/fail. |
| **POST** | `/api/orders/:id/reschedule` | Customer Only | `{ newDate, reason }` | `{ order, autoAssigned, agentName }` | Reschedules failed order, changes status to `RESCHEDULED`, triggers auto-assign. |

---

## Rate Calculation

The shipping price engine follows these calculations:

1. **Volumetric Weight**: Evaluates package volume using the formula `(length * breadth * height) / 5000`. The result is in kg, rounded to 2 decimals.
2. **Billed Weight**: Calculated as `Math.max(actualWeight, volumetricWeight)`, rounded to 2 decimals.
3. **Zone Detection**: Determines the pickup zone and drop zone by mapping the customer's pickup and drop pincodes through the `Area` database table.
4. **Rate Card Lookup**: Looks up the `RateCard` record matching the pickup zone, drop zone, and shipping segment (`B2B` or `B2C`).
5. **Base Charge**: Calculated as `billedWeight * rateCard.ratePerKg`, rounded to 2 decimals.
6. **COD Surcharge**: If `paymentType === 'COD'`, applies the zone pair's `codSurcharge` (e.g. ₹25). For `PREPAID`, the surcharge is `0`.
7. **Total Charge**: The final shipping cost equals `baseCharge + codSurcharge`.

---

## Hosted URL

- **Frontend App (Vercel)**: `https://lastmile-tracker-frontend.vercel.app` (Placeholder)
- **Backend API (Railway)**: `https://lastmile-tracker-backend.up.railway.app` (Placeholder)
