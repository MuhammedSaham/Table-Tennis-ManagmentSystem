# 🏓 Sam's College Table Tennis Management System (TTMS)

[![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20TypeScript-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Bundler-Vite%208-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

A modern, full-stack table tennis tournament orchestration, match officiating, and club membership management platform engineered for **Sam's College**. The system automates tournament bracket draws, enables live digital scorekeeping, streamlines doubles partnerships, and manages club rankings.

---

## 🌟 Key Features

### 🏆 1. Tournament & Bracket Engine
* **Intelligent Seeding (Choice B)**: Canonical seeded placement anchors top seeds (e.g., Seed 1 & 2) on opposite ends of the bracket so they can only face off in the Grand Final.
* **Random BYE Lottery**: Automatically allocates BYE matches via an unbiased random draw for non-power-of-two participant pools.
* **Multiple Tournament Formats**: Full support for Single Knockout and Group Stage + Knockout progression.
* **Division Entry**: Dynamic enrollment for Singles, Men's Doubles, Women's Doubles, and Mixed Doubles with age & gender eligibility verification.

### ⚖️ 2. Match Officiating & Live Scoring
* **Official Referee Dashboard**: Dedicated interface for assigned referees to record sets, game points, and official match outcomes.
* **Instant Progression**: Match winners automatically advance to the next bracket round with real-time score updates across the system.
* **Group Standings Engine**: Live calculation of points, set differentials, matches won/lost, and tiebreak placements.

### 👥 3. Doubles Pairing & Partner Invitations
* **In-App Partnership Invites**: Players can invite partners directly from the tournament division card.
* **Strict Division Rules**: Automatic gender-matching validation for Men's Doubles, Women's Doubles, and Mixed Doubles.
* **Accept / Decline System**: Real-time notifications and action banners on player dashboards to accept or decline partnership requests.

### 🎴 4. Player Passport & Public Community
* **Public Player Profiles**: Shareable public profile pages with customizable QR codes and direct links.
* **Fan Favorites & Likes**: Club members and spectators can "Like" player profiles; players can view their total fan support badge directly on their profile header.
* **Club Rankings & H2H Statistics**: Complete performance breakdown, including win rates, total matches, head-to-head records, and official club ranking.

### 🛡️ 5. Role-Based Access Control (RBAC) & Governance
* **Multi-Role Structure**: Granular permission model spanning **Super Admin**, **Admin**, **Referee**, and **Player**.
* **Admin Privilege Control**: Super Admins can selectively grant or revoke operational permissions (e.g., Manage Tournaments, Users, Referees, Results, Rankings).
* **Audit Trail Logging**: Full system audit log tracking critical administrative actions with downloadable, print-ready PDF export.

### 💳 6. Membership & Payment Processing
* **Club Membership Verification**: Allows players to apply for official club membership and upload verification credentials.
* **Payment Slip Upload**: Tournament participants can upload payment receipts (JPG, PNG, PDF) for admin review and approval.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Heroicons, React Router v6, Axios, React Hot Toast |
| **Backend** | Node.js, Express.js, TypeScript, RESTful API architecture |
| **Database & ORM** | PostgreSQL, Prisma ORM |
| **Authentication & Security** | JWT (JSON Web Tokens), Bcrypt password hashing, Role/Permission Middleware |
| **File Handling** | Multer for secure multipart uploads (payment slips, profile images) |

---

## 📁 Repository Structure

```text
Table-Tennis-ManagmentSystem/
├── table-tennis-backend/         # Express REST API Server
│   ├── prisma/                   # Prisma schema, migrations, and seed script
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── controllers/          # Request handlers
│       ├── middleware/           # Auth, role check, and upload middlewares
│       ├── routes/               # API route definitions
│       ├── services/             # Business logic (bracket, auth, tournaments, teams)
│       └── server.ts             # Application entry point
│
├── table-tennis-frontend/        # React + Vite Frontend Application
│   ├── public/                   # Static branding assets and images
│   └── src/
│       ├── components/           # Reusable UI components (Brackets, Modals, Navbars)
│       ├── context/              # Global state (AuthContext)
│       ├── pages/                # Application routes and views
│       ├── services/             # Axios API client
│       └── utils/                # Helpers, date formatters, and status chips
│
└── README.md                     # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** (v18.0.0 or higher recommended)
* **npm** or **pnpm**
* **PostgreSQL** database (Local or cloud-hosted via Supabase / Neon / Render)

---

### 1. Backend Setup

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd table-tennis-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables by creating a `.env` file in `table-tennis-backend/`:
   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL="postgresql://username:password@localhost:5432/tabletennis?schema=public"
   JWT_SECRET="your-super-secure-jwt-secret-key-change-in-production"
   JWT_EXPIRES_IN="7d"
   FRONTEND_URL="http://localhost:5173"
   ```

4. Push database schema and seed default data:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

5. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The backend will be running at:* `http://localhost:5000`

---

### 2. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd table-tennis-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables by creating a `.env` file in `table-tennis-frontend/`:
   ```env
   VITE_API_URL="http://localhost:5000/api"
   ```

4. Launch the Vite development server:
   ```bash
   npm run dev
   ```
   *The application will open at:* `http://localhost:5173`

---

## 🔑 Default Seed Credentials

For evaluation and testing, you can use the pre-configured accounts created by the seed script:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `admin@tabletennis.com` | `admin123` |
| **Official Referee** | `referee@tabletennis.com` | `referee123` |

> *Tip: You can also register a new athlete account directly from the **Register** page on the frontend.*

---

## 📜 Key Scripts

### Backend (`/table-tennis-backend`)
* `npm run dev` - Starts the development server with live reload (`ts-node-dev`).
* `npm run build` - Compiles TypeScript to JavaScript in `/dist`.
* `npm start` - Runs the compiled production server.
* `npx prisma studio` - Launches the visual Prisma database manager.

### Frontend (`/table-tennis-frontend`)
* `npm run dev` - Starts the Vite development server.
* `npm run build` - Type-checks (`tsc -b`) and bundles for production (`vite build`).
* `npm run preview` - Locally previews the production build.

---

## 📄 License & Attribution

Developed for **Sam's College Table Tennis Club**.  
© 2026 Sam's College Table Tennis Management System. All rights reserved.

