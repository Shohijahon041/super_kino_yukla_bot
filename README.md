<div align="center">

# 🎬 CinemaHub AI Ultimate

### Enterprise-Grade AI-Powered Movie & Series Platform

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![NestJS](https://img.shields.io/badge/NestJS-10.4-red)
![Next.js](https://img.shields.io/badge/Next.js-14.2-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)

---

**CinemaHub AI Ultimate** is a full-stack enterprise movie platform with AI-powered recommendations, Telegram bot integration, real-time streaming, payment processing, and a comprehensive admin panel.

[🚀 Quick Start](#-quick-start) · [📖 API Docs](#-api-documentation) · [🤖 Telegram Bot](#-telegram-bot) · [🐳 Docker](#-docker-deployment)

</div>

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Quick Start](#-quick-start)
- [📖 API Documentation](#-api-documentation)
- [🔐 Admin Panel](#-admin-panel)
- [🤖 Telegram Bot](#-telegram-bot)
- [🐳 Docker Deployment](#-docker-deployment)
- [⚙️ Environment Variables](#️-environment-variables)
- [📂 Project Structure](#-project-structure)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## ✨ Features

### 🎥 Content Management
- 🎬 **Movies** — Full CRUD with metadata, ratings, and media files
- 📺 **Series** — Episode/season management with progress tracking
- 🎭 **Actors & Directors** — Detailed profiles with filmographies
- 🌍 **Countries & Languages** — Multi-language and multi-region support
- 🎭 **Genres & Categories** — Hierarchical genre taxonomy
- 📚 **Collections** — Curated movie/series collections
- 📁 **Media Management** — S3/MinIO file storage with upload pipeline

### 🤖 AI & Smart Features
- 🧠 **AI Recommendations** — GPT-4 powered personalized suggestions
- 🔍 **ElasticSearch** — Full-text search with fuzzy matching & filters
- 📊 **AI Analytics** — Viewing pattern analysis and insights
- 🎯 **Smart Suggestions** — Context-aware content discovery

### 👤 User Features
- 🔐 **JWT Authentication** — Access + refresh token flow with secure sessions
- ❤️ **Favorites & Watchlist** — Personal movie/series bookmarks
- 📜 **Watch History** — Resume playback tracking
- 🏆 **Gamification** — Achievements, points, and leaderboards
- 🎁 **Referral System** — Invite friends and earn rewards
- 🔔 **Push Notifications** — Real-time in-app notifications
- 👥 **Social Features** — Reviews, ratings, and sharing
- 💳 **Subscriptions** — Tiered plans with PayMe integration
- 📱 **User Profiles** — Avatar, preferences, and settings

### 🤖 Telegram Bot
- 📲 **Movie Sharing** — Browse and share films via Telegram
- 🔍 **Inline Search** — Search movies directly in chats
- 📢 **Channel Integration** — Auto-post new releases to channels
- 🌐 **Telethon Userbot** — Advanced Telegram API integration
- 👥 **Multi-Admin** — Role-based bot administration

### 🔧 Admin Panel
- 📊 **Dashboard** — Real-time analytics and KPIs
- 🎬 **Movie Management** — Full content CRUD interface
- 📺 **Series Management** — Episode and season editor
- 👤 **User Management** — User profiles, roles, and bans
- 📡 **Broadcasts** — Mass notification delivery
- 📈 **Statistics** — Viewership, revenue, and engagement metrics
- ⚙️ **Settings** — Platform configuration

### 🏗️ Infrastructure
- 🐳 **Docker** — Full containerization with docker-compose
- 🔄 **Bull/BullMQ Queues** — Background job processing
- 💾 **Redis Caching** — High-performance caching layer
- 📊 **Prometheus + Grafana** — Metrics collection and dashboards
- 🔒 **Security** — Helmet, rate limiting, input validation, CORS
- 🌐 **Nginx** — Reverse proxy with SSL, gzip, and rate limiting
- 📝 **Winston Logging** — Structured logging with daily rotation
- 🩺 **Health Checks** — Service health monitoring endpoints
- 🔄 **WebSockets** — Real-time communication via Socket.IO

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                       NGINX                               │
│              (Reverse Proxy / SSL / Rate Limiting)         │
├─────────────────────┬────────────────────────────────────┤
│   api.cinemahub.uz  │     admin.cinemahub.uz              │
│   storage.cinemahub.uz                                   │
├─────────┬───────────┼──────────────┬─────────────────────┤
│         │           │              │                      │
│  ┌──────▼──────┐ ┌──▼──────┐ ┌────▼─────┐ ┌────────────┐ │
│  │   Backend   │ │  Admin  │ │  MinIO   │ │ Prometheus │ │
│  │   NestJS    │ │  Next.js│ │   S3     │ │ + Grafana  │ │
│  │   :3000     │ │  :3001  │ │  :9000   │ │  :9090     │ │
│  └──────┬──────┘ └─────────┘ └──────────┘ └────────────┘ │
│         │                                                 │
│  ┌──────┴──────────────────────────────────────────────┐  │
│  │              Service Layer                           │  │
│  │  Auth │ Movies │ AI │ Bot │ Search │ Payments │ ...  │  │
│  └──────┬──────────────────────────────────────────────┘  │
│         │                                                 │
│  ┌──────┴──────┐ ┌──────────┐ ┌────────────┐             │
│  │ PostgreSQL  │ │  Redis   │ │ElasticSearch│             │
│  │    :5432    │ │  :6379   │ │   :9200     │             │
│  └─────────────┘ └──────────┘ └────────────┘             │
└──────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **NestJS 10** | Enterprise Node.js framework |
| **TypeScript 5.5** | Type-safe development |
| **Prisma 5** | Database ORM & migrations |
| **PostgreSQL 16** | Primary database |
| **Redis 7** | Caching & session storage |
| **ElasticSearch 8** | Full-text search engine |
| **JWT + Passport** | Authentication & authorization |
| **Telegraf** | Telegram Bot API |
| **Telethon** | Telegram Userbot API |
| **Bull/BullMQ** | Background job queues |
| **Socket.IO** | WebSocket communication |
| **Swagger/OpenAPI** | API documentation |
| **Winston** | Structured logging |
| **Helmet** | Security headers |
| **Winston** | Application logging |

### Frontend (Admin)
| Technology | Purpose |
|------------|---------|
| **Next.js 14** | React framework |
| **React 18** | UI library |
| **Tailwind CSS** | Utility-first styling |
| **Radix UI** | Accessible components |
| **React Query** | Server state management |
| **React Hook Form** | Form handling |
| **Zod** | Schema validation |
| **Chart.js** | Data visualization |
| **Lucide Icons** | Icon library |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization |
| **Nginx** | Reverse proxy |
| **MinIO** | S3-compatible storage |
| **Prometheus** | Metrics collection |
| **Grafana** | Monitoring dashboards |
| **PostgreSQL 16** | Database |
| **Redis 7** | Cache layer |
| **ElasticSearch 8** | Search engine |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** or **yarn**
- **PostgreSQL** ≥ 16
- **Redis** ≥ 7
- **Docker** & **Docker Compose** (for full deployment)
- **ElasticSearch** ≥ 8.x (optional, for search features)

### 1. Clone the Repository

```bash
git clone https://github.com/Shohijahon041/super_kino_yukla_bot.git
cd CinemaHub-AI-Ultimate
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Seed the database
npm run db:seed

# Start development server
npm run start:dev
```

Backend will be available at `http://localhost:3000`

### 3. Admin Panel Setup

```bash
cd admin

# Install dependencies
npm install

# Copy environment file and configure
cp .env.local.example .env.local

# Start development server
npm run dev
```

Admin panel will be available at `http://localhost:3001`

### 4. Access Points

| Service | URL |
|---------|-----|
| API Server | http://localhost:3000 |
| Swagger Docs | http://localhost:3000/docs |
| Admin Panel | http://localhost:3001 |
| Health Check | http://localhost:3000/api/v1/health |

---

## 📖 API Documentation

### Swagger UI

Interactive API documentation is available at:

```
http://localhost:3000/docs
```

### API Base URL

```
http://localhost:3000/api/v1
```

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/register` | Register new user |
| `POST` | `/api/v1/auth/login` | User login |
| `POST` | `/api/v1/auth/refresh` | Refresh access token |
| `GET` | `/api/v1/movies` | List all movies |
| `GET` | `/api/v1/movies/:id` | Get movie details |
| `POST` | `/api/v1/movies` | Create movie (admin) |
| `PUT` | `/api/v1/movies/:id` | Update movie (admin) |
| `DELETE` | `/api/v1/movies/:id` | Delete movie (admin) |
| `GET` | `/api/v1/series` | List all series |
| `GET` | `/api/v1/search` | Search content |
| `POST` | `/api/v1/ai/recommend` | Get AI recommendations |
| `GET` | `/api/v1/users/me` | Get current user |
| `GET` | `/api/v1/favorites` | Get user favorites |
| `POST` | `/api/v1/payments/create` | Create payment |
| `GET` | `/api/v1/statistics` | Dashboard statistics |
| `WS` | `/socket.io/` | Real-time events |

### Authentication

All protected endpoints require a Bearer token:

```
Authorization: Bearer <access_token>
```

---

## 🔐 Admin Panel

The admin panel is built with **Next.js 14** and provides:

### Dashboard
- 📊 Real-time analytics with Chart.js
- 📈 Viewership and revenue charts
- 👥 Active user metrics
- 🎬 Popular content rankings

### Content Management
- 🎬 **Movies** — Full CRUD with drag-and-drop media uploads
- 📺 **Series** — Episode management per season
- 🏷️ **Genres, Countries, Languages** — Taxonomy management
- 📚 **Collections** — Curated content groups

### User Management
- 👤 User profiles with role assignment
- 🚫 Ban/unban functionality
- 📊 User activity monitoring

### Broadcasts
- 📡 Send mass notifications to all users
- 🎯 Targeted broadcasts by subscription tier

### Settings
- ⚙️ Platform configuration
- 🤖 Telegram bot settings
- 💳 Payment gateway configuration

---

## 🤖 Telegram Bot

### Features
- 📲 Browse and search movies inline
- 🔍 Search by title, genre, actor, or year
- 📢 Auto-post new releases to Telegram channels
- 🌐 Telethon userbot for advanced operations
- 👥 Multi-admin support with role-based permissions

### Setup

```env
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_ADMIN_IDS=admin_id1,admin_id2
TELEGRAM_CHANNEL=@your_channel
TELEGRAM_CHANNEL_ID=-100xxxxxxxxxx
```

### Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message & main menu |
| `/search <query>` | Search movies/series |
| `/genres` | Browse by genre |
| `/new` | Latest releases |
| `/random` | Random movie suggestion |
| `/mylist` | Personal watchlist |

---

## 🐳 Docker Deployment

### Full Stack Deployment

```bash
# Clone the repository
git clone https://github.com/Shohijahon041/super_kino_yukla_bot.git
cd CinemaHub-AI-Ultimate

# Configure environment
cd backend && cp .env.example .env && cd ..
cd admin && cp .env.local.example .env.local && cd ..

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### Services Overview

| Service | Port | Description |
|---------|------|-------------|
| `cinemahub-backend` | 3000 | NestJS API server |
| `cinemahub-admin` | 3001 | Next.js admin panel |
| `cinemahub-db` | 5432 | PostgreSQL database |
| `cinemahub-redis` | 6379 | Redis cache |
| `cinemahub-minio` | 9000/9001 | MinIO object storage |
| `cinemahub-elastic` | 9200 | ElasticSearch |
| `cinemahub-nginx` | 80/443 | Reverse proxy |
| `cinemahub-prometheus` | 9090 | Metrics collection |
| `cinemahub-grafana` | 3002 | Monitoring dashboards |

### Useful Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Rebuild after changes
docker-compose up -d --build

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f admin

# Database operations
docker-compose exec backend npx prisma migrate dev
docker-compose exec backend npm run db:seed

# Access database
docker-compose exec postgres psql -U postgres -d cinemahub
```

---

## ⚙️ Environment Variables

### Backend (`.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `APP_NAME` | Application name | `CinemaHub-AI` |
| `APP_PORT` | Server port | `3000` |
| `APP_ENV` | Environment | `development` |
| `APP_URL` | Base URL | `http://localhost:3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/cinemahub` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis password | _(empty)_ |
| `JWT_SECRET` | JWT access token secret | _(required)_ |
| `JWT_EXPIRES_IN` | Access token expiry | `15m` |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | _(required)_ |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | `7d` |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token | _(required)_ |
| `TELEGRAM_ADMIN_IDS` | Comma-separated admin IDs | _(required)_ |
| `TELEGRAM_CHANNEL` | Telegram channel username | _(required)_ |
| `TELEGRAM_CHANNEL_ID` | Telegram channel ID | _(required)_ |
| `TELETHON_API_ID` | Telethon API ID | _(required)_ |
| `TELETHON_API_HASH` | Telethon API hash | _(required)_ |
| `MINIO_ENDPOINT` | MinIO endpoint | `localhost` |
| `MINIO_PORT` | MinIO port | `9000` |
| `MINIO_ACCESS_KEY` | MinIO access key | `minioadmin` |
| `MINIO_SECRET_KEY` | MinIO secret key | `minioadmin` |
| `MINIO_BUCKET` | MinIO bucket name | `cinemahub` |
| `ELASTICSEARCH_NODE` | ElasticSearch URL | `http://localhost:9200` |
| `TMDB_API_KEY` | TMDB API key | _(optional)_ |
| `AI_PROVIDER` | AI provider | `openai` |
| `AI_API_KEY` | AI API key | _(optional)_ |
| `AI_MODEL` | AI model name | `gpt-4` |
| `PAYMENT_PROVIDER` | Payment gateway | `payme` |
| `PAYMENT_MERCHANT_ID` | Merchant ID | _(optional)_ |
| `PAYMENT_SECRET_KEY` | Payment secret key | _(optional)_ |

---

## 📂 Project Structure

```
CinemaHub-AI-Ultimate/
├── 📁 .github/
│   └── 📁 workflows/          # CI/CD pipelines
├── 📁 backend/
│   ├── 📁 prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.ts            # Database seeder
│   ├── 📁 src/
│   │   ├── 📁 common/         # Shared utilities
│   │   ├── 📁 config/         # App configuration
│   │   ├── 📁 database/       # Database module
│   │   ├── 📁 modules/
│   │   │   ├── 📁 actors/     # Actor management
│   │   │   ├── 📁 admin/      # Admin features
│   │   │   ├── 📁 ai/         # AI recommendations
│   │   │   ├── 📁 auth/       # Authentication
│   │   │   ├── 📁 bot/        # Telegram bot
│   │   │   ├── 📁 cache/      # Redis caching
│   │   │   ├── 📁 categories/ # Categories CRUD
│   │   │   ├── 📁 collections/# Collections
│   │   │   ├── 📁 countries/  # Countries CRUD
│   │   │   ├── 📁 directors/  # Director management
│   │   │   ├── 📁 favorites/  # User favorites
│   │   │   ├── 📁 gamification/# Gamification system
│   │   │   ├── 📁 genres/     # Genre management
│   │   │   ├── 📁 health/     # Health checks
│   │   │   ├── 📁 history/    # Watch history
│   │   │   ├── 📁 languages/  # Languages CRUD
│   │   │   ├── 📁 media/      # File uploads (S3)
│   │   │   ├── 📁 movies/     # Movie CRUD
│   │   │   ├── 📁 notifications/# Push notifications
│   │   │   ├── 📁 payments/   # Payment processing
│   │   │   ├── 📁 queue/      # Job queues (Bull)
│   │   │   ├── 📁 referrals/  # Referral system
│   │   │   ├── 📁 reports/    # Content reports
│   │   │   ├── 📁 search/     # ElasticSearch
│   │   │   ├── 📁 series/     # Series CRUD
│   │   │   ├── 📁 social/     # Social features
│   │   │   ├── 📁 statistics/ # Analytics
│   │   │   ├── 📁 subscriptions/# Subscription plans
│   │   │   └── 📁 users/      # User management
│   │   ├── app.module.ts      # Root module
│   │   └── main.ts            # Application entry
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── 📁 admin/
│   ├── 📁 src/
│   │   ├── 📁 app/
│   │   │   └── 📁 (dashboard)/# Dashboard pages
│   │   │       ├── broadcasts/
│   │   │       ├── dashboard/
│   │   │       ├── movies/
│   │   │       ├── series/
│   │   │       └── users/
│   │   ├── 📁 components/     # React components
│   │   │   ├── dashboard/
│   │   │   ├── movies/
│   │   │   ├── series/
│   │   │   ├── settings/
│   │   │   ├── ui/
│   │   │   └── users/
│   │   ├── 📁 hooks/          # React hooks
│   │   ├── 📁 lib/            # Utilities
│   │   └── 📁 types/          # TypeScript types
│   ├── Dockerfile
│   ├── next.config.js
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── 📁 docker/                  # Docker configs
├── 📁 docs/                    # Documentation
├── 📁 monitoring/
│   └── prometheus.yml          # Prometheus config
├── 📁 nginx/
│   └── nginx.conf              # Nginx reverse proxy
├── 📁 scripts/                 # Utility scripts
├── docker-compose.yml          # Docker orchestration
├── .gitignore
└── README.md
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

### 1. Fork & Clone

```bash
git clone https://github.com/your-username/CinemaHub-AI-Ultimate.git
cd CinemaHub-AI-Ultimate
```

### 2. Create a Branch

```bash
git checkout -b feature/amazing-feature
```

### 3. Make Changes

- Follow the existing code style
- Write tests for new features
- Update documentation as needed

### 4. Lint & Test

```bash
# Backend
cd backend
npm run lint
npm run test

# Admin
cd admin
npm run lint
```

### 5. Commit & Push

```bash
git add .
git commit -m "✨ Add amazing feature"
git push origin feature/amazing-feature
```

### 6. Open a PR

Create a Pull Request on GitHub with a clear description of your changes.

### Code Style

- **Backend**: ESLint + Prettier (NestJS conventions)
- **Admin**: ESLint + Prettier (Next.js conventions)
- Use **TypeScript** strict mode
- Follow **Conventional Commits** for commit messages

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with ❤️ by [Shohijahon](https://github.com/Shohijahon041)**

⭐ Star this repo if you find it useful!

</div>
