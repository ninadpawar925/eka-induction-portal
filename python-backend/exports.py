import csv
from io import BytesIO, StringIO

from openpyxl import Workbook


EXPORT_COLUMNS = [
    ("Reference Number", "referenceNumber"),
    ("Full Name", "fullName"),
    ("Employee ID", "employeeId"),
    ("Designation", "designation"),
    ("Department", "department"),
    ("Date of Joining", "dateOfJoining"),
    ("Mobile Number", "phone"),
    ("Language", "language"),
    ("Quiz Score", "quizScore"),
    ("Total Questions", "totalQuestions"),
    ("Completed At (IST)", "completedAt"),
]


def records_to_csv(records):
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow([label for label, _key in EXPORT_COLUMNS])

    for record in records:
        writer.writerow([record[key] for _label, key in EXPORT_COLUMNS])

    return output.getvalue()


def records_to_xlsx(records):
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Inductions"
    sheet.append([label for label, _key in EXPORT_COLUMNS])

    for record in records:
        sheet.append([record[key] for _label, key in EXPORT_COLUMNS])

    for column in sheet.columns:
        max_length = max(len(str(cell.value or "")) for cell in column)
        sheet.column_dimensions[column[0].column_letter].width = min(max_length + 2, 42)

    output = BytesIO()
    workbook.save(output)
    output.seek(0)
    return output
