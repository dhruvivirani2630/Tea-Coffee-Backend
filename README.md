# Tea Coffee Backend

Production-ready Node.js, Express.js, MongoDB, JWT authentication, profile management, and role-based admin APIs.

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` and set at least `MONGO_URI` and `JWT_SECRET`.

### MongoDB Atlas

If you use MongoDB Atlas and see a whitelist or IP access error:

1. Open MongoDB Atlas, go to your project, then Network Access.
2. Add your current IP address, or `0.0.0.0/0` for local development only.
3. Wait 1 to 2 minutes, then run the server again.

```bash
npm run seed-admin
npm run dev
```

Default server URL:

```text
http://localhost:5000
```

## Environment Variables

```env
MONGO_URI=mongodb://127.0.0.1:27017/tea-coffee-auth
JWT_SECRET=replace_with_a_long_random_secret
CORS_ORIGIN=http://localhost:5173
```

## Default Admin

```bash
npm run seed-admin
```

The seed script skips creation when an admin account already exists.

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

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/profile
```

## Profile APIs

Authenticated user:

```http
GET /api/users/profile
PUT /api/users/profile
PUT /api/users/change-password
```

Update profile payload:

```json
{
  "name": "Jane Updated",
  "email": "jane@example.com",
  "phone": "9876543210",
  "profileImage": "data:image/png;base64,..."
}
```

Change password payload:

```json
{
  "currentPassword": "User@1234",
  "newPassword": "NewUser@1234",
  "confirmPassword": "NewUser@1234"
}
```

## Admin User APIs

Admin only:

```http
GET /api/admin/users?search=jane&employeeId=EMP001&role=user&status=active
GET /api/admin/users/:id
PUT /api/admin/users/:id
```

Admin update payload:

```json
{
  "name": "Jane Updated",
  "email": "jane@example.com",
  "phone": "9876543210",
  "employeeId": "EMP002",
  "role": "user",
  "status": "active",
  "profileImage": "https://example.com/image.jpg"
}
```

## Folder Structure

```text
src/
  controllers/
  middlewares/
  models/
  routes/
  services/
  validators/
  utils/
frontend/
  src/
    api/
    components/
    context/
    pages/
    styles/
```

## Security Notes

- Passwords are never returned in API responses.
- JWT-protected routes are enforced with bearer tokens or HTTP-only cookies.
- Role-based authorization protects admin-only endpoints.
- Email, phone, and employee ID duplicates are rejected with conflict errors.
- Profile image input is validated as an image URL or data URI and capped at 2MB.

## Frontend Scaffold

The repo now includes a Vite-ready React scaffold under `frontend/` with:

- Profile page
- Edit profile form
- Change password page
- Admin user list and edit page
- Shared Axios service layer
- Basic loading, error, and success UI states

To run it after installing dependencies in `frontend/`:

```bash
cd frontend
npm install
npm run dev
```
