# Eka Induction Portal

Safety induction portal for Eka Infra employees.

The QNAP-ready version has two main parts:

- `frontend`: Next.js induction flow, exported as static files for NAS hosting.
- `python-backend`: Flask API for completion records, SQLite storage, and PDF certificates.

The old Node backend is still in `backend` as a fallback/reference.

See `docs/qnap-deployment.md` for local setup and QNAP deployment.
