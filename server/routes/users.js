const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getProfessionals, getUser, deactivateUser } = require('../controllers/usersController');

router.get( '/professionals',         getProfessionals);
router.get( '/:id',                   getUser);
router.put( '/:id/deactivate', protect, authorize('admin'), deactivateUser);

module.exports = router;
