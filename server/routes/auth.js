const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const {
  register, login, getMe,
  updateProfile, updatePassword,
  forgotPassword, resetPassword,
} = require('../controllers/authController');

router.post('/register',                 register);
router.post('/login',                    login);
router.get( '/me',          protect,     getMe);
router.put( '/updateprofile', protect,   updateProfile);
router.put( '/updatepassword', protect,  updatePassword);
router.post('/forgotpassword',           forgotPassword);
router.put( '/resetpassword/:token',     resetPassword);

module.exports = router;
