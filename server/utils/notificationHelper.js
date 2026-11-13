const Notification = require('../models/Notification');
const { emitToUser } = require('../config/socket');

const createNotification = async ({
  recipient,
  sender = null,
  flat = null,
  type,
  title,
  message,
  link = '',
  metadata = {}
}) => {
  try {
    const notification = await Notification.create({
      recipient,
      sender,
      flat,
      type,
      title,
      message,
      link,
      metadata
    });

    const populatedNotification = await Notification.findById(notification._id)
      .populate('sender', 'name username avatarColor');

    emitToUser(recipient.toString(), 'new_notification', populatedNotification);
    return populatedNotification;
  } catch (error) {
    console.error('[Notification Error]:', error.message);
    return null;
  }
};

module.exports = {
  createNotification
};

