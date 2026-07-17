# QNAP Deployment Guide

This project should be deployed as a static frontend plus a Python Flask API.

## Local Development

Run the Python API:

```bash
cd python-backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

Run the frontend in another terminal:

```bash
cd frontend
npm run dev
```

Open `http://localhost:3000`.

When the frontend is running locally on port `3000`, it automatically calls the
Python API at `http://localhost:5000/api`. On QNAP, it uses same-origin `/api`.

## Static Frontend Build

```bash
cd frontend
npm run build
```

The static website is created in `frontend/out`.

## QNAP Deployment

1. Upload `frontend/out` to the QNAP web root for the site.
2. Upload `python-backend` to the NAS.
3. On QNAP, create and activate a Python virtual environment.
4. Install backend dependencies with `pip install -r requirements.txt`.
5. Start Flask with Gunicorn:

```bash
gunicorn app:app --bind 0.0.0.0:5000
```

6. Configure QNAP Nginx/Apache reverse proxy:

```text
/      -> static files from frontend/out
/api   -> http://127.0.0.1:5000/api
```

7. Configure the Gunicorn command as a startup task or run it inside Container Station.
8. Enable HTTPS for the public site.

## Recommended Production Command

```bash
cd /path/to/python-backend
source venv/bin/activate
ADMIN_EXPORT_TOKEN=change-this-token \
gunicorn app:app --workers 2 --bind 0.0.0.0:5000
```

The SQLite database will be created automatically at `python-backend/data/inductions.db`.

## Data Storage

Completion records are stored in SQLite:

```text
python-backend/data/inductions.db
```

If you use Docker, keep this volume mapping so records survive container
rebuilds:

```bash
-v "$PWD/data:/app/data"
```

Back up this `data` folder regularly.

## Completion Reference Page

The employee completion screen shows:

- reference number
- employee details
- quiz score
- completion date

This reference number is the main proof of completion. The PDF certificate
endpoint still exists if you need it later.

## Admin Export

CSV export:

```text
https://your-domain.com/api/admin/inductions/export.csv?token=change-this-token
```

Excel export:

```text
https://your-domain.com/api/admin/inductions/export.xlsx?token=change-this-token
```

Set `ADMIN_EXPORT_TOKEN` on QNAP to protect these exports. If it is not set,
the export endpoints are open to anyone who can access the API.

## Container Station Option

From inside `python-backend` on QNAP:

```bash
docker build -t eka-induction-api .
docker run -d \
  --name eka-induction-api \
  --restart unless-stopped \
  -p 5000:5000 \
  -e ADMIN_EXPORT_TOKEN=change-this-token \
  -v "$PWD/data:/app/data" \
  eka-induction-api
```

Then proxy `/api` to `http://127.0.0.1:5000/api`.
