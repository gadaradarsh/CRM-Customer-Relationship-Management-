# CRM Project

## Install

- Backend
  - From `backend/`: `npm install`
- Frontend
  - From `frontend/`: `npm install`

## Create .env files

- Backend: copy `backend/.env.example` to `backend/config.env`
  - Windows (PowerShell): `Copy-Item backend/.env.example backend/config.env`
  - macOS/Linux: `cp backend/.env.example backend/config.env`
- Frontend: copy `frontend/.env.example` to `frontend/.env`
  - Windows (PowerShell): `Copy-Item frontend/.env.example frontend/.env`
  - macOS/Linux: `cp frontend/.env.example frontend/.env`

## Database setup

- Restore dump: `mongorestore --uri="mongodb://localhost:27017/crm_system" ./db-backup/<dump-folder>`
- OR run seed script (if provided): `node backend/scripts/seed.js`

## How to run

```
cd backend && npm run dev
cd frontend && npm run dev
```
