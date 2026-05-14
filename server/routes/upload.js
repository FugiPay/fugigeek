const express  = require('express');
const router   = express.Router();
const { protect }  = require('../middleware/auth');
const { upload }   = require('../config/s3');
const {
  uploadAvatar,
  uploadPortfolioImage,
  deletePortfolioImage,
} = require('../controllers/uploadController');

// Avatar — single image, max 2MB
router.post('/avatar',    protect, upload.single('avatar'),    uploadAvatar);

// Portfolio image — single image, returns URL to use in profile
router.post('/portfolio', protect, upload.single('image'),     uploadPortfolioImage);
router.delete('/portfolio', protect,                            deletePortfolioImage);

module.exports = router;
