# JWT Authentication Setup

## Overview
This backend now includes JWT (JSON Web Token) authentication for secure user management. The implementation includes access tokens, refresh tokens, and role-based authorization.

## Installation
JWT dependencies have been installed:
- `jsonwebtoken`: JWT library for Node.js
- `@types/jsonwebtoken`: TypeScript types

## Key Files

### 1. `lib/jwt.ts` - JWT Token Management
Handles token generation and verification:
- `generateAccessToken()`: Creates a 1-hour access token
- `generateRefreshToken()`: Creates a 7-day refresh token
- `generateTokens()`: Generates both tokens at once
- `verifyToken()`: Validates and decodes a token
- `refreshAccessToken()`: Issues a new access token using a refresh token

### 2. `lib/auth-middleware.ts` - Authentication Middleware
Provides middleware for protecting routes:
- `authenticateToken`: Middleware that verifies JWT from Authorization header
- `authorizeRole`: Middleware that checks user role for access control

### 3. `services/AuthService.ts` - Authentication Service
Updated to include JWT tokens in responses:
- `signup()`: Creates new user and returns tokens
- `login()`: Authenticates user and returns tokens

## API Endpoints

### Authentication
- **POST** `/api/auth/signup`: Register a new user
  ```json
  {
    "email": "user@example.com",
    "name": "John Doe",
    "password": "password123",
    "role": "Student"
  }
  ```
  Response includes `accessToken` and `refreshToken`

- **POST** `/api/auth/login`: Login user
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
  Response includes `accessToken` and `refreshToken`

- **POST** `/api/auth/refresh`: Refresh access token
  ```json
  {
    "refreshToken": "your-refresh-token"
  }
  ```

### Protected Routes
- **GET** `/api/profile`: User profile (requires authentication)
  - Header: `Authorization: Bearer <accessToken>`

- **GET** `/api/admin/dashboard`: Admin dashboard (requires Admin role)
  - Header: `Authorization: Bearer <accessToken>`

## Usage Examples

### 1. Sign up
```bash
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "password": "password123",
    "role": "Student"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### 3. Access protected route
```bash
curl -X GET http://localhost:8080/api/profile \
  -H "Authorization: Bearer <accessToken>"
```

### 4. Refresh token
```bash
curl -X POST http://localhost:8080/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<refreshToken>"
  }'
```

## Token Structure

### Access Token
Payload contains:
- `id`: User ID
- `email`: User email
- `role`: User role (Admin, Instructor, Student)
- `iat`: Issued at timestamp
- `exp`: Expiration timestamp (1 hour from issue)

### Refresh Token
Payload contains:
- `id`: User ID
- `email`: User email
- `iat`: Issued at timestamp
- `exp`: Expiration timestamp (7 days from issue)

## Security Configuration

### Environment Variables
Add to your `.env` file:
```
JWT_SECRET=your-very-secure-secret-key-change-in-production
```

**Important**: The default secret key is `"your-secret-key-change-in-production"`. Always set `JWT_SECRET` environment variable in production!

## Adding JWT Protection to Routes

### Protect a route (requires authentication)
```typescript
app.get("/api/protected", authenticateToken, (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});
```

### Protect a route (requires specific role)
```typescript
app.delete("/api/users/:id", 
  authenticateToken,
  authorizeRole("Admin"),
  (req: AuthRequest, res: Response) => {
    // Only admins can execute this
  }
);
```

### Multiple allowed roles
```typescript
app.post("/api/assignments",
  authenticateToken,
  authorizeRole("Admin", "Instructor"),
  (req: AuthRequest, res: Response) => {
    // Only admins and instructors
  }
);
```

## Token Validation Flow

1. Client sends token in `Authorization: Bearer <token>` header
2. `authenticateToken` middleware extracts the token
3. Token is verified using `JWT_SECRET`
4. If valid, user data is attached to `req.user`
5. If invalid or expired, 403 error is returned
6. Client uses refresh token to get new access token when needed

## Error Responses

- **401 Unauthorized**: Missing token or authentication required
- **403 Forbidden**: Invalid/expired token or insufficient permissions
- **400 Bad Request**: Missing required fields

## Best Practices

1. **Use HTTPS**: Always use HTTPS in production to protect tokens in transit
2. **Secure Secret**: Use a strong, random secret for JWT_SECRET in production
3. **Token Expiration**: Access tokens expire after 1 hour, refresh tokens after 7 days
4. **Refresh Tokens**: Store refresh tokens securely on client (HttpOnly cookies recommended)
5. **Role-Based Access**: Use `authorizeRole` middleware to enforce permissions
6. **Error Handling**: Don't expose sensitive information in error messages
