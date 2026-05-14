const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../config/s3');
const {
  getTasks, getTask, createTask, updateTask, deleteTask, cancelTask,
  uploadAttachments, getProposals, submitProposal, acceptProposal, getMyTasks,
} = require('../controllers/listingsController');

// All roles that can post tasks
const POSTERS = ['individual', 'business', 'professional', 'admin', 'manager'];

// Public
router.get('/',         getTasks);
router.get('/my/tasks', protect, authorize(...POSTERS), getMyTasks);
router.get('/:id',      getTask);

// Task management — any poster role
router.post('/',                protect, authorize(...POSTERS),              createTask);
router.put( '/:id',             protect, authorize(...POSTERS),              updateTask);
router.put( '/:id/cancel',      protect, authorize(...POSTERS),              cancelTask);
router.delete('/:id',           protect, authorize(...POSTERS),              deleteTask);
router.post('/:id/upload',      protect, authorize(...POSTERS), upload.array('files', 5), uploadAttachments);

// Proposals
router.get( '/:id/proposals',                        protect, authorize(...POSTERS),     getProposals);
router.post('/:id/proposals',                        protect, authorize('professional'), submitProposal);
router.put( '/:taskId/proposals/:proposalId/accept', protect, authorize(...POSTERS),     acceptProposal);

module.exports = router;
