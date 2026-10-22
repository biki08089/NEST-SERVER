# 🎓 NestJS Course & Learning Management Server

A robust, modular, and production-ready E-Learning backend built with [NestJS](https://nestjs.com/), [Prisma ORM](https://www.prisma.io/), [PostgreSQL](https://www.postgresql.org/), and [Redis](https://redis.io/).

---

## 🛠️ Technology Stack

* **Framework:** NestJS (Node.js & TypeScript, ES Modules)
* **Database & ORM:** PostgreSQL + Prisma ORM
* **Caching & Storage:** Redis (Upstash / `ioredis`) for high-speed course caching
* **Authentication:** JWT (Passport-JWT) + Email OTP 2FA (Nodemailer) + bcrypt password hashing
* **Validation:** `class-validator` + `class-transformer`
* **Testing:** Vitest

---

## 🏗️ Architecture & Request Lifecycle

This application implements NestJS architectural building blocks:

```
Incoming Request
       │
1. [ LoggerMiddleware ]          --> Logs method, URL, and client IP (with route exclusions)
       │
2. [ Guards ]
       ├── JwtAuthGuard          --> Verifies Bearer JWT token
       ├── RolesGuard            --> Role-Based Access Control (@Roles(Role.ADMIN))
       └── IsVerifiedGuard       --> Checks live PostgreSQL database for account verification
       │
3. [ Interceptors (Before) ]
       ├── TimingInterceptor     --> Starts performance stopwatch
       └── TransformInterceptor  --> Prepares standardized response envelope
       │
4. [ Controller & Service ]      --> Executes business logic, talks to PostgreSQL & Redis
       │
5. [ Interceptors (After) ]
       ├── TimingInterceptor     --> Logs route completion time (e.g. "⚡ GET /courses completed in +3ms")
       └── TransformInterceptor  --> Wraps output in standard JSON shape
       │
Outgoing Response
```

---

## ✨ Features Implemented

### 1. Middlewares (`src/common/middleware/`)
* **`LoggerMiddleware`**: Logs every incoming HTTP request method, URL, and client IP.
* **Selective Exclusions**: Configured in `AppModule` using `.exclude()` to skip noisy public routes like `GET /courses` and `GET /courses/:id`.

### 2. Guards (`src/auth/guards/`)
* **`JwtAuthGuard`**: Authenticates users using JWT Bearer tokens.
* **`RolesGuard`**: Reads `@Roles()` metadata using NestJS `Reflector` to restrict endpoints to `ADMIN` users.
* **`IsVerifiedGuard`**: Custom guard that injects `PrismaService` to inspect the database in real-time, blocking unverified users from sensitive actions (e.g., viewing enrolled courses).

### 3. Interceptors (`src/common/interceptors/`)
* **`TransformInterceptor`**: Registered globally in `main.ts`. Automatically standardizes all API responses into:
  ```json
  {
    "success": true,
    "statusCode": 200,
    "data": { ... },
    "timestamp": "2026-10-22T12:00:00.000Z"
  }
  ```
* **`TimingInterceptor`**: Registered globally. Uses RxJS `tap()` to measure execution speed in milliseconds without altering the response data.

### 4. Caching & Performance (`src/redis/`)
* Courses are cached in Redis RAM with a 5-minute TTL.
* **Automatic Cache Invalidation**: Creating, updating, or deleting courses clears the Redis cache immediately so users always see fresh data.
* Atomic `incr()` helper ready for rate-limiting.

---

## 📡 API Modules & Endpoints

### 🔐 Authentication (`/auth`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/send-register-otp` | Sends registration OTP via email | Public |
| `POST` | `/auth/register` | Verifies OTP, hashes password & registers user | Public |
| `POST` | `/auth/login` | Validates credentials & triggers 2FA OTP | Public |
| `POST` | `/auth/verify-login-otp` | Verifies OTP & returns JWT access token | Public |

### 👤 Users (`/users`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/users/me` | Get logged-in user profile | Logged-in |
| `GET` | `/users/my-courses` | Get enrolled courses | Verified User (`IsVerifiedGuard`) |
| `GET` | `/users` | Get all users | Admin (`RolesGuard`) |
| `GET` | `/users/:id` | Get user by ID | Admin (`RolesGuard`) |
| `PATCH`| `/users/:id` | Update profile / toggle verification | Self or Admin |
| `DELETE`| `/users/:id` | Delete user | Admin (`RolesGuard`) |

### 📚 Courses (`/courses`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/courses` | List all courses (Cached in Redis) | Public |
| `GET` | `/courses/:id` | Get single course by ID (Cached) | Public |
| `POST` | `/courses` | Create new course (Clears cache) | Admin |
| `PATCH`| `/courses/:id` | Update course (Clears cache) | Admin |
| `DELETE`| `/courses/:id`| Delete course (Clears cache) | Admin |
| `POST` | `/courses/:id/assign` | Assign course to student by email | Admin |

---

## 🚀 Getting Started

### 1. Prerequisites
* Node.js (v20+ recommended)
* PostgreSQL database
* Redis instance (local or Upstash Redis URL)

### 2. Environment Configuration
Create a `.env` file in the root directory:

```env
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/nest_db?schema=public"
REDIS_URL="rediss://default:token@your-redis-host:6379"
JWT_SECRET="yourSuperSecretKey"

# Email Configuration (Nodemailer)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Setup
```bash
# Push schema to database
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

### 5. Run the Server
```bash
# Development (watch mode)
npm run start:dev

# Production build
npm run build
npm run start:prod
```

---

## 🗺️ Upcoming Roadmap

* [ ] **Step 1:** Global Exception Filter (standardizing all error responses).
* [ ] **Step 2:** Custom Redis Rate-Limiter Guard (stopping OTP & auth spam).
* [ ] **Step 3:** Course Lessons Feature & `IsEnrolledGuard` (chapters, videos, progress tracking).
* [ ] **Step 4:** Course Reviews & Ratings System (1–5 stars and student feedback).
* [ ] **Step 5:** Cloudinary & Multer File Uploads (course thumbnails and user avatars).
