# QLess — Intelligent Real-Time Queue Management System

> A full-stack multi-tenant SaaS platform that eliminates physical queues using real-time token management, live dashboards, and role-based access control.

![Tech Stack](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![MySQL](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

---

## 📸 Features

- 🎫 **Real-Time Token Booking** — Customers book tokens online and track their status live
- ⚡ **Socket.IO Live Updates** — Status changes instantly without page refresh
- 👥 **4 Role System** — Customer, Staff, Admin, Super Admin
- 🏢 **Multi-Tenant** — Supports multiple organizations (Apollo Hospital, SBI Bank, Passport Office)
- 📊 **Analytics Dashboards** — Peak hours, service distribution, daily trends with Recharts
- 🔔 **Real-Time Notifications** — Bell alerts when token is called
- 🔒 **JWT Authentication** — Secure login with role-based access control
- 📋 **Audit Logs** — Full timeline of all system events
- 🌙 **Dark Mode UI** — Premium glassmorphism design

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Real-Time | Socket.IO |
| Auth | JWT (JSON Web Tokens) |
| Security | Helmet, Rate Limiting, bcryptjs |

---

## 📁 Project Structure

```
qless/
├── backend/                  # Node.js + Express API
│   ├── config/
│   │   └── db.js             # MySQL connection pool
│   ├── controllers/          # Business logic
│   │   ├── authController.js
│   │   ├── tokenController.js
│   │   ├── adminController.js
│   │   ├── organizationController.js
│   │   ├── superAdminController.js
│   │   └── notificationController.js
│   ├── middleware/
│   │   └── auth.js           # JWT verification + role guard
│   ├── routes/               # API route definitions
│   ├── seeds/
│   │   └── seed.js           # Demo data seeder
│   ├── socket/
│   │   └── index.js          # Socket.IO event handlers
│   ├── .env                  # Environment variables
│   └── server.js             # Entry point
│
├── frontend/                 # React + Vite App
│   └── src/
│       ├── components/       # Reusable UI components
│       │   ├── Layout.jsx
│       │   ├── Sidebar.jsx
│       │   ├── Topbar.jsx
│       │   └── StatCard.jsx
│       ├── context/
│       │   ├── AuthContext.jsx   # Login/logout state
│       │   └── SocketContext.jsx # Socket.IO connection
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── customer/     # Book token, track status, live queue
│       │   ├── staff/        # Counter dashboard
│       │   ├── admin/        # KPI, analytics, audit logs
│       │   └── superAdmin/   # Platform overview
│       └── services/
│           └── api.js        # Axios instance with JWT headers
│
└── database/
    ├── schema.sql            # Full MySQL schema
    └── migrate.sql           # Migration script
```

---

## ⚙️ Prerequisites

Make sure you have these installed:

- [Node.js](https://nodejs.org/) v18+
- [MySQL](https://dev.mysql.com/downloads/) v8.0+
- npm v9+

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/qless.git
cd qless
```

### 2. Set Up the Database

Open MySQL and run the schema:

```bash
mysql -u root -p < database/schema.sql
```

### 3. Configure Environment Variables

The file `backend/.env` should contain:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=qless
DB_PORT=3306

JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=24h

CLIENT_URL=http://localhost:5173
```

> ⚠️ Create this file and add your MySQL password.

### 4. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 5. Seed Demo Data

```bash
cd backend
npm run seed
```

### 6. Run the Application

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd backend
npm start
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

### 7. Open in Browser

👉 **http://localhost:5173**

---

## 🔑 Demo Login Credentials

> Password for all accounts: **`password123`**

### 🏥 Apollo Hospital
| Role | Email | Service |
|------|-------|---------|
| Admin | `admin@apollo.com` | Full dashboard |
| Staff | `staff1@apollo.com` | Cardiology (CAR) |
| Staff | `staff2@apollo.com` | General Consultation (CON) |
| Staff | `staff3@apollo.com` | Lab Tests (LAB) |
| Staff | `staff4@apollo.com` | Pharmacy (PHR) |

### 🏦 SBI Bank
| Role | Email | Service |
|------|-------|---------|
| Admin | `admin@sbi.com` | Full dashboard |
| Staff | `staff1@sbi.com` | Account Opening (ACC) |
| Staff | `staff2@sbi.com` | Cash Deposit (DEP) |
| Staff | `staff3@sbi.com` | Loan Enquiry (LON) |
| Staff | `staff4@sbi.com` | General Enquiry (GEN) |

### 🛂 Passport Office
| Role | Email | Service |
|------|-------|---------|
| Admin | `admin@passport.com` | Full dashboard |
| Staff | `staff1@passport.com` | New Passport (NEW) |
| Staff | `staff2@passport.com` | Passport Renewal (REN) |
| Staff | `staff3@passport.com` | Tatkal Service (TAT) |
| Staff | `staff4@passport.com` | Document Verification (DOC) |

### Others
| Role | Email |
|------|-------|
| Super Admin | `superadmin@qless.com` |
| Customer | `customer@example.com` |

---

## 🔄 How It Works — Full Flow

```
Customer books token → Status: WAITING
        ↓
Staff clicks "Call Next" → Status: CALLED  ← Customer notified in real-time
        ↓
Staff clicks "Start" → Status: IN_SERVICE
        ↓
Staff clicks "Complete" → Status: COMPLETED ← Admin dashboard updates live
```

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new account |
| POST | `/api/auth/login` | Login and get JWT |
| GET | `/api/auth/me` | Get current user profile |

### Organizations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/organizations` | List all organizations |
| GET | `/api/organizations/:id/branches` | Get branches |
| GET | `/api/organizations/branches/:id/services` | Get services |

### Tokens
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tokens/book` | Book a queue token |
| GET | `/api/tokens/user/active` | Get my active token |
| GET | `/api/tokens/live/service/:id` | Get live queue |
| POST | `/api/tokens/call` | Call next token (staff) |
| POST | `/api/tokens/:id/start` | Start service (staff) |
| POST | `/api/tokens/:id/complete` | Complete service (staff) |
| POST | `/api/tokens/:id/skip` | Skip token (staff) |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | KPI dashboard data |
| GET | `/api/admin/analytics` | Charts data |
| GET | `/api/admin/audit-logs` | Audit log timeline |

---

## ⚡ Real-Time Events (Socket.IO)

| Event | Description |
|-------|-------------|
| `queue:update` | Queue changed for a service |
| `admin:update` | Admin dashboard should refresh |
| `notification` | New notification for a user |

---

## 🗄️ Database Schema

8 tables supporting full multi-tenancy:

- `organizations` — Tenants (Apollo, SBI, Passport)
- `branches` — Physical locations per org
- `services` — Service types per branch
- `users` — All users with role-based access
- `counters` — Staff serving windows
- `tokens` — Queue tokens with full lifecycle
- `notifications` — Real-time alerts
- `audit_logs` — Immutable activity trail

---

## 🔒 Security Features

- JWT-based authentication with role guards
- Bcrypt password hashing (10 salt rounds)
- Helmet.js security headers
- Express Rate Limiting
- SQL injection prevention via parameterized queries
- CORS configured for frontend origin only

---

## 👤 Author

Built with ❤️ by **[Saranya K](https://github.com/SaranyaK-0709)**  

