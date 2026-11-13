const crypto = require('crypto');
const Flat = require('../models/Flat');
const User = require('../models/User');
const { logActivity } = require('../utils/activityLogger');
const { createNotification } = require('../utils/notificationHelper');

const generateInviteCode = () => {
  return 'FLAT-' + crypto.randomBytes(3).toString('hex').toUpperCase();
};

// @route POST /api/flats/create
const createFlat = async (req, res, next) => {
  try {
    const { name, address, defaultCreditValue } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a name for your flat/household.'
      });
    }

    if (req.user.flat) {
      return res.status(400).json({
        success: false,
        message: 'You are already part of a flat. You must leave your current flat first.'
      });
    }

    let inviteCode = generateInviteCode();
    // Ensure code is unique
    let codeExists = await Flat.findOne({ inviteCode });
    while (codeExists) {
      inviteCode = generateInviteCode();
      codeExists = await Flat.findOne({ inviteCode });
    }

    const flat = await Flat.create({
      name: name.trim(),
      address: address ? address.trim() : '',
      inviteCode,
      createdBy: req.user._id,
      members: [{
        user: req.user._id,
        role: 'admin',
        joinedAt: new Date()
      }],
      settings: {
        defaultCreditValue: defaultCreditValue || 1,
        allowInstantCreditSettle: true
      }
    });

    // Update user
    await User.findByIdAndUpdate(req.user._id, {
      flat: flat._id,
      role: 'admin'
    });

    await logActivity({
      flat: flat._id,
      actor: req.user._id,
      action: 'created_flat',
      category: 'flat',
      details: `${req.user.name} created the flat "${flat.name}".`
    });

    const populatedFlat = await Flat.findById(flat._id).populate(
      'members.user',
      'name username email avatarColor role phone'
    );

    res.status(201).json({
      success: true,
      message: 'Flat created successfully!',
      flat: populatedFlat
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/flats/join
const joinFlat = async (req, res, next) => {
  try {
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a flat invitation code.'
      });
    }

    if (req.user.flat) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of a flat. Leave it first to join a new one.'
      });
    }

    const cleanCode = inviteCode.toUpperCase().trim();
    const flat = await Flat.findOne({ inviteCode: cleanCode });

    if (!flat) {
      return res.status(404).json({
        success: false,
        message: 'Invalid invitation code. No flat found with this code.'
      });
    }

    // Check if already a member
    const alreadyMember = flat.members.some(
      m => m.user.toString() === req.user._id.toString()
    );

    if (alreadyMember) {
      await User.findByIdAndUpdate(req.user._id, { flat: flat._id });
      return res.status(200).json({
        success: true,
        message: 'Welcome back to your flat!',
        flat
      });
    }

    // Add to members
    flat.members.push({
      user: req.user._id,
      role: 'member',
      joinedAt: new Date()
    });
    await flat.save();

    // Update user
    await User.findByIdAndUpdate(req.user._id, {
      flat: flat._id,
      role: 'member'
    });

    // Notify other members
    for (const member of flat.members) {
      if (member.user.toString() !== req.user._id.toString()) {
        await createNotification({
          recipient: member.user,
          sender: req.user._id,
          flat: flat._id,
          type: 'general',
          title: 'New Flatmate Joined',
          message: `${req.user.name} (@${req.user.username}) has joined ${flat.name}!`,
          link: '/flatmates'
        });
      }
    }

    await logActivity({
      flat: flat._id,
      actor: req.user._id,
      action: 'joined_flat',
      category: 'flat',
      details: `${req.user.name} joined the flat using an invite code.`
    });

    const populatedFlat = await Flat.findById(flat._id).populate(
      'members.user',
      'name username email avatarColor role phone'
    );

    res.status(200).json({
      success: true,
      message: `Successfully joined ${flat.name}!`,
      flat: populatedFlat
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/flats/current
const getFlatDetails = async (req, res, next) => {
  try {
    const flat = await Flat.findById(req.flatId).populate(
      'members.user',
      'name username email avatarColor role phone'
    ).populate('createdBy', 'name username');

    if (!flat) {
      return res.status(404).json({
        success: false,
        message: 'Flat not found.'
      });
    }

    res.status(200).json({
      success: true,
      flat
    });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/flats/settings
const updateFlatSettings = async (req, res, next) => {
  try {
    const { name, address, defaultCreditValue, allowInstantCreditSettle } = req.body;
    const flat = await Flat.findById(req.flatId);

    if (name) flat.name = name.trim();
    if (address !== undefined) flat.address = address.trim();
    if (defaultCreditValue) flat.settings.defaultCreditValue = defaultCreditValue;
    if (allowInstantCreditSettle !== undefined) {
      flat.settings.allowInstantCreditSettle = allowInstantCreditSettle;
    }

    await flat.save();

    await logActivity({
      flat: flat._id,
      actor: req.user._id,
      action: 'updated_settings',
      category: 'flat',
      details: `${req.user.name} updated the flat settings.`
    });

    const populatedFlat = await Flat.findById(flat._id).populate(
      'members.user',
      'name username email avatarColor role phone'
    );

    res.status(200).json({
      success: true,
      message: 'Flat settings updated successfully!',
      flat: populatedFlat
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/flats/leave
const leaveFlat = async (req, res, next) => {
  try {
    const flat = await Flat.findById(req.flatId);

    // Remove user from members
    flat.members = flat.members.filter(
      m => m.user.toString() !== req.user._id.toString()
    );

    // If flat has no members left, we can delete or keep
    await flat.save();

    await User.findByIdAndUpdate(req.user._id, {
      flat: null,
      role: 'member'
    });

    await logActivity({
      flat: flat._id,
      actor: req.user._id,
      action: 'left_flat',
      category: 'flat',
      details: `${req.user.name} left the flat.`
    });

    res.status(200).json({
      success: true,
      message: 'You have left the flat.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFlat,
  joinFlat,
  getFlatDetails,
  updateFlatSettings,
  leaveFlat
};

