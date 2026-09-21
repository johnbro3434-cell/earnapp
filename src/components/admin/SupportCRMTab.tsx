import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  Send,
  User,
  Shield,
  Phone,
  RefreshCw,
  Tag,
  Paperclip,
  X,
  ExternalLink,
} from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { SupportTicket, SupportMessage } from '../../types';
import { ImageUploadInput } from '../common/ImageUploadInput';

interface SupportCRMTabProps {
  onSelectUser?: (phone: string) => void;
}

export function SupportCRMTab({ onSelectUser }: SupportCRMTabProps) {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected ticket for chat thread
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyAttachment, setReplyAttachment] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await apiRequest(`/api/admin/support/tickets?${params.toString()}`);
      if (res && res.tickets) {
        setTickets(res.tickets);
        // If there's an open ticket, update its reference
        if (selectedTicket) {
          const updated = res.tickets.find((t: SupportTicket) => t.id === selectedTicket.id);
          if (updated) setSelectedTicket(updated);
        }
      }
    } catch (err: any) {
      showToast('error', 'Fetch Failed', err.message || 'Could not load support tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, priorityFilter]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    try {
      setSendingReply(true);
      const res = await apiRequest(`/api/admin/support/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        body: JSON.stringify({
          message: replyText.trim(),
          attachmentUrl: replyAttachment || undefined,
        }),
      });

      if (res && res.ticket) {
        setSelectedTicket(res.ticket);
        setReplyText('');
        setReplyAttachment('');
        showToast('success', 'Reply Sent', 'Live notification dispatched to user.');
        fetchTickets();
      }
    } catch (err: any) {
      showToast('error', 'Send Error', err.message || 'Failed to send reply.');
    } finally {
      setSendingReply(false);
    }
  };

  const handleUpdateStatus = async (status: 'open' | 'in_progress' | 'resolved' | 'closed') => {
    if (!selectedTicket) return;
    try {
      setStatusUpdating(true);
      const res = await apiRequest(`/api/admin/support/tickets/${selectedTicket.id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
      if (res && res.ticket) {
        setSelectedTicket(res.ticket);
        showToast('success', 'Status Updated', `Ticket marked as ${status.replace('_', ' ')}.`);
        fetchTickets();
      }
    } catch (err: any) {
      showToast('error', 'Update Failed', err.message || 'Could not update ticket status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'high':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'medium':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'in_progress':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'resolved':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'closed':
        return 'bg-slate-700/50 text-slate-400 border-slate-600';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Support Ticket CRM</h2>
              <p className="text-xs text-slate-400">
                Live customer support, real-time query resolution, and member assistance
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTickets}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 font-semibold text-xs flex items-center gap-2 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchTickets()}
            placeholder="Search phone, ticket #, subject..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Ticket Statuses</option>
            <option value="open">Open (Needs Attention)</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-300">
          <span>Tickets ({tickets.length})</span>
          <span className="text-slate-500">Click any ticket to open live response thread</span>
        </div>

        {loading && tickets.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
            <span>Loading support tickets...</span>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No support tickets match the selected filters.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60 max-h-[600px] overflow-y-auto">
            {tickets.map((t) => {
              const lastMsg = t.messages?.[t.messages.length - 1];
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={`p-4 transition cursor-pointer hover:bg-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    selectedTicket?.id === t.id ? 'bg-amber-500/10 border-l-4 border-amber-500' : ''
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-amber-400">#{t.id}</span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${getPriorityBadge(t.priority)}`}>
                        {t.priority}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${getStatusBadge(t.status)}`}>
                        {t.status.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium">
                        {t.category}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white truncate">{t.subject}</h3>
                    {lastMsg && (
                      <p className="text-xs text-slate-400 truncate">
                        <span className="text-slate-500 font-medium">{lastMsg.senderType === 'admin' ? 'Support: ' : 'User: '}</span>
                        {lastMsg.message}
                      </p>
                    )}
                  </div>

                  <div className="flex md:flex-col items-start md:items-end justify-between shrink-0 text-[11px] text-slate-500 gap-1">
                    <div className="flex items-center gap-1.5 text-slate-300 font-mono font-medium">
                      <Phone className="w-3.5 h-3.5 text-amber-400" />
                      <span>{t.userPhone}</span>
                    </div>
                    <span>{new Date(t.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ticket Response Modal / Drawer */}
      {selectedTicket && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold text-amber-400">Ticket #{selectedTicket.id}</span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${getPriorityBadge(selectedTicket.priority)}`}>
                    {selectedTicket.priority}
                  </span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${getStatusBadge(selectedTicket.status)}`}>
                    {selectedTicket.status.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="text-base font-black text-white">{selectedTicket.subject}</h3>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    {selectedTicket.userPhone}
                  </span>
                  <span>•</span>
                  <span>Category: {selectedTicket.category}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedTicket(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Status Bar */}
            <div className="py-3 px-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
              <span className="text-xs text-slate-400 font-semibold">Change Status:</span>
              <div className="flex items-center gap-1.5">
                {(['open', 'in_progress', 'resolved', 'closed'] as const).map((st) => (
                  <button
                    key={st}
                    disabled={statusUpdating || selectedTicket.status === st}
                    onClick={() => handleUpdateStatus(st)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase transition cursor-pointer ${
                      selectedTicket.status === st
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Thread Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 my-2">
              {selectedTicket.messages?.map((msg) => {
                const isAdmin = msg.senderType === 'admin';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400">
                      {isAdmin ? (
                        <>
                          <span className="font-bold text-amber-400">{msg.senderName}</span>
                          <Shield className="w-3 h-3 text-amber-400" />
                        </>
                      ) : (
                        <>
                          <User className="w-3 h-3 text-emerald-400" />
                          <span className="font-bold text-emerald-400">{msg.senderName}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                        isAdmin
                          ? 'bg-amber-500/10 border border-amber-500/30 text-amber-100 rounded-br-sm'
                          : 'bg-slate-800 border border-slate-700 text-slate-100 rounded-bl-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                      {msg.attachmentUrl && (
                        <div className="mt-2.5 pt-2 border-t border-slate-700/50">
                          <a
                            href={msg.attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-[11px] text-amber-400 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>View Attachment</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Form */}
            <form onSubmit={handleSendReply} className="pt-3 border-t border-slate-800 space-y-3 shrink-0">
              <div className="relative">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your official support response to the member..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex-1 max-w-sm">
                  <ImageUploadInput
                    label="Attach Screenshot (Cloudinary)"
                    value={replyAttachment}
                    onChange={setReplyAttachment}
                    folder="support_attachments"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sendingReply || !replyText.trim()}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-amber-950/30 cursor-pointer self-end"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingReply ? 'Sending...' : 'Send Live Reply'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
