from datetime import datetime, timedelta, timezone
from io import BytesIO
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_LOGO_PATH = BASE_DIR.parent / "frontend" / "public" / "logo-header.png"
INDIA_TIMEZONE = timezone(timedelta(hours=5, minutes=30), name="IST")


def _format_completion_time(value):
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return parsed.astimezone(INDIA_TIMEZONE).strftime(
            "%d/%m/%Y, %I:%M:%S %p IST"
        )
    except ValueError:
        return value


def _draw_centered_text(pdf, text, y, font_name, font_size, color, width):
    pdf.setFont(font_name, font_size)
    pdf.setFillColor(color)
    pdf.drawCentredString(width / 2, y, text)


def _draw_detail(pdf, label, value, x, y, box_width):
    pdf.setFillColor(colors.HexColor("#676767"))
    pdf.setFont("Helvetica-Bold", 8)
    pdf.drawString(x, y, label.upper())
    pdf.setFillColor(colors.HexColor("#1f1f1f"))
    pdf.setFont("Helvetica", 10)
    pdf.drawString(x, y - 14, str(value))


def generate_certificate_pdf(record, logo_path=None):
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    page_width, page_height = A4
    margin = 42
    accent = colors.HexColor("#0b66c2")
    dark = colors.HexColor("#1f1f1f")
    muted = colors.HexColor("#676767")
    background = colors.HexColor("#f7f9fb")
    logo = Path(logo_path) if logo_path else DEFAULT_LOGO_PATH

    pdf.setTitle(f"Eka Infra Induction Certificate {record['referenceNumber']}")
    pdf.setAuthor("Eka Infra")

    pdf.setStrokeColor(accent)
    pdf.setLineWidth(1.5)
    pdf.roundRect(margin, margin, page_width - margin * 2, page_height - margin * 2, 20)

    pdf.setFillColor(background)
    pdf.setStrokeColor(colors.HexColor("#dfe3ea"))
    pdf.roundRect(
        margin + 12,
        margin + 12,
        page_width - margin * 2 - 24,
        page_height - margin * 2 - 24,
        16,
        fill=1,
        stroke=1,
    )

    header_top = page_height - margin - 80
    if logo.exists():
        image = ImageReader(str(logo))
        logo_width = 140
        logo_height = 50
        pdf.drawImage(
            image,
            (page_width - logo_width) / 2,
            header_top,
            width=logo_width,
            height=logo_height,
            preserveAspectRatio=True,
            mask="auto",
        )

    _draw_centered_text(
        pdf,
        "Eka Infra Safety Induction",
        header_top - 42,
        "Helvetica-Bold",
        20,
        dark,
        page_width,
    )
    _draw_centered_text(
        pdf,
        "Certificate of Completion",
        header_top - 82,
        "Helvetica-Bold",
        32,
        accent,
        page_width,
    )

    pdf.setFillColor(muted)
    pdf.setFont("Helvetica", 10)
    pdf.drawCentredString(
        page_width / 2,
        header_top - 122,
        "This is to certify that the person named below has successfully completed",
    )
    pdf.drawCentredString(
        page_width / 2,
        header_top - 138,
        "the Eka Infra safety induction program and assessment.",
    )

    line_y = header_top - 178
    pdf.setStrokeColor(accent)
    pdf.line(margin + 60, line_y, page_width - margin - 60, line_y)

    _draw_centered_text(
        pdf,
        record["fullName"],
        line_y - 34,
        "Helvetica-Bold",
        24,
        dark,
        page_width,
    )
    _draw_centered_text(
        pdf,
        f"Employee ID: {record['employeeId']}",
        line_y - 58,
        "Helvetica",
        11,
        muted,
        page_width,
    )

    details_top = line_y - 120
    info_x = margin + 70
    info_width = page_width - margin * 2 - 140
    pdf.setFillColor(colors.white)
    pdf.setStrokeColor(colors.HexColor("#d8dde6"))
    pdf.roundRect(info_x, details_top - 120, info_width, 150, 14, fill=1, stroke=1)

    left_x = info_x + 16
    right_x = info_x + info_width / 2 + 16
    row_gap = 36
    details = [
        ("Designation", record["designation"], "Department", record["department"]),
        ("Date of Joining", record["dateOfJoining"], "Mobile Number", record["phone"]),
        ("Language", record["language"], "Quiz Score", f"{record['quizScore']}/{record['totalQuestions']}"),
        ("Completed At (IST)", _format_completion_time(record["completedAt"]), "Reference Number", record["referenceNumber"]),
    ]

    for index, (left_label, left_value, right_label, right_value) in enumerate(details):
        y = details_top - index * row_gap
        _draw_detail(pdf, left_label, left_value, left_x, y, info_width / 2 - 24)
        _draw_detail(pdf, right_label, right_value, right_x, y, info_width / 2 - 24)

    signature_y = margin + 156
    signature_width = 180
    pdf.setStrokeColor(muted)
    pdf.setLineWidth(0.7)
    pdf.line(margin + 90, signature_y, margin + 90 + signature_width, signature_y)
    pdf.line(page_width - margin - 90 - signature_width, signature_y, page_width - margin - 90, signature_y)
    pdf.setFillColor(muted)
    pdf.setFont("Helvetica", 10)
    pdf.drawCentredString(margin + 90 + signature_width / 2, signature_y - 16, "Authorized Signatory")
    pdf.drawCentredString(page_width - margin - 90 - signature_width / 2, signature_y - 16, "Date")

    reference_x = 180
    reference_y = margin + 34
    reference_width = page_width - 360
    pdf.setFillColor(colors.HexColor("#f3f7fd"))
    pdf.setStrokeColor(colors.HexColor("#cdd6e8"))
    pdf.roundRect(reference_x, reference_y, reference_width, 58, 8, fill=1, stroke=1)
    _draw_centered_text(pdf, "REFERENCE NUMBER", reference_y + 38, "Helvetica-Bold", 9, colors.HexColor("#5f6f8c"), page_width)
    _draw_centered_text(pdf, record["referenceNumber"], reference_y + 17, "Helvetica-Bold", 20, dark, page_width)

    pdf.setFillColor(muted)
    pdf.setFont("Helvetica", 9)
    pdf.drawCentredString(page_width / 2, margin - 2, "Generated by Eka Infra Induction Portal")
    pdf.setFont("Helvetica", 8)
    pdf.setFillColor(colors.HexColor("#8b95a2"))
    pdf.drawCentredString(page_width / 2, margin - 16, "This certificate is valid only with the reference number shown above.")

    pdf.showPage()
    pdf.save()
    buffer.seek(0)
    return buffer
