require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Flat = require('./models/Flat');
const Task = require('./models/Task');
const ChoreTransaction = require('./models/ChoreTransaction');
const ExchangeRequest = require('./models/ExchangeRequest');
const ItemDebt = require('./models/ItemDebt');
const Notification = require('./models/Notification');
const ActivityLog = require('./models/ActivityLog');

const seedData = async () => {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas.');

    // Clear existing sample collections
    console.log('Clearing old sample data...');
    await User.deleteMany({});
    await Flat.deleteMany({});
    await Task.deleteMany({});
    await ChoreTransaction.deleteMany({});
    await ExchangeRequest.deleteMany({});
    await ItemDebt.deleteMany({});
    await Notification.deleteMany({});
    await ActivityLog.deleteMany({});

    console.log('Creating users...');
    const arghadeep = await User.create({
      name: 'Arghadeep Debnath',
      username: 'arghadeep',
      email: 'arghadeep@example.com',
      password: 'password123',
      avatarColor: '#10B981',
      phone: '+1 (555) 234-5678'
    });

    const rahul = await User.create({
      name: 'Rahul Sharma',
      username: 'rahul',
      email: 'rahul@example.com',
      password: 'password123',
      avatarColor: '#3B82F6',
      phone: '+1 (555) 345-6789'
    });

    const priya = await User.create({
      name: 'Priya Patel',
      username: 'priya',
      email: 'priya@example.com',
      password: 'password123',
      avatarColor: '#EC4899',
      phone: '+1 (555) 456-7890'
    });

    console.log('Creating shared flat...');
    const flat = await Flat.create({
      name: 'Emerald Heights Apt 4B',
      address: '742 Evergreen Terrace, Springfield',
      inviteCode: 'FLAT-2026',
      createdBy: arghadeep._id,
      members: [
        { user: arghadeep._id, role: 'admin', joinedAt: new Date(Date.now() - 30 * 86400000) },
        { user: rahul._id, role: 'member', joinedAt: new Date(Date.now() - 25 * 86400000) },
        { user: priya._id, role: 'member', joinedAt: new Date(Date.now() - 20 * 86400000) }
      ],
      settings: {
        allowInstantCreditSettle: true,
        defaultCreditValue: 1
      }
    });

    // Update users' flat references
    arghadeep.flat = flat._id;
    arghadeep.role = 'admin';
    await arghadeep.save();

    rahul.flat = flat._id;
    rahul.role = 'member';
    await rahul.save();

    priya.flat = flat._id;
    priya.role = 'member';
    await priya.save();

    console.log('Creating tasks...');
    const now = new Date();
    const tomorrow = new Date(Date.now() + 86400000);
    const inTwoDays = new Date(Date.now() + 2 * 86400000);
    const yesterday = new Date(Date.now() - 86400000);

    // 1. Completed on behalf of Rahul by Arghadeep (The classic prompt example!)
    const dishTask = await Task.create({
      flat: flat._id,
      title: 'Wash the dishes and wipe counter',
      description: 'Clean lunch plates, frying pans, and dry sink area',
      assignedTo: rahul._id,
      createdBy: rahul._id,
      category: 'Washing dishes',
      priority: 'High',
      status: 'Completed',
      dueDate: yesterday,
      creditValue: 1,
      completedAt: new Date(Date.now() - 12 * 3600000),
      completedBy: arghadeep._id,
      isCompletedOnBehalf: true
    });

    const dishTxn = await ChoreTransaction.create({
      flat: flat._id,
      task: dishTask._id,
      creditor: arghadeep._id,
      debtor: rahul._id,
      credits: 1,
      type: 'chore_completed',
      status: 'confirmed',
      notes: 'Arghadeep completed "Wash the dishes and wipe counter" on behalf of Rahul'
    });

    dishTask.choreTransaction = dishTxn._id;
    dishTask.history.push({
      action: 'completed',
      performedBy: arghadeep._id,
      timestamp: dishTask.completedAt,
      details: 'Completed by Arghadeep Debnath on behalf of Rahul Sharma (+1 credit)'
    });
    await dishTask.save();

    // 2. Kitchen Deep Clean completed by Arghadeep for Rahul (3 credits)
    const kitchenTask = await Task.create({
      flat: flat._id,
      title: 'Deep clean kitchen and stove',
      description: 'Degrease stove burners, clean microwave inside out, empty trash bin',
      assignedTo: rahul._id,
      createdBy: arghadeep._id,
      category: 'Cleaning',
      priority: 'High',
      status: 'Completed',
      dueDate: new Date(Date.now() - 48 * 3600000),
      creditValue: 3,
      completedAt: new Date(Date.now() - 40 * 3600000),
      completedBy: arghadeep._id,
      isCompletedOnBehalf: true
    });

    const kitchenTxn = await ChoreTransaction.create({
      flat: flat._id,
      task: kitchenTask._id,
      creditor: arghadeep._id,
      debtor: rahul._id,
      credits: 3,
      type: 'chore_completed',
      status: 'confirmed',
      notes: 'Arghadeep completed "Deep clean kitchen and stove" on behalf of Rahul'
    });
    kitchenTask.choreTransaction = kitchenTxn._id;
    await kitchenTask.save();

    // 3. Grocery Shopping completed by Arghadeep for Priya (1 credit)
    const groceryTask = await Task.create({
      flat: flat._id,
      title: 'Buy household grocery essentials',
      description: 'Trash bags, paper towels, dish soap, laundry detergent',
      assignedTo: priya._id,
      createdBy: priya._id,
      category: 'Grocery shopping',
      priority: 'Medium',
      status: 'Completed',
      dueDate: new Date(Date.now() - 24 * 3600000),
      creditValue: 1,
      completedAt: new Date(Date.now() - 18 * 3600000),
      completedBy: arghadeep._id,
      isCompletedOnBehalf: true
    });

    const groceryTxn = await ChoreTransaction.create({
      flat: flat._id,
      task: groceryTask._id,
      creditor: arghadeep._id,
      debtor: priya._id,
      credits: 1,
      type: 'chore_completed',
      status: 'confirmed',
      notes: 'Arghadeep completed "Buy household grocery essentials" on behalf of Priya'
    });
    groceryTask.choreTransaction = groceryTxn._id;
    await groceryTask.save();

    // 4. Rahul completed task for Arghadeep (2 credits) -> offsets previous debt!
    const balconyTask = await Task.create({
      flat: flat._id,
      title: 'Clean balcony and water plants',
      description: 'Sweep balcony floor, mop tiles, and water potted herbs',
      assignedTo: arghadeep._id,
      createdBy: arghadeep._id,
      category: 'Cleaning',
      priority: 'Medium',
      status: 'Completed',
      dueDate: new Date(Date.now() - 6 * 3600000),
      creditValue: 2,
      completedAt: new Date(Date.now() - 2 * 3600000),
      completedBy: rahul._id,
      isCompletedOnBehalf: true
    });

    const balconyTxn = await ChoreTransaction.create({
      flat: flat._id,
      task: balconyTask._id,
      creditor: rahul._id,
      debtor: arghadeep._id,
      credits: 2,
      type: 'chore_completed',
      status: 'confirmed',
      notes: 'Rahul completed "Clean balcony and water plants" on behalf of Arghadeep'
    });
    balconyTask.choreTransaction = balconyTxn._id;
    await balconyTask.save();

    // Active pending tasks
    const pendingTask1 = await Task.create({
      flat: flat._id,
      title: 'Bathroom scrub and toilet disinfectant',
      description: 'Clean shower glass, scrub toilet bowl, restock toilet paper',
      assignedTo: rahul._id,
      createdBy: arghadeep._id,
      category: 'Bathroom cleaning',
      priority: 'High',
      status: 'Pending',
      dueDate: tomorrow,
      creditValue: 2
    });

    const pendingTask2 = await Task.create({
      flat: flat._id,
      title: 'Mop hallway and living room floor',
      description: 'Vacuum sofa cushions and wet mop wooden floor',
      assignedTo: arghadeep._id,
      createdBy: arghadeep._id,
      category: 'Cleaning',
      priority: 'Medium',
      status: 'In Progress',
      dueDate: inTwoDays,
      creditValue: 2
    });

    const pendingTask3 = await Task.create({
      flat: flat._id,
      title: 'Take out recyclables and garbage',
      description: 'Separate plastic & paper bins, haul down to disposal chute',
      assignedTo: priya._id,
      createdBy: arghadeep._id,
      category: 'Garbage disposal',
      priority: 'Low',
      status: 'Pending',
      dueDate: tomorrow,
      creditValue: 1
    });

    // 5. Item Debts (The exact user prompt example: 2 onions, 1 glass rice, etc.)
    console.log('Creating item debt records (onions, rice, milk)...');
    await ItemDebt.create({
      flat: flat._id,
      borrower: rahul._id,
      lender: arghadeep._id,
      itemName: 'Onions',
      quantity: 2,
      unit: 'onions',
      description: 'Borrowed for cooking dinner mutton curry',
      status: 'owed'
    });

    await ItemDebt.create({
      flat: flat._id,
      borrower: arghadeep._id,
      lender: rahul._id,
      itemName: 'Basmati Rice',
      quantity: 1,
      unit: 'glass',
      description: 'Borrowed 1 glass rice when packet ran out on Tuesday',
      status: 'owed'
    });

    await ItemDebt.create({
      flat: flat._id,
      borrower: priya._id,
      lender: arghadeep._id,
      itemName: 'Full Cream Milk',
      quantity: 1,
      unit: 'packet',
      description: 'Borrowed for morning tea/coffee preparation',
      status: 'owed'
    });

    await ItemDebt.create({
      flat: flat._id,
      borrower: rahul._id,
      lender: priya._id,
      itemName: 'Eggs',
      quantity: 4,
      unit: 'eggs',
      description: 'Borrowed for Sunday breakfast omelettes',
      status: 'returned',
      returnedAt: new Date(Date.now() - 24 * 3600000)
    });

    // 6. Chore Exchange Requests
    console.log('Creating sample chore exchange requests...');
    await ExchangeRequest.create({
      flat: flat._id,
      requester: rahul._id,
      requestedTo: arghadeep._id,
      type: 'request_help',
      offeredTask: pendingTask1._id,
      message: 'Hey Arghadeep! I have an office deadline tomorrow. Can you take over bathroom scrubbing?',
      status: 'pending'
    });

    // 7. Activity logs
    console.log('Creating activity logs...');
    await ActivityLog.create({
      flat: flat._id,
      actor: arghadeep._id,
      targetUser: rahul._id,
      action: 'completed_task_on_behalf',
      category: 'credit',
      details: 'Arghadeep completed "Wash the dishes and wipe counter" for Rahul. Rahul owes Arghadeep 1 credit.'
    });

    await ActivityLog.create({
      flat: flat._id,
      actor: arghadeep._id,
      targetUser: rahul._id,
      action: 'completed_task_on_behalf',
      category: 'credit',
      details: 'Arghadeep completed "Deep clean kitchen and stove" for Rahul. Rahul owes Arghadeep 3 credits.'
    });

    await ActivityLog.create({
      flat: flat._id,
      actor: rahul._id,
      targetUser: arghadeep._id,
      action: 'completed_task_on_behalf',
      category: 'credit',
      details: 'Rahul completed "Clean balcony and water plants" for Arghadeep. Arghadeep owes Rahul 2 credits.'
    });

    await ActivityLog.create({
      flat: flat._id,
      actor: rahul._id,
      targetUser: arghadeep._id,
      action: 'borrowed_item',
      category: 'item_debt',
      details: 'Rahul owes Arghadeep 2 onions (Borrowed for cooking dinner mutton curry).'
    });

    await ActivityLog.create({
      flat: flat._id,
      actor: arghadeep._id,
      targetUser: rahul._id,
      action: 'borrowed_item',
      category: 'item_debt',
      details: 'Arghadeep owes Rahul 1 glass of Basmati Rice.'
    });

    // 8. Notifications
    console.log('Creating notifications...');
    await Notification.create({
      recipient: arghadeep._id,
      sender: rahul._id,
      flat: flat._id,
      type: 'exchange_requested',
      title: 'Chore Exchange Request',
      message: 'Rahul requested help with "Bathroom scrub and toilet disinfectant"',
      link: '/exchange'
    });

    await Notification.create({
      recipient: arghadeep._id,
      sender: rahul._id,
      flat: flat._id,
      type: 'credit_earned',
      title: 'Chore Credits Earned!',
      message: 'You completed "Wash the dishes" for Rahul and earned 1 credit.',
      link: '/credits'
    });

    await Notification.create({
      recipient: rahul._id,
      sender: arghadeep._id,
      flat: flat._id,
      type: 'debt_incurred',
      title: 'Chore Completed on Your Behalf',
      message: 'Arghadeep completed "Wash the dishes". You now owe 1 chore credit.',
      link: '/credits'
    });

    console.log('----------------------------------------------------');
    console.log('FlatMate database seeded successfully on MongoDB Atlas!');
    console.log('Credentials:');
    console.log('1. Arghadeep Debnath: arghadeep@example.com / password123');
    console.log('2. Rahul Sharma:     rahul@example.com / password123');
    console.log('3. Priya Patel:      priya@example.com / password123');
    console.log('Flat Code:           FLAT-2026');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Seed Error:', error);
    process.exit(1);
  }
};

seedData();

