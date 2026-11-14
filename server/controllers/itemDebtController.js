const ItemDebt = require('../models/ItemDebt');
const User = require('../models/User');
const { logActivity } = require('../utils/activityLogger');
const { createNotification } = require('../utils/notificationHelper');
const { emitToFlat } = require('../config/socket');

// @route GET /api/items
const getItemDebts = async (req, res, next) => {
  try {
    const { filter = 'all', status = 'owed' } = req.query;

    const query = { flat: req.flatId };

    if (status !== 'all') {
      query.status = status;
    }

    if (filter === 'i_owe') {
      query.borrower = req.user._id;
    } else if (filter === 'they_owe_me') {
      query.lender = req.user._id;
    }

    const itemDebts = await ItemDebt.find(query)
      .populate('borrower', 'name username avatarColor email')
      .populate('lender', 'name username avatarColor email')
      .sort({ createdAt: -1 });

    // Aggregate summary
    const allFlatDebts = await ItemDebt.find({ flat: req.flatId });
    const iOweCount = allFlatDebts.filter(
      d => d.borrower.toString() === req.user._id.toString() && d.status === 'owed'
    ).length;
    const theyOweMeCount = allFlatDebts.filter(
      d => d.lender.toString() === req.user._id.toString() && d.status === 'owed'
    ).length;
    const settledCount = allFlatDebts.filter(d => d.status === 'returned').length;

    res.status(200).json({
      success: true,
      count: itemDebts.length,
      summary: {
        iOweCount,
        theyOweMeCount,
        settledCount
      },
      itemDebts
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/items
const createItemDebt = async (req, res, next) => {
  try {
    const { borrowerId, lenderId, itemName, quantity, unit, description, imageUrl } = req.body;

    if (!borrowerId || !lenderId || !itemName || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Please provide borrower, lender, item name, and quantity.'
      });
    }

    if (borrowerId === lenderId) {
      return res.status(400).json({
        success: false,
        message: 'Borrower and lender cannot be the same person.'
      });
    }

    const borrower = await User.findOne({ _id: borrowerId, flat: req.flatId });
    const lender = await User.findOne({ _id: lenderId, flat: req.flatId });

    if (!borrower || !lender) {
      return res.status(400).json({
        success: false,
        message: 'Both borrower and lender must be flat members.'
      });
    }

    const itemDebt = await ItemDebt.create({
      flat: req.flatId,
      borrower: borrower._id,
      lender: lender._id,
      itemName: itemName.trim(),
      quantity: Number(quantity),
      unit: unit ? unit.trim() : 'units',
      description: description ? description.trim() : '',
      imageUrl: imageUrl || '',
      status: 'owed',
      history: [{
        action: 'borrowed',
        performedBy: req.user._id,
        timestamp: new Date(),
        note: `Logged: ${borrower.name} owes ${lender.name} ${quantity} ${unit || 'units'} of ${itemName}`
      }]
    });

    // Notify borrower or lender depending on who logged it
    const targetUser = req.user._id.toString() === borrower._id.toString() ? lender : borrower;
    const isBorrowerLogging = req.user._id.toString() === borrower._id.toString();

    await createNotification({
      recipient: targetUser._id,
      sender: req.user._id,
      flat: req.flatId,
      type: 'item_borrowed',
      title: isBorrowerLogging ? 'Item Borrowed Logged' : 'Item Lent Logged',
      message: isBorrowerLogging
        ? `${borrower.name} logged that they owe you ${quantity} ${unit || ''} of ${itemName}.`
        : `${lender.name} recorded that you owe them ${quantity} ${unit || ''} of ${itemName}.`,
      link: '/items'
    });

    await logActivity({
      flat: req.flatId,
      actor: req.user._id,
      targetUser: targetUser._id,
      action: 'borrowed_item',
      category: 'item_debt',
      details: `${borrower.name} owes ${lender.name} ${quantity} ${unit || 'units'} of "${itemName}" (${description || 'pantry share'}).`
    });

    const populated = await ItemDebt.findById(itemDebt._id)
      .populate('borrower', 'name username avatarColor email')
      .populate('lender', 'name username avatarColor email');

    emitToFlat(req.flatId.toString(), 'item_debt_created', populated);

    res.status(201).json({
      success: true,
      message: `Recorded: ${quantity} ${unit || ''} of ${itemName} owed to ${lender.name}!`,
      itemDebt: populated
    });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/items/:id/return
const markItemReturned = async (req, res, next) => {
  try {
    const itemDebt = await ItemDebt.findOne({ _id: req.params.id, flat: req.flatId })
      .populate('borrower lender');

    if (!itemDebt) {
      return res.status(404).json({ success: false, message: 'Item debt record not found.' });
    }

    if (itemDebt.status === 'returned') {
      return res.status(400).json({ success: false, message: 'This item has already been marked returned.' });
    }

    itemDebt.status = 'returned';
    itemDebt.returnedAt = new Date();
    itemDebt.history.push({
      action: 'returned',
      performedBy: req.user._id,
      timestamp: new Date(),
      note: `Marked returned by ${req.user.name}`
    });

    await itemDebt.save();

    const otherUser = req.user._id.toString() === itemDebt.borrower._id.toString()
      ? itemDebt.lender
      : itemDebt.borrower;

    await createNotification({
      recipient: otherUser._id,
      sender: req.user._id,
      flat: req.flatId,
      type: 'item_returned',
      title: 'Item Returned / Settled',
      message: `${itemDebt.quantity} ${itemDebt.unit} of ${itemDebt.itemName} has been marked as returned!`,
      link: '/items'
    });

    await logActivity({
      flat: req.flatId,
      actor: req.user._id,
      targetUser: otherUser._id,
      action: 'returned_item',
      category: 'item_debt',
      details: `${itemDebt.borrower.name} returned ${itemDebt.quantity} ${itemDebt.unit} of "${itemDebt.itemName}" to ${itemDebt.lender.name}.`
    });

    emitToFlat(req.flatId.toString(), 'item_debt_updated', itemDebt);

    res.status(200).json({
      success: true,
      message: `Marked ${itemDebt.quantity} ${itemDebt.unit} of ${itemDebt.itemName} as returned.`,
      itemDebt
    });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/items/:id
const updateItemDebt = async (req, res, next) => {
  try {
    const itemDebt = await ItemDebt.findOne({ _id: req.params.id, flat: req.flatId });

    if (!itemDebt) {
      return res.status(404).json({ success: false, message: 'Item debt record not found.' });
    }

    const { quantity, unit, itemName, description, imageUrl } = req.body;

    const changes = [];
    if (quantity !== undefined && Number(quantity) > 0 && Number(quantity) !== itemDebt.quantity) {
      changes.push(`quantity: ${itemDebt.quantity} -> ${quantity}`);
      itemDebt.quantity = Number(quantity);
    }
    if (unit && unit.trim() !== itemDebt.unit) {
      changes.push(`unit: ${itemDebt.unit} -> ${unit.trim()}`);
      itemDebt.unit = unit.trim();
    }
    if (itemName && itemName.trim() !== itemDebt.itemName) {
      changes.push(`item: ${itemDebt.itemName} -> ${itemName.trim()}`);
      itemDebt.itemName = itemName.trim();
    }
    if (description !== undefined) {
      itemDebt.description = description.trim();
    }
    if (imageUrl !== undefined) {
      itemDebt.imageUrl = imageUrl;
    }

    if (changes.length > 0) {
      itemDebt.history.push({
        action: 'updated',
        performedBy: req.user._id,
        timestamp: new Date(),
        note: `Updated by ${req.user.name}: ${changes.join(', ')}`
      });
    }

    await itemDebt.save();

    const populated = await ItemDebt.findById(itemDebt._id)
      .populate('borrower', 'name username avatarColor email')
      .populate('lender', 'name username avatarColor email');

    emitToFlat(req.flatId.toString(), 'item_debt_updated', populated);

    res.status(200).json({
      success: true,
      message: 'Item debt updated successfully',
      itemDebt: populated
    });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/items/:id
const deleteItemDebt = async (req, res, next) => {
  try {
    const itemDebt = await ItemDebt.findOne({ _id: req.params.id, flat: req.flatId });

    if (!itemDebt) {
      return res.status(404).json({ success: false, message: 'Item debt record not found.' });
    }

    await ItemDebt.findByIdAndDelete(itemDebt._id);

    emitToFlat(req.flatId.toString(), 'item_debt_deleted', { itemDebtId: itemDebt._id });

    res.status(200).json({
      success: true,
      message: 'Item debt record removed.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getItemDebts,
  createItemDebt,
  updateItemDebt,
  markItemReturned,
  deleteItemDebt
};

