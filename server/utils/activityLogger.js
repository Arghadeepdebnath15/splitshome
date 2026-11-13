const ActivityLog = require('../models/ActivityLog');
const { emitToFlat } = require('../config/socket');

const logActivity = async ({
  flat,
  actor,
  targetUser = null,
  action,
  category = 'task',
  details,
  metadata = {}
}) => {
  try {
    const activity = await ActivityLog.create({
      flat,
      actor,
      targetUser,
      action,
      category,
      details,
      metadata
    });

    const populatedActivity = await ActivityLog.findById(activity._id)
      .populate('actor', 'name username avatarColor')
      .populate('targetUser', 'name username avatarColor');

    emitToFlat(flat.toString(), 'new_activity', populatedActivity);
    return populatedActivity;
  } catch (error) {
    console.error('[ActivityLog Error]:', error.message);
    return null;
  }
};

module.exports = {
  logActivity
};

