# Eka Induction Portal Setup

## Frontend

```bash
cd frontend
npm run dev
```

The frontend runs on `http://localhost:3000`.

Create `frontend/.env.local` if the API URL changes:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## Backend

```bash
cd backend
npm run dev
```

The API runs on `http://localhost:4000`.

Without `DATABASE_URL`, the backend saves records to `backend/data/inductions.json` for development.

## PostgreSQL

Create a database, apply `database/schema.sql`, and set:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/eka_induction
```

## Useful Endpoints

- `GET /api/health`
- `GET /api/inductions`
- `POST /api/inductions`
- `GET /api/inductions/:referenceNumber`
- `GET /api/inductions/:referenceNumber/certificate`
