// backend/server.js
const express = require("express");
const multer = require("multer");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const util = require("util");

const app = express();
app.use(cors());
app.use(express.json());

const UPLOADS_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

// multer storage config
const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    const safeName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, safeName);
  }
});

// file size limit: 10MB
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed"));
    }
    cb(null, true);
  }
});

// open sqlite DB
const DB_FILE = path.join(__dirname, "documents.db");
const db = new sqlite3.Database(DB_FILE);

// promisify helpers
const dbRun = (...args) =>
  new Promise((resolve, reject) => db.run(...args, function (err) {
    if (err) reject(err); else resolve(this);
  }));

const dbAll = (sql, params = []) =>
  new Promise((resolve, reject) => db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows))));

const dbGet = (sql, params = []) =>
  new Promise((resolve, reject) => db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row))));

const unlinkAsync = util.promisify(fs.unlink);

// initialize table
db.run(`CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  filepath TEXT NOT NULL,
  filesize INTEGER NOT NULL,
  uploaded_at TEXT NOT NULL
)`);

// --- Routes ---

// health
app.get("/", (req, res) => {
  res.json({ ok: true, message: "Patient Document Portal backend is running" });
});

// Upload PDF
app.post("/documents/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const { filename, path: filepath, size } = req.file;
    const uploaded_at = new Date().toISOString();
    const result = await dbRun(
      `INSERT INTO documents (filename, filepath, filesize, uploaded_at) VALUES (?, ?, ?, ?)`,
      [filename, filepath, size, uploaded_at]
    );
    res.json({ message: "Uploaded", id: result.lastID, filename, size, uploaded_at });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Upload failed" });
  }
});

// List all documents
app.get("/documents", async (req, res) => {
  try {
    const rows = await dbAll(`SELECT id, filename, filesize, uploaded_at FROM documents ORDER BY uploaded_at DESC`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch documents" });
  }
});

// Download document by id
app.get("/documents/:id", async (req, res) => {
  try {
    const row = await dbGet(`SELECT * FROM documents WHERE id = ?`, [req.params.id]);
    if (!row) return res.status(404).json({ error: "Document not found" });
    // stream download with original filename
    res.download(row.filepath, row.filename);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Download failed" });
  }
});

// Delete document by id
app.delete("/documents/:id", async (req, res) => {
  try {
    const row = await dbGet(`SELECT * FROM documents WHERE id = ?`, [req.params.id]);
    if (!row) return res.status(404).json({ error: "Document not found" });
    // delete file from disk
    await unlinkAsync(row.filepath).catch((e) => {
      // if file not found, continue to delete DB row
      console.warn("File deletion warning:", e.message);
    });
    await dbRun(`DELETE FROM documents WHERE id = ?`, [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Delete failed" });
  }
});

// start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend listening on http://localhost:${PORT}`));
