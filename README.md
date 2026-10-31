# 🚗 Ride Compare

> A unified multi-provider ride booking and comparison platform.

Compare fares, ETAs, and vehicle categories across **Uber**, **Ola**, and other ride-hailing providers through a single application.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  React Frontend                      │
│   Location Search → Compare → Book → Track           │
├──────────────────────┬──────────────────────────────┤
│      REST API        │        Socket.IO              │
│  (Express + JWT)     │   (Real-time Tracking)        │
├──────────────────────┴──────────────────────────────┤
│               Service Layer                          │
│  AuthService · RideService · ProviderService         │
├─────────────────────────────────────────────────────┤
│           Provider Adapter Layer                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │   Uber   │  │   Ola    │  │   Mock   │  ← add   │
│  │ Adapter  │  │ Adapter  │  │ Adapter  │   more!  │
│  └──────────┘  └──────────┘  └──────────┘          │
├─────────────────────────────────────────────────────┤
│   MongoDB Atlas  │  Redis (optional)  │  Razorpay   │
└─────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (Mongoose) |
| Auth | JWT (access + refresh tokens), OAuth 2.0 |
| Real-time | Socket.IO |
| Maps | Google Maps Platform |
| Payments | Razorpay |
| Deployment | Vercel (frontend), Render (backend) |

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- npm 9+

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/ride-compare.git
cd ride-compare

# 2. Install dependencies
npm install

# 3. Configure environment
cp server/.env.example server/.env
# Edit server/.env with your credentials

# 4. Start development server
npm run dev:server
```

### Environment Variables

Copy `server/.env.example` to `server/.env` and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_ACCESS_SECRET` | ✅ | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | ✅ | Secret for signing refresh tokens |
| `ENCRYPTION_KEY` | ✅ prod | 32-byte hex key for AES-256 token encryption |
| `GOOGLE_MAPS_API_KEY` | ✅ prod | Google Maps Platform API key |
| `UBER_CLIENT_ID` | ❌ | Uber OAuth client ID |
| `OLA_APP_TOKEN` | ❌ | Ola API application token |
| `RAZORPAY_KEY_ID` | ❌ | Razorpay payment gateway key |

> Without Uber/Ola keys, the **Mock provider** is fully functional for development.

## API Endpoints

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Create account |
| POST | `/api/auth/login` | ❌ | Login |
| POST | `/api/auth/refresh-token` | ❌ | Refresh access token |
| POST | `/api/auth/logout` | ✅ | Logout |
| GET | `/api/auth/me` | ✅ | Get profile |
| PUT | `/api/auth/profile` | ✅ | Update profile |

### Rides
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/rides/estimate` | ✅ | Get fare estimates |
| POST | `/api/rides/book` | ✅ | Book a ride |
| GET | `/api/rides/history` | ✅ | Ride history |
| GET | `/api/rides/:id` | ✅ | Booking details |
| GET | `/api/rides/:id/track` | ✅ | Live tracking |
| POST | `/api/rides/:id/cancel` | ✅ | Cancel booking |
| POST | `/api/rides/:id/rate` | ✅ | Rate completed ride |

### Providers
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/providers` | ❌ | List providers |
| GET | `/api/providers/:id/auth` | ✅ | OAuth redirect URL |
| GET | `/api/providers/:id/callback` | - | OAuth callback |
| DELETE | `/api/providers/:id/unlink` | ✅ | Unlink provider |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Liveness check |
| GET | `/health/detailed` | Full readiness check |

## Adding a New Provider

The adapter pattern makes this straightforward:

1. Create `server/src/providers/<name>/`
2. Implement `<Name>Adapter.js` extending `ProviderAdapter`
3. Implement `<Name>ResponseMapper.js` for data normalization
4. Register in `server/src/providers/bootstrap.js`
5. Add config vars to `config/index.js` + `.env.example`

See [ProviderAdapter.js](server/src/providers/ProviderAdapter.js) for the interface contract.

## Project Structure

```
ride-compare/
├── server/
│   ├── src/
│   │   ├── config/          # Configuration, DB, logger, constants
│   │   ├── controllers/     # HTTP request handlers
│   │   ├── middleware/       # Auth, validation, rate limiting, errors
│   │   ├── models/           # Mongoose schemas (User, Booking)
│   │   ├── providers/        # Provider adapter system
│   │   │   ├── mock/         # Mock adapter (always available)
│   │   │   ├── uber/         # Uber API v1.2 adapter
│   │   │   ├── ola/          # Ola API adapter
│   │   │   ├── ProviderAdapter.js   # Abstract base class
│   │   │   ├── ProviderRegistry.js  # Adapter registry singleton
│   │   │   └── bootstrap.js         # Startup registration
│   │   ├── routes/           # Express route definitions
│   │   ├── services/         # Business logic
│   │   ├── socket/           # Socket.IO real-time tracking
│   │   ├── utils/            # Crypto, geo, fare, response utilities
│   │   ├── validators/       # Joi validation schemas
│   │   ├── app.js            # Express app factory
│   │   └── server.js         # Entrypoint
│   ├── .env.example
│   └── package.json
├── client/                   # React frontend (Sprint 2)
├── .gitignore
├── package.json              # Workspace root
└── README.md
```

## Development Roadmap

- [x] **Sprint 1:** Foundation & core infrastructure
- [ ] **Sprint 2:** Frontend, booking flow, real-time tracking
- [ ] **Sprint 3:** Payments, notifications, deployment

## License

MIT

