# Diamond Trading Platform - Backend Technical Documentation

## Document Information
- **Project Name**: Diamond Trading Platform API
- **Version**: 1.0.0
- **Document Type**: Technical Delivery Documentation

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Project Structure](#project-structure)
5. [API Architecture](#api-architecture)
6. [Authentication & Authorization](#authentication--authorization)
7. [Database Design](#database-design)
8. [Real-time Communication](#real-time-communication)
9. [Third-party Integrations](#third-party-integrations)
10. [Security Features](#security-features)
11. [Environment Configuration](#environment-configuration)
12. [Build & Deployment](#build--deployment)
13. [API Standards & Conventions](#api-standards--conventions)
14. [Deliverables](#deliverables)

---

## Executive Summary

This document provides a comprehensive overview of the Diamond Trading Platform backend system. The backend is built as a RESTful API service using Node.js and TypeScript, designed to support a diamond trading marketplace with features including user management, inventory management, bidding system, escrow services, real-time chat, and administrative controls.

### Key Highlights
- **RESTful API** architecture with standardized endpoints
- **Real-time communication** via WebSocket (Socket.IO)
- **Modular architecture** for maintainability and scalability
- **Type-safe development** using TypeScript
- **Secure authentication** with JWT tokens
- **MongoDB** for flexible data storage
- **Production-ready** security middleware and error handling

---

## Technology Stack

### Core Technologies
- **Runtime**: Node.js (v22+)
- **Language**: TypeScript (v5.6.3)
- **Framework**: Express.js (v4.18.2)
- **Database**: MongoDB with Mongoose ODM (v7.6.0)

### Key Dependencies
- **Authentication**: JWT (jsonwebtoken), bcryptjs
- **Validation**: Joi
- **Real-time**: Socket.IO (v4.7.2)
- **File Processing**: Multer, Sharp
- **Security**: Helmet, CORS
- **Payment Processing**: Stripe SDK
- **Push Notifications**: Firebase Admin SDK
- **Document Generation**: PDFKit, QRCode

### Development Tools
- **TypeScript Compiler**: tsc
- **Development Server**: nodemon with ts-node
- **Linting**: ESLint

---

## System Architecture

### High-Level Architecture

```
┌─────────────────┐
│   Client Apps   │
│  (Web/Mobile)   │
└────────┬────────┘
         │
         │ HTTP/REST + WebSocket
         │
┌────────▼────────────────────────┐
│      Express.js Server          │
│  ┌──────────────────────────┐   │
│  │   API Routes Layer       │   │
│  │   /api/v1/*              │   │
│  └──────────────────────────┘   │
│  ┌──────────────────────────┐   │
│  │   Middleware Layer       │   │
│  │   Auth, Validation, CORS │   │
│  └──────────────────────────┘   │
│  ┌──────────────────────────┐   │
│  │   Business Logic Layer   │   │
│  │   Controllers & Services │   │
│  └──────────────────────────┘   │
└────────┬─────────────────────────┘
         │
         │
┌────────▼────────────────────────┐
│      MongoDB Database           │
└─────────────────────────────────┘
         │
┌────────▼────────────────────────┐
│   External Services             │
│   - Stripe (Payments)           │
│   - Firebase (Notifications)    │
└─────────────────────────────────┘
```

### Request Flow
1. **Client Request** → Express Server
2. **Middleware Processing** → Authentication, Validation, CORS
3. **Route Handler** → Controller
4. **Business Logic** → Service Layer
5. **Data Access** → MongoDB via Mongoose
6. **Response** → JSON formatted response to client

---

## Project Structure

The project follows a modular, feature-based architecture:

```
src/
├── app.ts                    # Express application setup
├── server.ts                 # Server entry point
├── config/                   # Configuration files
│   ├── connection.ts         # MongoDB connection
│   └── index.ts              # App configuration
├── middlewares/              # Express middlewares
│   ├── auth.middleware.ts    # JWT authentication
│   ├── role.middleware.ts    # Role-based access control
│   └── validation.middleware.ts # Request validation
├── models/                   # MongoDB schemas
│   ├── User.model.ts
│   ├── Inventory.model.ts
│   ├── Deal.model.ts
│   ├── Bid.model.ts
│   ├── Escrow.model.ts
│   ├── Chat.model.ts
│   ├── Requirement.model.ts
│   ├── Rating.model.ts
│   ├── Notification.model.ts
│   └── Ads.model.ts
├── modules/                  # Feature modules
│   ├── auth/                 # Authentication module
│   ├── admin/                # Admin operations
│   ├── inventory/            # Inventory management
│   ├── requirement/          # Requirements management
│   ├── bid/                  # Bidding system
│   ├── deal/                 # Deal management
│   ├── escrow/               # Escrow services
│   ├── chat/                 # Chat functionality
│   ├── rating/               # Rating system
│   ├── ads/                  # Advertisement management
│   ├── notification/         # Notifications
│   └── notification-settings/ # Notification preferences
├── routes/                   # Route definitions
│   └── index.ts              # Main router
├── services/                 # Shared services
│   └── notification.service.ts
├── socket/                   # WebSocket handlers
│   ├── index.ts              # Socket.IO setup
│   ├── chat.events.ts        # Chat event handlers
│   └── chat.service.ts       # Chat business logic
└── utils/                    # Utility functions
    ├── asyncHandler.utility.ts
    ├── errorHandler.utility.ts
    ├── jwt.utility.ts
    ├── response.utility.ts
    ├── constants.utility.ts
    ├── firebase.utility.ts
    ├── stripe.utility.ts
    ├── pdfGenerator.utility.ts
    ├── barcode.utility.ts
    └── mongo.utility.ts
```

### Module Structure Pattern
Each feature module follows a consistent structure:
```
module-name/
├── module-name.controller.ts  # Request handlers
├── module-name.service.ts     # Business logic (if needed)
├── module-name.routes.ts      # Route definitions
└── module-name.validation.ts  # Input validation schemas
```

---

## API Architecture

### Base URL Structure
All API endpoints are prefixed with `/api/v1`

**Example**: `https://api.example.com/api/v1/auth/login`

### API Modules & Endpoints

#### 1. Authentication (`/api/v1/auth`)
- User registration and login
- Token management
- Password reset functionality

#### 2. Requirements (`/api/v1/requirements`)
- Create and manage diamond requirements
- Search and filter requirements
- Requirement status management

#### 3. Bids (`/api/v1/bids`)
- Submit bids on requirements
- View and manage bids
- Bid status tracking

#### 4. Deals (`/api/v1/deals`)
- Deal creation and management
- Deal status workflow
- Deal history

#### 5. Escrow (`/api/v1/escrow`)
- Escrow account management
- Payment processing
- Transaction tracking

#### 6. Inventory (`/api/v1/inventory`)
- Diamond inventory management
- Product catalog operations
- Inventory search and filtering

#### 7. Chat (`/api/v1/chat`)
- Message history retrieval
- Chat room management
- Real-time messaging (via WebSocket)

#### 8. Ratings (`/api/v1/ratings`)
- User rating system
- Review management
- Rating statistics

#### 9. Ads (`/api/v1/ads`)
- Advertisement management
- Ad placement and targeting
- Ad performance tracking

#### 10. Notifications (`/api/v1/notifications`)
- Notification retrieval
- Notification status management
- Notification preferences

#### 11. Admin (`/api/v1/admin`)
- Administrative operations
- User management
- System configuration
- KYC verification

### Health Check Endpoints
- `GET /api/v1/health` - API health status
- `GET /health` - Server health status

### Static File Serving
- `/uploads/*` - Served static files (images, documents)

---

## Authentication & Authorization

### Authentication Mechanism
The system uses **JSON Web Tokens (JWT)** for authentication.

#### Token Structure
- **Header**: Contains token type and algorithm
- **Payload**: User ID, role, token version
- **Signature**: Signed with JWT_SECRET

#### Authentication Flow
1. User logs in with credentials
2. Server validates credentials
3. Server generates JWT token with user information
4. Client stores token (typically in localStorage or secure storage)
5. Client includes token in `Authorization` header for subsequent requests
6. Server validates token on each protected request

#### Token Format
```
Authorization: Bearer <JWT_TOKEN>
```

### Authorization Levels

#### User Roles
- **USER**: Standard platform user
- **ADMIN**: Administrative access with full system control

**Default Admin User**
On first server start, an admin user is automatically created with:
- Email: `admin.diamond@gmail.com`
- Password: `diamondAdmin@123`

#### Access Control
- **Public Endpoints**: No authentication required (e.g., login, register)
- **Protected Endpoints**: Require valid JWT token
- **Role-Based Access**: Certain endpoints restricted to specific roles
- **Verification Requirement**: Some operations require user email verification

### Security Features
- **Token Versioning**: Tokens include version numbers for invalidation
- **Password Hashing**: bcryptjs with salt rounds
- **Token Expiration**: Configurable expiration (default: 7 days)
- **Email Verification**: Users must verify email for certain operations

---

## Database Design

### Database Technology
- **Database**: MongoDB (NoSQL document database)
- **ODM**: Mongoose (v7.6.0)

### Data Models

#### Core Models

1. **User**
   - User authentication and profile information
   - Role-based access control
   - KYC (Know Your Customer) data
   - Notification preferences
   - Token versioning for security

2. **Inventory**
   - Diamond product catalog
   - Product specifications and details
   - Availability status

3. **Requirement**
   - Buyer requirements for diamonds
   - Requirement specifications
   - Status tracking

4. **Bid**
   - Bids placed on requirements
   - Bid amounts and details
   - Bid status and history

5. **Deal**
   - Completed transactions
   - Deal terms and conditions
   - Deal status workflow

6. **Escrow**
   - Escrow account information
   - Payment processing records
   - Transaction status

7. **Chat**
   - Message history
   - Chat participants
   - Message metadata

8. **Rating**
   - User ratings and reviews
   - Rating scores
   - Review content

9. **Notification**
   - System notifications
   - Notification types and content
   - Read/unread status

10. **Ads**
    - Advertisement content
    - Ad placement information
    - Ad performance metrics

### Database Connection
- Connection managed via Mongoose
- Connection string configured via `MONGO_URI` environment variable
- Automatic reconnection handling
- Strict query mode enabled

---

## Real-time Communication

### WebSocket Implementation
The system uses **Socket.IO** for real-time bidirectional communication.

### Socket.IO Features

#### Connection Management
- User registration to personal rooms
- Online user tracking
- Automatic disconnection handling

#### Real-time Events
- **Chat Events**: Real-time messaging between users
- **Notification Events**: Push notifications to connected clients
- **Presence Events**: User online/offline status

#### Socket Architecture
```
Client Connection
    ↓
Socket.IO Server
    ↓
Event Handlers (chat.events.ts)
    ↓
Business Logic (chat.service.ts)
    ↓
Database Updates
```

### Use Cases
1. **Real-time Chat**: Instant messaging between buyers and sellers
2. **Live Notifications**: Push notifications for bids, deals, messages
3. **Presence Indicators**: Show online/offline status
4. **Live Updates**: Real-time updates for inventory, deals, bids

---

## Third-party Integrations

### 1. Stripe Payment Processing
- **Purpose**: Payment processing for escrow and transactions
- **Integration**: Stripe SDK (v19.3.1)
- **Configuration**: Secret key via environment variable
- **Features**: Payment intents, refunds, transaction tracking

### 2. Firebase Cloud Messaging (FCM)
- **Purpose**: Push notifications to mobile devices
- **Integration**: Firebase Admin SDK (v13.6.0)
- **Configuration**: Service account credentials
- **Features**: 
  - Push notification delivery
  - Notification targeting
  - Device token management

### 3. File Processing
- **Sharp**: Image processing and optimization
- **Multer**: File upload handling
- **PDFKit**: PDF document generation
- **QRCode**: QR code generation for products

---

## Security Features

### Application Security

1. **Helmet.js**
   - Sets various HTTP headers for security
   - Protects against common vulnerabilities

2. **CORS (Cross-Origin Resource Sharing)**
   - Configurable CORS policies
   - Prevents unauthorized cross-origin requests

3. **Input Validation**
   - Joi validation schemas for all inputs
   - Prevents injection attacks
   - Type checking and sanitization

4. **Authentication Middleware**
   - JWT token verification
   - Token version checking
   - User verification status checks

5. **Password Security**
   - bcryptjs hashing with salt
   - Secure password storage
   - No plaintext password storage

6. **Error Handling**
   - Centralized error handling
   - No sensitive information in error messages
   - Proper HTTP status codes

### Data Security
- **MongoDB**: Secure connection strings
- **Environment Variables**: Sensitive data stored in environment variables
- **Token Security**: JWT tokens with expiration and versioning

---

## Environment Configuration

### Required Environment Variables

```env
# Server Configuration
PORT=3000

# Database
MONGO_URI=mongodb://localhost:27017/diamond-platform

# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY=your-private-key
```

### Configuration Management
- Environment variables loaded via `dotenv`
- Configuration centralized in `src/config/index.ts`
- Default values provided for development
- Production values must be set via environment variables

### Environment-Specific Settings
- **Development**: Local MongoDB, test API keys
- **Production**: Production MongoDB, live API keys, secure secrets

---

## Build & Deployment

### Build Process

#### Development
```bash
npm run dev
```
- Uses `nodemon` with `ts-node` for hot reloading
- Direct TypeScript execution
- Automatic restart on file changes

#### Production Build
```bash
npm run build
```
- Compiles TypeScript to JavaScript
- Output directory: `dist/`
- Source maps generated for debugging

#### Production Start
```bash
npm start
```
- Runs compiled JavaScript from `dist/`
- Uses Node.js runtime directly

### Build Artifacts
- **Source Code**: `src/` directory
- **Compiled Code**: `dist/` directory
- **Dependencies**: `node_modules/` directory
- **Configuration**: Environment variables

### Deployment Checklist
1. Set all required environment variables
2. Build the project (`npm run build`)
3. Install production dependencies (`npm install --production`)
4. Ensure MongoDB connection is configured
5. Configure firewall and security groups
6. Set up process manager (PM2, systemd, etc.)
7. Configure reverse proxy (Nginx, Apache)
8. Set up SSL/TLS certificates
9. Configure logging and monitoring
10. Test health check endpoints

### Server Requirements
- **Node.js**: Version 22 or higher
- **MongoDB**: Compatible version for Mongoose 7.6.0
- **Memory**: Minimum 512MB RAM (recommended: 1GB+)
- **Storage**: Sufficient space for uploads and logs

---

## API Standards & Conventions

### HTTP Methods
- **GET**: Retrieve resources
- **POST**: Create new resources
- **PUT/PATCH**: Update existing resources
- **DELETE**: Remove resources

### Response Format
Standardized JSON response structure:
```json
{
  "status": true/false,
  "message": "Response message",
  "data": { ... },
  "error": { ... }
}
```

### Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **500**: Internal Server Error

### Error Handling
- Centralized error handler middleware
- Consistent error response format
- Proper HTTP status codes
- User-friendly error messages

### Request Validation
- All inputs validated using Joi schemas
- Validation middleware applied to routes
- Clear validation error messages

### File Uploads
- Maximum file size: 50MB
- Supported formats: Images, PDFs, documents
- Files served from `/uploads` directory
- Static file serving configured

---

## Deliverables

### Code Deliverables
1. **Source Code**: Complete TypeScript source code in `src/` directory
2. **Compiled Code**: Production-ready JavaScript in `dist/` directory
3. **Configuration Files**: 
   - `package.json` - Dependencies and scripts
   - `tsconfig.json` - TypeScript configuration
   - Environment variable template

### Documentation Deliverables
1. **Technical Documentation**: This document
2. **API Documentation**: Postman collection (`postman_collection.json`)
3. **README**: Quick start guide and project overview

### Additional Deliverables
1. **Database Schema**: MongoDB models and relationships
2. **Environment Template**: Required environment variables
3. **Build Scripts**: npm scripts for development and production

### Post-Delivery Support
- Code structure and architecture explanation
- Deployment guidance
- Integration support documentation
- API endpoint reference (via Postman collection)

---

## Additional Notes

### Development Best Practices
- **Type Safety**: Full TypeScript implementation
- **Modular Design**: Feature-based module structure
- **Error Handling**: Comprehensive error handling
- **Code Organization**: Clear separation of concerns
- **Validation**: Input validation on all endpoints

### Scalability Considerations
- Modular architecture allows easy feature addition
- Database indexing for performance
- Stateless API design for horizontal scaling
- WebSocket connection management for real-time features

### Maintenance
- Clear code structure for easy maintenance
- Comprehensive error logging
- Health check endpoints for monitoring
- Environment-based configuration
