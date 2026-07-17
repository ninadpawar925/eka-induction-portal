import os
import random
import re
import sqlite3
import uuid
from datetime import datetime, timedelta, timezone

from flask import Response, Flask, jsonify, request, send_file
from flask_cors import CORS

from certificate import generate_certificate_pdf
from exports import records_to_csv, records_to_xlsx
from storage import find_record, init_db, insert_record, list_records


app = Flask(__name__)
CORS(
    app,
    resources={r"/api/*": {"origins": os.getenv("CLIENT_ORIGIN", "*")}},
)

TOTAL_FALLBACK_QUESTIONS = 3
PHONE_PATTERN = re.compile(r"^[0-9]{10}$")
# India Standard Time is permanently UTC+05:30; using a fixed offset also works
# on Windows installations that do not include the IANA timezone database.
INDIA_TIMEZONE = timezone(timedelta(hours=5, minutes=30), name="IST")


def normalize_text(value):
    return str(value or "").strip()


def validate_induction_payload(payload):
    errors = []

    if not isinstance(payload, dict):
        return ["Request body is required."]

    if payload.get("language") not in ("English", "Hindi"):
        errors.append("Language must be English or Hindi.")

    employee = payload.get("employee")
    if not isinstance(employee, dict):
        errors.append("Employee details are required.")
        return errors

    required_fields = [
        "fullName",
        "employeeId",
        "designation",
        "department",
        "dateOfJoining",
        "phone",
    ]

    for field in required_fields:
        if not normalize_text(employee.get(field)):
            errors.append(f"{field} is required.")

    if not PHONE_PATTERN.match(normalize_text(employee.get("phone"))):
        errors.append("Phone must be a 10 digit number.")

    quiz_score = payload.get("quizScore")
    total_questions = payload.get("totalQuestions")

    if not isinstance(quiz_score, int) or quiz_score < 0:
        errors.append("Quiz score must be a positive integer.")

    if not isinstance(total_questions, int) or total_questions <= 0:
        errors.append("Total questions must be a positive integer.")

    if (
        isinstance(quiz_score, int)
        and isinstance(total_questions, int)
        and quiz_score > total_questions
    ):
        errors.append("Quiz score cannot exceed total questions.")

    return errors


def create_reference_number():
    return str(random.randint(10000000, 99999999))


def create_record(payload):
    employee = payload["employee"]
    return {
        "id": str(uuid.uuid4()),
        "referenceNumber": create_reference_number(),
        "language": payload["language"],
        "fullName": normalize_text(employee["fullName"]),
        "employeeId": normalize_text(employee["employeeId"]),
        "designation": normalize_text(employee["designation"]),
        "department": normalize_text(employee["department"]),
        "dateOfJoining": normalize_text(employee["dateOfJoining"]),
        "phone": normalize_text(employee["phone"]),
        "quizScore": payload["quizScore"],
        "totalQuestions": payload.get("totalQuestions") or TOTAL_FALLBACK_QUESTIONS,
        "completedAt": datetime.now(INDIA_TIMEZONE).isoformat(),
    }


def require_admin_access():
    admin_token = os.getenv("ADMIN_EXPORT_TOKEN", "").strip()

    if not admin_token:
        return None

    provided_token = (
        request.headers.get("X-Admin-Token", "").strip()
        or request.args.get("token", "").strip()
    )

    if provided_token != admin_token:
        return jsonify({"error": "Admin access is required."}), 401

    return None


@app.get("/api/health")
def health():
    return jsonify({"ok": True, "storage": "sqlite"})


@app.get("/api/inductions")
def inductions_index():
    return jsonify(list_records())


@app.post("/api/inductions")
def inductions_create():
    payload = request.get_json(silent=True)
    errors = validate_induction_payload(payload)

    if errors:
        return jsonify({"errors": errors}), 400

    for _ in range(5):
        record = create_record(payload)
        try:
            saved = insert_record(record)
            return jsonify(saved), 201
        except sqlite3.IntegrityError:
            continue

    return jsonify({"error": "Unable to create a unique reference number."}), 500


@app.get("/api/inductions/<reference_number>")
def inductions_show(reference_number):
    record = find_record(reference_number)

    if not record:
        return jsonify({"error": "Induction record not found."}), 404

    return jsonify(record)


@app.get("/api/admin/inductions/export.csv")
def inductions_export_csv():
    unauthorized = require_admin_access()
    if unauthorized:
        return unauthorized

    csv_content = records_to_csv(list_records(limit=None))
    return Response(
        csv_content,
        mimetype="text/csv",
        headers={
            "Content-Disposition": 'attachment; filename="eka-inductions.csv"',
        },
    )


@app.get("/api/admin/inductions/export.xlsx")
def inductions_export_xlsx():
    unauthorized = require_admin_access()
    if unauthorized:
        return unauthorized

    workbook = records_to_xlsx(list_records(limit=None))
    return send_file(
        workbook,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True,
        download_name="eka-inductions.xlsx",
    )


@app.get("/api/inductions/<reference_number>/certificate")
def induction_certificate(reference_number):
    record = find_record(reference_number)

    if not record:
        return jsonify({"error": "Induction record not found."}), 404

    certificate = generate_certificate_pdf(record)
    return send_file(
        certificate,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=f"eka-induction-{record['referenceNumber']}.pdf",
    )


@app.errorhandler(404)
def not_found(_error):
    return jsonify({"error": "Route not found."}), 404


init_db()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")))
