const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const PDFDocument = require("pdfkit");
const { Pool } = require("pg");

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:3000";
const totalFallbackQuestions = 3;

app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
    })
  : null;

const dataDirectory = path.join(__dirname, "..", "data");
const dataFile = path.join(dataDirectory, "inductions.json");
const logoPath = path.join(
  __dirname,
  "..",
  "..",
  "frontend",
  "public",
  "logo-header.png"
);

function ensureDataFile() {
  if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, { recursive: true });
  }

  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, "[]", "utf8");
  }
}

function readFileStore() {
  ensureDataFile();

  try {
    const content = fs.readFileSync(dataFile, "utf8");
    return JSON.parse(content);
  } catch {
    return [];
  }
}

function writeFileStore(records) {
  ensureDataFile();
  fs.writeFileSync(dataFile, JSON.stringify(records, null, 2), "utf8");
}

function createReferenceNumber() {
  return String(crypto.randomInt(10000000, 100000000));
}

function normalizeText(value) {
  return String(value || "").trim();
}

function validateInductionPayload(payload) {
  const employee = payload && payload.employee;
  const errors = [];

  if (!payload || typeof payload !== "object") {
    return ["Request body is required."];
  }

  if (!["English", "Hindi"].includes(payload.language)) {
    errors.push("Language must be English or Hindi.");
  }

  if (!employee || typeof employee !== "object") {
    errors.push("Employee details are required.");
    return errors;
  }

  const requiredFields = [
    "fullName",
    "employeeId",
    "designation",
    "department",
    "dateOfJoining",
    "phone",
  ];

  for (const field of requiredFields) {
    if (!normalizeText(employee[field])) {
      errors.push(`${field} is required.`);
    }
  }

  if (!/^[0-9]{10}$/.test(normalizeText(employee.phone))) {
    errors.push("Phone must be a 10 digit number.");
  }

  if (!Number.isInteger(payload.quizScore) || payload.quizScore < 0) {
    errors.push("Quiz score must be a positive integer.");
  }

  if (
    !Number.isInteger(payload.totalQuestions) ||
    payload.totalQuestions <= 0
  ) {
    errors.push("Total questions must be a positive integer.");
  }

  if (
    Number.isInteger(payload.quizScore) &&
    Number.isInteger(payload.totalQuestions) &&
    payload.quizScore > payload.totalQuestions
  ) {
    errors.push("Quiz score cannot exceed total questions.");
  }

  return errors;
}

function toRecord(payload) {
  const employee = payload.employee;

  return {
    id: crypto.randomUUID(),
    referenceNumber: createReferenceNumber(),
    language: payload.language,
    fullName: normalizeText(employee.fullName),
    employeeId: normalizeText(employee.employeeId),
    designation: normalizeText(employee.designation),
    department: normalizeText(employee.department),
    dateOfJoining: normalizeText(employee.dateOfJoining),
    phone: normalizeText(employee.phone),
    quizScore: payload.quizScore,
    totalQuestions: payload.totalQuestions || totalFallbackQuestions,
    completedAt: new Date().toISOString(),
  };
}

async function saveRecord(record) {
  if (!pool) {
    const records = readFileStore();
    records.push(record);
    writeFileStore(records);
    return record;
  }

  const result = await pool.query(
    `insert into inductions (
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
    ) values (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
    )
    returning
      id,
      reference_number as "referenceNumber",
      completed_at as "completedAt"`,
    [
      record.id,
      record.referenceNumber,
      record.language,
      record.fullName,
      record.employeeId,
      record.designation,
      record.department,
      record.dateOfJoining,
      record.phone,
      record.quizScore,
      record.totalQuestions,
      record.completedAt,
    ]
  );

  return result.rows[0];
}

async function findRecord(referenceNumber) {
  if (!pool) {
    return (
      readFileStore().find(
        (record) => record.referenceNumber === referenceNumber
      ) || null
    );
  }

  const result = await pool.query(
    `select
      id,
      reference_number as "referenceNumber",
      language,
      full_name as "fullName",
      employee_id as "employeeId",
      designation,
      department,
      date_of_joining as "dateOfJoining",
      phone,
      quiz_score as "quizScore",
      total_questions as "totalQuestions",
      completed_at as "completedAt"
    from inductions
    where reference_number = $1`,
    [referenceNumber]
  );

  return result.rows[0] || null;
}

async function listRecords() {
  if (!pool) {
    return readFileStore().sort(
      (first, second) =>
        new Date(second.completedAt).getTime() -
        new Date(first.completedAt).getTime()
    );
  }

  const result = await pool.query(
    `select
      id,
      reference_number as "referenceNumber",
      language,
      full_name as "fullName",
      employee_id as "employeeId",
      designation,
      department,
      date_of_joining as "dateOfJoining",
      phone,
      quiz_score as "quizScore",
      total_questions as "totalQuestions",
      completed_at as "completedAt"
    from inductions
    order by completed_at desc
    limit 100`
  );

  return result.rows;
}

app.get("/api/health", (request, response) => {
  response.json({
    ok: true,
    storage: pool ? "postgres" : "file",
  });
});

app.get("/api/inductions", async (request, response) => {
  try {
    response.json(await listRecords());
  } catch (error) {
    console.error("Unable to list inductions", error);
    response.status(500).json({
      error: "Unable to list induction records.",
    });
  }
});

app.post("/api/inductions", async (request, response) => {
  const errors = validateInductionPayload(request.body);

  if (errors.length > 0) {
    response.status(400).json({ errors });
    return;
  }

  try {
    const record = toRecord(request.body);
    const saved = await saveRecord(record);

    response.status(201).json({
      id: saved.id,
      referenceNumber: saved.referenceNumber,
      completedAt: saved.completedAt,
    });
  } catch (error) {
    console.error("Unable to save induction", error);
    response.status(500).json({
      error: "Unable to save induction completion.",
    });
  }
});

app.get("/api/inductions/:referenceNumber", async (request, response) => {
  const record = await findRecord(request.params.referenceNumber);

  if (!record) {
    response.status(404).json({ error: "Induction record not found." });
    return;
  }

  response.json(record);
});

app.get(
  "/api/inductions/:referenceNumber/certificate",
  async (request, response) => {
    const record = await findRecord(request.params.referenceNumber);

    if (!record) {
      response.status(404).json({ error: "Induction record not found." });
      return;
    }

    const document = new PDFDocument({
      size: "A4",
      margin: 42,
      info: {
        Title: `Eka Infra Induction Certificate ${record.referenceNumber}`,
        Author: "Eka Infra",
      },
    });
    const completedDate = new Date(record.completedAt).toLocaleDateString(
      "en-IN"
    );
    const pageWidth = document.page.width;
    const pageHeight = document.page.height;
    const margin = 42;
    const accent = "#0b66c2";
    const dark = "#1f1f1f";
    const muted = "#676767";
    const background = "#f7f9fb";

    response.setHeader("Content-Type", "application/pdf");
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="eka-induction-${record.referenceNumber}.pdf"`
    );

    document.pipe(response);

    document
      .roundedRect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2, 20)
      .lineWidth(1.5)
      .stroke(accent);

    document
      .roundedRect(margin + 12, margin + 12, pageWidth - margin * 2 - 24, pageHeight - margin * 2 - 24, 16)
      .fill(background)
      .stroke("#dfe3ea");

    const contentWidth = pageWidth - margin * 2;
    const headerTop = margin + 30;
    const logoWidth = 140;
    const logoHeight = 50;

    if (fs.existsSync(logoPath)) {
      document.image(logoPath, (pageWidth - logoWidth) / 2, headerTop, {
        fit: [logoWidth, logoHeight],
      });
    }

    document
      .font("Helvetica-Bold")
      .fontSize(20)
      .fillColor(dark)
      .text("Eka Infra Safety Induction", margin, headerTop + 70, {
        width: contentWidth,
        align: "center",
      });

    document
      .font("Helvetica-Bold")
      .fontSize(36)
      .fillColor(accent)
      .text("Certificate of Completion", margin, headerTop + 106, {
        width: contentWidth,
        align: "center",
        lineGap: 4,
      });

    document
      .font("Helvetica")
      .fontSize(11)
      .fillColor(muted)
      .text(
        "This is to certify that the person named below has successfully completed the Eka Infra safety induction program and assessment.",
        margin,
        headerTop + 160,
        {
          width: contentWidth - 120,
          align: "center",
          lineGap: 4,
        }
      );

    document
      .moveTo(margin + 60, headerTop + 210)
      .lineTo(pageWidth - margin - 60, headerTop + 210)
      .lineWidth(1)
      .stroke(accent);

    document
      .font("Helvetica-Bold")
      .fontSize(24)
      .fillColor(dark)
      .text(record.fullName, margin, headerTop + 226, {
        width: contentWidth,
        align: "center",
      });

    document
      .font("Helvetica")
      .fontSize(11)
      .fillColor(muted)
      .text(`Employee ID: ${record.employeeId}`, margin, headerTop + 258, {
        width: contentWidth,
        align: "center",
      });

    const detailsTop = headerTop + 300;
    const infoBoxX = margin + 70;
    const infoBoxWidth = pageWidth - margin * 2 - 140;
    const leftColumnX = infoBoxX + 10;
    const rightColumnX = infoBoxX + infoBoxWidth / 2 + 10;
    const rowGap = 34;
    const details = [
      ["Designation", record.designation, "Department", record.department],
      ["Date of Joining", record.dateOfJoining, "Mobile Number", record.phone],
      ["Language", record.language, "Quiz Score", `${record.quizScore}/${record.totalQuestions}`],
      ["Completion Date", completedDate, "Reference Number", record.referenceNumber],
    ];

    document
      .roundedRect(infoBoxX, detailsTop - 24, infoBoxWidth, 280, 14)
      .fill("#ffffff")
      .stroke("#d8dde6");

    details.forEach(([leftLabel, leftValue, rightLabel, rightValue], index) => {
      const y = detailsTop + index * rowGap;

      document
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor(muted)
        .text(leftLabel.toUpperCase(), leftColumnX, y, {
          width: infoBoxWidth / 2 - 20,
        });

      document
        .font("Helvetica")
        .fontSize(12)
        .fillColor(dark)
        .text(leftValue, leftColumnX, y + 12, {
          width: infoBoxWidth / 2 - 20,
        });

      document
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor(muted)
        .text(rightLabel.toUpperCase(), rightColumnX, y, {
          width: infoBoxWidth / 2 - 20,
        });

      document
        .font("Helvetica")
        .fontSize(12)
        .fillColor(dark)
        .text(rightValue, rightColumnX, y + 12, {
          width: infoBoxWidth / 2 - 20,
        });
    });

    const signatureY = detailsTop + details.length * rowGap + 30;
    const signatureWidth = 180;
    const signatureLineY = signatureY + 24;

    document
      .moveTo(margin + 90, signatureLineY)
      .lineTo(margin + 90 + signatureWidth, signatureLineY)
      .lineWidth(0.7)
      .stroke(muted);

    document
      .moveTo(pageWidth - margin - 90 - signatureWidth, signatureLineY)
      .lineTo(pageWidth - margin - 90, signatureLineY)
      .stroke(muted);

    document
      .font("Helvetica")
      .fontSize(10)
      .fillColor(muted)
      .text("Authorized Signatory", margin + 90, signatureLineY + 6, {
        width: signatureWidth,
        align: "center",
      });

    document
      .font("Helvetica")
      .fontSize(10)
      .fillColor(muted)
      .text("Date", pageWidth - margin - 90 - signatureWidth, signatureLineY + 6, {
        width: signatureWidth,
        align: "center",
      });

    document
      .roundedRect(180, pageHeight - 128, pageWidth - 360, 58, 8)
      .fill("#f3f7fd")
      .stroke("#cdd6e8");

    document
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor("#5f6f8c")
      .text("REFERENCE NUMBER", 180, pageHeight - 112, {
        width: pageWidth - 360,
        align: "center",
      });

    document
      .font("Helvetica-Bold")
      .fontSize(20)
      .fillColor(dark)
      .text(record.referenceNumber, 180, pageHeight - 96, {
        width: pageWidth - 360,
        align: "center",
      });

    document
      .font("Helvetica")
      .fontSize(9)
      .fillColor(muted)
      .text("Generated by Eka Infra Induction Portal", margin, pageHeight - 44, {
        align: "center",
      });

    document
      .fontSize(8)
      .fillColor("#8b95a2")
      .text(
        "This certificate is valid only with the reference number shown above.",
        margin,
        pageHeight - 28,
        {
          align: "center",
        }
      );

    document.end();
  }
);

app.use((request, response) => {
  response.status(404).json({ error: "Route not found." });
});

app.listen(port, () => {
  console.log(`Eka induction API running on http://localhost:${port}`);
});
