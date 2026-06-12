# Tea Coffee Backend

Production-ready Node.js, Express.js, MongoDB, JWT authentication, and role management API.

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` and set at least `MONGO_URI` and `JWT_SECRET`.

### MongoDB Atlas (required for cloud DB)

If you use MongoDB Atlas and see a **whitelist / IP access** error:

1. Open [MongoDB Atlas](https://cloud.mongodb.com) → your project → **Network Access**
2. Click **Add IP Address** → **Add Current IP Address** (or `0.0.0.0/0` for local dev only)
3. Wait 1–2 minutes, then run the commands below

```bash
npm run seed-admin
npm run dev
```

Default server URL:

```text
http://localhost:5000
```

## Environment Variables

See `.env.example` for all supported settings.

Important values:

```env
MONGO_URI=mongodb://127.0.0.1:27017/tea-coffee-auth
JWT_SECRET=replace_with_a_long_random_secret
CORS_ORIGIN=http://localhost:3000
```

## Default Admin

Create the default admin:

```bash
npm run seed-admin
```

The seed script skips creation when any admin account already exists.

```json
{
  "employeeId": "ADMIN001",
  "name": "System Admin",
  "email": "admin@example.com",
  "password": "Admin@123"
}
```

## Standard Response Format

Success:

```json
{
  "success": true,
  "message": "Success message",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Error message"
}
```

## Authentication APIs

### Register

```http
POST /api/auth/register
Content-Type: application/json
```

```json
{
  "employeeId": "EMP001",
  "name": "Jane User",
  "email": "jane@example.com",
  "password": "User@1234"
}
```

### Login With Email

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "jane@example.com",
  "password": "User@1234"
}
```

### Login With Phone

```json
{
  "phone": "9876543210",
  "password": "User@1234"
}
```

### Logout

```http
POST /api/auth/logout
Authorization: Bearer <token>
```

### Current User

```http
GET /api/auth/profile
Authorization: Bearer <token>
```

## User APIs

Admin only:

```http
GET /api/users?search=jane&role=user&status=active
DELETE /api/users/:id
PATCH /api/users/:id/status
```

Admin or own user:

```http
GET /api/users/:id
PUT /api/users/:id
```

Own authenticated user:

```http
PATCH /api/users/me/password
```

Update user:

```json
{
  "name": "Jane Updated",
  "phone": "9876543210"
}
```

Admin role/status update:

```json
{
  "role": "user",
  "status": "inactive"
}
```

Status update:

```json
{
  "status": "inactive"
}
```

Change password:

```json
{
  "currentPassword": "User@1234",
  "newPassword": "NewUser@1234"
}
```

## Security

- Passwords are hashed with bcryptjs.
- JWT payload contains `id` and `role`.
- JWT can be sent as `Authorization: Bearer <token>` or the HTTP-only auth cookie.
- Helmet, CORS, cookie parsing, request validation, and rate limiting are enabled.
- Signup always creates `role: "user"`.
- Admin creation is limited to the seed script and skipped when an admin exists.
- Inactive users cannot login or access protected routes.
