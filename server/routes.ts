import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  getStore,
  saveStore,
} from './db';
import {
  emitWalletUpdated,
  emitDepositStatusChanged,
  emitWithdrawStatusChanged,
  emitNotificationNew,
  emitReferralCommission,
  emitTaskCompleted,
  emitCampaignUpdated,
  emitHolidayUpdated,
  emitBrandingUpdated,
  emitAdminDashboardUpdated,
  getOnlineUserCount,
} from './socket';
import {
  User,
  Wallet,
  Transaction,
  DepositRequest,
  WithdrawRequest,
  TaskHistory,
  ReferralCommission,
  AppNotification,
  ActivityLog,
} from '../src/types';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'earnhub-bd-v20-locked-secret-key-2026';

// Helper: BD Phone validation
function isValidBdPhone(phone: string): boolean {
  const clean = phone.replace(/[\s-]/g, '');
  return /^(?:\+8801|8801|01)[3-9]\d{8}$/.test(clean);
}

function normalizeBdPhone(phone: string): string {
  let clean = phone.replace(/[\s-]/g, '');
  if (clean.startsWith('+88')) clean = clean.substring(3);
  if (clean.startsWith('88')) clean = clean.substring(2);
  return clean;
}

// Authentication Middleware
export function authenticateUser(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : (req.cookies && req.cookies.token);

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Please login' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; phone: string; isAdmin?: boolean; role?: string };
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or invalid token' });
  }
}

// Admin Auth Middleware
export function authenticateAdmin(req: Request, res: Response, next: () => void) {
  authenticateUser(req, res, () => {
    const user = (req as any).user;
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Access denied: Admin privileges required' });
    }
    next();
  });
}

// ==========================================
// PUBLIC & AUTH ROUTES
// ==========================================

// Register
router.post('/auth/register', (req: Request, res: Response) => {
  const { phone, password, referralCode, deviceFingerprint } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ error: 'Phone number and password are required' });
  }

  if (!isValidBdPhone(phone)) {
    return res.status(400).json({ error: 'Invalid Bangladesh phone number format (e.g. 017xxxxxxxx)' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const normalizedPhone = normalizeBdPhone(phone);
  const store = getStore();

  const existingUser = store.users.find(u => u.phone === normalizedPhone);
  if (existingUser) {
    return res.status(400).json({ error: 'This phone number is already registered' });
  }

  // Referral code validation (MANDATORY: cannot create account without valid referral code)
  if (!referralCode || !referralCode.trim()) {
    return res.status(400).json({
      error: 'Referral code is required. Account cannot be created without a valid referral code. (রেফার কোড আবশ্যক, রেফার কোড ছাড়া অ্যাকাউন্ট তৈরি করা সম্ভব নয়)।',
    });
  }

  const cleanRefCode = referralCode.trim().toUpperCase();
  const uplineUser = store.users.find(u => u.referralCode.toUpperCase() === cleanRefCode);
  const isOfficialCode = cleanRefCode === 'EHBD1001' || cleanRefCode === 'EARNHUB20';

  if (!uplineUser && !isOfficialCode) {
    return res.status(400).json({
      error: 'Invalid referral code. Please enter an active and valid referral code. (ভুল রেফার কোড। অনুগ্রহ করে সঠিক ও সক্রিয় রেফার কোড দিন)।',
    });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  const userId = `user_${Date.now()}`;
  const generatedRefCode = `EH${normalizedPhone.slice(-4)}${Math.floor(100 + Math.random() * 900)}`;
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '103.205.71.1';
  const fp = deviceFingerprint || `fp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // Free trial: 4 Days, 25 TK daily income, 100 TK max trial income
  const newUser: User = {
    id: userId,
    phone: normalizedPhone,
    passwordHash,
    role: 'Member',
    referralCode: generatedRefCode,
    referredBy: uplineUser ? uplineUser.referralCode : undefined,
    createdAt: new Date().toISOString(),
    status: 'active',
    isTrial: true,
    trialStartDate: new Date().toISOString(),
    trialDaysUsed: 0,
    trialTotalEarned: 0,
    trialMissedDays: 0,
    trialExpired: false,
    activePackageId: 'pkg_trial',
    packageActivatedAt: new Date().toISOString(),
    withdrawSetupDone: false,
    deviceFingerprint: fp,
    lastLoginIp: clientIp,
    lastLoginAt: new Date().toISOString(),
  };

  const newWallet: Wallet = {
    userId,
    balance: 0,
    totalDeposit: 0,
    totalWithdraw: 0,
    totalEarned: 0,
    todayIncome: 0,
    referralIncome: 0,
    giftIncome: 0,
    salaryIncome: 0,
    updatedAt: new Date().toISOString(),
  };

  // Device Fingerprint recording
  let dfRecord = store.deviceFingerprints.find(d => d.deviceFingerprint === fp);
  if (dfRecord) {
    if (!dfRecord.associatedUserIds.includes(userId)) {
      dfRecord.associatedUserIds.push(userId);
    }
    dfRecord.lastSeenAt = new Date().toISOString();
    dfRecord.lastSeenIp = clientIp;
  } else {
    store.deviceFingerprints.push({
      deviceFingerprint: fp,
      associatedUserIds: [userId],
      trialWithdrawalCompleted: false,
      lastSeenIp: clientIp,
      lastSeenAt: new Date().toISOString(),
    });
  }

  // Welcome notification
  store.notifications.push({
    id: `notif_${Date.now()}`,
    userId,
    type: 'task',
    title: 'Welcome to EarnHub BD V20 Enterprise!',
    message: 'Your 4-Day Free Trial is now active. Complete 1 video task today to earn 25 TK.',
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  store.users.push(newUser);
  store.wallets.push(newWallet);
  saveStore();

  emitAdminDashboardUpdated();

  const token = jwt.sign(
    { id: newUser.id, phone: newUser.phone, isAdmin: false, role: newUser.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 86400000 });

  const { passwordHash: _, ...safeUser } = newUser;
  return res.json({ token, user: safeUser, wallet: newWallet });
});

// Login
router.post('/auth/login', (req: Request, res: Response) => {
  const { phone, password, deviceFingerprint } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ error: 'Phone number and password are required' });
  }

  const normalizedPhone = normalizeBdPhone(phone);
  const store = getStore();

  // Check admin users first
  const admin = store.adminUsers.find(a => a.phone === normalizedPhone);
  if (admin && bcrypt.compareSync(password, admin.passwordHash)) {
    const token = jwt.sign(
      { id: admin.id, phone: admin.phone, isAdmin: true, role: admin.role, name: admin.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 86400000 });
    return res.json({
      token,
      isAdmin: true,
      admin: { id: admin.id, phone: admin.phone, name: admin.name, role: admin.role, permissions: admin.permissions },
    });
  }

  // Check regular users
  const user = store.users.find(u => u.phone === normalizedPhone);
  if (!user || !user.passwordHash || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid phone number or password' });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'Your account has been suspended by administration' });
  }

  // Update login data
  user.lastLoginAt = new Date().toISOString();
  user.lastLoginIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '103.205.71.1';
  if (deviceFingerprint) {
    user.deviceFingerprint = deviceFingerprint;
  }
  saveStore();

  const wallet = store.wallets.find(w => w.userId === user.id);

  const token = jwt.sign(
    { id: user.id, phone: user.phone, isAdmin: false, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 86400000 });

  const { passwordHash: _, withdrawPasswordHash: __, ...safeUser } = user;
  return res.json({ token, isAdmin: false, user: safeUser, wallet });
});

// Me
router.get('/auth/me', authenticateUser, (req: Request, res: Response) => {
  const tokenUser = (req as any).user;
  const store = getStore();

  if (tokenUser.isAdmin) {
    const admin = store.adminUsers.find(a => a.id === tokenUser.id);
    if (!admin) return res.status(404).json({ error: 'Admin not found' });
    return res.json({
      isAdmin: true,
      admin: { id: admin.id, phone: admin.phone, name: admin.name, role: admin.role, permissions: admin.permissions },
    });
  }

  const user = store.users.find(u => u.id === tokenUser.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const wallet = store.wallets.find(w => w.userId === user.id);
  const activePackage = store.packages.find(p => p.id === user.activePackageId);

  const { passwordHash: _, withdrawPasswordHash: __, ...safeUser } = user;

  let uplineInfo = null;
  if (user.referredBy) {
    const upline = store.users.find(u => u.referralCode === user.referredBy);
    if (upline) {
      uplineInfo = {
        referralCode: upline.referralCode,
        phone: upline.phone,
        role: upline.role,
      };
    }
  }
  (safeUser as any).uplineInfo = uplineInfo;

  return res.json({
    isAdmin: false,
    user: safeUser,
    wallet,
    activePackage,
    withdrawSetupDone: user.withdrawSetupDone,
  });
});

// Logout
router.post('/auth/logout', (req: Request, res: Response) => {
  res.clearCookie('token');
  return res.json({ success: true, message: 'Logged out successfully' });
});

// Change Password
router.post('/auth/change-password', authenticateUser, (req: Request, res: Response) => {
  const tokenUser = (req as any).user;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  const store = getStore();
  const user = store.users.find(u => u.id === tokenUser.id);
  if (!user || !user.passwordHash || !bcrypt.compareSync(currentPassword, user.passwordHash)) {
    return res.status(400).json({ error: 'Incorrect current password' });
  }

  const salt = bcrypt.genSaltSync(10);
  user.passwordHash = bcrypt.hashSync(newPassword, salt);
  saveStore();

  return res.json({ success: true, message: 'Password updated successfully' });
});

// ==========================================
// WITHDRAW SETUP (LOCKED - ONCE ONLY)
// ==========================================
router.post('/wallet/withdraw-setup', authenticateUser, (req: Request, res: Response) => {
  const tokenUser = (req as any).user;
  const { paymentMethod, withdrawNumber, withdrawPassword } = req.body;

  if (!paymentMethod || !withdrawNumber || !withdrawPassword) {
    return res.status(400).json({ error: 'Payment method, withdraw number, and withdraw password are required' });
  }

  if (paymentMethod !== 'bKash' && paymentMethod !== 'Nagad') {
    return res.status(400).json({ error: 'Payment method must be bKash or Nagad' });
  }

  if (!isValidBdPhone(withdrawNumber)) {
    return res.status(400).json({ error: 'Invalid Bangladesh phone number for withdraw' });
  }

  const normalizedWithdrawNumber = normalizeBdPhone(withdrawNumber);
  const store = getStore();
  const user = store.users.find(u => u.id === tokenUser.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (user.withdrawSetupDone) {
    return res.status(400).json({ error: 'Withdraw setup is LOCKED and can only be performed once in lifetime' });
  }

  // Withdraw Number unique globally rule: Same number cannot be used by another account
  const duplicateNumberUser = store.users.find(
    u => u.id !== user.id && u.withdrawNumber === normalizedWithdrawNumber
  );
  if (duplicateNumberUser) {
    return res.status(400).json({
      error: 'This withdraw number is already registered by another EarnHub BD account. Withdraw numbers must be globally unique.',
    });
  }

  const salt = bcrypt.genSaltSync(10);
  user.withdrawMethod = paymentMethod;
  user.withdrawNumber = normalizedWithdrawNumber;
  user.withdrawPasswordHash = bcrypt.hashSync(withdrawPassword, salt);
  user.withdrawSetupDone = true;

  saveStore();

  return res.json({
    success: true,
    message: 'Withdraw account setup completed and permanently locked.',
    withdrawMethod: user.withdrawMethod,
    withdrawNumber: user.withdrawNumber,
  });
});

// ==========================================
// VIDEO TASK SYSTEM (LOCKED: 10s Countdown)
// ==========================================
router.get('/tasks/today', authenticateUser, (req: Request, res: Response) => {
  const tokenUser = (req as any).user;
  const store = getStore();
  const user = store.users.find(u => u.id === tokenUser.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const todayStr = new Date().toISOString().split('T')[0];
  const dayOfWeek = new Date().getDay(); // 0 is Sunday

  // Sunday off-day check
  const isSundayOff = store.settings.sundayIsOffDay && dayOfWeek === 0;

  // Holiday check
  const activeHoliday = store.holidays.find(h => h.date === todayStr && h.tasksDisabled);

  if (isSundayOff || activeHoliday) {
    return res.json({
      tasksDisabled: true,
      reason: activeHoliday
        ? `Official Holiday: ${activeHoliday.name}. ${activeHoliday.reason}`
        : 'Sunday Maintenance Day: Daily task servers are resting today.',
      tasks: [],
      completedCount: 0,
      totalAllowed: 0,
      todayEarned: 0,
    });
  }

  // Free trial expiration check
  if (user.isTrial) {
    if (user.trialExpired || user.trialDaysUsed >= 4) {
      return res.json({
        tasksDisabled: true,
        reason: 'Your 4-day free trial has expired. Purchase Bronze, Golden, or Diamond package to continue earning.',
        tasks: [],
        completedCount: 0,
        totalAllowed: 0,
        todayEarned: user.trialTotalEarned,
        isTrialExpired: true,
      });
    }
  }

  const pkg = store.packages.find(p => p.id === (user.activePackageId || 'pkg_trial')) || store.packages[0];

  // Completed tasks today
  const todayTasks = store.taskHistories.filter(
    th => th.userId === user.id && th.completedAt.startsWith(todayStr)
  );

  const completedCount = todayTasks.length;
  const totalAllowed = pkg.videosPerDay;
  const remainingCount = Math.max(0, totalAllowed - completedCount);

  // Return available video tasks
  return res.json({
    tasksDisabled: false,
    package: pkg,
    completedCount,
    totalAllowed,
    remainingCount,
    todayEarned: todayTasks.reduce((acc, t) => acc + t.rewardEarned, 0),
    tasks: store.videoTasks.map(vt => ({
      ...vt,
      durationSeconds: 10, // Strictly locked to 10 seconds!
      rewardAmount: pkg.incomePerVideo,
    })),
  });
});

// Complete Video Task (Reward After Countdown)
router.post('/tasks/complete', authenticateUser, (req: Request, res: Response) => {
  const tokenUser = (req as any).user;
  const { taskId, watchDurationSeconds } = req.body;

  // Strict 10-second check
  if (!watchDurationSeconds || watchDurationSeconds < 9.5) {
    return res.status(400).json({ error: 'Video task must be watched for full 10-second countdown' });
  }

  const store = getStore();
  const user = store.users.find(u => u.id === tokenUser.id);
  const wallet = store.wallets.find(w => w.userId === tokenUser.id);
  if (!user || !wallet) return res.status(404).json({ error: 'User or wallet not found' });

  const todayStr = new Date().toISOString().split('T')[0];
  const pkg = store.packages.find(p => p.id === (user.activePackageId || 'pkg_trial')) || store.packages[0];

  // Check today completed count
  const todayTasks = store.taskHistories.filter(
    th => th.userId === user.id && th.completedAt.startsWith(todayStr)
  );

  if (todayTasks.length >= pkg.videosPerDay) {
    return res.status(400).json({ error: `Daily video limit reached (${pkg.videosPerDay} videos/day for ${pkg.name})` });
  }

  const reward = pkg.incomePerVideo;

  // Free trial limits: Daily income 25 TK, Max total 100 TK
  if (user.isTrial) {
    if (user.trialTotalEarned + reward > 100) {
      return res.status(400).json({ error: 'Maximum free trial earning reached (100 TK limit)' });
    }
    user.trialTotalEarned += reward;
    if (todayTasks.length === 0) {
      user.trialDaysUsed += 1;
    }
  }

  // Wallet update
  wallet.balance += reward;
  wallet.totalEarned += reward;
  wallet.todayIncome += reward;
  wallet.updatedAt = new Date().toISOString();

  // Task history
  const historyItem: TaskHistory = {
    id: `th_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: user.id,
    taskId: taskId || 'task_vid_1',
    packageId: pkg.id,
    rewardEarned: reward,
    completedAt: new Date().toISOString(),
    ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '103.205.71.1',
  };
  store.taskHistories.push(historyItem);

  // Transaction passbook entry
  store.transactions.push({
    id: `tx_${Date.now()}`,
    userId: user.id,
    type: 'task_reward',
    amount: reward,
    description: `10s Video Task Reward (${pkg.name})`,
    balanceAfter: wallet.balance,
    createdAt: new Date().toISOString(),
    referenceId: historyItem.id,
  });

  // Video Commission for upline ONLY for PAID USERS
  if (!user.isTrial && user.referredBy) {
    const uplineA = store.users.find(u => u.referralCode === user.referredBy);
    if (uplineA && !uplineA.isTrial) {
      const commA = (reward * store.settings.levelAPercentage) / 100;
      const walletA = store.wallets.find(w => w.userId === uplineA.id);
      if (walletA) {
        walletA.balance += commA;
        walletA.referralIncome += commA;
        walletA.totalEarned += commA;
        walletA.updatedAt = new Date().toISOString();

        store.referralCommissions.push({
          id: `refcomm_${Date.now()}`,
          fromUserId: user.id,
          fromUserPhone: user.phone,
          toUserId: uplineA.id,
          level: 'A',
          type: 'video_commission',
          percentage: store.settings.levelAPercentage,
          commissionAmount: commA,
          createdAt: new Date().toISOString(),
        });

        emitWalletUpdated(uplineA.id, walletA);
        emitReferralCommission(uplineA.id, {
          amount: commA,
          from: user.phone,
          level: 'A',
          type: 'Video Commission',
        });
      }

      // Level B upline
      if (uplineA.referredBy) {
        const uplineB = store.users.find(u => u.referralCode === uplineA.referredBy);
        if (uplineB && !uplineB.isTrial) {
          const commB = (reward * store.settings.levelBPercentage) / 100;
          const walletB = store.wallets.find(w => w.userId === uplineB.id);
          if (walletB) {
            walletB.balance += commB;
            walletB.referralIncome += commB;
            walletB.totalEarned += commB;
            walletB.updatedAt = new Date().toISOString();
            emitWalletUpdated(uplineB.id, walletB);
          }
        }
      }
    }
  }

  saveStore();

  // Socket.IO real-time triggers
  emitWalletUpdated(user.id, wallet);
  emitTaskCompleted(user.id, {
    reward,
    newBalance: wallet.balance,
    completedToday: todayTasks.length + 1,
    totalAllowed: pkg.videosPerDay,
  });

  return res.json({
    success: true,
    rewardEarned: reward,
    newBalance: wallet.balance,
    completedToday: todayTasks.length + 1,
    remainingCount: Math.max(0, pkg.videosPerDay - (todayTasks.length + 1)),
  });
});

// ==========================================
// WALLET & DEPOSIT SYSTEM
// ==========================================
router.get('/wallet/overview', authenticateUser, (req: Request, res: Response) => {
  const tokenUser = (req as any).user;
  const store = getStore();
  const wallet = store.wallets.find(w => w.userId === tokenUser.id);
  const user = store.users.find(u => u.id === tokenUser.id);

  if (!wallet || !user) return res.status(404).json({ error: 'Wallet not found' });

  const activePackage = store.packages.find(p => p.id === user.activePackageId);

  return res.json({
    wallet,
    user: {
      phone: user.phone,
      role: user.role,
      isTrial: user.isTrial,
      trialTotalEarned: user.trialTotalEarned,
      trialDaysUsed: user.trialDaysUsed,
      withdrawSetupDone: user.withdrawSetupDone,
      withdrawMethod: user.withdrawMethod,
      withdrawNumber: user.withdrawNumber,
    },
    activePackage,
    settings: {
      withdrawOpeningHour: store.settings.withdrawOpeningHour,
      withdrawClosingHour: store.settings.withdrawClosingHour,
      withdrawGloballyEnabled: store.settings.withdrawGloballyEnabled,
    },
  });
});

// Passbook
router.get('/wallet/passbook', authenticateUser, (req: Request, res: Response) => {
  const tokenUser = (req as any).user;
  const store = getStore();
  const transactions = store.transactions
    .filter(t => t.userId === tokenUser.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ transactions });
});

// Deposit Numbers (Randomized assignment with copy button)
router.get('/wallet/payment-numbers', authenticateUser, (req: Request, res: Response) => {
  const store = getStore();
  const activeNumbers = store.paymentNumbers.filter(pn => pn.isActive);
  return res.json({ paymentNumbers: activeNumbers });
});

// Create Deposit Request (Min 100 TK, Max 25,000 TK)
router.post('/wallet/deposit', authenticateUser, (req: Request, res: Response) => {
  const tokenUser = (req as any).user;
  const { amount, paymentMethod, assignedNumber, senderNumber, transactionId, screenshotUrl } = req.body;

  const depositAmount = Number(amount);
  if (!depositAmount || depositAmount < 100 || depositAmount > 25000) {
    return res.status(400).json({ error: 'Deposit amount must be between 100 TK and 25,000 TK' });
  }

  if (!paymentMethod || (paymentMethod !== 'bKash' && paymentMethod !== 'Nagad')) {
    return res.status(400).json({ error: 'Valid payment method (bKash or Nagad) is required' });
  }

  if (!senderNumber || !isValidBdPhone(senderNumber)) {
    return res.status(400).json({ error: 'Valid sender Bangladesh phone number is required' });
  }

  if (!transactionId || transactionId.trim().length < 6) {
    return res.status(400).json({ error: 'Valid transaction ID is required (min 6 characters)' });
  }

  const store = getStore();
  const user = store.users.find(u => u.id === tokenUser.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Check duplicate TrxID
  const duplicateTrx = store.deposits.find(
    d => d.transactionId.toUpperCase() === transactionId.trim().toUpperCase()
  );
  if (duplicateTrx) {
    return res.status(400).json({ error: 'This Transaction ID has already been submitted' });
  }

  const depositReq: DepositRequest = {
    id: `dep_${Date.now()}`,
    userId: user.id,
    userPhone: user.phone,
    amount: depositAmount,
    paymentMethod,
    assignedNumber: assignedNumber || '01712345678',
    senderNumber: normalizeBdPhone(senderNumber),
    transactionId: transactionId.trim().toUpperCase(),
    screenshotUrl: screenshotUrl || '',
    status: 'pending',
    verificationType: store.settings.hybridDepositVerificationEnabled ? 'hybrid' : 'manual',
    createdAt: new Date().toISOString(),
  };

  // Update payment number volume count
  const pn = store.paymentNumbers.find(p => p.number === depositReq.assignedNumber);
  if (pn) {
    pn.usageCount += 1;
    pn.currentDailyVolume += depositAmount;
  }

  store.deposits.push(depositReq);
  saveStore();

  emitDepositStatusChanged(user.id, depositReq);
  emitAdminDashboardUpdated();

  return res.json({
    success: true,
    message: 'Deposit request submitted successfully. Awaiting manual verification.',
    deposit: depositReq,
  });
});

// Deposit History
router.get('/wallet/deposit-history', authenticateUser, (req: Request, res: Response) => {
  const tokenUser = (req as any).user;
  const store = getStore();
  const history = store.deposits
    .filter(d => d.userId === tokenUser.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ deposits: history });
});

// ==========================================
// WITHDRAW SYSTEM (LOCKED RULES & CARDS)
// ==========================================
router.get('/wallet/withdraw-history', authenticateUser, (req: Request, res: Response) => {
  const tokenUser = (req as any).user;
  const store = getStore();
  const history = store.withdraws
    .filter(w => w.userId === tokenUser.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ withdraws: history });
});

// Request Withdraw
router.post('/wallet/withdraw', authenticateUser, (req: Request, res: Response) => {
  const tokenUser = (req as any).user;
  const { amount, withdrawPassword, deviceFingerprint } = req.body;

  const withdrawAmount = Number(amount);
  const store = getStore();
  const user = store.users.find(u => u.id === tokenUser.id);
  const wallet = store.wallets.find(w => w.userId === tokenUser.id);

  if (!user || !wallet) return res.status(404).json({ error: 'User or wallet not found' });

  // Check withdraw setup done
  if (!user.withdrawSetupDone || !user.withdrawPasswordHash || !user.withdrawNumber || !user.withdrawMethod) {
    return res.status(400).json({ error: 'You must setup your Withdraw Method and Withdraw Password first' });
  }

  // Global withdraw disable check
  if (!store.settings.withdrawGloballyEnabled) {
    return res.status(400).json({ error: 'Withdrawals are temporarily closed by administration for maintenance' });
  }

  // Opening hours check
  const currentHour = new Date().getHours();
  if (
    currentHour < store.settings.withdrawOpeningHour ||
    currentHour >= store.settings.withdrawClosingHour
  ) {
    return res.status(400).json({
      error: `Withdraw is open daily between ${store.settings.withdrawOpeningHour}:00 and ${store.settings.withdrawClosingHour}:00`,
    });
  }

  // Verify withdraw password
  if (!withdrawPassword || !bcrypt.compareSync(withdrawPassword, user.withdrawPasswordHash)) {
    return res.status(400).json({ error: 'Invalid Withdraw Password' });
  }

  // Daily one withdraw rule
  const todayStr = new Date().toISOString().split('T')[0];
  const userTodayWithdraws = store.withdraws.filter(
    w => w.userId === user.id && w.createdAt.startsWith(todayStr) && w.status !== 'rejected'
  );
  if (userTodayWithdraws.length >= 1) {
    return res.status(400).json({ error: 'Only one withdrawal request is permitted per calendar day' });
  }

  // Free User Withdrawal Rule:
  // Free users cannot withdraw by default. They can only withdraw if admin enabled permission
  // globally (store.settings.allowFreeUserWithdrawal) OR individually for this user (user.freeWithdrawAllowed).
  // Paid package users can deposit, buy any package, work and withdraw normally.
  const isFreeUser = Boolean(user.isTrial || !user.activePackageId || user.activePackageId === 'pkg_trial');
  const isFreeWithdrawPermitted = Boolean(store.settings.allowFreeUserWithdrawal || user.freeWithdrawAllowed);

  if (isFreeUser && !isFreeWithdrawPermitted) {
    return res.status(403).json({
      error: 'ফ্রি ইউজাররা টাকা উইথড্র করতে পারবেন না। টাকা উইথড্র করার অনুমতি পেতে অনুগ্রহ করে সাপোর্ট টিমে অথবা আপনার রেফারেল মেম্বারের সাথে যোগাযোগ করুন। অথবা ডিপোজিট করে যেকোনো প্যাকেজ ক্রয় করে কাজ করুন। (Free users cannot withdraw. Please contact support or contact your referral member to request withdrawal permission).',
      freeWithdrawBlocked: true,
      contactSupport: true,
      contactReferral: true,
      referredBy: user.referredBy || null,
    });
  }

  // LOCKED Withdraw Amount Cards rule:
  // Paid User Minimum = 460 TK. Allowed Cards: 460, 1680, 5800, 16800, 49999, 150000.
  // Free Trial User (when permission enabled): 100 TK card or standard cards
  const allowedPaidCards = [460, 1680, 5800, 16800, 49999, 150000];
  let isTrialWithdraw = false;

  if (isFreeUser) {
    if (withdrawAmount === 100) {
      isTrialWithdraw = true;
      const fp = deviceFingerprint || user.deviceFingerprint;
      const dfRecord = store.deviceFingerprints.find(d => d.deviceFingerprint === fp);
      if (dfRecord && dfRecord.trialWithdrawalCompleted) {
        return res.status(400).json({
          error: 'Device Protection Alert: This device has already received a free trial withdrawal. Lifetime limit: 1 free trial withdrawal per device.',
        });
      }
    } else if (!allowedPaidCards.includes(withdrawAmount)) {
      return res.status(400).json({
        error: 'Invalid withdrawal amount card selected. Please select 100 TK or an authorized card (460, 1680, 5800, 16800, 49999, 150000 TK).',
      });
    }
  } else {
    if (!allowedPaidCards.includes(withdrawAmount)) {
      return res.status(400).json({
        error: 'Invalid withdrawal amount card selected. Please select from 460, 1680, 5800, 16800, 49999, or 150000 TK.',
      });
    }
  }

  if (wallet.balance < withdrawAmount) {
    return res.status(400).json({ error: `Insufficient wallet balance. You have ${wallet.balance.toFixed(2)} TK` });
  }

  // Withdraw Fee = 10% (LOCKED)
  const fee = (withdrawAmount * 10) / 100;
  const netAmount = withdrawAmount - fee;

  // Deduct balance instantly
  wallet.balance -= withdrawAmount;
  wallet.totalWithdraw += withdrawAmount;
  wallet.updatedAt = new Date().toISOString();

  const withdrawReq: WithdrawRequest = {
    id: `wdr_${Date.now()}`,
    userId: user.id,
    userPhone: user.phone,
    amount: withdrawAmount,
    fee,
    netAmount,
    paymentMethod: user.withdrawMethod,
    withdrawNumber: user.withdrawNumber,
    status: 'pending',
    isTrialWithdraw,
    deviceFingerprint: deviceFingerprint || user.deviceFingerprint,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timeline: [
      {
        step: 'pending',
        timestamp: new Date().toISOString(),
        note: `Withdrawal request of ${withdrawAmount} TK submitted to ${user.withdrawMethod} ${user.withdrawNumber}`,
      },
    ],
  };

  store.withdraws.push(withdrawReq);

  // If trial withdraw, mark device fingerprint
  if (isTrialWithdraw) {
    const fp = deviceFingerprint || user.deviceFingerprint;
    let dfRecord = store.deviceFingerprints.find(d => d.deviceFingerprint === fp);
    if (dfRecord) {
      dfRecord.trialWithdrawalCompleted = true;
      dfRecord.trialWithdrawalDate = new Date().toISOString();
      dfRecord.trialWithdrawalAmount = 100;
    }
  }

  // Passbook entry
  store.transactions.push({
    id: `tx_${Date.now()}`,
    userId: user.id,
    type: 'withdraw',
    amount: -withdrawAmount,
    fee,
    description: `Withdraw Request to ${user.withdrawMethod} (${netAmount} TK after 10% fee)`,
    balanceAfter: wallet.balance,
    createdAt: new Date().toISOString(),
    referenceId: withdrawReq.id,
  });

  saveStore();

  emitWalletUpdated(user.id, wallet);
  emitWithdrawStatusChanged(user.id, withdrawReq);
  emitAdminDashboardUpdated();

  return res.json({
    success: true,
    message: 'Withdrawal request submitted successfully.',
    withdraw: withdrawReq,
    newBalance: wallet.balance,
  });
});

// ==========================================
// PACKAGE PURCHASE (ONLY WALLET BALANCE!)
// ==========================================
router.get('/packages', (req: Request, res: Response) => {
  const store = getStore();
  const activePackages = store.packages.filter(p => p.enabled && p.id !== 'pkg_trial');
  return res.json({ packages: activePackages });
});

router.post('/packages/purchase', authenticateUser, (req: Request, res: Response) => {
  const tokenUser = (req as any).user;
  const { packageId } = req.body;

  const store = getStore();
  const user = store.users.find(u => u.id === tokenUser.id);
  const wallet = store.wallets.find(w => w.userId === tokenUser.id);
  const pkg = store.packages.find(p => p.id === packageId && p.enabled);

  if (!user || !wallet) return res.status(404).json({ error: 'User or wallet not found' });
  if (!pkg) return res.status(404).json({ error: 'Selected package is not available' });

  if (pkg.price <= 0) {
    return res.status(400).json({ error: 'Invalid package purchase' });
  }

  // Rule: Packages purchased ONLY using Wallet Balance!
  if (wallet.balance < pkg.price) {
    return res.status(400).json({
      error: `Insufficient wallet balance. Package price is ${pkg.price.toLocaleString()} TK, but your current balance is ${wallet.balance.toLocaleString()} TK. Please deposit first.`,
    });
  }

  // Wallet deducted instantly
  wallet.balance -= pkg.price;
  wallet.updatedAt = new Date().toISOString();

  // Package activated instantly after purchase
  user.activePackageId = pkg.id;
  user.packageActivatedAt = new Date().toISOString();
  user.isTrial = false; // Becomes paid user!
  user.trialExpired = true;

  // If user role was Member, upgrade to Manager if higher tier
  if (pkg.price >= 22500 && user.role === 'Member') {
    user.role = 'Manager';
  }

  // Transaction passbook entry
  store.transactions.push({
    id: `tx_${Date.now()}`,
    userId: user.id,
    type: 'package_purchase',
    amount: -pkg.price,
    description: `Purchased ${pkg.name} Package (${pkg.dailyIncome} TK daily / ${pkg.videosPerDay} videos)`,
    balanceAfter: wallet.balance,
    createdAt: new Date().toISOString(),
    referenceId: pkg.id,
  });

  // Referral package commission for uplines
  if (user.referredBy) {
    const uplineA = store.users.find(u => u.referralCode === user.referredBy);
    if (uplineA) {
      const bonusA = (pkg.price * store.settings.levelAPercentage) / 100;
      const walletA = store.wallets.find(w => w.userId === uplineA.id);
      if (walletA) {
        walletA.balance += bonusA;
        walletA.referralIncome += bonusA;
        walletA.totalEarned += bonusA;
        walletA.updatedAt = new Date().toISOString();

        store.referralCommissions.push({
          id: `ref_pkg_${Date.now()}`,
          fromUserId: user.id,
          fromUserPhone: user.phone,
          toUserId: uplineA.id,
          level: 'A',
          type: 'package_bonus',
          percentage: store.settings.levelAPercentage,
          commissionAmount: bonusA,
          createdAt: new Date().toISOString(),
        });

        store.transactions.push({
          id: `tx_${Date.now()}_ref`,
          userId: uplineA.id,
          type: 'referral_bonus',
          amount: bonusA,
          description: `Level A Referral Bonus from ${user.phone} (${pkg.name} purchase)`,
          balanceAfter: walletA.balance,
          createdAt: new Date().toISOString(),
        });

        emitWalletUpdated(uplineA.id, walletA);
        emitReferralCommission(uplineA.id, {
          amount: bonusA,
          from: user.phone,
          level: 'A',
          type: 'Package Purchase Bonus',
        });
      }
    }
  }

  // Notification
  store.notifications.push({
    id: `notif_${Date.now()}`,
    userId: user.id,
    type: 'task',
    title: `${pkg.name} Package Activated!`,
    message: `Congratulations! Your ${pkg.name} package is active. You can now watch ${pkg.videosPerDay} videos daily for ${pkg.dailyIncome} TK.`,
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  saveStore();

  emitWalletUpdated(user.id, wallet);
  emitNotificationNew(user.id, store.notifications[store.notifications.length - 1]);
  emitAdminDashboardUpdated();

  return res.json({
    success: true,
    message: `${pkg.name} package purchased and activated successfully!`,
    activePackage: pkg,
    newBalance: wallet.balance,
  });
});

// ==========================================
// REFERRAL SYSTEM
// ==========================================
router.get('/referral/summary', authenticateUser, (req: Request, res: Response) => {
  const tokenUser = (req as any).user;
  const store = getStore();
  const user = store.users.find(u => u.id === tokenUser.id);
  const wallet = store.wallets.find(w => w.userId === tokenUser.id);
  if (!user || !wallet) return res.status(404).json({ error: 'User not found' });

  // Level A members: directly referred by user.referralCode
  const levelAUsers = store.users.filter(u => u.referredBy === user.referralCode);
  const levelACodes = levelAUsers.map(u => u.referralCode);

  // Level B members
  const levelBUsers = store.users.filter(u => u.referredBy && levelACodes.includes(u.referredBy));
  const levelBCodes = levelBUsers.map(u => u.referralCode);

  // Level C members
  const levelCUsers = store.users.filter(u => u.referredBy && levelBCodes.includes(u.referredBy));

  const mapMember = (m: User, level: 'A' | 'B' | 'C') => {
    const pkg = store.packages.find(p => p.id === m.activePackageId);
    const comms = store.referralCommissions
      .filter(c => c.toUserId === user.id && c.fromUserId === m.id)
      .reduce((acc, c) => acc + c.commissionAmount, 0);

    return {
      userId: m.id,
      phone: `${m.phone.slice(0, 4)}***${m.phone.slice(-3)}`,
      role: m.role,
      level,
      joinedAt: m.createdAt,
      activePackageName: pkg ? pkg.name : (m.isTrial ? 'Free Trial' : 'None'),
      commissionEarnedForUpline: comms,
    };
  };

  const commissions = store.referralCommissions
    .filter(c => c.toUserId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Salary requirements progress:
  // Active team members needed: Manager (10), Senior Manager (25), VIP (50)
  const paidTeamMembersCount = [...levelAUsers, ...levelBUsers, ...levelCUsers].filter(u => !u.isTrial).length;
  let salaryTarget = 10;
  let salaryRole = 'Manager (5,000 TK/mo)';
  if (paidTeamMembersCount >= 25) {
    salaryTarget = 50;
    salaryRole = 'VIP (25,000 TK/mo)';
  } else if (paidTeamMembersCount >= 10) {
    salaryTarget = 25;
    salaryRole = 'Senior Manager (12,000 TK/mo)';
  }

  return res.json({
    referralCode: user.referralCode,
    totalReferralEarnings: wallet.referralIncome,
    teamCounts: {
      total: levelAUsers.length + levelBUsers.length + levelCUsers.length,
      levelA: levelAUsers.length,
      levelB: levelBUsers.length,
      levelC: levelCUsers.length,
      paidCount: paidTeamMembersCount,
    },
    percentages: {
      levelA: store.settings.levelAPercentage,
      levelB: store.settings.levelBPercentage,
      levelC: store.settings.levelCPercentage,
    },
    teamMembers: [
      ...levelAUsers.map(u => mapMember(u, 'A')),
      ...levelBUsers.map(u => mapMember(u, 'B')),
      ...levelCUsers.map(u => mapMember(u, 'C')),
    ],
    commissions: commissions.slice(0, 20),
    salaryProgress: {
      currentCount: paidTeamMembersCount,
      targetCount: salaryTarget,
      percentage: Math.min(100, Math.round((paidTeamMembersCount / salaryTarget) * 100)),
      nextRole: salaryRole,
    },
  });
});

// ==========================================
// PROMOTIONS & CAMPAIGNS
// ==========================================
router.get('/promotions', (req: Request, res: Response) => {
  const store = getStore();
  const activeCampaigns = store.campaigns.filter(c => c.isActive);
  return res.json({ campaigns: activeCampaigns });
});

router.post('/promotions/claim-code', authenticateUser, (req: Request, res: Response) => {
  const tokenUser = (req as any).user;
  const { code } = req.body;

  if (!code) return res.status(400).json({ error: 'Promo code is required' });

  const store = getStore();
  const user = store.users.find(u => u.id === tokenUser.id);
  const wallet = store.wallets.find(w => w.userId === tokenUser.id);
  if (!user || !wallet) return res.status(404).json({ error: 'User or wallet not found' });

  const promo = store.promoCodes.find(
    p => p.code.toUpperCase() === code.trim().toUpperCase() && p.isActive
  );

  if (!promo) {
    return res.status(400).json({ error: 'Invalid or expired promo code' });
  }

  if (promo.currentUsage >= promo.maxUsage) {
    return res.status(400).json({ error: 'This promo code usage limit has been reached' });
  }

  // Check if user already claimed this promo
  const alreadyClaimed = store.transactions.find(
    t => t.userId === user.id && t.type === 'promo_code' && t.referenceId === promo.id
  );
  if (alreadyClaimed) {
    return res.status(400).json({ error: 'You have already claimed this promo code' });
  }

  promo.currentUsage += 1;
  wallet.balance += promo.rewardAmount;
  wallet.giftIncome += promo.rewardAmount;
  wallet.totalEarned += promo.rewardAmount;
  wallet.updatedAt = new Date().toISOString();

  store.transactions.push({
    id: `tx_${Date.now()}`,
    userId: user.id,
    type: 'promo_code',
    amount: promo.rewardAmount,
    description: `Promo Code Redeemed: ${promo.code}`,
    balanceAfter: wallet.balance,
    createdAt: new Date().toISOString(),
    referenceId: promo.id,
  });

  store.notifications.push({
    id: `notif_${Date.now()}`,
    userId: user.id,
    type: 'gift',
    title: 'Promo Reward Credited!',
    message: `${promo.rewardAmount} TK added to your wallet from promo code ${promo.code}.`,
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  saveStore();

  emitWalletUpdated(user.id, wallet);
  emitNotificationNew(user.id, store.notifications[store.notifications.length - 1]);

  return res.json({
    success: true,
    message: `Promo code redeemed! +${promo.rewardAmount} TK credited to your wallet.`,
    rewardAmount: promo.rewardAmount,
    newBalance: wallet.balance,
  });
});

// Notifications
router.get('/notifications', authenticateUser, (req: Request, res: Response) => {
  const tokenUser = (req as any).user;
  const store = getStore();
  const list = store.notifications
    .filter(n => n.userId === tokenUser.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ notifications: list });
});

router.post('/notifications/mark-read', authenticateUser, (req: Request, res: Response) => {
  const tokenUser = (req as any).user;
  const store = getStore();
  store.notifications
    .filter(n => n.userId === tokenUser.id)
    .forEach(n => {
      n.isRead = true;
    });
  saveStore();
  return res.json({ success: true });
});

// Settings & Branding
router.get('/settings/public', (req: Request, res: Response) => {
  const store = getStore();
  return res.json({
    settings: store.settings,
    todayIsHoliday: store.holidays.some(
      h => h.date === new Date().toISOString().split('T')[0] && h.tasksDisabled
    ),
    onlineUsers: getOnlineUserCount(),
  });
});

// ==========================================
// ADMIN CRM ENTERPRISE API ROUTES
// ==========================================

// 1. Admin Dashboard Live Cards
router.get('/admin/dashboard-stats', authenticateAdmin, (req: Request, res: Response) => {
  const store = getStore();

  const totalUsers = store.users.length;
  const activeUsers = store.users.filter(u => u.status === 'active').length;
  const freeTrialUsers = store.users.filter(u => u.isTrial).length;
  const activePaidUsers = store.users.filter(u => !u.isTrial && u.activePackageId).length;

  const totalDeposit = store.deposits
    .filter(d => d.status === 'approved')
    .reduce((acc, d) => acc + d.amount, 0);

  const totalWithdraw = store.withdraws
    .filter(w => w.status === 'paid' || w.status === 'approved')
    .reduce((acc, w) => acc + w.amount, 0);

  const withdrawFeeRevenue = store.withdraws
    .filter(w => w.status === 'paid' || w.status === 'approved')
    .reduce((acc, w) => acc + w.fee, 0);

  const totalReferralBonus = store.referralCommissions.reduce((acc, r) => acc + r.commissionAmount, 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRevenue = store.deposits
    .filter(d => d.status === 'approved' && d.createdAt.startsWith(todayStr))
    .reduce((acc, d) => acc + d.amount, 0);

  return res.json({
    stats: {
      totalUsers,
      activeUsers,
      freeTrialUsers,
      activePaidUsers,
      totalDeposit,
      totalWithdraw,
      withdrawFeeRevenue,
      totalReferralBonus,
      todayRevenue,
      onlineUsers: getOnlineUserCount(),
    },
    pendingDepositsCount: store.deposits.filter(d => d.status === 'pending').length,
    pendingWithdrawsCount: store.withdraws.filter(w => w.status === 'pending').length,
    recentDeposits: store.deposits.slice(-5).reverse(),
    recentWithdraws: store.withdraws.slice(-5).reverse(),
  });
});

// 2. User CRM: Search & Detail
router.get('/admin/users', authenticateAdmin, (req: Request, res: Response) => {
  const store = getStore();
  const { search, role, status } = req.query;

  let filtered = [...store.users];

  if (search && typeof search === 'string') {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(u => u.phone.includes(q) || u.referralCode.toLowerCase().includes(q));
  }

  if (role && typeof role === 'string' && role !== 'all') {
    filtered = filtered.filter(u => u.role === role);
  }

  if (status && typeof status === 'string' && status !== 'all') {
    filtered = filtered.filter(u => u.status === status);
  }

  const enriched = filtered.map(u => {
    const wallet = store.wallets.find(w => w.userId === u.id);
    const pkg = store.packages.find(p => p.id === u.activePackageId);
    return {
      id: u.id,
      phone: u.phone,
      role: u.role,
      status: u.status,
      referralCode: u.referralCode,
      referredBy: u.referredBy,
      isTrial: u.isTrial,
      freeWithdrawAllowed: Boolean(u.freeWithdrawAllowed),
      trialDaysUsed: u.trialDaysUsed,
      activePackageName: pkg ? pkg.name : (u.isTrial ? 'Free Trial' : 'None'),
      balance: wallet ? wallet.balance : 0,
      totalDeposit: wallet ? wallet.totalDeposit : 0,
      totalWithdraw: wallet ? wallet.totalWithdraw : 0,
      deviceFingerprint: u.deviceFingerprint,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
    };
  });

  return res.json({ users: enriched });
});

// User CRM Profile Detail
router.get('/admin/users/:id', authenticateAdmin, (req: Request, res: Response) => {
  const store = getStore();
  const user = store.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const wallet = store.wallets.find(w => w.userId === user.id);
  const deposits = store.deposits.filter(d => d.userId === user.id);
  const withdraws = store.withdraws.filter(w => w.userId === user.id);
  const team = store.users.filter(u => u.referredBy === user.referralCode);
  const pkg = store.packages.find(p => p.id === user.activePackageId);

  const { passwordHash: _, ...safeUser } = user;
  return res.json({
    user: safeUser,
    wallet,
    activePackage: pkg,
    deposits,
    withdraws,
    teamCount: team.length,
  });
});

// Admin User Actions: Balance adjustment, role change, status toggle
router.post('/admin/users/:id/action', authenticateAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).user;
  const store = getStore();
  const user = store.users.find(u => u.id === req.params.id);
  const wallet = store.wallets.find(w => w.userId === req.params.id);
  if (!user || !wallet) return res.status(404).json({ error: 'User or wallet not found' });

  const { action, amount, reason, role, newPassword } = req.body;

  if (action === 'add_balance') {
    const val = Number(amount);
    if (!val || val <= 0) return res.status(400).json({ error: 'Valid positive amount required' });
    wallet.balance += val;
    wallet.giftIncome += val;
    wallet.updatedAt = new Date().toISOString();

    store.transactions.push({
      id: `tx_${Date.now()}`,
      userId: user.id,
      type: 'gift',
      amount: val,
      description: `Admin Credit: ${reason || 'Administrative adjustment'}`,
      balanceAfter: wallet.balance,
      createdAt: new Date().toISOString(),
    });

    store.notifications.push({
      id: `notif_${Date.now()}`,
      userId: user.id,
      type: 'gift',
      title: 'Wallet Balance Added by Admin',
      message: `${val} TK has been added to your wallet. Reason: ${reason || 'Admin Credit'}.`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    emitWalletUpdated(user.id, wallet);
    emitNotificationNew(user.id, store.notifications[store.notifications.length - 1]);
  } else if (action === 'deduct_balance') {
    const val = Number(amount);
    if (!val || val <= 0 || wallet.balance < val) {
      return res.status(400).json({ error: 'Invalid deduction amount or exceeds user balance' });
    }
    wallet.balance -= val;
    wallet.updatedAt = new Date().toISOString();

    store.transactions.push({
      id: `tx_${Date.now()}`,
      userId: user.id,
      type: 'withdraw',
      amount: -val,
      description: `Admin Deduction: ${reason || 'Administrative correction'}`,
      balanceAfter: wallet.balance,
      createdAt: new Date().toISOString(),
    });

    emitWalletUpdated(user.id, wallet);
  } else if (action === 'assign_role') {
    if (!role) return res.status(400).json({ error: 'Role is required' });
    user.role = role;
  } else if (action === 'toggle_status') {
    user.status = user.status === 'active' ? 'suspended' : 'active';
  } else if (action === 'toggle_free_withdraw') {
    user.freeWithdrawAllowed = !user.freeWithdrawAllowed;
  } else if (action === 'reset_password') {
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const salt = bcrypt.genSaltSync(10);
    user.passwordHash = bcrypt.hashSync(newPassword, salt);
  }

  // Audit activity log
  store.activityLogs.push({
    id: `log_${Date.now()}`,
    adminId: adminUser.id,
    adminName: adminUser.name || 'Admin',
    action: `User Action: ${action}`,
    target: user.phone,
    details: reason || `Updated user ${user.phone}`,
    timestamp: new Date().toISOString(),
  });

  saveStore();
  emitAdminDashboardUpdated();

  return res.json({ success: true, message: `Action ${action} executed successfully`, user, wallet });
});

// 3. Deposit Manager: Approve, Reject, Manual Verify
router.get('/admin/deposits', authenticateAdmin, (req: Request, res: Response) => {
  const store = getStore();
  const { status } = req.query;
  let list = [...store.deposits];
  if (status && typeof status === 'string' && status !== 'all') {
    list = list.filter(d => d.status === status);
  }
  return res.json({ deposits: list.reverse() });
});

router.post('/admin/deposits/:id/review', authenticateAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).user;
  const store = getStore();
  const deposit = store.deposits.find(d => d.id === req.params.id);
  if (!deposit) return res.status(404).json({ error: 'Deposit request not found' });

  const { status, rejectedReason } = req.body;
  if (status !== 'approved' && status !== 'rejected') {
    return res.status(400).json({ error: 'Status must be approved or rejected' });
  }

  deposit.status = status;
  deposit.reviewedAt = new Date().toISOString();
  deposit.reviewedBy = adminUser.name || 'Admin';

  const user = store.users.find(u => u.id === deposit.userId);
  const wallet = store.wallets.find(w => w.userId === deposit.userId);

  if (status === 'approved' && wallet) {
    // Deposit approval ONLY adds Wallet Balance!
    // NEVER activate package after deposit approval (LOCKED RULE)!
    wallet.balance += deposit.amount;
    wallet.totalDeposit += deposit.amount;
    wallet.updatedAt = new Date().toISOString();

    store.transactions.push({
      id: `tx_${Date.now()}`,
      userId: deposit.userId,
      type: 'deposit',
      amount: deposit.amount,
      description: `${deposit.paymentMethod} Deposit Approved (TrxID: ${deposit.transactionId})`,
      balanceAfter: wallet.balance,
      createdAt: new Date().toISOString(),
      referenceId: deposit.id,
    });

    store.notifications.push({
      id: `notif_${Date.now()}`,
      userId: deposit.userId,
      type: 'deposit',
      title: 'Deposit Approved!',
      message: `Your ${deposit.paymentMethod} deposit of ${deposit.amount} TK has been approved and added to your wallet balance.`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    emitWalletUpdated(deposit.userId, wallet);
    emitNotificationNew(deposit.userId, store.notifications[store.notifications.length - 1]);
  } else if (status === 'rejected') {
    deposit.rejectedReason = rejectedReason || 'Transaction could not be verified';
    store.notifications.push({
      id: `notif_${Date.now()}`,
      userId: deposit.userId,
      type: 'deposit',
      title: 'Deposit Rejected',
      message: `Your deposit of ${deposit.amount} TK was rejected. Reason: ${deposit.rejectedReason}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
    emitNotificationNew(deposit.userId, store.notifications[store.notifications.length - 1]);
  }

  // Audit activity log
  store.activityLogs.push({
    id: `log_${Date.now()}`,
    adminId: adminUser.id,
    adminName: adminUser.name || 'Admin',
    action: `Deposit Review: ${status}`,
    target: deposit.transactionId,
    details: `${status} ${deposit.amount} TK for ${deposit.userPhone}`,
    timestamp: new Date().toISOString(),
  });

  saveStore();

  emitDepositStatusChanged(deposit.userId, deposit);
  emitAdminDashboardUpdated();

  return res.json({ success: true, deposit });
});

// 4. Withdraw Manager: Approve, Reject, Paid
router.get('/admin/withdraws', authenticateAdmin, (req: Request, res: Response) => {
  const store = getStore();
  const { status } = req.query;
  let list = [...store.withdraws];
  if (status && typeof status === 'string' && status !== 'all') {
    list = list.filter(w => w.status === status);
  }
  return res.json({ withdraws: list.reverse() });
});

router.post('/admin/withdraws/:id/action', authenticateAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).user;
  const store = getStore();
  const withdraw = store.withdraws.find(w => w.id === req.params.id);
  if (!withdraw) return res.status(404).json({ error: 'Withdraw request not found' });

  const { status, note, rejectedReason } = req.body;
  if (!['approved', 'paid', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be approved, paid, or rejected' });
  }

  withdraw.status = status;
  withdraw.updatedAt = new Date().toISOString();

  withdraw.timeline.push({
    step: status,
    timestamp: new Date().toISOString(),
    note: note || `Status updated to ${status} by ${adminUser.name || 'Admin'}`,
  });

  if (status === 'rejected') {
    withdraw.rejectedReason = rejectedReason || 'Withdrawal rejected by finance administration';
    // Refund wallet balance if rejected!
    const wallet = store.wallets.find(w => w.userId === withdraw.userId);
    if (wallet) {
      wallet.balance += withdraw.amount;
      wallet.totalWithdraw -= withdraw.amount;
      wallet.updatedAt = new Date().toISOString();

      store.transactions.push({
        id: `tx_${Date.now()}`,
        userId: withdraw.userId,
        type: 'gift',
        amount: withdraw.amount,
        description: `Refund for Rejected Withdraw #${withdraw.id}`,
        balanceAfter: wallet.balance,
        createdAt: new Date().toISOString(),
      });

      emitWalletUpdated(withdraw.userId, wallet);
    }

    store.notifications.push({
      id: `notif_${Date.now()}`,
      userId: withdraw.userId,
      type: 'withdraw',
      title: 'Withdrawal Request Rejected',
      message: `Your withdrawal of ${withdraw.amount} TK was rejected. Amount has been refunded. Reason: ${withdraw.rejectedReason}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
    emitNotificationNew(withdraw.userId, store.notifications[store.notifications.length - 1]);
  } else if (status === 'paid') {
    store.notifications.push({
      id: `notif_${Date.now()}`,
      userId: withdraw.userId,
      type: 'withdraw',
      title: 'Withdrawal Completed & Paid!',
      message: `Your ${withdraw.netAmount} TK has been sent via ${withdraw.paymentMethod} to ${withdraw.withdrawNumber}.`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
    emitNotificationNew(withdraw.userId, store.notifications[store.notifications.length - 1]);
  }

  // Audit activity log
  store.activityLogs.push({
    id: `log_${Date.now()}`,
    adminId: adminUser.id,
    adminName: adminUser.name || 'Admin',
    action: `Withdraw Action: ${status}`,
    target: withdraw.withdrawNumber,
    details: `${status} ${withdraw.amount} TK to ${withdraw.userPhone}`,
    timestamp: new Date().toISOString(),
  });

  saveStore();

  emitWithdrawStatusChanged(withdraw.userId, withdraw);
  emitAdminDashboardUpdated();

  return res.json({ success: true, withdraw });
});

// 5. Package Manager: CRUD & Toggle
router.get('/admin/packages', authenticateAdmin, (req: Request, res: Response) => {
  const store = getStore();
  return res.json({ packages: store.packages });
});

router.post('/admin/packages/:id', authenticateAdmin, (req: Request, res: Response) => {
  const store = getStore();
  const pkg = store.packages.find(p => p.id === req.params.id);
  if (!pkg) return res.status(404).json({ error: 'Package not found' });

  const { price, dailyIncome, videosPerDay, enabled, isPopular } = req.body;

  if (price !== undefined) pkg.price = Number(price);
  if (dailyIncome !== undefined) pkg.dailyIncome = Number(dailyIncome);
  if (videosPerDay !== undefined) {
    pkg.videosPerDay = Number(videosPerDay);
    pkg.incomePerVideo = pkg.dailyIncome / pkg.videosPerDay;
  }
  if (enabled !== undefined) pkg.enabled = Boolean(enabled);
  if (isPopular !== undefined) pkg.isPopular = Boolean(isPopular);

  saveStore();
  return res.json({ success: true, package: pkg });
});

// 6. Referral & Salary Rules Manager
router.post('/admin/settings/referrals', authenticateAdmin, (req: Request, res: Response) => {
  const store = getStore();
  const { levelA, levelB, levelC } = req.body;

  if (levelA !== undefined) store.settings.levelAPercentage = Number(levelA);
  if (levelB !== undefined) store.settings.levelBPercentage = Number(levelB);
  if (levelC !== undefined) store.settings.levelCPercentage = Number(levelC);

  saveStore();
  return res.json({ success: true, settings: store.settings });
});

// 7. Campaigns & Promo Codes Manager
router.post('/admin/campaigns', authenticateAdmin, (req: Request, res: Response) => {
  const store = getStore();
  const { title, description, bannerUrl, type, startDate, endDate, isActive } = req.body;

  const campaign = {
    id: `camp_${Date.now()}`,
    title,
    description,
    bannerUrl: bannerUrl || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&auto=format&fit=crop&q=80',
    type: type || 'banner',
    startDate: startDate || new Date().toISOString().split('T')[0],
    endDate: endDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    isActive: isActive !== undefined ? isActive : true,
  };

  store.campaigns.push(campaign);
  saveStore();
  emitCampaignUpdated(campaign);

  return res.json({ success: true, campaign });
});

router.post('/admin/promocodes', authenticateAdmin, (req: Request, res: Response) => {
  const store = getStore();
  const { code, rewardAmount, maxUsage, expiresAt } = req.body;

  if (!code || !rewardAmount) {
    return res.status(400).json({ error: 'Code and reward amount are required' });
  }

  const promoCode = {
    id: `promo_${Date.now()}`,
    code: code.trim().toUpperCase(),
    rewardAmount: Number(rewardAmount),
    maxUsage: Number(maxUsage) || 500,
    currentUsage: 0,
    expiresAt: expiresAt || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  store.promoCodes.push(promoCode);
  saveStore();

  return res.json({ success: true, promoCode });
});

// 8. Gift Balance Manager (Reason required, notification required, history saved!)
router.post('/admin/gift-balance', authenticateAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).user;
  const { phone, amount, reason } = req.body;

  if (!phone || !amount || !reason) {
    return res.status(400).json({ error: 'Target phone, amount, and reason are strictly required' });
  }

  const normalizedPhone = normalizeBdPhone(phone);
  const store = getStore();
  const user = store.users.find(u => u.phone === normalizedPhone);
  const wallet = store.wallets.find(w => w.userId === (user ? user.id : ''));

  if (!user || !wallet) {
    return res.status(404).json({ error: 'User with this phone number was not found' });
  }

  const giftVal = Number(amount);
  wallet.balance += giftVal;
  wallet.giftIncome += giftVal;
  wallet.totalEarned += giftVal;
  wallet.updatedAt = new Date().toISOString();

  store.transactions.push({
    id: `tx_${Date.now()}`,
    userId: user.id,
    type: 'gift',
    amount: giftVal,
    description: `Official Gift Balance: ${reason}`,
    balanceAfter: wallet.balance,
    createdAt: new Date().toISOString(),
  });

  store.notifications.push({
    id: `notif_${Date.now()}`,
    userId: user.id,
    type: 'gift',
    title: 'Special Gift Balance Received!',
    message: `You received ${giftVal} TK gift balance in your wallet. Reason: ${reason}.`,
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  store.activityLogs.push({
    id: `log_${Date.now()}`,
    adminId: adminUser.id,
    adminName: adminUser.name || 'Admin',
    action: 'Gift Balance Awarded',
    target: user.phone,
    details: `${giftVal} TK awarded. Reason: ${reason}`,
    timestamp: new Date().toISOString(),
  });

  saveStore();

  emitWalletUpdated(user.id, wallet);
  emitNotificationNew(user.id, store.notifications[store.notifications.length - 1]);

  return res.json({ success: true, message: `Gift balance of ${giftVal} TK sent to ${user.phone}`, newBalance: wallet.balance });
});

// 9. Holiday Manager (Reason required, disable tasks, banner shown, real-time)
router.post('/admin/holidays', authenticateAdmin, (req: Request, res: Response) => {
  const { date, name, reason, tasksDisabled } = req.body;

  if (!date || !name || !reason) {
    return res.status(400).json({ error: 'Date, name, and reason are required for holidays' });
  }

  const store = getStore();
  const holiday = {
    id: `hol_${Date.now()}`,
    date,
    name,
    reason,
    tasksDisabled: tasksDisabled !== undefined ? Boolean(tasksDisabled) : true,
  };

  store.holidays.push(holiday);
  saveStore();

  emitHolidayUpdated(holiday);

  return res.json({ success: true, holiday });
});

// 10. Payment Number Manager
router.get('/admin/payment-numbers', authenticateAdmin, (req: Request, res: Response) => {
  const store = getStore();
  return res.json({ paymentNumbers: store.paymentNumbers });
});

router.post('/admin/payment-numbers', authenticateAdmin, (req: Request, res: Response) => {
  const { method, number, accountType, dailyLimit } = req.body;
  if (!number || !isValidBdPhone(number)) {
    return res.status(400).json({ error: 'Valid Bangladesh phone number is required' });
  }

  const store = getStore();
  const pn = {
    id: `num_${Date.now()}`,
    method: method || 'bKash',
    number: normalizeBdPhone(number),
    accountType: accountType || 'Personal',
    isActive: true,
    usageCount: 0,
    dailyLimit: Number(dailyLimit) || 200000,
    currentDailyVolume: 0,
  };

  store.paymentNumbers.push(pn);
  saveStore();

  return res.json({ success: true, paymentNumber: pn });
});

router.post('/admin/payment-numbers/:id/toggle', authenticateAdmin, (req: Request, res: Response) => {
  const store = getStore();
  const pn = store.paymentNumbers.find(p => p.id === req.params.id);
  if (!pn) return res.status(404).json({ error: 'Number not found' });

  pn.isActive = !pn.isActive;
  saveStore();
  return res.json({ success: true, paymentNumber: pn });
});

// 11. Branding & Settings Manager
router.post('/admin/settings', authenticateAdmin, (req: Request, res: Response) => {
  const store = getStore();
  const {
    websiteName,
    tagline,
    logoUrl,
    mobileLogoUrl,
    whatsappNumber,
    themePrimaryColor,
    footerText,
    withdrawOpeningHour,
    withdrawClosingHour,
    withdrawStartHour,
    withdrawEndHour,
    withdrawGloballyEnabled,
    isWithdrawDisabled,
    allowFreeUserWithdrawal,
    hybridDepositVerificationEnabled,
    sundayIsOffDay,
  } = req.body;

  if (websiteName !== undefined) store.settings.websiteName = websiteName;
  if (tagline !== undefined) store.settings.tagline = tagline;
  if (logoUrl !== undefined) store.settings.logoUrl = logoUrl;
  if (mobileLogoUrl !== undefined) store.settings.mobileLogoUrl = mobileLogoUrl;
  if (whatsappNumber !== undefined) store.settings.whatsappNumber = whatsappNumber;
  if (themePrimaryColor !== undefined) store.settings.themePrimaryColor = themePrimaryColor;
  if (footerText !== undefined) store.settings.footerText = footerText;

  const openingH = withdrawOpeningHour !== undefined ? Number(withdrawOpeningHour) : (withdrawStartHour !== undefined ? Number(withdrawStartHour) : undefined);
  if (openingH !== undefined) {
    store.settings.withdrawOpeningHour = openingH;
    store.settings.withdrawStartHour = openingH;
  }

  const closingH = withdrawClosingHour !== undefined ? Number(withdrawClosingHour) : (withdrawEndHour !== undefined ? Number(withdrawEndHour) : undefined);
  if (closingH !== undefined) {
    store.settings.withdrawClosingHour = closingH;
    store.settings.withdrawEndHour = closingH;
  }

  if (withdrawGloballyEnabled !== undefined) store.settings.withdrawGloballyEnabled = Boolean(withdrawGloballyEnabled);
  if (isWithdrawDisabled !== undefined) {
    store.settings.isWithdrawDisabled = Boolean(isWithdrawDisabled);
    store.settings.withdrawGloballyEnabled = !Boolean(isWithdrawDisabled);
  }
  if (allowFreeUserWithdrawal !== undefined) {
    store.settings.allowFreeUserWithdrawal = Boolean(allowFreeUserWithdrawal);
  }
  if (hybridDepositVerificationEnabled !== undefined) store.settings.hybridDepositVerificationEnabled = Boolean(hybridDepositVerificationEnabled);
  if (sundayIsOffDay !== undefined) store.settings.sundayIsOffDay = Boolean(sundayIsOffDay);

  saveStore();
  emitBrandingUpdated(store.settings);

  return res.json({ success: true, settings: store.settings });
});

router.post('/admin/settings/branding', authenticateAdmin, (req: Request, res: Response) => {
  const store = getStore();
  const { websiteName, tagline, logoUrl, mobileLogoUrl, whatsappNumber, themePrimaryColor, footerText, withdrawOpeningHour, withdrawClosingHour, withdrawGloballyEnabled, isWithdrawDisabled, allowFreeUserWithdrawal, hybridDepositVerificationEnabled, sundayIsOffDay } = req.body;

  if (websiteName !== undefined) store.settings.websiteName = websiteName;
  if (tagline !== undefined) store.settings.tagline = tagline;
  if (logoUrl !== undefined) store.settings.logoUrl = logoUrl;
  if (mobileLogoUrl !== undefined) store.settings.mobileLogoUrl = mobileLogoUrl;
  if (whatsappNumber !== undefined) store.settings.whatsappNumber = whatsappNumber;
  if (themePrimaryColor !== undefined) store.settings.themePrimaryColor = themePrimaryColor;
  if (footerText !== undefined) store.settings.footerText = footerText;
  if (withdrawOpeningHour !== undefined) store.settings.withdrawOpeningHour = Number(withdrawOpeningHour);
  if (withdrawClosingHour !== undefined) store.settings.withdrawClosingHour = Number(withdrawClosingHour);
  if (withdrawGloballyEnabled !== undefined) store.settings.withdrawGloballyEnabled = Boolean(withdrawGloballyEnabled);
  if (isWithdrawDisabled !== undefined) store.settings.isWithdrawDisabled = Boolean(isWithdrawDisabled);
  if (allowFreeUserWithdrawal !== undefined) store.settings.allowFreeUserWithdrawal = Boolean(allowFreeUserWithdrawal);
  if (hybridDepositVerificationEnabled !== undefined) store.settings.hybridDepositVerificationEnabled = Boolean(hybridDepositVerificationEnabled);
  if (sundayIsOffDay !== undefined) store.settings.sundayIsOffDay = Boolean(sundayIsOffDay);

  saveStore();
  emitBrandingUpdated(store.settings);

  return res.json({ success: true, settings: store.settings });
});

// Toggle Free User Withdraw Permission by user ID
router.post('/admin/users/:id/toggle-free-withdraw', authenticateAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).user;
  const store = getStore();
  const user = store.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.freeWithdrawAllowed = !user.freeWithdrawAllowed;

  store.activityLogs.push({
    id: `log_${Date.now()}`,
    adminId: adminUser.id,
    adminName: adminUser.name || 'Admin',
    action: `Toggle Free Withdraw: ${user.freeWithdrawAllowed ? 'Enabled' : 'Disabled'}`,
    target: user.phone,
    details: `Free withdrawal permission ${user.freeWithdrawAllowed ? 'granted' : 'revoked'} for ${user.phone}`,
    timestamp: new Date().toISOString(),
  });

  if (user.freeWithdrawAllowed) {
    store.notifications.push({
      id: `notif_${Date.now()}`,
      userId: user.id,
      type: 'withdraw',
      title: 'Free Withdrawal Permission Granted!',
      message: 'Admin has enabled withdrawal permission for your free account. You can now request your withdrawal.',
      isRead: false,
      createdAt: new Date().toISOString(),
    });
    emitNotificationNew(user.id, store.notifications[store.notifications.length - 1]);
  }

  saveStore();
  emitAdminDashboardUpdated();

  return res.json({
    success: true,
    message: `Free withdrawal permission ${user.freeWithdrawAllowed ? 'enabled' : 'disabled'} for ${user.phone}`,
    freeWithdrawAllowed: user.freeWithdrawAllowed,
  });
});

router.post('/admin/settings/cloudinary', authenticateAdmin, (req: Request, res: Response) => {
  const store = getStore();
  const { cloudName, apiKey, apiSecret } = req.body;

  if (cloudName) store.cloudinarySettings.cloudName = cloudName;
  if (apiKey) store.cloudinarySettings.apiKey = apiKey;
  if (apiSecret) store.cloudinarySettings.apiSecret = apiSecret;
  store.cloudinarySettings.isConfigured = Boolean(cloudName && apiKey);

  saveStore();
  return res.json({ success: true, cloudinarySettings: store.cloudinarySettings });
});

// 12. Fraud & Device Security Dashboard
router.get('/admin/fraud-dashboard', authenticateAdmin, (req: Request, res: Response) => {
  const store = getStore();
  return res.json({
    deviceRecords: store.deviceFingerprints,
    trialWithdrawalCount: store.deviceFingerprints.filter(d => d.trialWithdrawalCompleted).length,
    multiAccountDevices: store.deviceFingerprints.filter(d => d.associatedUserIds.length > 1),
  });
});

// 13. Audit & Activity Logs
router.get('/admin/activity-logs', authenticateAdmin, (req: Request, res: Response) => {
  const store = getStore();
  return res.json({ logs: store.activityLogs.slice(-100).reverse() });
});

export default router;
