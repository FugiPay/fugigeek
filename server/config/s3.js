const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');
const multer   = require('multer');
const path     = require('path');
const crypto   = require('crypto');

// ── S3 client ─────────────────────────────────────────────────────────────
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  // Required for non us-east-1 buckets to prevent PermanentRedirect
  followRegionRedirects: true,
});

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_MB   = 5;

// ── File filter ───────────────────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Accepted: jpg, png, webp`), false);
  }
};

// ── Multer-S3 storage ──────────────────────────────────────────────────────
const storage = multerS3({
  s3,
  bucket:      (req, file, cb) => cb(null, process.env.AWS_S3_BUCKET),
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (req, file, cb) => {
    const unique = crypto.randomBytes(16).toString('hex');
    const ext    = path.extname(file.originalname).toLowerCase();
    cb(null, `fugigeek/uploads/${Date.now()}-${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
});

// ── Helper: delete a file from S3 by its key ─────────────────────────────
const deleteFromS3 = async (key) => {
  await s3.send(new DeleteObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key:    key,
  }));
};

module.exports = { s3, upload, deleteFromS3 };
