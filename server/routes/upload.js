const express  = require('express');
const router   = express.Router();
const { protect }  = require('../middleware/auth');
const { upload }   = require('../config/s3');
const {
  uploadAvatar,
  uploadPortfolioImage,
  deletePortfolioImage,
} = require('../controllers/uploadController');

// Multer error handler wrapper — catches S3/multer errors and returns JSON
const handleUpload = (fieldName) => (req, res, next) => {
  upload.single(fieldName)(req, res, (err) => {
    if (err) {
      console.error('Multer/S3 upload error:', err.message, err.code || '');
      return res.status(500).json({
        success: false,
        message: err.message || 'File upload failed',
        code:    err.code,
      });
    }
    next();
  });
};

router.post('/avatar',      protect, handleUpload('avatar'),  uploadAvatar);
router.post('/portfolio',   protect, handleUpload('image'),   uploadPortfolioImage);
router.delete('/portfolio', protect,                          deletePortfolioImage);

module.exports = router;
