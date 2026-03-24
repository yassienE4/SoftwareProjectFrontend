# User Management API - New Features

**Date:** March 5, 2026  
**Status:** ✅ Implemented and Tested

---

## Overview

User Management System has been added to the backend. Admins can now create, read, update, and delete users with full role-based access control.

---

## New Endpoints

**Base URL:** `http://localhost:8080/api`

All endpoints require authentication: `Authorization: Bearer <accessToken>`

### 1. GET `/users`
**Access:** Admin only  
List all users with optional role filter.

**Query Parameters:**
- `role` (optional): `Admin` | `Instructor` | `Student`

**Example Request:**
```bash
curl -X GET "http://localhost:8080/api/users?role=Student" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "student@example.com",
      "name": "John Doe",
      "role": "Student",
      "createdAt": "2026-03-05T04:21:37.848Z",
      "updatedAt": "2026-03-05T04:21:37.848Z"
    }
  ]
}
```

---

### 2. GET `/users/:id`
**Access:** Admin OR the user themselves  
Get specific user details.

**Example Request:**
```bash
curl -X GET "http://localhost:8080/api/users/1" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "student@example.com",
    "name": "John Doe",
    "role": "Student",
    "createdAt": "2026-03-05T04:21:37.848Z",
    "updatedAt": "2026-03-05T04:21:37.848Z"
  }
}
```

---

### 3. POST `/users`
**Access:** Admin only  
Create a new user.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "name": "Jane Smith",
  "password": "password123",
  "role": "Instructor"  // Optional: defaults to "Student"
}
```

**Example Request:**
```bash
curl -X POST "http://localhost:8080/api/users" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "instructor@example.com",
    "name": "Jane Smith",
    "password": "password123",
    "role": "Instructor"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "email": "instructor@example.com",
    "name": "Jane Smith",
    "role": "Instructor",
    "createdAt": "2026-03-05T04:21:51.935Z",
    "updatedAt": "2026-03-05T04:21:51.935Z"
  }
}
```

---

### 4. PATCH `/users/:id`
**Access:** Admin only  
Update user information including password (admin override).

**Request Body (all fields optional):**
```json
{
  "name": "Updated Name",
  "email": "newemail@example.com",
  "role": "Admin",
  "password": "newpassword123"  // Admin can reset user password
}
```

**Example Request:**
```bash
curl -X PATCH "http://localhost:8080/api/users/5" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Senior Instructor",
    "password": "newpassword123"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "email": "instructor@example.com",
    "name": "Senior Instructor",
    "role": "Instructor",
    "createdAt": "2026-03-05T04:21:51.935Z",
    "updatedAt": "2026-03-05T04:22:04.722Z"
  }
}
```

---

### 5. DELETE `/users/:id`
**Access:** Admin only  
Permanently delete user from database (hard delete).

**Example Request:**
```bash
curl -X DELETE "http://localhost:8080/api/users/5" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## Access Control Rules

| Endpoint | Admin | Instructor | Student |
|----------|-------|------------|---------|
| GET `/users` | ✅ | ❌ | ❌ |
| GET `/users/:id` | ✅ | ✅ (self only) | ✅ (self only) |
| POST `/users` | ✅ | ❌ | ❌ |
| PATCH `/users/:id` | ✅ | ❌ | ❌ |
| DELETE `/users/:id` | ✅ | ❌ | ❌ |

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Email, name, and password are required"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied. Required roles: Admin"
}
```

or

```json
{
  "error": "Access denied"
}
```

### 404 Not Found
```json
{
  "error": "User not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to fetch users"
}
```

---

## What Frontend Needs to Implement

### Pages/Components Required

#### 1. **User Management Page** (Admin Only)
Location: `/admin/users` or similar

**UI Components:**
- Users table/list with columns:
  - ID
  - Name
  - Email
  - Role (with colored badges: Admin=red, Instructor=blue, Student=green)
  - Created Date
  - Actions (Edit, Delete buttons)
- Role filter dropdown (All, Admin, Instructor, Student)
- "Create User" button (opens modal/form)
- Search/filter functionality
- Pagination (if many users)

**Required Features:**
- Display all users in a table
- Filter users by role using dropdown
- Create new user with form (email, name, password, role dropdown)
- Edit user modal with form (pre-filled with current data)
- Delete user with confirmation dialog ("Are you sure you want to delete [name]?")
- Show success/error toast notifications

#### 2. **User Profile Page** (All Users)
Location: `/profile` or `/settings`

**UI Components:**
- Display current user's information:
  - Name
  - Email
  - Role (read-only badge)
  - Account created date
- Optional: Edit own profile (name, email) - you'll need a new endpoint for this
- Optional: Change own password - you'll need a new endpoint for this

---


If using TypeScript, create these types:

```typescript
export type UserRole = 'Admin' | 'Instructor' | 'Student';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
  role?: UserRole;
}

export interface UpdateUserRequest {
  email?: string;
  name?: string;
  role?: UserRole;
  password?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

---

## Required Environment Variables

Add to your frontend `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8080/api
# or for Next.js:
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
```

---

## Checklist for Frontend Team

- [ ] Create `userService.js/ts` with all API functions
- [ ] Create User Management page (`/admin/users`)
- [ ] Create User Profile page (`/profile`)
- [ ] Implement Create User modal/form
- [ ] Implement Edit User modal/form
- [ ] Implement Delete confirmation dialog
- [ ] Add role filter dropdown
- [ ] Add role-based navigation (show/hide menu items)
- [ ] Implement protected routes (Admin-only pages)
- [ ] Add error handling and toast notifications
- [ ] Add loading states
- [ ] Add form validation
- [ ] Style role badges (different colors per role)
- [ ] Add pagination if needed (many users)
- [ ] Test all CRUD operations
- [ ] Test access control (try accessing admin page as student)

---

## Implementation Details

### Features Implemented
- ✅ Hard delete (users permanently removed from database)
- ✅ Admin password override (admins can reset any user's password)
- ✅ Role-based access control
- ✅ Self-access for users to view own profile
- ✅ Email uniqueness validation
- ✅ Password hashing (SHA-256)
- ✅ Proper error handling

### Security
- Passwords are hashed and never returned in responses
- JWT token required for all endpoints
- Role verification on protected endpoints
- Email uniqueness enforced at database level

---

## Testing

All endpoints have been tested and verified:
- ✅ Admin can list all users
- ✅ Admin can create users with any role
- ✅ Admin can update user info and passwords
- ✅ Admin can delete users (hard delete)
- ✅ Students blocked from admin endpoints
- ✅ Students can view their own profile
- ✅ Students blocked from viewing other profiles
