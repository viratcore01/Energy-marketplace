# ⚡ EnergyDAO — Decentralized Renewable Energy Marketplace

## What is this?
EnergyDAO is a full-stack marketplace for decentralized renewable energy with three dedicated portals:
- Consumer Portal: Buy connections, monitor usage, and track monthly billing.
- Producer Portal: List renewable supply, set direct prices, and manage energy availability.
- Admin Portal: Monitor center storage, execute center-to-center transfers, and review transfer logs.

## Tech Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: SQLite (better-sqlite3)

## How to Run Locally

### Backend
```bash
cd backend
npm install
node server.js
```
Runs on http://localhost:3001

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Opens at http://localhost:5173

## API Endpoints

### Consumers
- `GET /api/consumers` - Get all consumers
- `POST /api/consumers` - Create new consumer
- `PUT /api/consumers/:id` - Update consumer usage and bill

### Producers
- `GET /api/producers` - Get all producers
- `POST /api/producers` - Create new producer
- `PUT /api/producers/:id` - Update producer listing

### Centers / Transfers
- `GET /api/centers` - Get all energy centers
- `POST /api/centers/transfer` - Transfer energy between centers
- `GET /api/centers/transfers` - Get transfer log

## Features
- Consumer connection cost calculated by distance to nearest energy center
- Producer direct pricing with no middlemen
- Admin center-to-center energy transfers
- Fully persistent data with SQLite

---
