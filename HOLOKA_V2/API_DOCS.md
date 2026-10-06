# HOLOKA API Documentation

Base URL: `http://localhost:8080/api`

## Authentication (`/auth`)

### POST `/auth/login`
Authenticates a user and returns a JWT token.
- **Request Body:**
  ```json
  {
    "username": "admin",
    "password": "password"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhb...",
      "refreshToken": "def456...",
      "user": {
        "id": 1,
        "username": "admin",
        "fullName": "System Admin",
        "role": "ADMIN"
      }
    }
  }
  ```

---

## Dashboard (`/dashboard`)

### GET `/dashboard/overview`
Retrieves aggregated statistics for the primary dashboard view.
- **Headers:** `Authorization: Bearer <token>`
- **Query Params:** `workspaceId=1`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "totalProperties": 5,
      "occupancyRate": 92.5,
      "monthlyRevenue": 125000000,
      "outstandingPayments": 12500000,
      "openMaintenance": 2,
      "contractsExpiringSoon": 3,
      "pendingTasks": 1
    }
  }
  ```

---

## Properties (`/properties`)

### GET `/properties`
Lists all properties in a workspace.
- **Query Params:** `workspaceId=1`
- **Response:** List of property objects including occupancy calculations.

### POST `/properties`
Creates a new property.
- **Request Body:**
  ```json
  {
    "name": "Sunrise Tower",
    "code": "P-SRT",
    "address": "123 Main St",
    "propertyType": "BUILDING"
  }
  ```

---

## Rooms (`/rooms`)

### GET `/rooms`
Lists rooms, including their current active contract status.
- **Query Params:** `workspaceId=1`
- **Response:** List of room objects. Status is evaluated dynamically based on active contracts and maintenance logs.

---

## Technical Notes
- **Responses:** All API endpoints return a standardized wrapper format:
  ```json
  {
    "success": true|false,
    "message": "Optional description",
    "data": { ... } // or array
  }
  ```
- **Security:** All endpoints except `/auth/login` require a valid JWT token sent in the `Authorization: Bearer <token>` header.
