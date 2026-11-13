const ExchangeRequest = require('../models/ExchangeRequest');
const Task = require('../models/Task');
const User = require('../models/User');
const { logActivity } = require('../utils/activityLogger');
const { createNotification } = require('../utils/notificationHelper');
const { emitToFlat } = require('../config/socket');

// @route GET /api/exchanges
const getExchanges = async (req, res, next) => {
  try {
    const { status = 'pending' } = req.query;

    const query = { flat: req.flatId };
    if (status !== 'all') {
      query.status = status;
    }

    const exchanges = await ExchangeRequest.find(query)
      .populate('requester', 'name username avatarColor email')
      .populate('requestedTo', 'name username avatarColor email')
      .populate('offeredTask')
      .populate('targetTask')
      .populate('resolvedBy', 'name username')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: exchanges.length,
      exchanges
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/exchanges
const createExchange = async (req, res, next) => {
  try {
    const {
      type, // 'request_help' | 'volunteer' | 'swap'
      offeredTaskId,
      targetTaskId,
      requestedToId,
      message
    } = req.body;

    if (!type || !offeredTaskId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide exchange type and offered task.'
      });
    }

    const offeredTask = await Task.findOne({ _id: offeredTaskId, flat: req.flatId });
    if (!offeredTask) {
      return res.status(404).json({ success: false, message: 'Offered task not found in flat.' });
    }

    if (offeredTask.status === 'Completed') {
      return res.status(400).json({ success: false, message: 'Cannot exchange a completed task.' });
    }

    let targetTask = null;
    if (type === 'swap') {
      if (!targetTaskId) {
        return res.status(400).json({ success: false, message: 'Swap requires a target task to exchange with.' });
      }
      targetTask = await Task.findOne({ _id: targetTaskId, flat: req.flatId });
      if (!targetTask) {
        return res.status(404).json({ success: false, message: 'Target task not found in flat.' });
      }
      if (targetTask.status === 'Completed') {
        return res.status(400).json({ success: false, message: 'Cannot swap with an already completed task.' });
      }
    }

    // Determine target recipient
    let requestedTo = null;
    if (requestedToId) {
      requestedTo = await User.findOne({ _id: requestedToId, flat: req.flatId });
    } else if (type === 'volunteer') {
      // Volunteering for someone else's task -> recipient is the assignee of offeredTask
      requestedTo = await User.findOne({ _id: offeredTask.assignedTo, flat: req.flatId });
    } else if (type === 'swap' && targetTask) {
      // Swapping tasks -> recipient is the assignee of targetTask
      requestedTo = await User.findOne({ _id: targetTask.assignedTo, flat: req.flatId });
    }

    const exchange = await ExchangeRequest.create({
      flat: req.flatId,
      requester: req.user._id,
      requestedTo: requestedTo ? requestedTo._id : null,
      type,
      offeredTask: offeredTask._id,
      targetTask: targetTask ? targetTask._id : null,
      message: message ? message.trim() : '',
      status: 'pending'
    });

    // Notify recipient or all flatmates
    if (requestedTo) {
      let notifyMsg = `${req.user.name} sent you a chore exchange request: `;
      if (type === 'request_help') notifyMsg += `Help needed on "${offeredTask.title}".`;
      if (type === 'volunteer') notifyMsg += `Offered to take over "${offeredTask.title}".`;
      if (type === 'swap') notifyMsg += `Wants to swap "${offeredTask.title}" with your "${targetTask?.title}".`;

      await createNotification({
        recipient: requestedTo._id,
        sender: req.user._id,
        flat: req.flatId,
        type: 'exchange_requested',
        title: 'Chore Exchange Request',
        message: notifyMsg,
        link: '/exchange',
        metadata: { exchangeId: exchange._id }
      });
    }

    await logActivity({
      flat: req.flatId,
      actor: req.user._id,
      targetUser: requestedTo ? requestedTo._id : null,
      action: 'created_exchange',
      category: 'exchange',
      details: `${req.user.name} proposed a chore exchange (${type}): "${offeredTask.title}".`
    });

    const populated = await ExchangeRequest.findById(exchange._id)
      .populate('requester', 'name username avatarColor email')
      .populate('requestedTo', 'name username avatarColor email')
      .populate('offeredTask')
      .populate('targetTask');

    emitToFlat(req.flatId.toString(), 'exchange_created', populated);

    res.status(201).json({
      success: true,
      message: 'Chore exchange request submitted successfully!',
      exchange: populated
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/exchanges/:id/respond
const respondToExchange = async (req, res, next) => {
  try {
    const { action, responseNote } = req.body; // 'accept' | 'reject'

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be accept or reject.' });
    }

    const exchange = await ExchangeRequest.findOne({
      _id: req.params.id,
      flat: req.flatId,
      status: 'pending'
    }).populate('offeredTask targetTask requester requestedTo');

    if (!exchange) {
      return res.status(404).json({ success: false, message: 'Pending exchange request not found.' });
    }

    exchange.status = action === 'accept' ? 'accepted' : 'rejected';
    exchange.responseNote = responseNote ? responseNote.trim() : '';
    exchange.resolvedBy = req.user._id;
    exchange.resolvedAt = new Date();

    if (action === 'accept') {
      const offeredTask = await Task.findById(exchange.offeredTask._id);

      if (exchange.type === 'request_help') {
        // Someone accepted to take over requester's task
        // Reassign offeredTask to the responder
        const helper = req.user;
        offeredTask.assignedTo = helper._id;
        offeredTask.history.push({
          action: 'exchanged',
          performedBy: helper._id,
          timestamp: new Date(),
          details: `Reassigned to ${helper.name} via accepted chore exchange request.`
        });
        await offeredTask.save();
      } else if (exchange.type === 'volunteer') {
        // Requester volunteered to take over offeredTask; now accepted by task owner
        offeredTask.assignedTo = exchange.requester._id;
        offeredTask.history.push({
          action: 'exchanged',
          performedBy: req.user._id,
          timestamp: new Date(),
          details: `Volunteered and reassigned to ${exchange.requester.name}.`
        });
        await offeredTask.save();
      } else if (exchange.type === 'swap') {
        // Swap tasks between two users
        const targetTask = await Task.findById(exchange.targetTask._id);
        const tempAssignee = offeredTask.assignedTo;
        offeredTask.assignedTo = targetTask.assignedTo;
        targetTask.assignedTo = tempAssignee;

        offeredTask.history.push({
          action: 'swapped',
          performedBy: req.user._id,
          timestamp: new Date(),
          details: `Swapped task with "${targetTask.title}" via exchange.`
        });
        targetTask.history.push({
          action: 'swapped',
          performedBy: req.user._id,
          timestamp: new Date(),
          details: `Swapped task with "${offeredTask.title}" via exchange.`
        });

        await offeredTask.save();
        await targetTask.save();
      }

      // Notify requester
      await createNotification({
        recipient: exchange.requester._id,
        sender: req.user._id,
        flat: req.flatId,
        type: 'exchange_accepted',
        title: 'Chore Exchange Accepted! 🎉',
        message: `${req.user.name} accepted your chore exchange request. Task assignments have been updated.`,
        link: '/my-tasks'
      });

      await logActivity({
        flat: req.flatId,
        actor: req.user._id,
        targetUser: exchange.requester._id,
        action: 'accepted_exchange',
        category: 'exchange',
        details: `${req.user.name} accepted chore exchange request from ${exchange.requester.name}.`
      });
    } else {
      // Rejected
      await createNotification({
        recipient: exchange.requester._id,
        sender: req.user._id,
        flat: req.flatId,
        type: 'exchange_rejected',
        title: 'Chore Exchange Declined',
        message: `${req.user.name} was unable to accept your chore exchange request.`,
        link: '/exchange'
      });

      await logActivity({
        flat: req.flatId,
        actor: req.user._id,
        targetUser: exchange.requester._id,
        action: 'declined_exchange',
        category: 'exchange',
        details: `${req.user.name} declined chore exchange request from ${exchange.requester.name}.`
      });
    }

    await exchange.save();

    const populated = await ExchangeRequest.findById(exchange._id)
      .populate('requester', 'name username avatarColor email')
      .populate('requestedTo', 'name username avatarColor email')
      .populate('offeredTask')
      .populate('targetTask')
      .populate('resolvedBy', 'name username');

    emitToFlat(req.flatId.toString(), 'exchange_updated', populated);
    emitToFlat(req.flatId.toString(), 'task_updated', {});

    res.status(200).json({
      success: true,
      message: `Exchange request ${action}ed successfully.`,
      exchange: populated
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExchanges,
  createExchange,
  respondToExchange
};

