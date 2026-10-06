# HOLOKA – AI-Powered Property Operations Platform

HOLOKA is a modern B2B SaaS platform designed for Property Owners, Landlords, Property Managers, and Operations Staff. It transforms traditional property CRUD management into an intelligent system that focuses on:

**Manage → Understand → Detect → Recommend → Act → Predict**

## Features Built in Phase 1

1. **Authentication & Security:** JWT-based stateless authentication with role-based access control.
2. **Portfolio Management:** Manage Properties (Buildings/Houses) and nested Rooms with full occupancy tracking.
3. **Tenant & Contract Lifecycle:** Digital contract management with strict validation to prevent overlapping active contracts for a single room.
4. **Finance & Invoicing:** Automated tracking of rent and utilities from `DRAFT` to `PAID` or `OVERDUE`.
5. **Maintenance & Tasking:** Track physical issues, assign tasks to staff, and monitor repair status.
6. **AI-Powered Notification Engine:** A background `AlertScheduler` that continuously evaluates operational data against business rules to generate actionable alerts (e.g., "3 contracts expiring soon", "2 overdue payments").
7. **Premium UX Dashboard:** A highly visual React frontend utilizing Tailwind CSS to present real-time operational insights without N+1 query issues.

## Technology Stack

### Backend
- **Framework:** Java 21 + Spring Boot 3.3.0
- **Database:** Microsoft SQL Server (Native SQL queries for complex analytics)
- **Migrations:** Flyway
- **Security:** Spring Security + JWT
- **Build Tool:** Maven

### Frontend
- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS v4
- **Icons:** Lucide React
- **Routing:** React Router v6
- **HTTP Client:** Axios

## Getting Started

### Prerequisites
- JDK 21
- Node.js 18+
- SQL Server

### 1. Database Setup
Create a database named `holoka_newconcept_it` in SQL Server.
Update the credentials in `backend/src/main/resources/application.properties`.

### 2. Running the Backend
```bash
cd backend
./mvnw spring-boot:run
```
The API will be available at `http://localhost:8080/api`.
Flyway will automatically run the database migrations on startup.

### 3. Running the Frontend
```bash
cd frontend
npm install
npm run dev
```
The application will be available at `http://localhost:5173`.

## Architecture Highlights
- **Single-Query Dashboard:** The `DashboardRepository` uses advanced native SQL to aggregate revenue, occupancy, and task data in a single database round-trip, ensuring blazing fast load times.
- **Serializable Locking:** The `AlertEvaluator` uses SQL Server `UPDLOCK, HOLDLOCK` hints to guarantee that background rule evaluations do not conflict if multiple backend instances are scaled horizontally.
- **Interceptor Guarded Frontend:** The React application features robust Axios interceptors that automatically manage JWT injection and handle token expiration/401 redirects elegantly.

## License
Proprietary / Closed Source.
