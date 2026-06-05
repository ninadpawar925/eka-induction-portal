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
    const accent = "#ffc000";
    const dark = "#1f1f1f";
    const muted = "#666666";

    response.setHeader("Content-Type", "application/pdf");
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="eka-induction-${record.referenceNumber}.pdf"`
    );

    document.pipe(response);

    document
      .rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2)
      .lineWidth(2)
      .stroke(accent);

    document
      .rect(margin + 8, margin + 8, pageWidth - margin * 2 - 16, pageHeight - margin * 2 - 16)
      .lineWidth(0.5)
      .stroke("#d6d6d6");

    if (fs.existsSync(logoPath)) {
      document.image(logoPath, pageWidth / 2 - 95, 68, {
        fit: [190, 70],
        align: "center",
      });
    }

    document
      .font("Helvetica-Bold")
      .fontSize(24)
      .fillColor(dark)
      .text("Eka Infra Safety Induction", 0, 145, {
        align: "center",
      });

    document
      .moveDown(0.4)
      .fontSize(30)
      .fillColor(accent)
      .text("Certificate of Completion", {
        align: "center",
      });

    document
      .moveDown(0.8)
      .font("Helvetica")
      .fontSize(12)
      .fillColor(muted)
      .text("This certifies that the employee named below has completed the safety induction process and assessment.", {
        align: "center",
        width: pageWidth - margin * 2,
      });

    document
      .moveTo(margin + 42, 245)
      .lineTo(pageWidth - margin - 42, 245)
      .lineWidth(1)
      .stroke(accent);

    document
      .font("Helvetica-Bold")
      .fontSize(20)
      .fillColor(dark)
      .text(record.fullName, margin, 270, {
        align: "center",
      });

    document
      .font("Helvetica")
      .fontSize(11)
      .fillColor(muted)
      .text(`Employee ID: ${record.employeeId}`, {
        align: "center",
      });

    const detailsTop = 340;
    const labelX = 95;
    const valueX = 250;
    const rowGap = 30;
    const details = [
      ["Designation", record.designation],
      ["Department", record.department],
      ["Date of Joining", record.dateOfJoining],
      ["Mobile Number", record.phone],
      ["Language", record.language],
      ["Quiz Score", `${record.quizScore}/${record.totalQuestions}`],
      ["Completion Date", completedDate],
      ["Reference Number", record.referenceNumber],
    ];

    document
      .roundedRect(78, detailsTop - 28, pageWidth - 156, 286, 10)
      .fillAndStroke("#fbfbfb", "#eeeeee");

    details.forEach(([label, value], index) => {
      const y = detailsTop + index * rowGap;

      document
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor(muted)
        .text(label.toUpperCase(), labelX, y, {
          width: 130,
        });

      document
        .font("Helvetica")
        .fontSize(12)
        .fillColor(dark)
        .text(value, valueX, y - 1, {
          width: 260,
        });
    });

    document
      .roundedRect(180, 655, pageWidth - 360, 58, 8)
      .fillAndStroke("#111111", "#111111");

    document
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor("#bdbdbd")
      .text("REFERENCE NUMBER", 180, 670, {
        width: pageWidth - 360,
        align: "center",
      });

    document
      .fontSize(22)
      .fillColor(accent)
      .text(record.referenceNumber, 180, 685, {
        width: pageWidth - 360,
        align: "center",
      });

    document
      .font("Helvetica")
      .fontSize(9)
      .fillColor(muted)
      .text("Generated by Eka Infra Induction Portal", margin, pageHeight - 82, {
        align: "center",
      });

    document
      .fontSize(8)
      .fillColor("#999999")
      .text("This certificate is valid only with the reference number shown above.", margin, pageHeight - 66, {
      align: "center",
      });

    document.end();
  }
);

app.use((request, response) => {
  response.status(404).json({ error: "Route not found." });
});

app.listen(port, () => {
  console.log(`Eka induction API running on http://localhost:${port}`);
});
