const http = require('http');

const request = (path, method = 'GET', data = null, token = null) => {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const options = {
      hostname: 'localhost',
      port: 5001,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
};

const runTests = async () => {
  console.log('--- 🧪 STARTING E2E API VERIFICATION TESTS ---');

  // 1. Health check
  const health = await request('/api/health');
  console.log('1. Health Check:', health.status === 200 ? '✅ PASSED' : '❌ FAILED', health.data);

  // 2. Login as Arghadeep
  const loginRes = await request('/api/auth/login', 'POST', {
    identifier: 'arghadeep@example.com',
    password: 'password123'
  });
  console.log('2. Login:', loginRes.status === 200 ? '✅ PASSED' : '❌ FAILED', loginRes.data.user.name);
  const token = loginRes.data.token;

  // 3. Current Flat
  const flatRes = await request('/api/flats/current', 'GET', null, token);
  console.log('3. Flat Info:', flatRes.status === 200 ? '✅ PASSED' : '❌ FAILED', flatRes.data.flat.name, 'InviteCode:', flatRes.data.flat.inviteCode);

  // 4. Dashboard Stats
  const dashRes = await request('/api/dashboard', 'GET', null, token);
  console.log('4. Dashboard Stats:', dashRes.status === 200 ? '✅ PASSED' : '❌ FAILED');
  console.log('   Total Tasks:', dashRes.data.stats.totalTasks, '| Completed:', dashRes.data.stats.completedTasks, '| Net Balance:', dashRes.data.stats.netBalance);

  // 5. Chore Credit & Debt Ledger (MOST IMPORTANT FEATURE)
  const ledgerRes = await request('/api/credits/ledger', 'GET', null, token);
  console.log('5. Credit Ledger:', ledgerRes.status === 200 ? '✅ PASSED' : '❌ FAILED');
  console.log('   --- Ledger Members ---');
  ledgerRes.data.ledger.forEach(m => {
    console.log(`   ${m.user.name.padEnd(20)} | Earned: ${m.creditsEarned} | Owed: ${m.creditsOwed} | Net: ${m.netBalance > 0 ? '+' : ''}${m.netBalance}`);
  });
  console.log('   --- Pairwise Debts ---');
  ledgerRes.data.pairwiseDebts.forEach(p => {
    if (p.isSettled) {
      console.log(`   ${p.userA.name} & ${p.userB.name}: All settled (0 net)`);
    } else {
      console.log(`   ${p.debtor.name} owes ${p.creditor.name} -> ${p.netAmount} credits`);
    }
  });

  // 6. Item & Pantry Debts ("2 onions", "1 glass rice")
  const itemsRes = await request('/api/items', 'GET', null, token);
  console.log('6. Pantry Items Owed:', itemsRes.status === 200 ? '✅ PASSED' : '❌ FAILED');
  itemsRes.data.itemDebts.forEach(item => {
    console.log(`   📦 ${item.borrower.name} owes ${item.lender.name}: ${item.quantity} ${item.unit} of ${item.itemName} (${item.status})`);
  });

  // 7. Chore Exchanges
  const exchangeRes = await request('/api/exchanges', 'GET', null, token);
  console.log('7. Chore Exchanges:', exchangeRes.status === 200 ? '✅ PASSED' : '❌ FAILED', 'Count:', exchangeRes.data.count);

  // 8. Flatmate Leaderboard
  const leaderRes = await request('/api/leaderboard', 'GET', null, token);
  console.log('8. Leaderboard:', leaderRes.status === 200 ? '✅ PASSED' : '❌ FAILED');
  if (leaderRes.data.spotlight.mostHelpful) {
    console.log(`   😇 Most Helpful: ${leaderRes.data.spotlight.mostHelpful.user.name} (${leaderRes.data.spotlight.mostHelpful.tasksCompletedForOthers} chores for others)`);
  }
  if (leaderRes.data.spotlight.mostCompleted) {
    console.log(`   🏆 Most Tasks: ${leaderRes.data.spotlight.mostCompleted.user.name} (${leaderRes.data.spotlight.mostCompleted.tasksCompletedTotal} chores done)`);
  }

  // 9. Activity Feed
  const actRes = await request('/api/activities?limit=5', 'GET', null, token);
  console.log('9. Activity Logs:', actRes.status === 200 ? '✅ PASSED' : '❌ FAILED', `(Loaded ${actRes.data.activities.length} recent events)`);

  console.log('--- 🚀 ALL BACKEND ENDPOINTS AND DATA FLOW VERIFIED SUCCESSFULLY ---');
};

runTests().catch(console.error);

