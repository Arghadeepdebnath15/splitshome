const Task = require('../models/Task');
const ChoreTransaction = require('../models/ChoreTransaction');
const ItemDebt = require('../models/ItemDebt');
const ActivityLog = require('../models/ActivityLog');

// @route GET /api/dashboard
const getDashboardStats = async (req, res, next) => {
  try {
    const flatId = req.flatId;
    const userId = req.user._id;

    // Refresh overdue status
    const now = new Date();
    await Task.updateMany(
      {
        flat: flatId,
        status: { $in: ['Pending', 'In Progress'] },
        dueDate: { $lt: now }
      },
      { $set: { status: 'Overdue' } }
    );

    // 1. Task counts
    const allTasks = await Task.find({ flat: flatId })
      .populate('assignedTo', 'name username avatarColor')
      .populate('completedBy', 'name username avatarColor');

    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === 'Completed').length;
    const pendingTasks = allTasks.filter(t => t.status === 'Pending' || t.status === 'In Progress').length;
    const overdueTasks = allTasks.filter(t => t.status === 'Overdue').length;

    // Assigned to me vs others
    const myTasks = allTasks.filter(t => t.assignedTo?._id.toString() === userId.toString());
    const myPendingTasks = myTasks.filter(t => t.status === 'Pending' || t.status === 'In Progress' || t.status === 'Overdue').length;
    const myCompletedTasks = myTasks.filter(t => t.status === 'Completed').length;
    const otherTasksCount = totalTasks - myTasks.length;

    // Category distribution
    const categoryCounts = {};
    allTasks.forEach(t => {
      categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
    });

    // 2. Credits & Debts
    const transactions = await ChoreTransaction.find({
      flat: flatId,
      status: 'confirmed'
    });

    let creditsEarned = 0;
    let creditsOwed = 0;

    transactions.forEach(txn => {
      if (txn.creditor.toString() === userId.toString()) {
        creditsEarned += txn.credits;
      }
      if (txn.debtor.toString() === userId.toString()) {
        creditsOwed += txn.credits;
      }
    });

    const netBalance = Number((creditsEarned - creditsOwed).toFixed(2));
    creditsEarned = Number(creditsEarned.toFixed(2));
    creditsOwed = Number(creditsOwed.toFixed(2));

    // 3. Item debts
    const allItemDebts = await ItemDebt.find({ flat: flatId, status: 'owed' });
    const itemsIOwe = allItemDebts.filter(i => i.borrower.toString() === userId.toString()).length;
    const itemsOwedToMe = allItemDebts.filter(i => i.lender.toString() === userId.toString()).length;

    // 4. Recent activity
    const recentActivity = await ActivityLog.find({ flat: flatId })
      .populate('actor', 'name username avatarColor')
      .populate('targetUser', 'name username avatarColor')
      .sort({ createdAt: -1 })
      .limit(10);

    // 5. Upcoming tasks
    const upcomingTasks = await Task.find({
      flat: flatId,
      status: { $in: ['Pending', 'In Progress'] }
    })
      .populate('assignedTo', 'name username avatarColor')
      .sort({ dueDate: 1 })
      .limit(5);

    res.status(200).json({
      success: true,
      stats: {
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        myTasksCount: myTasks.length,
        myPendingTasks,
        myCompletedTasks,
        otherTasksCount,
        creditsEarned,
        creditsOwed,
        netBalance,
        itemsIOwe,
        itemsOwedToMe,
        categoryCounts
      },
      upcomingTasks,
      recentActivity
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats
};

