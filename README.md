# Diamond Trading Platform API

A comprehensive Node.js backend API for a Diamond Trading Platform built with TypeScript, Express, and MongoDB.

## Tech Stack

- **Runtime**: Node.js 22+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Real-time**: Socket.IO
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi
- **Security**: Helmet, CORS, bcryptjs

## Features

### Core Modules
- **Authentication**: User registration, login, JWT-based authentication
- **Requirements**: Diamond requirement management
- **Bids**: Bidding system for diamond trading
- **Deals**: Deal management and tracking
- **Escrow**: Secure escrow payment handling
- **Chat**: Real-time messaging with Socket.IO
- **Inventory**: Diamond inventory management
- **Ratings**: User rating and review system
- **Ads**: Advertisement management
- **Notifications**: Push notifications with Firebase Cloud Messaging
- **Notification Settings**: User notification preferences
- **Admin**: Administrative panel and controls

### Architecture
- Clean architecture: controllers → services → repositories → models
- Shared utilities and middleware
- Centralized error handling
- Input validation with Joi schemas
- Type-safe TypeScript implementation

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 22 or higher
- MongoDB (local or cloud instance)
- npm or yarn package manager

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd diamond-app-client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and fill in your configuration values (see [Environment Variables](#environment-variables) section).

4. **Start the development server**
   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:5000` (or the port specified in your `.env` file).

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=5000

# Database
MONGO_URI=mongodb://localhost:27017/diamond-platform

# JWT Configuration
JWT_SECRET=your-secret-key-here-change-in-production
JWT_EXPIRES_IN=7d

# Stripe Configuration (for payment processing)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key

# Firebase Configuration (for push notifications)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email@project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
```

### Environment Variables Notes
- `MONGO_URI`: Your MongoDB connection string. For local development, use `mongodb://localhost:27017/diamond-platform`
- `JWT_SECRET`: A strong, random secret key for signing JWT tokens. **Never commit this to version control.**
- `ADMIN_EMAIL` & `ADMIN_PASSWORD`: Default admin credentials (an admin user is automatically created on first run if it doesn't exist)
- Firebase credentials: Required for push notifications. You can obtain these from your Firebase project settings.

## Available Scripts

- `npm run dev` - Start development server with hot reload (nodemon + ts-node)
- `npm run build` - Compile TypeScript to JavaScript (outputs to `dist/` directory)
- `npm start` - Start production server (runs compiled JavaScript from `dist/`)
- `npm run lint` - Run ESLint to check code quality

## Project Structure

```
diamond-app-client/
├── src/
│   ├── app.ts                 # Express app configuration
│   ├── server.ts              # Server entry point
│   ├── config/
│   │   ├── connection.ts      # MongoDB connection
│   │   └── index.ts           # App configuration
│   ├── middlewares/
│   │   ├── auth.middleware.ts      # Authentication middleware
│   │   ├── role.middleware.ts      # Role-based access control
│   │   └── validation.middleware.ts # Request validation
│   ├── models/                # Mongoose models
│   │   ├── User.model.ts
│   │   ├── Requirement.model.ts
│   │   ├── Bid.model.ts
│   │   ├── Deal.model.ts
│   │   └── ...
│   ├── modules/               # Feature modules
│   │   ├── auth/
│   │   ├── requirement/
│   │   ├── bid/
│   │   ├── deal/
│   │   └── ...
│   ├── routes/
│   │   └── index.ts           # Route definitions
│   ├── services/              # Shared services
│   ├── socket/                # Socket.IO configuration
│   │   ├── index.ts
│   │   ├── chat.events.ts
│   │   └── chat.service.ts
│   └── utils/                 # Utility functions
│       ├── asyncHandler.utility.ts
│       ├── errorHandler.utility.ts
│       ├── jwt.utility.ts
│       └── ...
├── package.json
├── tsconfig.json
└── README.md
```

## API Documentation

For detailed API documentation, endpoints, and request/response examples, refer to:
- `TECHNICAL_DOCUMENTATION.md` - Comprehensive technical documentation

## Important Notes

### Starter Scaffold
This is a starter scaffold. Several production integrations are placeholders:
- **Stripe**: Payment processing integration is scaffolded
- **Firebase**: Push notification setup is included but may need configuration
- **PDF Generation**: PDF generation utilities are included as stubs
- **Barcode Generation**: QR code generation is included but may need customization

### Security Considerations
- Always use strong, unique values for `JWT_SECRET` in production
- Never commit `.env` file to version control
- Use environment-specific MongoDB connection strings
- Configure CORS appropriately for your frontend domain
- Enable HTTPS in production

## Development

### Hot Reload
The development server uses `nodemon` with `ts-node` for automatic restart on file changes.

### TypeScript
The project uses TypeScript for type safety. Configuration is in `tsconfig.json`.

### Database
Ensure MongoDB is running before starting the server. The connection is established automatically on startup.

## License

[Add your license information here]

## Contributing

[Add contributing guidelines here]

## Support

[Add support/contact information here]
