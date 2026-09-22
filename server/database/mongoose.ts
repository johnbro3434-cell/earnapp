/**
 * EarnHub BD V20 — MongoDB Atlas Connection & Schema Models
 * Seamless connection to MongoDB Atlas with Graceful Local Store Fallback
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL || '';

let isConnected = false;

export async function connectMongoDB(): Promise<boolean> {
  if (isConnected) return true;
  if (!MONGODB_URI) {
    console.log('[Database] MONGODB_URI not set. Using enterprise local file persistence engine.');
    return false;
  }

  try {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    };
    await mongoose.connect(MONGODB_URI, opts);
    isConnected = true;
    console.log('[Database] Successfully connected to MongoDB Atlas cluster.');
    return true;
  } catch (err) {
    console.error('[Database] MongoDB Atlas connection error. Falling back to local persistence:', err);
    isConnected = false;
    return false;
  }
}

export function isMongoConnected(): boolean {
  return isConnected;
}

// User Mongoose Schema
const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  phone: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  name: { type: String },
  role: { type: String, default: 'user' },
  balance: { type: Number, default: 0 },
  totalEarned: { type: Number, default: 0 },
  referralCode: { type: String, unique: true, index: true },
  referredBy: { type: String },
  trialDay: { type: Number, default: 1 },
  trialStartDate: { type: String },
  trialCompleted: { type: Boolean, default: false },
  trialWithdrawCompleted: { type: Boolean, default: false },
  freeWithdrawAllowed: { type: Boolean, default: false },
  currentPackage: { type: Object, default: null },
  isBanned: { type: Boolean, default: false },
  isSuspended: { type: Boolean, default: false },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
});

export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);

// Wallet Transaction Ledger Mongoose Schema
const WalletTransactionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  transactionType: { type: String, required: true },
  amount: { type: Number, required: true },
  balanceBefore: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  reason: { type: String },
  referenceId: { type: String },
  createdBy: { type: String, default: 'system' },
  status: { type: String, default: 'completed' },
  createdAt: { type: String, default: () => new Date().toISOString(), index: true }
});

export const WalletTransactionModel = mongoose.models.WalletTransaction || mongoose.model('WalletTransaction', WalletTransactionSchema);

// Deposit Mongoose Schema
const DepositSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  userPhone: { type: String },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  senderNumber: { type: String, required: true },
  receiverNumber: { type: String },
  transactionId: { type: String, required: true, index: true },
  screenshotUrl: { type: String },
  status: { type: String, default: 'pending', index: true },
  reviewedBy: { type: String },
  reviewedAt: { type: String },
  createdAt: { type: String, default: () => new Date().toISOString() }
});

export const DepositModel = mongoose.models.Deposit || mongoose.model('Deposit', DepositSchema);

// Withdraw Mongoose Schema
const WithdrawSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  userPhone: { type: String },
  amount: { type: Number, required: true },
  fee: { type: Number, required: true },
  netAmount: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  withdrawNumber: { type: String, required: true, index: true },
  status: { type: String, default: 'pending', index: true },
  isTrialWithdraw: { type: Boolean, default: false },
  deviceFingerprint: { type: String },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
});

export const WithdrawModel = mongoose.models.Withdrawal || mongoose.model('Withdrawal', WithdrawSchema);
