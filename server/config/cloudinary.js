const cloudinary     = require('cloudinary').v2;
const multer         = require('multer');
const { Readable }   = require('stream');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Custom multer storage engine — compatible with cloudinary v2 ──────────
// (multer-storage-cloudinary only supports cloudinary v1)
class CloudinaryStorageEngine {
  constructor(opts = {}) {
    this.folder         = opts.folder         || 'fugigeek';
    this.allowedFormats = opts.allowedFormats || ['jpg', 'jpeg', 'png', 'webp'];
    this.transformation = opts.transformation || [{ width: 1200, height: 900, crop: 'limit', quality: 'auto' }];
  }

  _handleFile(req, file, cb) {
    const ext = file.mimetype.split('/')[1];
    if (!this.allowedFormats.includes(ext)) {
      return cb(new Error(`File type not allowed. Accepted: ${this.allowedFormats.join(', ')}`));
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: this.folder, transformation: this.transformation, resource_type: 'auto' },
      (error, result) => {
        if (error) return cb(error);
        cb(null, {
          path:         result.secure_url, // req.file.path  → public URL
          filename:     result.public_id,  // req.file.filename → for deletion
          size:         result.bytes,
          mimetype:     file.mimetype,
          originalname: file.originalname,
        });
      }
    );

    file.stream.pipe(uploadStream);
  }

  _removeFile(req, file, cb) {
    file.filename
      ? cloudinary.uploader.destroy(file.filename, cb)
      : cb(null);
  }
}

const storage = new CloudinaryStorageEngine({
  folder:         'fugigeek',
  allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
  transformation: [{ width: 1200, height: 900, crop: 'limit', quality: 'auto' }],
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

module.exports = { cloudinary, upload };
