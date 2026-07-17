# Eka Induction Python Backend

Python backend for the Eka Infra induction portal.

## Local Setup

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

The API runs on `http://localhost:5000`.

## Production

```bash
gunicorn app:app --bind 0.0.0.0:5000
```

API endpoints:

- `GET /api/health`
- `GET /api/inductions`
- `POST /api/inductions`
- `GET /api/admin/inductions/export.csv`
- `GET /api/admin/inductions/export.xlsx`
- `GET /api/inductions/<referenceNumber>`
- `GET /api/inductions/<referenceNumber>/certificate`

## Admin Export Protection

Optionally set:

```bash
ADMIN_EXPORT_TOKEN=change-this-token
```

Then call export URLs with either `?token=change-this-token` or the
`X-Admin-Token` header.
