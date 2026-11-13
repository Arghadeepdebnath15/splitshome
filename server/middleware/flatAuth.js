const Flat = require('../models/Flat');

const requireFlat = async (req, res, next) => {
  if (!req.user || !req.user.flat) {
    return res.status(403).json({
      success: false,
      message: 'You must create or join a flat first before accessing this feature.'
    });
  }

  try {
    const flat = await Flat.findById(req.user.flat);
    if (!flat) {
      return res.status(404).json({
        success: false,
        message: 'Your associated flat was not found.'
      });
    }

    // Verify user is in flat members
    const isMember = flat.members.some(
      m => m.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You are not an active member of this flat.'
      });
    }

    req.flat = flat;
    req.flatId = flat._id;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error checking flat authorization: ' + error.message
    });
  }
};

module.exports = { requireFlat };

