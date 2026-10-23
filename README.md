# 🎓 NestJS Course & Learning Management Server

A robust, modular, and production-ready E-Learning backend built with [NestJS](https://nestjs.com/), [Prisma ORM](https://www.prisma.io/), [PostgreSQL](https://www.postgresql.org/), and [Redis](https://redis.io/).

---

## 🛠️ Technology Stack

* **Framework:** NestJS (Node.js & TypeScript, ES Modules)
* **Database & ORM:** PostgreSQL + Prisma ORM
* **Caching & In-Memory Store:** Redis (Upstash / `ioredis`) for course caching, OTP storage, and atomic rate-limiting
* **Authentication:** JWT (Passport-JWT) + Email OTP 2FA (Nodemailer) + bcrypt password hashing
* **Validation:** `class-validator` + `class-transformer`
* **Testing:** Vitest

---

## 🏗️ Architecture & Request Lifecycle

This application implements the complete NestJS architectural pipeline:

```
Incoming Request
       │
1. [ LoggerMiddleware ]          --> Logs method, URL, and client IP (with route exclusions)
       │
2. [ Guards ]
       ├── JwtAuthGuard          --> Verifies Bearer JWT access token
       ├── RolesGuard            --> Role-Based Access Control (@Roles(Role.ADMIN))
       ├── IsVerifiedGuard       --> Checks live PostgreSQL database for account verification
       ├── RateLimitGuard        --> IP-based sliding window rate-limiter using Redis incr()
       └── IsEnrolledGuard       --> Verifies student enrollment before granting lesson content access
       │
3. [ Interceptors (Before) ]
       ├── TimingInterceptor     --> Starts performance stopwatch
       └── TransformInterceptor  --> Prepares standardized response envelope
       │
4. [ Controller & Service ]      --> Executes business logic, talks to PostgreSQL & Redis
       │
5. [ Interceptors (After) ]
       ├── TimingInterceptor     --> Logs route completion time (e.g. "⚡ GET /courses completed in +3ms")
       └── TransformInterceptor  --> Standardizes response shape: { success: true, statusCode, data, timestamp }
       │
6. [ AllExceptionsFilter ]       --> Catches any error / crash and formats it into:
                                     { success: false, statusCode, message, path, timestamp }
```

---

## ✨ Features Implemented

### 1. Middlewares (`src/common/middleware/`)
* **`LoggerMiddleware`**: Logs every incoming HTTP request method, URL, and client IP.
* **Selective Exclusions**: Configured in `AppModule` using `.exclude()` to skip noisy public routes like `GET /courses` and `GET /courses/:id`.

### 2. Guards & Security (`src/common/guards/` & `src/auth/guards/`)
* **`JwtAuthGuard`**: Authenticates users using JWT Bearer tokens.
* **`RolesGuard`**: Reads `@Roles()` metadata using NestJS `Reflector` to restrict endpoints to `ADMIN` users.
* **`IsVerifiedGuard`**: Custom guard checking the database in real-time, blocking unverified accounts from sensitive operations.
* **`RateLimitGuard`**: Custom IP rate-limiter reading `@Throttle({ limit, ttl })` metadata and utilizing atomic Redis `incr()` with TTL to block brute-force and DDoS attempts (HTTP 429).
* **`IsEnrolledGuard`**: Checks PostgreSQL to ensure only enrolled students (or admins) can watch lesson videos and access course content.

### 3. Interceptors (`src/common/interceptors/`)
* **`TransformInterceptor`**: Registered globally in `main.ts`. Automatically standardizes all successful API responses into:
  ```json
  {
    "success": true,
    "statusCode": 200,
    "data": { ... },
    "timestamp": "2026-10-23T12:00:00.000Z"
  }
  ```
* **`TimingInterceptor`**: Registered globally. Uses RxJS `tap()` to measure execution speed in milliseconds without altering response data.

### 4. Exception Filters (`src/common/filters/`)
* **`AllExceptionsFilter`**: Registered globally in `main.ts`. Catches all HTTP errors and unhandled exceptions, formatting them into the exact same structure as success responses:
  ```json
  {
    "success": false,
    "statusCode": 404,
    "message": "Course with ID 99 not found.",
    "path": "/courses/99",
    "timestamp": "2026-10-23T12:00:00.000Z"
  }
  ```

### 5. High-Performance Redis Auth Engine (`src/auth/`)
* **Redis OTP Storage**: Both registration and login OTPs are stored in Redis RAM with automatic 5-minute (300s) TTL expiration, keeping PostgreSQL completely free of temporary clutter.
* **Defense-in-Depth Rate Limiting**:
  - **Outer Wall (Guard)**: IP-level throttle on `/auth/login` and `/auth/send-register-otp`.
  - **Inner Wall (Service)**: Per-email rate limiting (max 3 OTP requests per email in 5 minutes) to prevent email-bombing attacks via proxies/VPNs.
* **Single-Use Security**: OTPs are deleted from Redis immediately upon successful verification.

---

## 📡 API Modules & Endpoints

### 🔐 Authentication (`/auth`)
| Method | Endpoint | Description | Access / Rate Limit |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/send-register-otp` | Sends registration OTP via email | Public (Max 3 / min) |
| `POST` | `/auth/register` | Verifies OTP, hashes password & registers user | Public |
| `POST` | `/auth/login` | Validates credentials & triggers 2FA OTP | Public (Max 5 / min) |
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

### 📖 Course Lessons (`/courses/:courseId/lessons`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/courses/:courseId/lessons` | View syllabus (titles & order only) | Public |
| `GET` | `/courses/:courseId/lessons/:lessonId` | Watch lesson (full details + video URL) | Enrolled Student (`IsEnrolledGuard`) / Admin |
| `POST` | `/courses/:courseId/lessons` | Add a lesson chapter to a course | Admin |
| `PATCH`| `/courses/:courseId/lessons/:lessonId` | Update lesson content or video URL | Admin |
| `DELETE`| `/courses/:courseId/lessons/:lessonId` | Delete a lesson from a course | Admin |

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

## 🗺️ Roadmap Progress

* [x] **Step 1:** Global Exception Filter (standardizing all error responses).
* [x] **Step 2:** Custom Redis Rate-Limiter Guard & Redis Auth Optimization.
* [x] **Step 3:** Course Lessons Feature & `IsEnrolledGuard` (chapters, videos, syllabus).
* [ ] **Step 4:** Course Reviews & Ratings System (1–5 stars and student feedback).
* [ ] **Step 5:** Cloudinary & Multer File Uploads (course thumbnails and user avatars).
