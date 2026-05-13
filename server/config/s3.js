const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');
const multer   = require('multer');
const path     = require('path');
const crypto   = require('crypto');

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_MB   = 5;

// ── Lazy S3 client — only created when first needed ───────────────────────
let _s3 = null;
const getS3 = () => {
  if (!_s3) {
    _s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return _s3;
};

// ── File filter ───────────────────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed. Accepted: jpg, png, webp'), false);
  }
};

// ── Multer-S3 storage — bucket resolved at request time ───────────────────
const storage = multerS3({
  s3:          { send: (cmd) => getS3().send(cmd) },
  bucket:      (req, file, cb) => cb(null, process.env.AWS_S3_BUCKET),
  acl:         'public-read',
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key:         (req, file, cb) => {
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

// ── Delete a file from S3 by key ──────────────────────────────────────────
const deleteFromS3 = async (key) => {
  await getS3().send(new DeleteObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key:    key,
  }));
};

module.exports = { upload, deleteFromS3 };