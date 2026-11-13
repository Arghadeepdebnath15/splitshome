const Flat = require('../models/Flat');
const Task = require('../models/Task');
const ChoreTransaction = require('../models/ChoreTransaction');

// @route GET /api/leaderboard
const getLeaderboard = async (req, res, next) => {
  try {
    const flat = await Flat.findById(req.flatId).populate(
      'members.user',
      'name username email avatarColor role'
    );

    if (!flat) {
      return res.status(404).json({ success: false, message: 'Flat not found.' });
    }

    const members = flat.members.map(m => m.user).filter(Boolean);

    // Get all completed tasks
    const completedTasks = await Task.find({
      flat: req.flatId,
      status: 'Completed'
    });

    // Get all confirmed chore transactions
    const transactions = await ChoreTransaction.find({
      flat: req.flatId,
      status: 'confirmed'
    });

    const userStats = {};
    members.forEach(member => {
      userStats[member._id.toString()] = {
        user: member,
        tasksCompletedTotal: 0,
        tasksCompletedForOthers: 0,
        tasksCompletedOwn: 0,
        creditsEarned: 0,
        creditsOwed: 0,
        netBalance: 0,
        badges: []
      };
    });

    // Process completed tasks
    completedTasks.forEach(task => {
      if (task.completedBy) {
        const completerId = task.completedBy.toString();
        if (userStats[completerId]) {
          userStats[completerId].tasksCompletedTotal += 1;
          if (task.isCompletedOnBehalf) {
            userStats[completerId].tasksCompletedForOthers += 1;
          } else {
            userStats[completerId].tasksCompletedOwn += 1;
          }
        }
      }
    });

    // Process transactions
    transactions.forEach(txn => {
      const creditorId = txn.creditor.toString();
      const debtorId = txn.debtor.toString();

      if (userStats[creditorId]) {
        userStats[creditorId].creditsEarned += txn.credits;
      }
      if (userStats[debtorId]) {
        userStats[debtorId].creditsOwed += txn.credits;
      }
    });

    // Compute net balance and assign friendly badges
    const leaderboard = Object.values(userStats).map(stat => {
      stat.netBalance = Number((stat.creditsEarned - stat.creditsOwed).toFixed(2));
      stat.creditsEarned = Number(stat.creditsEarned.toFixed(2));
      stat.creditsOwed = Number(stat.creditsOwed.toFixed(2));

      // Friendly badges
      if (stat.tasksCompletedForOthers >= 3) {
        stat.badges.push({ name: 'Guardian Angel', icon: '😇', desc: 'Saved flatmates 3+ times' });
      }
      if (stat.tasksCompletedTotal >= 5) {
        stat.badges.push({ name: 'Chore Master', icon: '🏆', desc: 'Completed 5+ household chores' });
      }
      if (stat.creditsEarned >= 5) {
        stat.badges.push({ name: 'Credit Tycoon', icon: '💎', desc: 'Earned 5+ chore credits' });
      }
      if (stat.netBalance >= 0) {
        stat.badges.push({ name: 'Reliable Roomie', icon: '🤝', desc: 'Keeps credit balance positive' });
      }

      return stat;
    });

    // Specific category leaders
    const mostHelpful = [...leaderboard].sort((a, b) => b.tasksCompletedForOthers - a.tasksCompletedForOthers)[0] || null;
    const mostCompleted = [...leaderboard].sort((a, b) => b.tasksCompletedTotal - a.tasksCompletedTotal)[0] || null;
    const highestEarned = [...leaderboard].sort((a, b) => b.creditsEarned - a.creditsEarned)[0] || null;
    const mostOwed = [...leaderboard].sort((a, b) => b.creditsOwed - a.creditsOwed)[0] || null;

    // Overall rank sorted by net balance then completed tasks
    leaderboard.sort((a, b) => b.netBalance - a.netBalance || b.tasksCompletedTotal - a.tasksCompletedTotal);

    res.status(200).json({
      success: true,
      leaderboard,
      spotlight: {
        mostHelpful: mostHelpful && mostHelpful.tasksCompletedForOthers > 0 ? mostHelpful : null,
        mostCompleted: mostCompleted && mostCompleted.tasksCompletedTotal > 0 ? mostCompleted : null,
        highestEarned: highestEarned && highestEarned.creditsEarned > 0 ? highestEarned : null,
        mostOwed: mostOwed && mostOwed.creditsOwed > 0 ? mostOwed : null
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLeaderboard
};

