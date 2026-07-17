import sqlite3
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATABASE_PATH = DATA_DIR / "inductions.db"


def get_connection():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    with get_connection() as connection:
        connection.execute(
            """
            create table if not exists inductions (
              id text primary key,
              reference_number text not null unique,
              language text not null check (language in ('English', 'Hindi')),
              full_name text not null,
              employee_id text not null,
              designation text not null,
              department text not null,
              date_of_joining text not null,
              phone text not null check (length(phone) = 10),
              quiz_score integer not null check (quiz_score >= 0),
              total_questions integer not null check (total_questions > 0),
              completed_at text not null,
              created_at text not null default current_timestamp,
              check (quiz_score <= total_questions)
            )
            """
        )
        connection.execute(
            """
            create index if not exists inductions_employee_id_idx
            on inductions (employee_id)
            """
        )
        connection.execute(
            """
            create index if not exists inductions_completed_at_idx
            on inductions (completed_at desc)
            """
        )


def row_to_record(row):
    return {
        "id": row["id"],
        "referenceNumber": row["reference_number"],
        "language": row["language"],
        "fullName": row["full_name"],
        "employeeId": row["employee_id"],
        "designation": row["designation"],
        "department": row["department"],
        "dateOfJoining": row["date_of_joining"],
        "phone": row["phone"],
        "quizScore": row["quiz_score"],
        "totalQuestions": row["total_questions"],
        "completedAt": row["completed_at"],
    }


def insert_record(record):
    with get_connection() as connection:
        connection.execute(
            """
            insert into inductions (
              id,
              reference_number,
              language,
              full_name,
              employee_id,
              designation,
              department,
              date_of_joining,
              phone,
              quiz_score,
              total_questions,
              completed_at
            ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                record["id"],
                record["referenceNumber"],
                record["language"],
                record["fullName"],
                record["employeeId"],
                record["designation"],
                record["department"],
                record["dateOfJoining"],
                record["phone"],
                record["quizScore"],
                record["totalQuestions"],
                record["completedAt"],
            ),
        )

    return {
        "id": record["id"],
        "referenceNumber": record["referenceNumber"],
        "completedAt": record["completedAt"],
    }


def find_record(reference_number):
    with get_connection() as connection:
        row = connection.execute(
            """
            select *
            from inductions
            where reference_number = ?
            """,
            (reference_number,),
        ).fetchone()

    return row_to_record(row) if row else None


def list_records(limit=100):
    with get_connection() as connection:
        if limit:
            rows = connection.execute(
                """
                select *
                from inductions
                order by completed_at desc
                limit ?
                """,
                (limit,),
            ).fetchall()
        else:
            rows = connection.execute(
                """
                select *
                from inductions
                order by completed_at desc
                """
            ).fetchall()

    return [row_to_record(row) for row in rows]
