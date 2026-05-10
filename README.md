# Fugigeek

> A platform that connects businesses with experienced professionals to complete tasks that help businesses grow.

## Stack

| Layer    | Technology |
|----------|------------|
| Frontend | React 18, Vite, Redux Toolkit, React Query, React Router v6 |
| Backend  | Node.js, Express.js |
| Database | MongoDB + Mongoose ODM |
| Auth     | JWT (jsonwebtoken + bcryptjs) |
| Storage  | AWS S3 (`@aws-sdk/client-s3` + `multer-s3`) |
| Payments | Stripe (PaymentIntents + webhooks) |
| Realtime | Socket.io |

---

## Quick Start

### 1. Install dependencies
```bash
npm run install:all
```

### 2. Configure environment
```bash
cp server/.env.example server/.env
```
Fill in your values:
- `MONGO_URI` — MongoDB Atlas connection string
- `JWT_SECRET` — any long random string
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` — IAM user credentials
- `AWS_REGION` — e.g. `us-east-1`
- `AWS_S3_BUCKET` — your bucket name (make sure public-read ACL is enabled)
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — from your Stripe dashboard
- `CLIENT_URL` — `http://localhost:5173` for development

### 3. Run in development
```bash
npm run dev
```
- Client: http://localhost:5173
- API:    http://localhost:5000
- Health: http://localhost:5000/api/health

---

## Project Structure

```
fugigeek/
├── package.json              # Root: concurrently runs both servers
├── client/                   # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx           # All routes + role guards
│   │   ├── main.jsx          # Redux + React Query + Router providers
│   │   ├── index.css         # Global styles + CSS variables
│   │   ├── api/              # Axios modules per resource
│   │   │   ├── axios.js      # Base instance + interceptors
│   │   │   ├── auth.js
│   │   │   ├── listings.js
│   │   │   ├── orders.js
│   │   │   ├── payments.js
│   │   │   └── users.js
│   │   ├── store/            # Redux Toolkit
│   │   │   ├── index.js
│   │   │   └── slices/
│   │   │       ├── authSlice.js   # JWT + localStorage
│   │   │       ├── cartSlice.js   # Checkout state
│   │   │       └── uiSlice.js     # Global UI state
│   │   ├── hooks/
│   │   │   ├── useAuth.js    # Auth actions + role flags
│   │   │   └── useSocket.js  # Socket.io connection
│   │   └── pages/
│   │       ├── Home.jsx
│   │       ├── Login.jsx
│   │       ├── Register.jsx          # 2-step role-based registration
│   │       ├── Listings.jsx          # Browse + filter tasks
│   │       ├── ListingDetail.jsx     # Task detail + proposal form
│   │       ├── PostTask.jsx          # Business: post a task
│   │       ├── BusinessDashboard.jsx
│   │       ├── ProfessionalDashboard.jsx
│   │       ├── OrderDetail.jsx       # Submit / approve / dispute
│   │       └── Professionals.jsx     # Browse professionals
└── server/                   # Express + Node.js backend
    ├── index.js              # App entry, Socket.io, routes
    ├── config/
    │   ├── db.js             # Mongoose connect
    │   └── s3.js             # AWS S3 client + Multer-S3 storage
    ├── middleware/
    │   ├── auth.js           # protect + authorize(role)
    │   └── errorHandler.js   # Global error → clean JSON
    ├── models/
    │   ├── User.js           # business + professional profiles
    │   ├── Task.js           # listings
    │   ├── Proposal.js       # bids on tasks
    │   ├── Order.js          # active engagements
    │   └── Review.js         # post-completion ratings
    ├── controllers/
    │   ├── authController.js
    │   ├── listingsController.js
    │   ├── ordersController.js
    │   ├── paymentsController.js
    │   ├── usersController.js
    │   └── reviewsController.js
    ├── routes/
    │   ├── auth.js
    │   ├── listings.js
    │   ├── orders.js
    │   ├── payments.js
    │   ├── users.js
    │   └── reviews.js
    └── utils/
        ├── asyncHandler.js
        └── generateToken.js
```

---

## API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register as business or professional |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET  | `/api/auth/me` | ✅ | Get current user |
| PUT  | `/api/auth/updateprofile` | ✅ | Update profile |
| PUT  | `/api/auth/updatepassword` | ✅ | Change password |
| POST | `/api/auth/forgotpassword` | — | Request reset link |
| PUT  | `/api/auth/resetpassword/:token` | — | Reset password |

### Listings (Tasks)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET  | `/api/listings` | — | Browse + filter tasks |
| GET  | `/api/listings/:id` | — | Task detail |
| POST | `/api/listings` | business | Post a new task |
| PUT  | `/api/listings/:id` | business | Edit task |
| DELETE | `/api/listings/:id` | business | Delete task |
| GET  | `/api/listings/my/tasks` | business | My posted tasks |
| GET  | `/api/listings/:id/proposals` | business | View proposals |
| POST | `/api/listings/:id/proposals` | professional | Submit proposal |
| PUT  | `/api/listings/:taskId/proposals/:proposalId/accept` | business | Accept proposal |

### Orders
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/orders` | business | Create order after accepting proposal |
| GET  | `/api/orders` | ✅ | My orders |
| GET  | `/api/orders/:id` | ✅ | Order detail |
| PUT  | `/api/orders/:id/submit` | professional | Submit deliverables |
| PUT  | `/api/orders/:id/complete` | business | Approve + release payment |
| PUT  | `/api/orders/:id/dispute` | ✅ | Raise a dispute |

### Payments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/payments/create-intent` | business | Create Stripe PaymentIntent |
| POST | `/api/payments/webhook` | — | Stripe webhook |
| GET  | `/api/payments/history` | ✅ | Payment history |

### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET  | `/api/users/professionals` | — | Browse professionals |
| GET  | `/api/users/:id` | — | Public profile + reviews |

### Reviews
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/reviews` | ✅ | Post a review (completed orders only) |
| GET  | `/api/reviews/user/:userId` | — | Get user reviews |

---

## User Roles

**Business**
- Post tasks with budget, deadline, required skills
- Review incoming proposals
- Accept a proposal → creates an order
- Fund the order via Stripe
- Approve delivered work → releases payment
- Leave reviews for professionals

**Professional**
- Browse and filter open tasks
- Submit proposals with a bid and cover letter
- Complete accepted orders and submit deliverables
- Build a rated profile and portfolio

---

## Platform Fee
10% deducted from the order amount before payout to the professional. Configurable in `server/controllers/ordersController.js` (`PLATFORM_FEE_PCT`).

---

## Next Steps
- [ ] Email notifications (SendGrid) for proposals, order updates
- [ ] Stripe Connect for direct professional payouts
- [ ] In-app messaging between business and professional
- [ ] Admin panel for dispute resolution
- [ ] Mobile-responsive UI polish
- [ ] Search indexing (Algolia or Atlas Search)
