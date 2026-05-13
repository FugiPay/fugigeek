const Notification = require('../models/Notification');

// Create a notification and emit it in real-time via socket
const notify = async (io, { recipient, type, title, body, link }) => {
  try {
    const notification = await Notification.create({ recipient, type, title, body, link });
    if (io) {
      io.to(recipient.toString()).emit('notification', {
        _id:       notification._id,
        type, title, body, link,
        read:      false,
        createdAt: notification.createdAt,
      });
    }
    return notification;
  } catch (err) {
    console.error('Notification error:', err.message);
  }
};

module.exports = notify;
