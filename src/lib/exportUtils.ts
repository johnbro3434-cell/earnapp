/**
 * EarnHub BD V20 — Enterprise CSV & Excel Data Export Utility
 */

export function downloadCSV(filename: string, headers: string[], rows: (string | number | boolean | null | undefined)[][]) {
  const sanitizeCell = (cell: string | number | boolean | null | undefined): string => {
    if (cell === null || cell === undefined) return '""';
    const str = String(cell).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent = [
    headers.map(sanitizeCell).join(','),
    ...rows.map(row => row.map(sanitizeCell).join(','))
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportUsersToCSV(users: any[]) {
  const headers = ['User ID', 'Phone Number', 'Name', 'Role', 'Status', 'Wallet Balance', 'Total Income', 'Current Package', 'Trial Day', 'Trial Withdraw Completed', 'Referral Code', 'Referred By', 'Registered At'];
  const rows = users.map(u => [
    u.id,
    u.phone,
    u.name || 'N/A',
    u.role || 'user',
    u.isBanned ? 'Banned' : u.isSuspended ? 'Suspended' : 'Active',
    u.balance || 0,
    u.totalEarned || 0,
    u.currentPackage?.name || 'Free Trial',
    u.trialDay || 1,
    u.trialWithdrawCompleted ? 'Yes' : 'No',
    u.referralCode || 'N/A',
    u.referredBy || 'None',
    u.createdAt || 'N/A'
  ]);
  downloadCSV('earnhub_users_crm', headers, rows);
}

export function exportDepositsToCSV(deposits: any[]) {
  const headers = ['Deposit ID', 'User ID', 'Phone', 'Amount (BDT)', 'Gateway', 'Assigned Number', 'Sender Number', 'Transaction ID', 'Status', 'Submitted At', 'Reviewed At', 'Reviewed By'];
  const rows = deposits.map(d => [
    d.id,
    d.userId,
    d.userPhone || 'N/A',
    d.amount,
    d.paymentMethod,
    d.assignedNumber || 'N/A',
    d.senderNumber,
    d.transactionId,
    d.status,
    d.createdAt,
    d.reviewedAt || 'N/A',
    d.reviewedBy || 'N/A'
  ]);
  downloadCSV('earnhub_deposits_ledger', headers, rows);
}

export function exportWithdrawalsToCSV(withdrawals: any[]) {
  const headers = ['Withdraw ID', 'User ID', 'Phone', 'Gross Amount (BDT)', 'Fee (10%)', 'Net Payable (BDT)', 'Payment Method', 'Recipient Account', 'Status', 'Trial Withdrawal', 'Created At', 'Updated At'];
  const rows = withdrawals.map(w => [
    w.id,
    w.userId,
    w.userPhone || 'N/A',
    w.amount,
    w.fee || (w.amount * 0.10),
    w.netAmount || (w.amount * 0.90),
    w.paymentMethod,
    w.withdrawNumber,
    w.status,
    w.isTrialWithdraw ? 'Yes' : 'No',
    w.createdAt,
    w.updatedAt || 'N/A'
  ]);
  downloadCSV('earnhub_withdrawals_records', headers, rows);
}

export function exportWalletLedgerToCSV(ledgerEntries: any[]) {
  const headers = ['Ledger ID', 'User ID', 'Transaction Type', 'Amount (BDT)', 'Balance Before (BDT)', 'Balance After (BDT)', 'Reason / Reference', 'Status', 'Created By', 'Timestamp'];
  const rows = ledgerEntries.map(l => [
    l.id,
    l.userId,
    l.transactionType,
    l.amount,
    l.balanceBefore,
    l.balanceAfter,
    l.reason || l.referenceId || 'N/A',
    l.status,
    l.createdBy,
    l.createdAt
  ]);
  downloadCSV('earnhub_wallet_transactions_ledger', headers, rows);
}

export function exportAuditLogsToCSV(auditLogs: any[]) {
  const headers = ['Audit ID', 'Admin ID / Actor', 'Action', 'Target Type', 'Target ID', 'Details', 'IP Address', 'Timestamp'];
  const rows = auditLogs.map(a => [
    a.id,
    a.adminId || a.performedBy || 'System',
    a.action,
    a.targetType || 'N/A',
    a.targetId || 'N/A',
    a.details || a.reason || 'N/A',
    a.ip || 'N/A',
    a.timestamp || a.createdAt
  ]);
  downloadCSV('earnhub_audit_logs', headers, rows);
}
