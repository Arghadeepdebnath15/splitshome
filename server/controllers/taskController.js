const Task = require('../models/Task');
const ChoreTransaction = require('../models/ChoreTransaction');
const User = require('../models/User');
const { logActivity } = require('../utils/activityLogger');
const { createNotification } = require('../utils/notificationHelper');
const { emitToFlat } = require('../config/socket');

// Helper to update overdue tasks in query
const refreshOverdueTasks = async (flatId) => {
  const now = new Date();
  await Task.updateMany(
    {
      flat: flatId,
      status: { $in: ['Pending', 'In Progress'] },
      dueDate: { $lt: now }
    },
    { $set: { status: 'Overdue' } }
  );
};

// @route GET /api/tasks
const getTasks = async (req, res, next) => {
  try {
    await refreshOverdueTasks(req.flatId);

    const { status, category, priority, assignedTo, search, view } = req.query;

    const query = { flat: req.flatId };

    if (status && status !== 'all') {
      query.status = status;
    }
    if (category && category !== 'all') {
      query.category = category;
    }
    if (priority && priority !== 'all') {
      query.priority = priority;
    }
    if (assignedTo && assignedTo !== 'all') {
      query.assignedTo = assignedTo;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // If view is 'my-tasks', filter assigned to logged-in user
    if (view === 'my-tasks') {
      query.assignedTo = req.user._id;
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name username avatarColor email')
      .populate('createdBy', 'name username avatarColor')
      .populate('completedBy', 'name username avatarColor')
      .populate('choreTransaction')
      .sort({ dueDate: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/tasks/:id
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, flat: req.flatId })
      .populate('assignedTo', 'name username avatarColor email')
      .populate('createdBy', 'name username avatarColor')
      .populate('completedBy', 'name username avatarColor')
      .populate('choreTransaction')
      .populate('history.performedBy', 'name username avatarColor');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found in this flat.'
      });
    }

    res.status(200).json({
      success: true,
      task
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/tasks
const createTask = async (req, res, next) => {
  try {
    const {
      title,
      description,
      assignedTo,
      category,
      priority,
      dueDate,
      creditValue
    } = req.body;

    if (!title || !assignedTo || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide task title, assigned flatmate, and due date.'
      });
    }

    // Verify assignedTo belongs to this flat
    const assignee = await User.findOne({ _id: assignedTo, flat: req.flatId });
    if (!assignee) {
      return res.status(400).json({
        success: false,
        message: 'The assigned user is not a member of your flat.'
      });
    }

    const task = await Task.create({
      flat: req.flatId,
      title: title.trim(),
      description: description ? description.trim() : '',
      assignedTo,
      createdBy: req.user._id,
      category: category || 'Cleaning',
      priority: priority || 'Medium',
      dueDate: new Date(dueDate),
      creditValue: creditValue ? Number(creditValue) : (req.flat.settings?.defaultCreditValue || 1),
      status: 'Pending',
      history: [{
        action: 'created',
        performedBy: req.user._id,
        timestamp: new Date(),
        details: `Task created by ${req.user.name} and assigned to ${assignee.name}`
      }]
    });

    // Notify assigned flatmate
    if (assignee._id.toString() !== req.user._id.toString()) {
      await createNotification({
        recipient: assignee._id,
        sender: req.user._id,
        flat: req.flatId,
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: `${req.user.name} assigned you: "${task.title}" (Due: ${new Date(task.dueDate).toLocaleDateString()}, ${task.creditValue} cr)`,
        link: '/my-tasks',
        metadata: { taskId: task._id }
      });
    }

    await logActivity({
      flat: req.flatId,
      actor: req.user._id,
      targetUser: assignee._id,
      action: 'created_task',
      category: 'task',
      details: `${req.user.name} created task "${task.title}" and assigned it to ${assignee.name} (${task.creditValue} credits).`,
      metadata: { taskId: task._id }
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name username avatarColor email')
      .populate('createdBy', 'name username avatarColor');

    emitToFlat(req.flatId.toString(), 'task_created', populatedTask);

    res.status(201).json({
      success: true,
      message: 'Task created successfully!',
      task: populatedTask
    });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/tasks/:id
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, flat: req.flatId });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.'
      });
    }

    const {
      title,
      description,
      assignedTo,
      category,
      priority,
      status,
      dueDate,
      creditValue
    } = req.body;

    const previousAssignee = task.assignedTo.toString();

    if (title) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (category) task.category = category;
    if (priority) task.priority = priority;
    if (status && ['Pending', 'In Progress', 'Completed', 'Overdue'].includes(status)) {
      task.status = status;
    }
    if (dueDate) task.dueDate = new Date(dueDate);
    if (creditValue !== undefined) task.creditValue = Number(creditValue);

    if (assignedTo && assignedTo !== previousAssignee) {
      const newAssignee = await User.findOne({ _id: assignedTo, flat: req.flatId });
      if (!newAssignee) {
        return res.status(400).json({
          success: false,
          message: 'New assignee is not in this flat.'
        });
      }
      task.assignedTo = assignedTo;

      task.history.push({
        action: 'reassigned',
        performedBy: req.user._id,
        timestamp: new Date(),
        details: `Task reassigned to ${newAssignee.name}`
      });

      // Notify new assignee
      if (newAssignee._id.toString() !== req.user._id.toString()) {
        await createNotification({
          recipient: newAssignee._id,
          sender: req.user._id,
          flat: req.flatId,
          type: 'task_assigned',
          title: 'Task Reassigned To You',
          message: `${req.user.name} reassigned task "${task.title}" to you.`,
          link: '/my-tasks'
        });
      }
    }

    task.history.push({
      action: 'updated',
      performedBy: req.user._id,
      timestamp: new Date(),
      details: `Task updated by ${req.user.name}`
    });

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name username avatarColor email')
      .populate('createdBy', 'name username avatarColor')
      .populate('completedBy', 'name username avatarColor');

    emitToFlat(req.flatId.toString(), 'task_updated', populatedTask);

    res.status(200).json({
      success: true,
      message: 'Task updated successfully!',
      task: populatedTask
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/tasks/:id/complete
// CORE CHORE COMPLETION & CREDIT ENGINE
const completeTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, flat: req.flatId })
      .populate('assignedTo', 'name username avatarColor email');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.'
      });
    }

    if (task.status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'This task has already been completed.'
      });
    }

    // Determine who completed the task
    // Can specify completedBy in request body (e.g. if logging on behalf of flatmate), default is req.user._id
    const completerId = req.body.completedBy || req.user._id;
    const completer = await User.findOne({ _id: completerId, flat: req.flatId });

    if (!completer) {
      return res.status(400).json({
        success: false,
        message: 'Completing user not found in this flat.'
      });
    }

    const assignedUserId = task.assignedTo._id.toString();
    const isCompletedOnBehalf = completer._id.toString() !== assignedUserId;

    task.status = 'Completed';
    task.completedAt = new Date();
    task.completedBy = completer._id;
    task.isCompletedOnBehalf = isCompletedOnBehalf;
    if (req.body.proofImage) {
      task.proofImage = req.body.proofImage;
    }

    let transactionRecord = null;

    if (isCompletedOnBehalf) {
      // Check if duplicate transaction already exists for this task
      const existingTxn = await ChoreTransaction.findOne({ task: task._id });
      if (!existingTxn) {
        transactionRecord = await ChoreTransaction.create({
          flat: req.flatId,
          task: task._id,
          creditor: completer._id,     // Earner: e.g. Arghadeep
          debtor: task.assignedTo._id, // Debtor: e.g. Rahul
          credits: task.creditValue || 1,
          type: 'chore_completed',
          status: 'confirmed',
          notes: `Completed "${task.title}" on behalf of ${task.assignedTo.name}`
        });

        task.choreTransaction = transactionRecord._id;

        // Notify Debtor (whose task was completed)
        await createNotification({
          recipient: task.assignedTo._id,
          sender: completer._id,
          flat: req.flatId,
          type: 'debt_incurred',
          title: 'Chore Completed on Your Behalf',
          message: `${completer.name} completed your task "${task.title}". You now owe ${task.creditValue} credit(s).`,
          link: '/credits',
          metadata: {
            taskId: task._id,
            transactionId: transactionRecord._id,
            credits: task.creditValue
          }
        });

        // Notify Creditor (who earned the credit)
        await createNotification({
          recipient: completer._id,
          sender: task.assignedTo._id,
          flat: req.flatId,
          type: 'credit_earned',
          title: 'Chore Credits Earned!',
          message: `You completed "${task.title}" for ${task.assignedTo.name} and earned ${task.creditValue} credit(s)!`,
          link: '/credits',
          metadata: {
            taskId: task._id,
            transactionId: transactionRecord._id,
            credits: task.creditValue
          }
        });

        // Activity log for chore credit
        await logActivity({
          flat: req.flatId,
          actor: completer._id,
          targetUser: task.assignedTo._id,
          action: 'completed_task_on_behalf',
          category: 'credit',
          details: `${completer.name} completed "${task.title}" for ${task.assignedTo.name}. ${task.assignedTo.name} owes ${completer.name} ${task.creditValue} credit(s).`,
          metadata: {
            taskId: task._id,
            credits: task.creditValue,
            transactionId: transactionRecord._id
          }
        });
      }
    } else {
      // Completed own task: no credit or debt generated
      await logActivity({
        flat: req.flatId,
        actor: completer._id,
        action: 'completed_own_task',
        category: 'task',
        details: `${completer.name} completed their assigned task "${task.title}".`,
        metadata: { taskId: task._id }
      });
    }

    task.history.push({
      action: 'completed',
      performedBy: completer._id,
      timestamp: new Date(),
      details: isCompletedOnBehalf
        ? `Completed by ${completer.name} on behalf of ${task.assignedTo.name} (${task.creditValue} credits generated)`
        : `Completed by ${completer.name}`
    });

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name username avatarColor email')
      .populate('createdBy', 'name username avatarColor')
      .populate('completedBy', 'name username avatarColor')
      .populate('choreTransaction');

    emitToFlat(req.flatId.toString(), 'task_completed', {
      task: populatedTask,
      transaction: transactionRecord
    });
    emitToFlat(req.flatId.toString(), 'ledger_updated', {});

    res.status(200).json({
      success: true,
      message: isCompletedOnBehalf
        ? `Task completed! ${completer.name} earned ${task.creditValue} credit(s) from ${task.assignedTo.name}.`
        : 'Task completed successfully!',
      task: populatedTask,
      transaction: transactionRecord
    });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/tasks/:id
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, flat: req.flatId });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.'
      });
    }

    const taskTitle = task.title;
    await Task.findByIdAndDelete(task._id);

    await logActivity({
      flat: req.flatId,
      actor: req.user._id,
      action: 'deleted_task',
      category: 'task',
      details: `${req.user.name} deleted task "${taskTitle}".`
    });

    emitToFlat(req.flatId.toString(), 'task_deleted', { taskId: task._id });

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  completeTask,
  deleteTask
};

