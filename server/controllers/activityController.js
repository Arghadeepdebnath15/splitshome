const ActivityLog = require('../models/ActivityLog');

// @route GET /api/activities
const getActivities = async (req, res, next) => {
  try {
    const { category, limit = 50, page = 1 } = req.query;

    const query = { flat: req.flatId };
    if (category && category !== 'all') {
      query.category = category;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const activities = await ActivityLog.find(query)
      .populate('actor', 'name username avatarColor email')
      .populate('targetUser', 'name username avatarColor email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ActivityLog.countDocuments(query);

    res.status(200).json({
      success: true,
      activities,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActivities
};

