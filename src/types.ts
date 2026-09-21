export type UserRole = 'Member' | 'Manager' | 'Middle Manager' | 'Senior Manager' | 'VIP';

export type AdminRole = 'Main Admin' | 'Manager Admin' | 'Finance Admin' | 'Marketing Admin' | 'Support Admin';

export interface User {
  id: string;
  phone: string;
  passwordHash?: string;
  role: UserRole;
  referralCode: string;
  referredBy?: string;
  createdAt: string;
  status: 'active' | 'suspended';
  
  // Free Trial System
  isTrial: boolean;
  trialStartDate?: string;
  trialDaysUsed: number;
  trialTotalEarned: number;
  trialMissedDays: number;
  trialExpired: boolean;
  freeWithdrawAllowed?: boolean; // Admin can permit individual free user to withdraw
  
  // Active Package
  activePackageId?: string;
  packageActivatedAt?: string;
  
  // Security & Withdraw Setup (LOCKED - Once set, cannot edit)
  withdrawSetupDone: boolean;
  withdrawMethod?: 'bKash' | 'Nagad';
  withdrawNumber?: string;
  withdrawPasswordHash?: string;
  
  deviceFingerprint: string;
  isBanned?: boolean;
  deviceUsedFreeTrial?: boolean;
  lastLoginIp?: string;
  lastLoginAt?: string;
  uplineInfo?: {
    referralCode: string;
    phone?: string;
    role?: string;
  };
}

export interface Wallet {
  userId: string;
  balance: number;
  totalDeposit: number;
  totalWithdraw: number;
  totalEarned: number;
  todayIncome: number;
  referralIncome: number;
  giftIncome: number;
  salaryIncome: number;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdraw' | 'task_reward' | 'referral_bonus' | 'package_purchase' | 'salary' | 'gift' | 'promo_code';
  amount: number;
  fee?: number;
  description: string;
  balanceAfter: number;
  createdAt: string;
  referenceId?: string;
}

export interface Package {
  id: string;
  name: string;
  price: number; // in TK
  dailyIncome: number; // in TK
  videosPerDay: number;
  incomePerVideo: number; // in TK
  validityDays: number;
  badgeColor: string;
  enabled: boolean;
  isPopular?: boolean;
}

export interface DepositRequest {
  id: string;
  userId: string;
  userPhone: string;
  amount: number;
  paymentMethod: 'bKash' | 'Nagad';
  assignedNumber: string;
  senderNumber: string;
  transactionId: string;
  screenshotUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  verificationType: 'manual' | 'hybrid';
  rejectedReason?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface WithdrawRequest {
  id: string;
  userId: string;
  userPhone: string;
  amount: number; // Gross amount
  fee: number; // 10%
  netAmount: number; // 90%
  paymentMethod: 'bKash' | 'Nagad';
  withdrawNumber: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  isTrialWithdraw?: boolean;
  deviceFingerprint: string;
  rejectedReason?: string;
  createdAt: string;
  updatedAt: string;
  timeline: {
    step: 'pending' | 'approved' | 'paid' | 'rejected';
    timestamp: string;
    note?: string;
  }[];
}

export interface VideoTask {
  id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl: string;
  durationSeconds: number; // LOCKED: 10 Seconds
  rewardAmount: number;
  category: string;
  requiredPackageId?: string;
  enabled?: boolean;
  createdAt?: string;
}

export interface TaskHistory {
  id: string;
  userId: string;
  taskId: string;
  packageId: string;
  rewardEarned: number;
  completedAt: string;
  ipAddress?: string;
}

export interface PaymentNumber {
  id: string;
  method: 'bKash' | 'Nagad';
  number: string;
  accountType: 'Personal' | 'Agent' | 'Merchant';
  type?: string;
  isActive: boolean;
  usageCount: number;
  dailyLimit: number;
  currentDailyVolume: number;
}

export interface ReferralNode {
  userId: string;
  phone: string;
  role: UserRole;
  level: 'A' | 'B' | 'C';
  joinedAt: string;
  activePackageName?: string;
  commissionEarnedForUpline: number;
}

export interface ReferralCommission {
  id: string;
  fromUserId: string;
  fromUserPhone: string;
  toUserId: string;
  level: 'A' | 'B' | 'C';
  type: 'deposit_bonus' | 'video_commission' | 'package_bonus';
  percentage: number;
  commissionAmount: number;
  createdAt: string;
}

export interface PromoCode {
  id: string;
  code: string;
  rewardAmount: number;
  maxUsage: number;
  currentUsage: number;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  bannerUrl: string;
  type: 'popup' | 'banner' | 'festival';
  targetUrl?: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

export interface Holiday {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  reason: string;
  tasksDisabled: boolean;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: 'deposit' | 'withdraw' | 'referral' | 'task' | 'gift' | 'salary' | 'campaign' | 'holiday';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface PromotionCampaign {
  id: string;
  title: string;
  description: string;
  bannerUrl: string;
  code: string;
  rewardAmount: number;
  isActive: boolean;
}

export interface WebsiteSettings {
  websiteName: string;
  tagline: string;
  logoUrl: string;
  mobileLogoUrl: string;
  whatsappNumber: string;
  telegramGroupUrl?: string;
  telegramChannelUrl?: string;
  facebookGroupUrl?: string;
  youtubeTutorialUrl?: string;
  appDownloadUrl?: string;
  marqueeNotice?: string;
  themePrimaryColor: string;
  footerText: string;
  minDepositAmount?: number;
  maxDepositAmount?: number;
  minWithdrawAmount?: number;
  maxWithdrawAmount?: number;
  withdrawFeePercentage?: number;
  signupBonusAmount?: number;
  withdrawOpeningHour: number; // e.g. 8
  withdrawClosingHour: number; // e.g. 23
  withdrawStartHour?: number;
  withdrawEndHour?: number;
  withdrawGloballyEnabled: boolean;
  isWithdrawDisabled?: boolean;
  allowFreeUserWithdrawal?: boolean; // When true, all free users can withdraw funds; when false, free users need permission or package
  hybridDepositVerificationEnabled: boolean;
  maintenanceMode?: boolean;
  levelAPercentage: number; // e.g. 10
  levelBPercentage: number; // e.g. 5
  levelCPercentage: number; // e.g. 2
  dailyTaskResetHour: number; // 0 = 12:00 AM
  sundayIsOffDay: boolean;
  cloudinaryCloudName?: string;
  cloudinaryApiKey?: string;
  cloudinaryApiSecret?: string;
  cloudinaryUploadPreset?: string;
}

export interface CloudinarySettings {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  uploadPreset?: string;
  isConfigured: boolean;
}

export interface AdminUser {
  id: string;
  phone: string;
  name: string;
  role: AdminRole;
  passwordHash: string;
  permissions: string[];
  status?: 'active' | 'disabled';
  email?: string;
  lastLoginAt?: string;
  createdAt?: string;
}

export interface ActivityLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  target: string;
  details: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  ip?: string;
  timestamp: string;
}

export interface DeviceFingerprintRecord {
  deviceFingerprint: string;
  associatedUserIds: string[];
  trialWithdrawalCompleted: boolean;
  trialWithdrawalDate?: string;
  trialWithdrawalAmount?: number;
  lastSeenIp: string;
  lastSeenAt: string;
}

export interface SupportMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'user' | 'admin';
  message: string;
  attachmentUrl?: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userPhone: string;
  subject: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  messages: SupportMessage[];
}

export interface HomeSlider {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  buttonText?: string;
  buttonLink?: string;
  startDate?: string;
  endDate?: string;
  status: 'active' | 'inactive';
  sortOrder: number;
  createdAt: string;
}

export interface RoleDefinition {
  id: string;
  roleName: AdminRole | string;
  description: string;
  permissions: string[];
  userCount?: number;
}

export interface SystemHealthInfo {
  serverStatus: 'healthy' | 'degraded' | 'offline';
  uptimeSeconds: number;
  uptimeFormatted: string;
  nodeVersion: string;
  memoryUsageMb: number;
  heapUsedMb: number;
  totalMemoryMb: number;
  socketConnections: number;
  cloudinaryStatus: 'connected' | 'unconfigured' | 'error';
  databaseStatus: 'connected' | 'syncing' | 'error';
  lastBackupAt?: string;
  timestamp: string;
}
