const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const {
  getConversations, startConversation,
  getMessages, sendMessage, getUnreadCount,
} = require('../controllers/messagesController');

router.get( '/conversations',      protect, getConversations);
router.post('/conversations',      protect, startConversation);
router.get( '/conversations/:id',  protect, getMessages);
router.post('/conversations/:id',  protect, sendMessage);
router.get( '/unread',             protect, getUnreadCount);

module.exports = router;
