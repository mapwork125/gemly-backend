# Diamond Trading Platform API (Starter)

Node 22 + TypeScript + Express + MongoDB scaffold for the Diamond Trading Platform.

## Features
- Modules: Auth, Requirements, Notifications, Notification Settings, Bids, Deals, Escrow, Chat, Inventory, Ratings, Ads, Admin
- Clean architecture: controllers → services → repositories → models
- Shared utils, middleware, Socket.IO chat scaffold
- .env.example provided

## Quick start
1. Copy `.env.example` to `.env` and fill values.
2. `npm install`
3. `npm run dev`

## Notes
- This is a starter scaffold. Several production integrations (Stripe, Firebase) are placeholders.
- PDF generation, barcode generation and other heavy features are included as simple stubs.
