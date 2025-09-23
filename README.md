# Health Tracker - Ship Crew

Minimal MERN scaffold without login/dashboard features.

## Structure
- `backend/` — Express server with a basic health endpoint (`GET /api/health`).
- `frontend/` — Vite + React app with a simple placeholder UI.

## Prerequisites
- Node.js 18+ and npm

## Setup
Install dependencies for both apps:

```
cd backend && npm install
cd ../frontend && npm install
```

Or from the repo root using npm prefixes:

```
npm install --prefix backend
npm install --prefix frontend
```

## Environment variables (backend)
Create `backend/.env` based on `backend/.env.example`:

```
PORT=5000
MONGO_URI=your_mongo_uri_here
JWT_SECRET=a_secure_random_string
```

> Note: If you are not connecting to a database yet, you can still run the server for the `/api/health` endpoint.

## Run in development
Start both servers from the repo root:

```
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

Health check:

```
GET http://localhost:5000/api/health
```

## Notes
- Login and dashboard features were removed. `react-router-dom` is no longer required.
- `.gitignore` is configured to ignore environment files (e.g., `backend/.env`).
