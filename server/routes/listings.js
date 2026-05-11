const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../config/s3');
const {
  getTasks, getTask, createTask, updateTask, deleteTask,
  uploadAttachments, getProposals, submitProposal, acceptProposal, getMyTasks,
} = require('../controllers/listingsController');

// Public
router.get('/',         getTasks);
router.get('/my/tasks', protect, authorize('business', 'admin'), getMyTasks);
router.get('/:id',      getTask);

// Business only
router.post('/',        protect, authorize('business'), createTask);
router.put( '/:id',     protect, authorize('business', 'admin'), updateTask);
router.delete('/:id',   protect, authorize('business', 'admin'), deleteTask);
router.post('/:id/upload', protect, authorize('business'), upload.array('files', 5), uploadAttachments);

// Proposals
router.get( '/:id/proposals',              protect, authorize('business', 'admin'), getProposals);
router.post('/:id/proposals',              protect, authorize('professional'),      submitProposal);
router.put( '/:taskId/proposals/:proposalId/accept', protect, authorize('business'), acceptProposal);

module.exports = router;
