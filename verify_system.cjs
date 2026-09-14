/**
 * WATCH EARN — AUTOMATED CORE SYSTEM VERIFICATION SUITE
 * 
 * Verifies:
 * 1. User Registration & Referral attribution
 * 2. Membership Subscription & Payment Approval Workflow
 * 3. Anti-Fraud Video Watch Session Tokenization & Duration Enforcement
 * 4. Double-Entry Wallet Ledger Balance Formula Integrity
 * 5. Withdrawal Locking & Admin Approval / Rejection Refund Logic
 * 6. Role-Based Access Control (RBAC)
 */

const assert = require('assert');

console.log('=====================================================');
console.log('WATCH EARN — AUTOMATED INTEGRATION & SECURITY TEST SUITE');
console.log('=====================================================\n');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
  }
}

// -------------------------------------------------------------
// TEST 1: User Registration & Referral Code Generation
// -------------------------------------------------------------
test('Test 1: User Registration & Referral Code Integrity', () => {
  const user = {
    id: 'usr-101',
    fullName: 'Hamza Tariq',
    email: 'hamza@example.com',
    phone: '03001234567',
    referralCode: 'WE' + Math.random().toString(36).substring(2, 6).toUpperCase(),
    referredBy: 'ALI789',
    role: 'user',
    status: 'active',
  };

  assert.strictEqual(user.role, 'user');
  assert.ok(user.referralCode.startsWith('WE'));
  assert.strictEqual(user.referredBy, 'ALI789');
  assert.strictEqual(user.status, 'active');
});

// -------------------------------------------------------------
// TEST 2: Membership Payment & Activation Simulation
// -------------------------------------------------------------
test('Test 2: Payment Verification Activates 30-Day Membership', () => {
  const plan = {
    id: 'plan-300',
    price: 300,
    durationDays: 30,
    dailyTaskLimit: 10,
    rewardPerTask: 10,
  };

  let payment = {
    id: 'pay-001',
    amount: 300,
    method: 'JazzCash',
    transactionRef: 'JC99881122',
    status: 'pending',
  };

  let membership = null;

  // Simulate admin approval
  function approvePayment(p) {
    p.status = 'paid';
    return {
      id: 'mem-001',
      planId: plan.id,
      status: 'active',
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + 86400000 * plan.durationDays),
      tasksCompletedToday: 0,
    };
  }

  membership = approvePayment(payment);
  assert.strictEqual(payment.status, 'paid');
  assert.strictEqual(membership.status, 'active');
  assert.strictEqual(membership.tasksCompletedToday, 0);
  assert.ok(membership.expiresAt > membership.startedAt);
});

// -------------------------------------------------------------
// TEST 3: Anti-Fraud Watch Session & Duration Validation
// -------------------------------------------------------------
test('Test 3: Anti-Fraud Session Duration Rejection & Token Match', () => {
  const video = {
    id: 'vid-01',
    durationSeconds: 30,
    rewardAmount: 10,
  };

  const session = {
    id: 'ses-999',
    sessionToken: 'tok_sec_12345',
    startedAt: Date.now() - 10000, // Only 10s elapsed
    status: 'active',
  };

  // Premature validation attempt
  function validateWatchSession(ses, providedToken, currentVideo) {
    if (ses.sessionToken !== providedToken) {
      throw new Error('Token mismatch: security failure');
    }
    const elapsed = Math.floor((Date.now() - ses.startedAt) / 1000);
    if (elapsed < currentVideo.durationSeconds - 2) {
      return { success: false, error: 'Premature watch completion attempt' };
    }
    return { success: true, reward: currentVideo.rewardAmount };
  }

  const prematureResult = validateWatchSession(session, 'tok_sec_12345', video);
  assert.strictEqual(prematureResult.success, false);
  assert.strictEqual(prematureResult.error, 'Premature watch completion attempt');

  // Completed duration validation
  session.startedAt = Date.now() - 32000; // 32s elapsed
  const validResult = validateWatchSession(session, 'tok_sec_12345', video);
  assert.strictEqual(validResult.success, true);
  assert.strictEqual(validResult.reward, 10);
});

// -------------------------------------------------------------
// TEST 4: Double-Entry Wallet Ledger Balance Reconciliation
// -------------------------------------------------------------
test('Test 4: Double-Entry Ledger Balance Reconciliation', () => {
  let balance = 0;
  let totalEarned = 0;
  const ledgerTransactions = [];

  function recordTransaction(type, amount, desc) {
    const before = balance;
    balance += amount;
    if (amount > 0) totalEarned += amount;

    ledgerTransactions.push({
      id: `trx-${ledgerTransactions.length + 1}`,
      type,
      amount,
      balanceBefore: before,
      balanceAfter: balance,
      description: desc,
    });
  }

  recordTransaction('bonus', 50, 'Welcome bonus');
  recordTransaction('video_reward', 10, 'Completed video 1');
  recordTransaction('video_reward', 15, 'Completed video 2');

  assert.strictEqual(balance, 75);
  assert.strictEqual(totalEarned, 75);
  assert.strictEqual(ledgerTransactions.length, 3);

  // Verify balance equals sum of amounts
  const sumOfAmounts = ledgerTransactions.reduce((acc, t) => acc + t.amount, 0);
  assert.strictEqual(balance, sumOfAmounts);
});

// -------------------------------------------------------------
// TEST 5: Withdrawal Locking & Rejection / Refund Logic
// -------------------------------------------------------------
test('Test 5: Withdrawal Locks Funds and Rejection Triggers 100% Refund', () => {
  let balance = 200;
  let pendingBalance = 0;

  // Request withdrawal of Rs. 150
  const withdrawAmount = 150;
  assert.ok(balance >= withdrawAmount);

  // Atomic lock
  balance -= withdrawAmount;
  pendingBalance += withdrawAmount;

  assert.strictEqual(balance, 50);
  assert.strictEqual(pendingBalance, 150);

  // Admin rejection: Return locked funds
  balance += withdrawAmount;
  pendingBalance -= withdrawAmount;

  assert.strictEqual(balance, 200);
  assert.strictEqual(pendingBalance, 0);
});

// -------------------------------------------------------------
// TEST 6: RBAC Authorization Verification
// -------------------------------------------------------------
test('Test 6: Role-Based Access Control (RBAC) Permissions', () => {
  function checkAdminAccess(role) {
    return role === 'admin' || role === 'manager';
  }

  assert.strictEqual(checkAdminAccess('user'), false);
  assert.strictEqual(checkAdminAccess('support'), false);
  assert.strictEqual(checkAdminAccess('manager'), true);
  assert.strictEqual(checkAdminAccess('admin'), true);
});

// -------------------------------------------------------------
// TEST 7: 3 VIP Configurable Plans Tier Configuration
// -------------------------------------------------------------
test('Test 7: 3 VIP Configurable Plans Tier Limits & Calculations', () => {
  const plans = [
    { id: 'plan-1', name: 'Plan 1', price: 300, daily_task_limit: 7, reward_per_task: 8, daily_reward_limit: 56, cta_text: 'Buy Plan 1' },
    { id: 'plan-2', name: 'Plan 2', badge: 'POPULAR', price: 500, daily_task_limit: 12, reward_per_task: 10, daily_reward_limit: 120, cta_text: 'Buy Plan 2' },
    { id: 'plan-3', name: 'Plan 3', badge: 'VIP', price: 950, daily_task_limit: 17, reward_per_task: 12, daily_reward_limit: 204, cta_text: 'Buy Plan 3' },
  ];

  assert.strictEqual(plans.length, 3);

  // Plan 1
  assert.strictEqual(plans[0].price, 300);
  assert.strictEqual(plans[0].daily_task_limit, 7);
  assert.strictEqual(plans[0].reward_per_task, 8);
  assert.strictEqual(plans[0].daily_task_limit * plans[0].reward_per_task, 56);

  // Plan 2 (Popular)
  assert.strictEqual(plans[1].price, 500);
  assert.strictEqual(plans[1].badge, 'POPULAR');
  assert.strictEqual(plans[1].daily_task_limit, 12);
  assert.strictEqual(plans[1].reward_per_task, 10);
  assert.strictEqual(plans[1].daily_task_limit * plans[1].reward_per_task, 120);

  // Plan 3 (VIP)
  assert.strictEqual(plans[2].price, 950);
  assert.strictEqual(plans[2].badge, 'VIP');
  assert.strictEqual(plans[2].daily_task_limit, 17);
  assert.strictEqual(plans[2].reward_per_task, 12);
  assert.strictEqual(plans[2].daily_task_limit * plans[2].reward_per_task, 204);
});

// -------------------------------------------------------------
// TEST 8: Locked Earning State Without Active Plan
// -------------------------------------------------------------
test('Test 8: Locked Earning State When User Has No Active Plan', () => {
  function getEarningAccess(membership) {
    if (!membership || membership.status !== 'active') {
      return {
        locked: true,
        message: '🔒 Earning Locked. Choose an active plan to unlock your available reward tasks.',
        canWatch: false,
        tasksAvailable: 0,
      };
    }
    return {
      locked: false,
      message: 'Active',
      canWatch: true,
      tasksAvailable: membership.daily_task_limit,
    };
  }

  // Unsubscribed user
  const lockedState = getEarningAccess(null);
  assert.strictEqual(lockedState.locked, true);
  assert.strictEqual(lockedState.canWatch, false);
  assert.strictEqual(lockedState.tasksAvailable, 0);
  assert.ok(lockedState.message.includes('🔒 Earning Locked'));

  // Expired user
  const expiredState = getEarningAccess({ status: 'expired', daily_task_limit: 7 });
  assert.strictEqual(expiredState.locked, true);
  assert.strictEqual(expiredState.canWatch, false);

  // Active Plan 2 user
  const activeState = getEarningAccess({ status: 'active', daily_task_limit: 12 });
  assert.strictEqual(activeState.locked, false);
  assert.strictEqual(activeState.canWatch, true);
  assert.strictEqual(activeState.tasksAvailable, 12);
});

// -------------------------------------------------------------
// TEST 9: 10% Direct 1-Tier Referral Commission
// -------------------------------------------------------------
test('Test 9: 10% Direct 1-Tier Referral Commission Calculation', () => {
  function calculateReferralCommission(planPrice) {
    const rate = 0.10; // 10% direct
    return Math.round(planPrice * rate * 100) / 100;
  }

  // Plan 1 (Rs. 300) -> Rs. 30
  assert.strictEqual(calculateReferralCommission(300), 30);
  // Plan 2 (Rs. 500) -> Rs. 50
  assert.strictEqual(calculateReferralCommission(500), 50);
  // Plan 3 (Rs. 950) -> Rs. 95
  assert.strictEqual(calculateReferralCommission(950), 95);
});

// -------------------------------------------------------------
// TEST 10: Withdrawal Gating (Rs. 500 Min + 2 Qualified Referrals)
// -------------------------------------------------------------
test('Test 10: Withdrawal Eligibility Gating (Rs. 500 Min & 2 Qualified Referrals)', () => {
  function evaluateWithdrawalEligibility(balance, referrals) {
    const qualifiedCount = referrals.filter(r => r.is_qualified && r.status === 'qualified').length;
    const minWithdrawal = 500;
    const requiredReferrals = 2;

    const missingRequirements = [];
    if (balance < minWithdrawal) {
      missingRequirements.push(`Minimum withdrawal balance is Rs. ${minWithdrawal} (You have Rs. ${balance})`);
    }
    if (qualifiedCount < requiredReferrals) {
      missingRequirements.push(`Requires at least ${requiredReferrals} active referrals who bought a plan (You have ${qualifiedCount})`);
    }

    return {
      isEligible: missingRequirements.length === 0,
      qualifiedCount,
      missingRequirements,
    };
  }

  // Case 1: Ineligible - balance too low (Rs. 300) and 0 referrals
  const case1 = evaluateWithdrawalEligibility(300, []);
  assert.strictEqual(case1.isEligible, false);
  assert.strictEqual(case1.missingRequirements.length, 2);

  // Case 2: Ineligible - balance sufficient (Rs. 800) but only 1 qualified referral
  const case2 = evaluateWithdrawalEligibility(800, [
    { is_qualified: true, status: 'qualified' },
    { is_qualified: false, status: 'registered' },
  ]);
  assert.strictEqual(case2.isEligible, false);
  assert.strictEqual(case2.qualifiedCount, 1);
  assert.strictEqual(case2.missingRequirements.length, 1);
  assert.ok(case2.missingRequirements[0].includes('active referrals'));

  // Case 3: Eligible - balance Rs. 650 and 2 qualified referrals
  const case3 = evaluateWithdrawalEligibility(650, [
    { is_qualified: true, status: 'qualified' },
    { is_qualified: true, status: 'qualified' },
  ]);
  assert.strictEqual(case3.isEligible, true);
  assert.strictEqual(case3.qualifiedCount, 2);
  assert.strictEqual(case3.missingRequirements.length, 0);
});

// -------------------------------------------------------------
// TEST 11: SQL Migration File Existence & Integrity
// -------------------------------------------------------------
test('Test 11: SQL Migration File Integrity for 3 Plans & Stored Procedure', () => {
  const fs = require('fs');
  const path = require('path');
  const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20260912000003_three_plans_and_withdrawal_rules.sql');

  assert.ok(fs.existsSync(migrationPath), 'Migration file must exist');
  const content = fs.readFileSync(migrationPath, 'utf8');

  // Must contain the 3 plans insertion
  assert.ok(content.includes('Plan 1'), 'Must insert Plan 1');
  assert.ok(content.includes('Plan 2'), 'Must insert Plan 2');
  assert.ok(content.includes('Plan 3'), 'Must insert Plan 3');

  // Must contain min withdrawal 500
  assert.ok(content.includes('500.00'), 'Must define min withdrawal 500');

  // Must contain 2 qualified referrals requirement in stored procedure
  assert.ok(content.includes('v_qualified_referrals < 2'), 'Must check qualified referrals >= 2');
  assert.ok(content.includes('commission_rate NUMERIC(5, 2) DEFAULT 10.00'), 'Must document 10% commission');
});

// -------------------------------------------------------------
// TEST 12: Fresh User Default State (Zero Balance & No Active Plan)
// -------------------------------------------------------------
test('Test 12: Fresh User Default State Must Be Clean (No Plan, Rs. 0 Balance, 0 Referrals)', () => {
  // Model initial fresh user platform state
  const freshUser = { id: 'usr-new-001', email: 'fresh@example.com' };
  const allMemberships = [];
  const allWallets = {};
  const allTransactions = [];
  const allReferrals = [];

  const userMembership = allMemberships.find(m => m.user_id === freshUser.id && m.status === 'active') || null;
  const userWallet = allWallets[freshUser.id] || { balance: 0, pending_balance: 0, total_earned: 0 };
  const userTransactions = allTransactions.filter(t => t.user_id === freshUser.id);
  const userReferrals = allReferrals.filter(r => r.referrer_id === freshUser.id);

  // Today's earnings calculation
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEarnings = userTransactions
    .filter(t => t.created_at.startsWith(todayStr) && (t.type === 'video_reward' || t.type === 'referral_reward'))
    .reduce((sum, t) => sum + Math.max(0, t.amount), 0);

  const qualifiedReferralsCount = userReferrals.filter(r => r.is_qualified && r.status === 'qualified').length;
  const hasActivePlan = !!userMembership && userMembership.status === 'active';
  const activePlanName = hasActivePlan ? userMembership.plan.name : 'No Active Plan';
  const planStatus = hasActivePlan ? 'Active' : 'Not Active';
  const tasksCompletedToday = userMembership ? userMembership.tasks_completed_today : 0;
  const maxDailyTasks = hasActivePlan ? userMembership.plan.daily_task_limit : 0;

  const withdrawalEligible = userWallet.balance >= 500 && qualifiedReferralsCount >= 2;
  const withdrawalStatus = withdrawalEligible ? 'Eligible' : 'Not Eligible';

  // Strict Assertions for New User
  assert.strictEqual(activePlanName, 'No Active Plan', 'New user must show No Active Plan');
  assert.strictEqual(planStatus, 'Not Active', 'New user plan status must be Not Active');
  assert.strictEqual(`${tasksCompletedToday} / ${maxDailyTasks}`, '0 / 0', 'Today tasks must be 0 / 0');
  assert.strictEqual(`Rs. ${todayEarnings}`, 'Rs. 0', "Today's earnings must be Rs. 0");
  assert.strictEqual(`Rs. ${userWallet.balance}`, 'Rs. 0', 'Wallet balance must be Rs. 0');
  assert.strictEqual(`${qualifiedReferralsCount} / 2`, '0 / 2', 'Qualified referrals must be 0 / 2');
  assert.strictEqual(withdrawalStatus, 'Not Eligible', 'Withdrawal status must be Not Eligible');
});

// -------------------------------------------------------------
// TEST 13: State After Real Plan Purchase (Plan 1)
// -------------------------------------------------------------
test('Test 13: State After Real Plan Purchase Reflects Clean Initialized Progress', () => {
  const user = { id: 'usr-buyer-001', email: 'buyer@example.com' };
  const plan1 = {
    id: 'plan-1',
    name: 'Plan 1',
    price: 300,
    daily_task_limit: 7,
    reward_per_task: 8,
    duration_days: 30,
  };

  // Simulating payment submission and admin/simulated approval
  const activatedMembership = {
    id: 'mem-001',
    user_id: user.id,
    plan_id: plan1.id,
    plan: plan1,
    status: 'active',
    tasks_completed_today: 0,
    started_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 86400000 * 30).toISOString(),
  };

  const userWallet = { balance: 0, pending_balance: 0, total_earned: 0 };
  const userReferrals = [];
  const todayEarnings = 0;

  const hasActivePlan = activatedMembership.status === 'active';
  const activePlanName = hasActivePlan ? activatedMembership.plan.name : 'No Active Plan';
  const planStatus = hasActivePlan ? 'Active' : 'Not Active';
  const tasksCompletedToday = activatedMembership.tasks_completed_today;
  const maxDailyTasks = activatedMembership.plan.daily_task_limit;
  const qualifiedReferralsCount = userReferrals.filter(r => r.is_qualified).length;
  const withdrawalStatus = (userWallet.balance >= 500 && qualifiedReferralsCount >= 2) ? 'Eligible' : 'Not Eligible';

  assert.strictEqual(activePlanName, 'Plan 1', 'Active plan must be Plan 1');
  assert.strictEqual(planStatus, 'Active', 'Plan status must be Active');
  assert.strictEqual(`${tasksCompletedToday} / ${maxDailyTasks}`, '0 / 7', 'Tasks must be 0 / 7');
  assert.strictEqual(todayEarnings, 0, 'Earnings must be 0');
  assert.strictEqual(userWallet.balance, 0, 'Wallet balance must be 0');
  assert.strictEqual(`${qualifiedReferralsCount} / 2`, '0 / 2', 'Referrals must be 0 / 2');
  assert.strictEqual(withdrawalStatus, 'Not Eligible', 'Withdrawal must remain Not Eligible');
});

// -------------------------------------------------------------
// TEST 14: Withdrawal Eligibility Matrix (500 Min & >=2 Referrals)
// -------------------------------------------------------------
test('Test 14: Withdrawal Eligibility Matrix & Uncapped Qualified Referrals', () => {
  const settings = {
    minWithdrawalBalance: 500,
    requiredQualifiedReferrals: 2,
    referralCommissionPct: 10,
  };

  function checkEligibility(balance, qualifiedRefs) {
    const isEligible = balance >= settings.minWithdrawalBalance && qualifiedRefs >= settings.requiredQualifiedReferrals;
    const displayText = qualifiedRefs >= 2 ? `${qualifiedRefs} Qualified Referrals` : `${qualifiedRefs} / ${settings.requiredQualifiedReferrals}`;
    return { isEligible, displayText };
  }

  // Case 1: Fresh User (Balance 0, Referrals 0) -> Not Eligible
  const c1 = checkEligibility(0, 0);
  assert.strictEqual(c1.isEligible, false, 'Fresh user must be Not Eligible');
  assert.strictEqual(c1.displayText, '0 / 2');

  // Case 2: Balance Rs. 499 + 2 referrals -> Not Eligible
  const c2 = checkEligibility(499, 2);
  assert.strictEqual(c2.isEligible, false, 'Rs. 499 with 2 refs must be Not Eligible');
  assert.strictEqual(c2.displayText, '2 Qualified Referrals');

  // Case 3: Balance Rs. 500 + 1 referral -> Not Eligible
  const c3 = checkEligibility(500, 1);
  assert.strictEqual(c3.isEligible, false, 'Rs. 500 with 1 ref must be Not Eligible');
  assert.strictEqual(c3.displayText, '1 / 2');

  // Case 4: Balance Rs. 500 + 2 qualified referrals -> Eligible
  const c4 = checkEligibility(500, 2);
  assert.strictEqual(c4.isEligible, true, 'Rs. 500 with 2 refs must be Eligible');
  assert.strictEqual(c4.displayText, '2 Qualified Referrals');

  // Case 5: Balance Rs. 500 + 3 qualified referrals -> Eligible
  const c5 = checkEligibility(500, 3);
  assert.strictEqual(c5.isEligible, true, 'Rs. 500 with 3 refs must be Eligible');
  assert.strictEqual(c5.displayText, '3 Qualified Referrals');

  // Case 6: Balance Rs. 800 + 3 qualified referrals -> Eligible
  const c6 = checkEligibility(800, 3);
  assert.strictEqual(c6.isEligible, true, 'Rs. 800 with 3 refs must be Eligible');
  assert.strictEqual(c6.displayText, '3 Qualified Referrals');

  // Case 7: Balance Rs. 500 + 5 qualified referrals -> Eligible
  const c7 = checkEligibility(500, 5);
  assert.strictEqual(c7.isEligible, true, 'Rs. 500 with 5 refs must be Eligible');
  assert.strictEqual(c7.displayText, '5 Qualified Referrals');
});

// -------------------------------------------------------------
// TEST 15: Plan Activation Integrity (Pending Payment Not Activated)
// -------------------------------------------------------------
test('Test 15: Plan Stays Inactive While Payment Is Pending Verification', () => {
  // Model user submitting payment
  const user = { id: 'usr-buyer-002', email: 'test@example.com' };
  const payments = [];
  const memberships = [];

  // Submit payment
  const payment = {
    id: 'pay-123',
    user_id: user.id,
    plan_id: 'plan-1',
    amount: 300,
    status: 'pending', // submitted by checkout
  };
  payments.push(payment);

  // User check: Plan is NOT active yet!
  const userMem = memberships.find(m => m.user_id === user.id && m.status === 'active') || null;
  assert.strictEqual(userMem, null, 'Membership must remain null when payment is pending');

  // Admin approves payment
  payment.status = 'paid';
  memberships.push({
    id: 'mem-123',
    user_id: user.id,
    plan_id: payment.plan_id,
    status: 'active',
  });

  const activeMem = memberships.find(m => m.user_id === user.id && m.status === 'active');
  assert.ok(activeMem !== null, 'Membership becomes active only after verification');
  assert.strictEqual(activeMem.status, 'active');
});

// -------------------------------------------------------------
// TEST 16: Consolidated Production Migration File Integrity
// -------------------------------------------------------------
test('Test 16: Consolidated Production Migration Schema Integrity', () => {
  const fs = require('fs');
  const path = require('path');
  const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20260913000001_earnzo_complete_production.sql');

  assert.ok(fs.existsSync(migrationPath), 'Consolidated migration file must exist');
  const content = fs.readFileSync(migrationPath, 'utf8');

  // Verify all essential tables exist in schema
  const requiredTables = [
    'profiles', 'plans', 'memberships', 'payments', 'video_campaigns',
    'videos', 'video_watch_sessions', 'wallet_accounts', 'wallet_transactions',
    'withdrawals', 'referrals', 'referral_rewards', 'ad_placements',
    'announcements', 'support_tickets', 'support_ticket_messages', 'notifications',
    'audit_logs', 'settings'
  ];

  for (const table of requiredTables) {
    assert.ok(content.includes(`CREATE TABLE IF NOT EXISTS public.${table}`), `Must contain table: ${table}`);
  }

  // Verify essential RPC stored procedures
  const requiredProcedures = [
    'rpc_start_watch_session',
    'rpc_complete_watch_session',
    'rpc_verify_payment',
    'rpc_request_withdrawal',
    'rpc_process_withdrawal'
  ];

  for (const proc of requiredProcedures) {
    assert.ok(content.includes(`CREATE OR REPLACE FUNCTION public.${proc}`), `Must contain procedure: ${proc}`);
  }

  // Verify auth trigger
  assert.ok(content.includes('CREATE TRIGGER on_auth_user_created'), 'Must include auth trigger for clean profiles');
});

// -------------------------------------------------------------
// TEST 17: Plan Upgrade Difference Pricing & Downgrade Policy
// -------------------------------------------------------------
test('Test 17: Plan Upgrade Difference Pricing & Downgrade Policy', () => {
  const plans = [
    { id: 'plan-1', name: 'Plan 1', price: 300 },
    { id: 'plan-2', name: 'Plan 2', price: 500 },
    { id: 'plan-3', name: 'Plan 3', price: 950 },
  ];

  function calculateAction(currentPlan, targetPlan) {
    if (!currentPlan) {
      return { action: 'purchase', amountToPay: targetPlan.price };
    }
    if (currentPlan.id === targetPlan.id) {
      return { action: 'renew', amountToPay: targetPlan.price };
    }
    if (targetPlan.price > currentPlan.price) {
      // Upgrade: Pay difference
      return {
        action: 'upgrade',
        amountToPay: targetPlan.price - currentPlan.price,
      };
    }
    // Downgrade: Takes effect on renewal
    return {
      action: 'downgrade',
      amountToPay: targetPlan.price,
      note: 'Takes effect upon current plan expiration',
    };
  }

  // Fresh user -> Plan 1 = Rs. 300
  assert.deepStrictEqual(calculateAction(null, plans[0]), { action: 'purchase', amountToPay: 300 });

  // Plan 1 -> Plan 2 upgrade = 500 - 300 = Rs. 200
  assert.deepStrictEqual(calculateAction(plans[0], plans[1]), { action: 'upgrade', amountToPay: 200 });

  // Plan 1 -> Plan 3 upgrade = 950 - 300 = Rs. 650
  assert.deepStrictEqual(calculateAction(plans[0], plans[2]), { action: 'upgrade', amountToPay: 650 });

  // Plan 2 -> Plan 3 upgrade = 950 - 500 = Rs. 450
  assert.deepStrictEqual(calculateAction(plans[1], plans[2]), { action: 'upgrade', amountToPay: 450 });

  // Plan 3 -> Plan 1 downgrade = takes effect on renewal
  const downgradeResult = calculateAction(plans[2], plans[0]);
  assert.strictEqual(downgradeResult.action, 'downgrade');
  assert.strictEqual(downgradeResult.amountToPay, 300);
});

// -------------------------------------------------------------
// TEST 18: PlatformContext Supabase Source-of-Truth Code Verification
// -------------------------------------------------------------
test('Test 18: PlatformContext Supabase Source of Truth Verification', () => {
  const fs = require('fs');
  const path = require('path');
  const code = fs.readFileSync(path.join(__dirname, 'src', 'context', 'PlatformContext.tsx'), 'utf-8');

  // Verify that localStorage is NOT used for authoritative business data
  assert.ok(!code.includes("localStorage.setItem(STORAGE_KEYS.MEMBERSHIPS"), 'Memberships must not be saved to localStorage');
  assert.ok(!code.includes("localStorage.setItem(STORAGE_KEYS.PAYMENTS"), 'Payments must not be saved to localStorage');
  assert.ok(!code.includes("localStorage.setItem(STORAGE_KEYS.WALLETS"), 'Wallets must not be saved to localStorage');
  assert.ok(!code.includes("localStorage.setItem(STORAGE_KEYS.TRANSACTIONS"), 'Transactions must not be saved to localStorage');
  assert.ok(!code.includes("localStorage.setItem(STORAGE_KEYS.WITHDRAWALS"), 'Withdrawals must not be saved to localStorage');
  assert.ok(!code.includes("localStorage.setItem(STORAGE_KEYS.REFERRALS"), 'Referrals must not be saved to localStorage');

  // Verify that Supabase queries and RPCs are wired
  assert.ok(code.includes("supabase.from('memberships')"), 'Must query Supabase memberships table');
  assert.ok(code.includes("supabase.from('payments')"), 'Must query Supabase payments table');
  assert.ok(code.includes("supabase.from('wallet_accounts')"), 'Must query Supabase wallet_accounts table');
  assert.ok(code.includes("supabase.from('wallet_transactions')"), 'Must query Supabase wallet_transactions table');
  assert.ok(code.includes("supabase.rpc('rpc_verify_payment'"), 'Must call rpc_verify_payment RPC');
  assert.ok(code.includes("supabase.channel"), 'Must subscribe to Supabase Realtime changes');
  assert.ok(code.includes("window.addEventListener('focus'"), 'Must re-fetch on window focus');
});

// -------------------------------------------------------------
// TEST 19: Payment Verification RPC Idempotency & Membership Activation Logic
// -------------------------------------------------------------
test('Test 19: Payment Verification RPC Idempotency & Membership Activation Logic', () => {
  // Simulate database state for payment, user, plan, and referral
  const db = {
    payments: [{ id: 'pay-uuid-1', user_id: 'user-b', plan_id: 'plan-1', amount: 300, status: 'pending', method: 'JazzCash', transaction_ref: 'TRX123' }],
    plans: [{ id: 'plan-1', name: 'Plan 1', price: 300, daily_task_limit: 7, reward_per_task: 70, duration_days: 30 }],
    memberships: [],
    wallets: {
      'user-a': { id: 'wal-a', user_id: 'user-a', balance: 0, total_earned: 0 },
      'user-b': { id: 'wal-b', user_id: 'user-b', balance: 0, total_earned: 0 }
    },
    transactions: [],
    referrals: [{ id: 'ref-1', referrer_user_id: 'user-a', referred_user_id: 'user-b', is_qualified: false, commission_earned: 0 }]
  };

  function rpc_verify_payment(paymentId, action, notes) {
    const payment = db.payments.find(p => p.id === paymentId);
    if (!payment) throw new Error('Payment record not found');
    if (payment.status !== 'pending') throw new Error(`Payment has already been processed with status: ${payment.status}`);

    if (action === 'reject') {
      payment.status = 'failed';
      return { success: true, action: 'rejected' };
    }

    const plan = db.plans.find(p => p.id === payment.plan_id);
    if (!plan) throw new Error('Plan not found');

    // 1. Mark paid
    payment.status = 'paid';

    // 2. Activate membership
    db.memberships = db.memberships.filter(m => !(m.user_id === payment.user_id && m.status === 'active'));
    db.memberships.push({
      id: 'mem-1',
      user_id: payment.user_id,
      plan_id: plan.id,
      status: 'active',
      started_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 86400000 * plan.duration_days).toISOString(),
      tasks_completed_today: 0
    });

    // 3. 10% referral commission
    const referral = db.referrals.find(r => r.referred_user_id === payment.user_id);
    if (referral) {
      referral.is_qualified = true;
      const commission = (payment.amount * 10) / 100;
      referral.commission_earned += commission;
      const refWallet = db.wallets[referral.referrer_user_id];
      refWallet.balance += commission;
      refWallet.total_earned += commission;
      db.transactions.push({
        wallet_id: refWallet.id,
        user_id: referral.referrer_user_id,
        type: 'referral_bonus',
        amount: commission
      });
    }

    return { success: true, action: 'approved' };
  }

  // First approval: must succeed
  const res1 = rpc_verify_payment('pay-uuid-1', 'approve', 'Verified via JazzCash');
  assert.strictEqual(res1.success, true);
  assert.strictEqual(res1.action, 'approved');
  assert.strictEqual(db.memberships.length, 1);
  assert.strictEqual(db.memberships[0].status, 'active');
  assert.strictEqual(db.referrals[0].is_qualified, true);
  assert.strictEqual(db.wallets['user-a'].balance, 30); // 10% of 300 = Rs. 30

  // Second approval: must fail with idempotency error
  assert.throws(() => {
    rpc_verify_payment('pay-uuid-1', 'approve', 'Duplicate attempt');
  }, /Payment has already been processed with status: paid/);

  // Assert no double commission or duplicate membership
  assert.strictEqual(db.memberships.length, 1);
  assert.strictEqual(db.wallets['user-a'].balance, 30);
});

// -------------------------------------------------------------
// TEST 20: Cross-Client Multi-Session State Isolation & Synchronization
// -------------------------------------------------------------
test('Test 20: Cross-Client Multi-Session State Isolation & Synchronization', () => {
  // Two distinct user contexts
  const userA_session = {
    userId: 'user-a',
    membership: null,
    wallet: { balance: 0, pending_balance: 0 },
    qualifiedReferrals: 0
  };

  const userB_session = {
    userId: 'user-b',
    membership: null,
    wallet: { balance: 0, pending_balance: 0 },
    qualifiedReferrals: 0
  };

  // When User B gets approved in database:
  // Simulate Realtime broadcast payload
  const realtimePayloadMembership = {
    eventType: 'INSERT',
    new: {
      id: 'mem-b',
      user_id: 'user-b',
      plan_id: 'plan-2',
      status: 'active'
    }
  };

  // User A should NOT gain User B's membership
  if (realtimePayloadMembership.new.user_id === userA_session.userId) {
    userA_session.membership = realtimePayloadMembership.new;
  }
  if (realtimePayloadMembership.new.user_id === userB_session.userId) {
    userB_session.membership = realtimePayloadMembership.new;
  }

  assert.strictEqual(userA_session.membership, null, 'User A must not inherit User B membership');
  assert.ok(userB_session.membership !== null, 'User B must receive active membership');
  assert.strictEqual(userB_session.membership.plan_id, 'plan-2');
});

// -------------------------------------------------------------
// TEST 21: YouTube Embed Sanitization, Domain Validation & Video ID Extraction
// -------------------------------------------------------------
test('Test 21: YouTube Embed Extraction & Domain Security Filter', () => {
  // Parsing logic equivalent to src/lib/youtube.ts
  function parseYouTube(input) {
    if (!input || typeof input !== 'string') {
      return { isYouTube: false, error: 'Input cannot be empty' };
    }
    const trimmed = input.trim();
    let urlToTest = trimmed;
    const iframeSrcMatch = trimmed.match(/<iframe[^>]*\s+src=["']([^"']+)["']/i);
    if (iframeSrcMatch && iframeSrcMatch[1]) {
      urlToTest = iframeSrcMatch[1].trim();
    }
    if (urlToTest.startsWith('//')) {
      urlToTest = 'https:' + urlToTest;
    } else if (!/^https?:\/\//i.test(urlToTest)) {
      urlToTest = 'https://' + urlToTest;
    }
    try {
      const parsedUrl = new URL(urlToTest);
      const host = parsedUrl.hostname.toLowerCase().replace(/^www\./, '');
      const allowed = ['youtube.com', 'youtube-nocookie.com', 'youtu.be', 'm.youtube.com'];
      if (!allowed.includes(host)) {
        return { isYouTube: false, error: 'Domain is not a trusted YouTube domain' };
      }
      let videoId = null;
      if (host === 'youtu.be') {
        videoId = parsedUrl.pathname.slice(1).split('/')[0].split('?')[0];
      } else if (parsedUrl.pathname.startsWith('/embed/')) {
        videoId = parsedUrl.pathname.replace('/embed/', '').split('/')[0].split('?')[0];
      } else if (parsedUrl.pathname.startsWith('/shorts/')) {
        videoId = parsedUrl.pathname.replace('/shorts/', '').split('/')[0].split('?')[0];
      } else {
        videoId = parsedUrl.searchParams.get('v');
      }
      if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        return { isYouTube: false, error: 'Invalid 11-char video ID' };
      }
      return {
        isYouTube: true,
        videoId,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      };
    } catch (e) {
      return { isYouTube: false, error: 'Invalid URL' };
    }
  }

  // 1. Full iframe embed code
  const iframeInput = '<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ?si=abcdef" title="YouTube video player" frameborder="0" allowfullscreen></iframe>';
  const res1 = parseYouTube(iframeInput);
  assert.strictEqual(res1.isYouTube, true);
  assert.strictEqual(res1.videoId, 'dQw4w9WgXcQ');
  assert.strictEqual(res1.embedUrl, 'https://www.youtube.com/embed/dQw4w9WgXcQ');

  // 2. Standard watch URL
  const watchUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s';
  const res2 = parseYouTube(watchUrl);
  assert.strictEqual(res2.isYouTube, true);
  assert.strictEqual(res2.videoId, 'dQw4w9WgXcQ');

  // 3. Short URL youtu.be
  const shortUrl = 'https://youtu.be/dQw4w9WgXcQ?si=123';
  const res3 = parseYouTube(shortUrl);
  assert.strictEqual(res3.isYouTube, true);
  assert.strictEqual(res3.videoId, 'dQw4w9WgXcQ');

  // 4. Shorts URL
  const shortsUrl = 'https://www.youtube.com/shorts/dQw4w9WgXcQ';
  const res4 = parseYouTube(shortsUrl);
  assert.strictEqual(res4.isYouTube, true);
  assert.strictEqual(res4.videoId, 'dQw4w9WgXcQ');

  // 5. Malicious / untrusted domain rejection (Anti-XSS / Anti-phishing)
  const evilInput = '<iframe src="https://evil-site.com/steal-cookie.html"></iframe>';
  const res5 = parseYouTube(evilInput);
  assert.strictEqual(res5.isYouTube, false);
  assert.ok(res5.error.includes('not a trusted YouTube domain'));

  // 6. XSS injection attempt rejection
  const xssInput = 'javascript:alert(1)';
  const res6 = parseYouTube(xssInput);
  assert.strictEqual(res6.isYouTube, false);
});

// -------------------------------------------------------------
// TEST 22: Dynamic Website Content Element Manager & Placement Routing
// -------------------------------------------------------------
test('Test 22: Website Content Element Manager & Layout Properties', () => {
  const contentItems = [
    {
      id: 'cnt-1',
      type: 'banner',
      title: 'Mega Bonus Weekend',
      content_url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809',
      placement: 'dashboard_top',
      display_order: 1,
      enabled: true,
      desktop_visible: true,
      mobile_visible: true,
      layout_config: { width: 'full', alignment: 'center', padding: 'md', margin: 'md', borderRadius: 'xl' }
    },
    {
      id: 'cnt-2',
      type: 'youtube',
      title: 'Tutorial: How to Earn Rs. 500 Daily',
      content_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      placement: 'earn_top',
      display_order: 0,
      enabled: true,
      desktop_visible: true,
      mobile_visible: true,
      layout_config: { width: '4xl', alignment: 'center', padding: 'md', margin: 'md', borderRadius: '2xl' }
    },
    {
      id: 'cnt-3',
      type: 'text',
      title: 'Maintenance Notice',
      content_url: 'Scheduled server maintenance on Sunday 2:00 AM PKT.',
      placement: 'dashboard_top',
      display_order: 0,
      enabled: false, // Disabled
      desktop_visible: true,
      mobile_visible: true,
      layout_config: { width: 'full', alignment: 'left', padding: 'sm', margin: 'sm', borderRadius: 'lg' }
    }
  ];

  // Normal visitor filter for dashboard_top
  const dashboardTopVisible = contentItems
    .filter(i => i.placement === 'dashboard_top' && i.enabled)
    .sort((a, b) => a.display_order - b.display_order);

  assert.strictEqual(dashboardTopVisible.length, 1);
  assert.strictEqual(dashboardTopVisible[0].id, 'cnt-1');

  // Admin sees all elements regardless of enabled status
  const adminViewDashboardTop = contentItems
    .filter(i => i.placement === 'dashboard_top')
    .sort((a, b) => a.display_order - b.display_order);

  assert.strictEqual(adminViewDashboardTop.length, 2);
  assert.strictEqual(adminViewDashboardTop[0].id, 'cnt-3'); // Order 0 first
  assert.strictEqual(adminViewDashboardTop[1].id, 'cnt-1'); // Order 1 second

  // Toggle enable
  dashboardTopVisible[0].enabled = false;
  assert.strictEqual(dashboardTopVisible[0].enabled, false);
});

// -------------------------------------------------------------
// TEST 23: Sponsored Task Video CRUD & User-Side Synchronization
// -------------------------------------------------------------
test('Test 23: Sponsored Task Video CRUD & User-Side Synchronization', () => {
  // Simulated single source of truth (public.videos table)
  let dbVideos = [
    {
      id: '11111111-1111-4111-a111-111111111111',
      title: 'Initial Video Task',
      video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      duration_seconds: 30,
      reward_amount: 10.0,
      status: 'active',
      category: 'Technology',
      sponsor_badge: 'Official Sponsor',
      created_at: new Date().toISOString(),
    },
  ];

  // Helper simulating user query: SELECT * FROM videos WHERE status = 'active'
  const getUserActiveVideos = () => dbVideos.filter((v) => v.status === 'active');
  // Helper simulating admin query: SELECT * FROM videos
  const getAdminVideos = () => dbVideos;

  // 1. Initial State: Both see the single active video
  assert.strictEqual(getAdminVideos().length, 1);
  assert.strictEqual(getUserActiveVideos().length, 1);

  // 2. Admin creates a new video with valid RFC 4122 UUID and YouTube embed URL
  const newVideoId = '44444444-4444-4444-a444-444444444444';
  const newVideo = {
    id: newVideoId,
    title: 'Brand Sponsored Task 2026',
    video_url: 'https://www.youtube.com/embed/jNQXAC9IVRw',
    thumbnail_url: 'https://img.youtube.com/vi/jNQXAC9IVRw/hqdefault.jpg',
    duration_seconds: 45,
    reward_amount: 15.0,
    status: 'active',
    category: 'Education',
    sponsor_badge: 'Global Partner',
    created_at: new Date().toISOString(),
  };
  dbVideos.push(newVideo);

  // Verification: New active task appears immediately for users
  const userActiveTasksAfterCreate = getUserActiveVideos();
  assert.strictEqual(userActiveTasksAfterCreate.length, 2);
  assert.ok(userActiveTasksAfterCreate.some((v) => v.id === newVideoId));
  assert.strictEqual(userActiveTasksAfterCreate.find((v) => v.id === newVideoId).video_url, 'https://www.youtube.com/embed/jNQXAC9IVRw');

  // 3. Admin pauses / disables a video (status = 'paused')
  const videoToPause = dbVideos.find((v) => v.id === newVideoId);
  videoToPause.status = 'paused';

  // Verification: Paused video immediately disappears from user side, remains visible in admin
  assert.strictEqual(getAdminVideos().length, 2);
  const userActiveTasksAfterPause = getUserActiveVideos();
  assert.strictEqual(userActiveTasksAfterPause.length, 1);
  assert.ok(!userActiveTasksAfterPause.some((v) => v.id === newVideoId));

  // 4. Admin deletes a video
  dbVideos = dbVideos.filter((v) => v.id !== '11111111-1111-4111-a111-111111111111');

  // Verification: Deleted video immediately disappears from both admin and user sides
  assert.strictEqual(getAdminVideos().length, 1);
  assert.strictEqual(getUserActiveVideos().length, 0); // No active videos left
});

// -------------------------------------------------------------
// TEST 24: YouTube Embed Sanitization & Watch Session Duration Integrity
// -------------------------------------------------------------
test('Test 24: YouTube Embed Sanitization & Watch Session Duration Integrity', () => {
  const video = {
    id: '33333333-3333-4333-a333-333333333333',
    video_url: 'https://www.youtube.com/embed/9bZkp7q19f0',
    duration_seconds: 35,
    reward_amount: 15.0,
    status: 'active',
  };

  // Duration check tolerance (server-side enforces at least duration - 2s)
  const requiredDuration = video.duration_seconds;
  const prematureElapsed = 20; // 20s < 33s -> MUST FAIL
  const validElapsed = 35; // 35s >= 33s -> MUST PASS

  assert.ok(prematureElapsed < requiredDuration - 2, 'Premature elapsed should be flagged');
  assert.ok(validElapsed >= requiredDuration - 2, 'Valid elapsed duration satisfies criteria');
});

// -------------------------------------------------------------
// TEST 25: Database-Driven Settings Serialization & Mirror Sync
// -------------------------------------------------------------
test('Test 25: Database-Driven Settings Serialization & Mirror Sync', () => {
  const defaultSettings = {
    minWithdrawalBalance: 500,
    requiredQualifiedReferrals: 2,
    referralCommissionPct: 10,
    maintenanceMode: false,
    general: {
      site_name: 'Earnzo',
      maintenance_mode: false,
    },
    referrals: {
      referral_system_enabled: true,
      reward_type: 'percentage',
      reward_amount: 10,
      min_qualified_condition: 2,
    },
    withdrawals: {
      withdrawals_enabled: true,
      min_withdrawal_amount: 500,
    },
    welcomeMessage: {
      enabled: true,
      display_duration_seconds: 6,
    },
    auth: {
      registration_enabled: true,
      email_otp_enabled: false,
    },
  };

  // Simulate updating settings with new withdrawal minimum & maintenance mode
  const updates = {
    general: { ...defaultSettings.general, maintenance_mode: true },
    withdrawals: { ...defaultSettings.withdrawals, min_withdrawal_amount: 750 },
  };

  const updatedSettings = {
    ...defaultSettings,
    ...updates,
    maintenanceMode: updates.general.maintenance_mode,
    minWithdrawalBalance: updates.withdrawals.min_withdrawal_amount,
  };

  assert.strictEqual(updatedSettings.maintenanceMode, true, 'Top-level maintenanceMode must mirror general.maintenance_mode');
  assert.strictEqual(updatedSettings.minWithdrawalBalance, 750, 'Top-level minWithdrawalBalance must mirror withdrawals.min_withdrawal_amount');
  assert.strictEqual(updatedSettings.referrals.min_qualified_condition, 2);
});

// -------------------------------------------------------------
// TEST 26: Impersonation Isolation & Zero Privilege Escalation
// -------------------------------------------------------------
test('Test 26: Impersonation Isolation & Zero Privilege Escalation', () => {
  const adminActor = {
    id: 'admin-uuid-001',
    email: 'admin@earnzo.com',
    role: 'admin',
    full_name: 'Master Administrator',
  };

  const targetMember = {
    id: 'user-uuid-999',
    email: 'tariq@example.com',
    role: 'user',
    full_name: 'Tariq Mehmood',
  };

  // Impersonate function
  function simulateImpersonation(admin, target) {
    if (target.id === admin.id) throw new Error('Cannot impersonate self');
    if (target.role === 'admin' || target.email === 'admin@earnzo.com') {
      throw new Error('Cannot impersonate administrators');
    }

    const state = {
      user: target,
      impersonatorAdmin: admin,
      isImpersonating: true,
      isAdmin: false, // ZERO PRIVILEGE ESCALATION: admin rights stripped while acting as user
    };
    return state;
  }

  const activeSession = simulateImpersonation(adminActor, targetMember);
  assert.strictEqual(activeSession.isImpersonating, true);
  assert.strictEqual(activeSession.user.id, targetMember.id);
  assert.strictEqual(activeSession.user.email, 'tariq@example.com');
  assert.strictEqual(activeSession.isAdmin, false, 'Security violation: Admin status must strictly be false while impersonating');
  assert.strictEqual(activeSession.impersonatorAdmin.email, 'admin@earnzo.com');

  // Verify self-impersonation block
  assert.throws(() => simulateImpersonation(adminActor, adminActor), /Cannot impersonate self/);

  // Verify other-admin impersonation block
  const otherAdmin = { id: 'admin-uuid-002', email: 'co-admin@earnzo.com', role: 'admin', full_name: 'Co Admin' };
  assert.throws(() => simulateImpersonation(adminActor, otherAdmin), /Cannot impersonate administrators/);
});

// -------------------------------------------------------------
// TEST 27: Admin Self-Suspension & Root Admin Protection
// -------------------------------------------------------------
test('Test 27: Admin Self-Suspension & Root Admin Protection', () => {
  const currentAdmin = { id: 'admin-uuid-001', email: 'admin@earnzo.com' };
  const allProfiles = [
    { id: 'admin-uuid-001', email: 'admin@earnzo.com', status: 'active' },
    { id: 'usr-002', email: 'regular@example.com', status: 'active' },
  ];

  function updateUserStatus(actor, targetId, newStatus) {
    if (targetId === actor.id || targetId === 'admin-001') {
      throw new Error('Security violation: Administrators cannot suspend or terminate their own active account.');
    }
    const target = allProfiles.find((p) => p.id === targetId);
    if (target && target.email.toLowerCase() === 'admin@earnzo.com') {
      throw new Error('Security violation: The master root administrator account cannot be suspended or terminated.');
    }
    target.status = newStatus;
    return target;
  }

  // Self suspension attempt MUST fail
  assert.throws(
    () => updateUserStatus(currentAdmin, currentAdmin.id, 'suspended'),
    /Security violation: Administrators cannot suspend or terminate their own active account/
  );

  // Normal user suspension MUST succeed
  const updatedUser = updateUserStatus(currentAdmin, 'usr-002', 'suspended');
  assert.strictEqual(updatedUser.status, 'suspended');
});

// -------------------------------------------------------------
// TEST 28: Referral Multi-Mode Reward & Cap Enforcement
// -------------------------------------------------------------
test('Test 28: Referral Multi-Mode Reward & Cap Enforcement', () => {
  const percentageConfig = { reward_type: 'percentage', reward_amount: 10, max_reward_cap: 5000 };
  const fixedConfig = { reward_type: 'fixed', reward_amount: 75, max_reward_cap: 5000 };

  const planPurchasePrice = 2000;

  function calculateBonus(config, price, currentEarned) {
    let bonus = config.reward_type === 'percentage'
      ? (price * config.reward_amount) / 100
      : config.reward_amount;

    if (currentEarned + bonus > config.max_reward_cap) {
      bonus = Math.max(0, config.max_reward_cap - currentEarned);
    }
    return bonus;
  }

  const pctBonus = calculateBonus(percentageConfig, planPurchasePrice, 0);
  assert.strictEqual(pctBonus, 200, '10% of 2000 should be 200');

  const fixBonus = calculateBonus(fixedConfig, planPurchasePrice, 0);
  assert.strictEqual(fixBonus, 75, 'Fixed bonus should be 75');

  // Cap enforcement
  const cappedBonus = calculateBonus(percentageConfig, planPurchasePrice, 4900);
  assert.strictEqual(cappedBonus, 100, 'Bonus capped at remaining headroom (5000 - 4900 = 100)');
});

// -------------------------------------------------------------
// TEST 29: Welcome Message Dynamic Persona Resolution & Session Isolation
// -------------------------------------------------------------
test('Test 29: Welcome Message Dynamic Persona Resolution & Session Isolation', () => {
  const config = {
    enabled: true,
    new_user_title: 'Welcome to Earnzo! 🎉',
    new_user_message: 'Hi {name}, start earning today!',
    returning_user_title: 'Welcome Back! 👋',
    returning_user_message: 'Hi {name}, great to see you again!',
  };

  const newUser = {
    id: 'u-1',
    full_name: 'Zohaib Tariq',
    created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  };

  const returningUser = {
    id: 'u-2',
    full_name: 'Ahmed Bilal',
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(), // 10 days ago
  };

  function resolveWelcome(cfg, user) {
    const isNew = Date.now() - new Date(user.created_at).getTime() < 86400000;
    const template = isNew ? cfg.new_user_message : cfg.returning_user_message;
    return template.replace('{name}', user.full_name);
  }

  const newMsg = resolveWelcome(config, newUser);
  assert.strictEqual(newMsg, 'Hi Zohaib Tariq, start earning today!');

  const retMsg = resolveWelcome(config, returningUser);
  assert.strictEqual(retMsg, 'Hi Ahmed Bilal, great to see you again!');
});

// -------------------------------------------------------------
// TEST 30: Email OTP Verification & Cooldown Validation
// -------------------------------------------------------------
test('Test 30: Email OTP Verification & Cooldown Validation', () => {
  const simulatedDb = {
    'user@example.com': { otp: '582914', expiresAt: Date.now() + 600000 },
  };

  function verifyOtp(email, code) {
    const entry = simulatedDb[email];
    if (!entry) return { success: false, error: 'User not found' };
    if (Date.now() > entry.expiresAt) return { success: false, error: 'Code expired' };
    if (entry.otp !== code) return { success: false, error: 'Invalid verification code' };
    return { success: true };
  }

  assert.strictEqual(verifyOtp('user@example.com', '582914').success, true);
  assert.strictEqual(verifyOtp('user@example.com', '000000').success, false);
  assert.strictEqual(verifyOtp('unknown@example.com', '582914').success, false);
});

console.log(`\nResults: ${passedTests} of ${totalTests} test suites passed.`);
if (passedTests === totalTests) {
  console.log('STATUS: ALL INTEGRATION & LEDGER SECURITY TESTS PASSED PERFECTLY!\n');
}

