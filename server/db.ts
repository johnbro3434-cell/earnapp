import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  Wallet,
  Transaction,
  Package,
  DepositRequest,
  WithdrawRequest,
  VideoTask,
  TaskHistory,
  PaymentNumber,
  ReferralCommission,
  PromoCode,
  Campaign,
  Holiday,
  AppNotification,
  WebsiteSettings,
  CloudinarySettings,
  AdminUser,
  ActivityLog,
  DeviceFingerprintRecord,
  SupportTicket,
  HomeSlider,
  RoleDefinition,
} from '../src/types';

const DATA_FILE = path.join(process.cwd(), 'data', 'store.json');

export interface StoreData {
  users: User[];
  wallets: Wallet[];
  transactions: Transaction[];
  packages: Package[];
  deposits: DepositRequest[];
  withdraws: WithdrawRequest[];
  videoTasks: VideoTask[];
  taskHistories: TaskHistory[];
  paymentNumbers: PaymentNumber[];
  referralCommissions: ReferralCommission[];
  promoCodes: PromoCode[];
  campaigns: Campaign[];
  holidays: Holiday[];
  notifications: AppNotification[];
  settings: WebsiteSettings;
  cloudinarySettings: CloudinarySettings;
  adminUsers: AdminUser[];
  activityLogs: ActivityLog[];
  deviceFingerprints: DeviceFingerprintRecord[];
  supportTickets: SupportTicket[];
  sliders: HomeSlider[];
  roles: RoleDefinition[];
}

const defaultPackages: Package[] = [
  {
    id: 'pkg_trial',
    name: 'Free Trial',
    price: 0,
    dailyIncome: 25,
    videosPerDay: 1,
    incomePerVideo: 25,
    validityDays: 4,
    badgeColor: 'emerald',
    enabled: true,
  },
  {
    id: 'pkg_bronze',
    name: 'Bronze',
    price: 2500,
    dailyIncome: 80,
    videosPerDay: 4,
    incomePerVideo: 20,
    validityDays: 365,
    badgeColor: 'amber',
    enabled: true,
  },
  {
    id: 'pkg_golden',
    name: 'Golden',
    price: 7500,
    dailyIncome: 250,
    videosPerDay: 10,
    incomePerVideo: 25,
    validityDays: 365,
    badgeColor: 'yellow',
    enabled: true,
    isPopular: true,
  },
  {
    id: 'pkg_diamond',
    name: 'Diamond',
    price: 22500,
    dailyIncome: 750,
    videosPerDay: 15,
    incomePerVideo: 50,
    validityDays: 365,
    badgeColor: 'cyan',
    enabled: true,
  },
  {
    id: 'pkg_platinum',
    name: 'Platinum',
    price: 58000,
    dailyIncome: 2500,
    videosPerDay: 25,
    incomePerVideo: 100,
    validityDays: 365,
    badgeColor: 'purple',
    enabled: true,
  },
  {
    id: 'pkg_vip1',
    name: 'VIP1 Enterprise',
    price: 120000,
    dailyIncome: 5000,
    videosPerDay: 40,
    incomePerVideo: 125,
    validityDays: 365,
    badgeColor: 'rose',
    enabled: true,
  },
  {
    id: 'pkg_vip2',
    name: 'VIP2 Sovereign',
    price: 250000,
    dailyIncome: 12000,
    videosPerDay: 60,
    incomePerVideo: 200,
    validityDays: 365,
    badgeColor: 'indigo',
    enabled: true,
  },
];

const defaultPaymentNumbers: PaymentNumber[] = [
  {
    id: 'num_bkash_1',
    method: 'bKash',
    number: '01712345678',
    accountType: 'Personal',
    isActive: true,
    usageCount: 142,
    dailyLimit: 200000,
    currentDailyVolume: 35000,
  },
  {
    id: 'num_bkash_2',
    method: 'bKash',
    number: '01798765432',
    accountType: 'Agent',
    isActive: true,
    usageCount: 98,
    dailyLimit: 300000,
    currentDailyVolume: 62000,
  },
  {
    id: 'num_nagad_1',
    method: 'Nagad',
    number: '01811223344',
    accountType: 'Personal',
    isActive: true,
    usageCount: 110,
    dailyLimit: 200000,
    currentDailyVolume: 28000,
  },
  {
    id: 'num_nagad_2',
    method: 'Nagad',
    number: '01899887766',
    accountType: 'Agent',
    isActive: true,
    usageCount: 75,
    dailyLimit: 300000,
    currentDailyVolume: 49000,
  },
];

const defaultVideoTasks: VideoTask[] = [
  {
    id: 'task_vid_1',
    title: 'Smart Tech BD Brand Spotlight 2026',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-code-screen-close-up-34241-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 10,
    rewardAmount: 25,
    category: 'Technology & AI',
  },
  {
    id: 'task_vid_2',
    title: 'Green Agro Bangladesh Eco Project',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-working-on-a-computer-keyboard-40647-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 10,
    rewardAmount: 25,
    category: 'Sustainability',
  },
  {
    id: 'task_vid_3',
    title: 'Digital Commerce Dhaka Logistics Review',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-finger-pointing-at-a-screen-with-graphs-34242-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 10,
    rewardAmount: 25,
    category: 'E-Commerce',
  },
  {
    id: 'task_vid_4',
    title: 'Fintech Innovation bKash & Nagad Integration',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-screens-with-financial-data-28120-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 10,
    rewardAmount: 25,
    category: 'Fintech BD',
  },
  {
    id: 'task_vid_5',
    title: 'Enterprise Cloud Solutions Overview',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-typing-on-a-laptop-keyboard-close-up-40646-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 10,
    rewardAmount: 25,
    category: 'Enterprise IT',
  },
];

const defaultCampaigns: Campaign[] = [
  {
    id: 'camp_1',
    title: 'Grand Eid-ul-Fitr Mega Deposit Bonus 15%',
    description: 'Deposit 2,500 TK or more to receive an instant 15% wallet credit top-up! Limited to the first 5,000 users.',
    bannerUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&auto=format&fit=crop&q=80',
    type: 'banner',
    isActive: true,
    startDate: '2026-03-01',
    endDate: '2026-04-15',
  },
  {
    id: 'camp_2',
    title: 'Ramadan Daily Bonus Celebration',
    description: 'Complete all video tasks before 6:00 PM every day to enter the daily 500 TK cash pool!',
    bannerUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&auto=format&fit=crop&q=80',
    type: 'popup',
    isActive: true,
    startDate: '2026-03-10',
    endDate: '2026-04-10',
  },
];

const defaultSettings: WebsiteSettings = {
  websiteName: 'EarnHub BD V20 Enterprise',
  tagline: 'Leading Digital Micro-Task Earning Ecosystem in Bangladesh',
  logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
  mobileLogoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
  whatsappNumber: '+8801700112233',
  telegramGroupUrl: 'https://t.me/earnhub_bd_group',
  telegramChannelUrl: 'https://t.me/earnhub_bd_official',
  facebookGroupUrl: 'https://facebook.com/groups/earnhubbd',
  youtubeTutorialUrl: 'https://youtube.com/watch?v=earnhubbd_guide',
  appDownloadUrl: 'https://earnhub-bd.com/download/app.apk',
  marqueeNotice: '🔥 EarnHub BD V20 Enterprise - প্রতিদিন ১০ সেকেন্ড ভিডিও দেখে ইনকাম করুন! নতুন মেম্বারদের জন্য ফ্রি ট্রায়াল চালু রয়েছে। যেকোনো সহায়তায় আমাদের হোয়াটসঅ্যাপে যোগাযোগ করুন।',
  themePrimaryColor: '#059669', // Emerald Green BD
  footerText: '© 2026 EarnHub BD V20 Enterprise Ltd. Registered in Dhaka, Bangladesh. All Rights Reserved.',
  minDepositAmount: 500,
  maxDepositAmount: 100000,
  minWithdrawAmount: 300,
  maxWithdrawAmount: 50000,
  withdrawFeePercentage: 10,
  signupBonusAmount: 50,
  withdrawOpeningHour: 8, // 8:00 AM
  withdrawClosingHour: 23, // 11:00 PM
  withdrawStartHour: 8,
  withdrawEndHour: 23,
  withdrawGloballyEnabled: true,
  isWithdrawDisabled: false,
  allowFreeUserWithdrawal: false, // Default is false: free users cannot withdraw without permission
  hybridDepositVerificationEnabled: false, // Default is OFF as mandated!
  maintenanceMode: false,
  levelAPercentage: 10,
  levelBPercentage: 5,
  levelCPercentage: 2,
  dailyTaskResetHour: 0, // 12:00 AM midnight
  sundayIsOffDay: true, // Default Sunday off day as mandated!
};

const defaultCloudinary: CloudinarySettings = {
  cloudName: 'earnhub-bd-v20',
  apiKey: '839219842148123',
  apiSecret: '****************',
  isConfigured: true,
};

const defaultRoles: RoleDefinition[] = [
  {
    id: 'role_main_admin',
    roleName: 'Main Admin',
    description: 'Full Master Access to All Financial, CRM, Tasks, Security, and System Settings',
    permissions: ['all', 'dashboard', 'users', 'deposits', 'withdrawals', 'wallet', 'packages', 'tasks', 'referrals', 'salary', 'campaigns', 'promocodes', 'gifts', 'holidays', 'sliders', 'notifications', 'analytics', 'security', 'payment_numbers', 'cloudinary', 'branding', 'settings', 'admin_users', 'roles', 'activity_logs', 'support', 'system_health'],
    userCount: 2,
  },
  {
    id: 'role_manager_admin',
    roleName: 'Manager Admin',
    description: 'User CRM, Team Referrals, Monthly Salary distribution, and Member verification',
    permissions: ['dashboard', 'users', 'referrals', 'salary', 'activity_logs', 'support'],
    userCount: 1,
  },
  {
    id: 'role_finance_admin',
    roleName: 'Finance Admin',
    description: 'Deposits review, Withdrawals approvals, Wallet adjustments, Payment Numbers pool',
    permissions: ['dashboard', 'deposits', 'withdrawals', 'wallet', 'payment_numbers', 'analytics', 'activity_logs'],
    userCount: 1,
  },
  {
    id: 'role_marketing_admin',
    roleName: 'Marketing Admin',
    description: 'Campaign banners, Promo codes, Homepage sliders, Broadcast notifications',
    permissions: ['dashboard', 'campaigns', 'promocodes', 'sliders', 'notifications', 'branding'],
    userCount: 1,
  },
  {
    id: 'role_support_admin',
    roleName: 'Support Admin',
    description: 'User ticket inquiries, Live support messages, Profile lookup, Basic guidance',
    permissions: ['dashboard', 'users', 'support'],
    userCount: 1,
  },
];

const defaultSliders: HomeSlider[] = [
  {
    id: 'slide_1',
    title: 'Earn Daily Micro-Task Rewards in Bangladesh',
    subtitle: 'Watch 10-second sponsor videos and get instant bKash & Nagad payments',
    imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&auto=format&fit=crop&q=80',
    buttonText: 'Start Free Trial',
    buttonLink: '/register',
    status: 'active',
    sortOrder: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'slide_2',
    title: 'Ramadan Mega Bonus & Festival Rewards',
    subtitle: '15% instant deposit cashback and active leader team salary pool',
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&auto=format&fit=crop&q=80',
    buttonText: 'Upgrade Package',
    buttonLink: '/packages',
    status: 'active',
    sortOrder: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'slide_3',
    title: 'Automated Real-Time Micro-Earnings',
    subtitle: 'Guaranteed 10-second timer countdown with transparent ledger transactions',
    imageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1200&auto=format&fit=crop&q=80',
    buttonText: 'View Today Tasks',
    buttonLink: '/tasks',
    status: 'active',
    sortOrder: 3,
    createdAt: new Date().toISOString(),
  },
];

const defaultSupportTickets: SupportTicket[] = [
  {
    id: 'tkt_1001',
    userId: 'user_01711111111',
    userPhone: '01711111111',
    subject: 'Deposit confirmation query for bKash',
    category: 'Deposit',
    priority: 'high',
    status: 'resolved',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000 + 3600000).toISOString(),
    messages: [
      {
        id: 'msg_1',
        senderId: 'user_01711111111',
        senderName: '01711111111',
        senderType: 'user',
        message: 'Hello, I sent 7,500 TK via bKash TrxID BK9A82J1KD. How long will it take to verify?',
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        id: 'msg_2',
        senderId: 'admin_finance_01',
        senderName: 'Fatema Tuz Zohra (Finance Admin)',
        senderType: 'admin',
        message: 'Your deposit has been verified and added to your wallet balance. You can now purchase your Golden Package from the Packages tab.',
        createdAt: new Date(Date.now() - 3 * 86400000 + 1800000).toISOString(),
      },
    ],
  },
  {
    id: 'tkt_1002',
    userId: 'user_01822222222',
    userPhone: '01822222222',
    subject: 'Free trial video task countdown question',
    category: 'Tasks',
    priority: 'medium',
    status: 'open',
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    messages: [
      {
        id: 'msg_3',
        senderId: 'user_01822222222',
        senderName: '01822222222',
        senderType: 'user',
        message: 'Assalamu Alaikum. How many trial days do I have left for earning 25 TK daily?',
        createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
      },
    ],
  },
];

let store: StoreData = {
  users: [],
  wallets: [],
  transactions: [],
  packages: defaultPackages,
  deposits: [],
  withdraws: [],
  videoTasks: defaultVideoTasks,
  taskHistories: [],
  paymentNumbers: defaultPaymentNumbers,
  referralCommissions: [],
  promoCodes: [
    {
      id: 'promo_welcome',
      code: 'WELCOME50',
      rewardAmount: 50,
      maxUsage: 1000,
      currentUsage: 142,
      expiresAt: '2026-12-31',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'promo_eid',
      code: 'EID2026',
      rewardAmount: 100,
      maxUsage: 500,
      currentUsage: 89,
      expiresAt: '2026-05-01',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ],
  campaigns: defaultCampaigns,
  holidays: [
    {
      id: 'hol_1',
      date: '2026-03-26',
      name: 'Independence Day of Bangladesh',
      reason: 'National Holiday: Task server maintenance and community celebration',
      tasksDisabled: true,
    },
    {
      id: 'hol_2',
      date: '2026-04-14',
      name: 'Pohela Boishakh (Bengali New Year)',
      reason: 'Noboborsho Holiday: All micro-tasks paused with holiday gift allowance',
      tasksDisabled: true,
    },
  ],
  notifications: [],
  settings: defaultSettings,
  cloudinarySettings: defaultCloudinary,
  adminUsers: [],
  activityLogs: [],
  deviceFingerprints: [],
  supportTickets: defaultSupportTickets,
  sliders: defaultSliders,
  roles: defaultRoles,
};

// Seed initial users with bcrypt hashes
function initializeSeedData() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(DATA_FILE)) {
    try {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      store = JSON.parse(content);
      if (store.settings && store.settings.allowFreeUserWithdrawal === undefined) {
        store.settings.allowFreeUserWithdrawal = false;
      }
      if (!store.supportTickets || !store.supportTickets.length) {
        store.supportTickets = defaultSupportTickets;
      }
      if (!store.sliders || !store.sliders.length) {
        store.sliders = defaultSliders;
      }
      if (!store.roles || !store.roles.length) {
        store.roles = defaultRoles;
      }
      return;
    } catch (e) {
      console.warn('Could not parse store.json, re-initializing seeds');
    }
  }

  const salt = bcrypt.genSaltSync(10);
  const adminPass = bcrypt.hashSync('admin123', salt);
  const demoAdminPass = bcrypt.hashSync('demo1234', salt);
  const userPass = bcrypt.hashSync('user123', salt);
  const withdrawPass = bcrypt.hashSync('9988', salt);

  // 1. Main Admin user
  const mainAdmin: AdminUser = {
    id: 'admin_main_01',
    phone: '01700000000',
    name: 'Sultan Mahmud (Chief Admin)',
    role: 'Main Admin',
    passwordHash: adminPass,
    permissions: ['all', 'finance', 'users', 'packages', 'marketing', 'settings', 'logs'],
  };

  const financeAdmin: AdminUser = {
    id: 'admin_finance_01',
    phone: '01700000001',
    name: 'Fatema Tuz Zohra (Finance Head)',
    role: 'Finance Admin',
    passwordHash: adminPass,
    permissions: ['finance', 'deposits', 'withdraws', 'passbook'],
  };

  const demoAdmin: AdminUser = {
    id: 'admin_demo_015',
    phone: '01500000000',
    name: 'Demo System Admin',
    role: 'Main Admin',
    passwordHash: demoAdminPass,
    permissions: ['all', 'finance', 'users', 'packages', 'marketing', 'settings', 'logs'],
  };

  // 2. Demo Paid Member User (Bronze)
  const user1: User = {
    id: 'user_01711111111',
    phone: '01711111111',
    passwordHash: userPass,
    role: 'Manager',
    referralCode: 'EHBD1001',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    status: 'active',
    isTrial: false,
    trialDaysUsed: 4,
    trialTotalEarned: 100,
    trialMissedDays: 0,
    trialExpired: true,
    activePackageId: 'pkg_golden',
    packageActivatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    withdrawSetupDone: true,
    withdrawMethod: 'bKash',
    withdrawNumber: '01711111111',
    withdrawPasswordHash: withdrawPass,
    deviceFingerprint: 'fp_desktop_dhaka_01',
    lastLoginIp: '103.205.71.12',
    lastLoginAt: new Date().toISOString(),
  };

  // 3. Demo Free Trial User (Active trial day 2)
  const user2: User = {
    id: 'user_01822222222',
    phone: '01822222222',
    passwordHash: userPass,
    role: 'Member',
    referralCode: 'EHBD2002',
    referredBy: 'EHBD1001',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    status: 'active',
    isTrial: true,
    trialStartDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    trialDaysUsed: 2,
    trialTotalEarned: 50,
    trialMissedDays: 0,
    trialExpired: false,
    activePackageId: 'pkg_trial',
    packageActivatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    withdrawSetupDone: false,
    deviceFingerprint: 'fp_mobile_chittagong_02',
    lastLoginIp: '103.114.98.54',
    lastLoginAt: new Date().toISOString(),
  };

  // 4. Demo Paid Member User (Diamond)
  const user3: User = {
    id: 'user_01933333333',
    phone: '01933333333',
    passwordHash: userPass,
    role: 'Senior Manager',
    referralCode: 'EHBD3003',
    referredBy: 'EHBD1001',
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    status: 'active',
    isTrial: false,
    trialDaysUsed: 4,
    trialTotalEarned: 100,
    trialMissedDays: 0,
    trialExpired: true,
    activePackageId: 'pkg_diamond',
    packageActivatedAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    withdrawSetupDone: true,
    withdrawMethod: 'Nagad',
    withdrawNumber: '01933333333',
    withdrawPasswordHash: withdrawPass,
    deviceFingerprint: 'fp_laptop_sylhet_03',
    lastLoginIp: '103.88.22.91',
    lastLoginAt: new Date().toISOString(),
  };

  // Wallets
  const wallet1: Wallet = {
    userId: user1.id,
    balance: 4850,
    totalDeposit: 15000,
    totalWithdraw: 9200,
    totalEarned: 12450,
    todayIncome: 250,
    referralIncome: 1850,
    giftIncome: 100,
    salaryIncome: 3000,
    updatedAt: new Date().toISOString(),
  };

  const wallet2: Wallet = {
    userId: user2.id,
    balance: 50,
    totalDeposit: 0,
    totalWithdraw: 0,
    totalEarned: 50,
    todayIncome: 25,
    referralIncome: 0,
    giftIncome: 0,
    salaryIncome: 0,
    updatedAt: new Date().toISOString(),
  };

  const wallet3: Wallet = {
    userId: user3.id,
    balance: 18400,
    totalDeposit: 45000,
    totalWithdraw: 32000,
    totalEarned: 48900,
    todayIncome: 750,
    referralIncome: 8600,
    giftIncome: 200,
    salaryIncome: 12000,
    updatedAt: new Date().toISOString(),
  };

  // Initial Deposits
  const initialDeposits: DepositRequest[] = [
    {
      id: 'dep_1001',
      userId: user1.id,
      userPhone: user1.phone,
      amount: 7500,
      paymentMethod: 'bKash',
      assignedNumber: '01712345678',
      senderNumber: '01711111111',
      transactionId: 'BK9A82J1KD',
      screenshotUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop&q=80',
      status: 'approved',
      verificationType: 'manual',
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      reviewedAt: new Date(Date.now() - 10 * 86400000 + 120000).toISOString(),
      reviewedBy: 'Fatema Tuz Zohra',
    },
    {
      id: 'dep_1002',
      userId: user3.id,
      userPhone: user3.phone,
      amount: 22500,
      paymentMethod: 'Nagad',
      assignedNumber: '01811223344',
      senderNumber: '01933333333',
      transactionId: 'NG771900AA',
      screenshotUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
      status: 'approved',
      verificationType: 'manual',
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
      reviewedAt: new Date(Date.now() - 25 * 86400000 + 300000).toISOString(),
      reviewedBy: 'Sultan Mahmud',
    },
  ];

  // Initial Withdraws with LOCKED amounts
  const initialWithdraws: WithdrawRequest[] = [
    {
      id: 'wdr_2001',
      userId: user1.id,
      userPhone: user1.phone,
      amount: 5800,
      fee: 580,
      netAmount: 5220,
      paymentMethod: 'bKash',
      withdrawNumber: '01711111111',
      status: 'paid',
      deviceFingerprint: 'fp_desktop_dhaka_01',
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 86400000 + 3600000).toISOString(),
      timeline: [
        { step: 'pending', timestamp: new Date(Date.now() - 5 * 86400000).toISOString() },
        { step: 'approved', timestamp: new Date(Date.now() - 5 * 86400000 + 1800000).toISOString(), note: 'Verified by Finance Admin' },
        { step: 'paid', timestamp: new Date(Date.now() - 5 * 86400000 + 3600000).toISOString(), note: 'bKash TrxID: BKWDR991823' },
      ],
    },
  ];

  // Device fingerprint record for trial withdrawal
  const deviceRecords: DeviceFingerprintRecord[] = [
    {
      deviceFingerprint: 'fp_desktop_dhaka_01',
      associatedUserIds: [user1.id],
      trialWithdrawalCompleted: true,
      trialWithdrawalDate: new Date(Date.now() - 26 * 86400000).toISOString(),
      trialWithdrawalAmount: 100,
      lastSeenIp: '103.205.71.12',
      lastSeenAt: new Date().toISOString(),
    },
  ];

  // Activity logs
  const logs: ActivityLog[] = [
    {
      id: 'log_01',
      adminId: mainAdmin.id,
      adminName: mainAdmin.name,
      action: 'System Initialization',
      target: 'EarnHub BD V20 Enterprise',
      details: 'Locked specification v20 enterprise deployment initiated with Socket.io real-time engine',
      timestamp: new Date().toISOString(),
    },
  ];

  store = {
    users: [user1, user2, user3],
    wallets: [wallet1, wallet2, wallet3],
    transactions: [
      {
        id: 'tx_01',
        userId: user1.id,
        type: 'deposit',
        amount: 7500,
        description: 'bKash Deposit Approved',
        balanceAfter: 7500,
        createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      },
      {
        id: 'tx_02',
        userId: user1.id,
        type: 'package_purchase',
        amount: -7500,
        description: 'Golden Package Purchase (10 Videos / 250 TK daily)',
        balanceAfter: 0,
        createdAt: new Date(Date.now() - 10 * 86400000 + 60000).toISOString(),
      },
    ],
    packages: defaultPackages,
    deposits: initialDeposits,
    withdraws: initialWithdraws,
    videoTasks: defaultVideoTasks,
    taskHistories: [],
    paymentNumbers: defaultPaymentNumbers,
    referralCommissions: [],
    promoCodes: store.promoCodes,
    campaigns: defaultCampaigns,
    holidays: store.holidays,
    notifications: [
      {
        id: 'notif_welcome',
        userId: user1.id,
        type: 'task',
        title: 'Daily Tasks Reset at 12:00 AM',
        message: 'Your Golden Package video tasks are ready! Complete 10 videos (10s each) to earn 250 TK today.',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ],
    settings: defaultSettings,
    cloudinarySettings: defaultCloudinary,
    adminUsers: [mainAdmin, financeAdmin, demoAdmin],
    activityLogs: logs,
    deviceFingerprints: deviceRecords,
    supportTickets: defaultSupportTickets,
    sliders: defaultSliders,
    roles: defaultRoles,
  };

  saveStore();
}

export function getStore(): StoreData {
  return store;
}

export function saveStore() {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving store:', e);
  }
}

initializeSeedData();
