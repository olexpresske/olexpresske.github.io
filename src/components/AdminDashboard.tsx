import { useState, useEffect, FormEvent } from 'react';
import {
  ShieldAlert,
  Search,
  RotateCw,
  Download,
  Trash2,
  MessageSquare,
  Star,
  ArrowRight,
  Send,
  CheckCircle2,
  Lock,
  Clock,
  Car,
  Eye,
  X,
} from 'lucide-react';
import { Ticket, TicketStatus } from '../types';
import { ticketStore } from '../services/ticketStore';

export function AdminDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>(() => ticketStore.getTickets());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Accepted' | 'In Progress' | 'Completed' | 'No Review'>('All');
  const [dateFilter, setDateFilter] = useState<'Today' | 'Yesterday' | 'This Week' | 'All Time'>('All Time');

  // Comment to Driver modal state
  const [commentModalTicket, setCommentModalTicket] = useState<Ticket | null>(null);
  const [adminMessage, setAdminMessage] = useState('');
  const [commentType, setCommentType] = useState<'Response Required' | 'Info Only'>('Response Required');

  // View Ticket Details modal
  const [viewTicket, setViewTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    const unsub = ticketStore.subscribe(() => {
      setTickets(ticketStore.getTickets());
    });
    return unsub;
  }, []);

  const handleRefresh = () => {
    setTickets(ticketStore.getTickets());
  };

  // Top summary calculations
  const totalRevenue = tickets
    .filter((t) => t.status === 'Completed')
    .reduce((sum, t) => sum + t.fare, 0);

  const pendingCount = tickets.filter((t) => t.status === 'Waiting for Driver').length;
  const completedCount = tickets.filter((t) => t.status === 'Completed').length;
  const noReviewCount = tickets.filter(
    (t) =>
      t.status === 'Completed' &&
      (!t.review || t.review.skipped || t.review.autoUnlocked || t.review.rating === 0)
  ).length;

  // Filtered tickets
  const filteredTickets = tickets.filter((ticket) => {
    // Search filter
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      const matchId = ticket.id.toLowerCase().includes(q);
      const matchMobile = ticket.mobile.toLowerCase().includes(q);
      const matchTel = ticket.telephone?.toLowerCase().includes(q);
      const matchPickup = ticket.pickup.toLowerCase().includes(q);
      const matchDest = ticket.destination.toLowerCase().includes(q);
      if (!matchId && !matchMobile && !matchTel && !matchPickup && !matchDest) {
        return false;
      }
    }

    // Status filter
    if (statusFilter === 'Pending' && ticket.status !== 'Waiting for Driver') return false;
    if (statusFilter === 'Accepted' && ticket.status !== 'Accepted') return false;
    if (
      statusFilter === 'In Progress' &&
      (ticket.status === 'Waiting for Driver' ||
        ticket.status === 'Completed' ||
        ticket.status === 'Cancelled')
    ) {
      return false;
    }
    if (statusFilter === 'Completed' && ticket.status !== 'Completed') return false;
    if (statusFilter === 'No Review') {
      const isNoReview =
        ticket.status === 'Completed' &&
        (!ticket.review || ticket.review.skipped || ticket.review.autoUnlocked || ticket.review.rating === 0);
      if (!isNoReview) return false;
    }

    // Date filter
    if (dateFilter === 'Today') {
      const todayStr = new Date().toISOString().slice(0, 10);
      if (!ticket.createdAt.startsWith(todayStr)) return false;
    }

    return true;
  });

  // Export to Excel (CSV)
  const handleExportExcel = () => {
    const headers = [
      'Ticket ID',
      'Date',
      'Time',
      'Pickup (Nyandarua)',
      'Destination',
      'Distance KM',
      'Fare (KSH)',
      'Mobile',
      'Telephone',
      'Status',
      'Driver',
      'Rating',
      'Review Comment',
    ];

    const rows = filteredTickets.map((t) => [
      t.id,
      t.date,
      t.time,
      `"${t.pickup}"`,
      `"${t.destination}"`,
      t.distanceKm,
      t.fare,
      `"${t.mobile}"`,
      `"${t.telephone || ''}"`,
      t.status,
      `"${t.driverName || 'Unassigned'}"`,
      t.review?.rating || 'No Rating',
      `"${(t.review?.comment || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `OlexPress_Tickets_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submit admin comment
  const handleSendAdminComment = (e: FormEvent) => {
    e.preventDefault();
    if (!commentModalTicket || !adminMessage.trim()) return;

    ticketStore.addAdminComment(commentModalTicket.id, adminMessage.trim(), commentType);
    setCommentModalTicket(null);
    setAdminMessage('');
  };

  const handleDeleteTicket = (id: string) => {
    if (window.confirm(`Are you sure you want to delete ticket ${id}?`)) {
      ticketStore.deleteTicket(id);
    }
  };

  const handleCloseThread = (ticketId: string, commentId: string) => {
    ticketStore.closeAdminComment(ticketId, commentId);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-6 h-6 text-amber-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white">
              OlexPress Central Dispatch Admin
            </h1>
          </div>
          <p className="text-xs text-zinc-400">
            Operations command center • Nyandarua Launch Base & Kenya Nationwide Network
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="admin-export-btn"
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 hover:text-white hover:bg-zinc-800 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export to Excel (CSV)</span>
          </button>

          <button
            id="admin-refresh-btn"
            onClick={handleRefresh}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Refresh dashboard"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TOP SUMMARY CARDS (Specified in Blueprint Section 9) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Tickets */}
        <div className="bg-zinc-900/95 border border-zinc-800 p-4 rounded-2xl">
          <span className="text-[11px] font-mono text-zinc-400 uppercase block">
            Total Tickets
          </span>
          <p className="text-2xl font-black text-white font-mono mt-1">{tickets.length}</p>
          <span className="text-[10px] text-zinc-400">Recorded across system</span>
        </div>

        {/* Total Revenue KSH */}
        <div className="bg-zinc-900/95 border border-amber-500/50 p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-transparent">
          <span className="text-[11px] font-mono text-amber-400 font-semibold uppercase block">
            Total Revenue
          </span>
          <p className="text-2xl font-black text-amber-400 font-mono mt-1">
            KSH {totalRevenue.toLocaleString()}
          </p>
          <span className="text-[10px] text-zinc-400">From completed rides</span>
        </div>

        {/* Pending Count */}
        <div className="bg-zinc-900/95 border border-zinc-800 p-4 rounded-2xl">
          <span className="text-[11px] font-mono text-zinc-400 uppercase block">Pending</span>
          <p className="text-2xl font-black text-amber-400 font-mono mt-1">{pendingCount}</p>
          <span className="text-[10px] text-zinc-400">Awaiting driver accept</span>
        </div>

        {/* Completed Count */}
        <div className="bg-zinc-900/95 border border-zinc-800 p-4 rounded-2xl">
          <span className="text-[11px] font-mono text-zinc-400 uppercase block">Completed</span>
          <p className="text-2xl font-black text-emerald-400 font-mono mt-1">{completedCount}</p>
          <span className="text-[10px] text-zinc-400">Finished journeys</span>
        </div>

        {/* No Review Count */}
        <div className="bg-zinc-900/95 border border-zinc-800 p-4 rounded-2xl">
          <span className="text-[11px] font-mono text-zinc-400 uppercase block">No Review</span>
          <p className="text-2xl font-black text-zinc-300 font-mono mt-1">{noReviewCount}</p>
          <span className="text-[10px] text-zinc-400">Auto-unlocked / skipped</span>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ticket ID (OLX-xxx), mobile, telephone, pickup, destination..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Filter buttons row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Status filters */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-zinc-400 text-[11px] font-mono mr-1">Status:</span>
            {(['All', 'Pending', 'Accepted', 'In Progress', 'Completed', 'No Review'] as const).map(
              (f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                    statusFilter === f
                      ? 'bg-amber-400 text-black font-bold'
                      : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  {f}
                </button>
              )
            )}
          </div>

          {/* Date filter */}
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-zinc-400 text-[11px] font-mono mr-1">Date:</span>
            {(['Today', 'Yesterday', 'This Week', 'All Time'] as const).map((df) => (
              <button
                key={df}
                onClick={() => setDateFilter(df)}
                className={`px-2.5 py-1 rounded-lg transition-colors text-[11px] ${
                  dateFilter === df
                    ? 'bg-zinc-200 text-black font-bold'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {df}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TABLE ROWS: Ticket ID, Mobile, Telephone, Pickup -> Destination, KM, Fare, Date, Time, Status, Driver, Rating, Actions */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-950 text-[11px] font-mono uppercase text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="py-3 px-3">Ticket ID</th>
                <th className="py-3 px-3">Date / Time</th>
                <th className="py-3 px-3">Route (Nyandarua → Kenya)</th>
                <th className="py-3 px-3">KM</th>
                <th className="py-3 px-3">Fare</th>
                <th className="py-3 px-3">Contacts</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Driver</th>
                <th className="py-3 px-3">Review</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-zinc-500">
                    No tickets found matching your search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-zinc-800/40 transition-colors">
                    {/* Ticket ID */}
                    <td className="py-3 px-3 font-mono font-bold text-amber-400 whitespace-nowrap">
                      {ticket.id}
                    </td>

                    {/* Date / Time */}
                    <td className="py-3 px-3 font-mono text-zinc-400 whitespace-nowrap">
                      {ticket.date}
                      <span className="block text-[10px] text-zinc-400">{ticket.time}</span>
                    </td>

                    {/* Route: Pickup -> Destination */}
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-1 font-semibold text-white whitespace-nowrap">
                        <span className="text-emerald-400">{ticket.pickup}</span>
                        <ArrowRight className="w-3 h-3 text-zinc-400" />
                        <span className="text-amber-400">{ticket.destination}</span>
                      </div>
                      <span className="text-[10px] text-zinc-400">Nyandarua Base</span>
                    </td>

                    {/* KM */}
                    <td className="py-3 px-3 font-mono whitespace-nowrap">
                      {ticket.distanceKm} KM
                    </td>

                    {/* Fare */}
                    <td className="py-3 px-3 font-mono font-bold text-amber-400 whitespace-nowrap">
                      KSH {ticket.fare.toLocaleString()}
                    </td>

                    {/* Contacts: Mobile & Tel */}
                    <td className="py-3 px-3 font-mono whitespace-nowrap">
                      <a href={`tel:${ticket.mobile}`} className="text-emerald-400 hover:underline block">
                        {ticket.mobile}
                      </a>
                      {ticket.telephone ? (
                        <span className="text-[10px] text-zinc-400 block">{ticket.telephone}</span>
                      ) : null}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          ticket.status === 'Completed'
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                            : ticket.status === 'Cancelled'
                            ? 'bg-red-950 text-red-400 border-red-500/40'
                            : ticket.status === 'Waiting for Driver'
                            ? 'bg-amber-950 text-amber-400 border-amber-500/40'
                            : 'bg-cyan-950 text-cyan-400 border-cyan-500/40'
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </td>

                    {/* Driver */}
                    <td className="py-3 px-3 whitespace-nowrap text-xs">
                      {ticket.driverName ? (
                        <div>
                          <span className="font-semibold text-white block">{ticket.driverName}</span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {ticket.driverPlate || 'KDC 482J'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-500 italic">Unassigned</span>
                      )}
                    </td>

                    {/* Rating & Review */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {ticket.review?.rating ? (
                        <div className="flex items-center space-x-1 text-amber-400">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span className="font-bold text-xs">{ticket.review.rating}/5</span>
                        </div>
                      ) : ticket.status === 'Completed' ? (
                        <span className="text-[10px] text-zinc-400 italic">
                          {ticket.review?.autoUnlocked ? 'Auto Unlocked' : 'No Review'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-400">—</span>
                      )}
                    </td>

                    {/* Actions: View Details, View Review, Comment to Driver, Delete */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setViewTicket(ticket)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setCommentModalTicket(ticket);
                            setAdminMessage('');
                          }}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-amber-400 hover:text-black text-amber-400 transition-colors"
                          title="Comment to Driver via Ticket"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteTicket(ticket.id)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-600 hover:text-white text-red-400 transition-colors"
                          title="Delete Ticket"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Comment to Driver via Ticket (Section 8) */}
      {commentModalTicket && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border-2 border-amber-400 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">
                  Dispatch Comment to Driver ({commentModalTicket.id})
                </h3>
              </div>
              <button
                onClick={() => setCommentModalTicket(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-xs mb-4 space-y-1">
              <p className="text-zinc-300">
                Driver:{' '}
                <strong className="text-white">
                  {commentModalTicket.driverName || 'Mwangi Kamau (DRV-701)'}
                </strong>
              </p>
              <p className="text-zinc-400">
                Client Review: "{commentModalTicket.review?.comment || 'No written comment'}"
              </p>
            </div>

            <form onSubmit={handleSendAdminComment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Admin Message to Driver
                </label>
                <textarea
                  rows={3}
                  required
                  value={adminMessage}
                  onChange={(e) => setAdminMessage(e.target.value)}
                  placeholder="e.g. Driver, client noted you arrived slightly late at Ol Kalou pickup. Please explain."
                  className="w-full px-3.5 py-2.5 bg-zinc-950 rounded-xl border border-zinc-700 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Mode Toggle: Response Required vs Info Only */}
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                <span className="block text-xs font-semibold text-zinc-300 mb-2">
                  Driver Action Required:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label
                    className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer ${
                      commentType === 'Response Required'
                        ? 'bg-red-950/40 border-red-500 text-red-300 font-bold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="commentType"
                      checked={commentType === 'Response Required'}
                      onChange={() => setCommentType('Response Required')}
                      className="hidden"
                    />
                    <span>Response Required (Unlocks Reply)</span>
                  </label>

                  <label
                    className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer ${
                      commentType === 'Info Only'
                        ? 'bg-zinc-800 border-zinc-600 text-white font-bold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="commentType"
                      checked={commentType === 'Info Only'}
                      onChange={() => setCommentType('Info Only')}
                      className="hidden"
                    />
                    <span>Info Only (Read-Only)</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCommentModalTicket(null)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs flex-1 flex items-center justify-center space-x-1"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Comment to Driver</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: View Details & Thread History */}
      {viewTicket && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border-2 border-zinc-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <h3 className="font-bold text-white text-base font-mono">
                Ticket Details: {viewTicket.id}
              </h3>
              <button onClick={() => setViewTicket(null)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                <div>
                  <span className="text-zinc-400">Pickup Base:</span>
                  <p className="font-bold text-emerald-400">{viewTicket.pickup} (Nyandarua)</p>
                </div>
                <div>
                  <span className="text-zinc-400">Destination:</span>
                  <p className="font-bold text-amber-400">{viewTicket.destination}</p>
                </div>
                <div>
                  <span className="text-zinc-400">Road Distance:</span>
                  <p className="font-mono text-white">{viewTicket.distanceKm} KM (~{viewTicket.estimatedTime})</p>
                </div>
                <div>
                  <span className="text-zinc-400">Calculated Fare:</span>
                  <p className="font-mono font-bold text-amber-400">KSH {viewTicket.fare.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-zinc-400">Mobile (M-Pesa):</span>
                  <p className="font-mono text-white">{viewTicket.mobile}</p>
                </div>
                <div>
                  <span className="text-zinc-400">Alt Telephone:</span>
                  <p className="font-mono text-zinc-300">{viewTicket.telephone || 'None'}</p>
                </div>
                <div>
                  <span className="text-zinc-400">Current Status:</span>
                  <p className="font-bold text-cyan-400">{viewTicket.status}</p>
                </div>
                <div>
                  <span className="text-zinc-400">Driver:</span>
                  <p className="font-semibold text-white">{viewTicket.driverName || 'Unassigned'}</p>
                </div>
              </div>

              {/* Review Info */}
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                <span className="font-bold text-white block mb-1">Customer Review:</span>
                {viewTicket.review ? (
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1 text-amber-400">
                      <span>Rating:</span>
                      <strong>{viewTicket.review.rating} / 5 Stars</strong>
                    </div>
                    <p className="text-zinc-300">
                      "{viewTicket.review.comment || 'No written review text'}"
                    </p>
                    {viewTicket.review.autoUnlocked && (
                      <span className="text-[10px] text-zinc-400">
                        (Auto-unlocked after 5 min timeout)
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-zinc-500">No review submitted yet.</span>
                )}
              </div>

              {/* Admin Comments Thread */}
              {viewTicket.review?.adminComments && viewTicket.review.adminComments.length > 0 && (
                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-2">
                  <span className="font-bold text-amber-400 block">Dispatch Thread:</span>
                  {viewTicket.review.adminComments.map((c) => (
                    <div key={c.id} className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-amber-400 font-bold">{c.adminName}</span>
                        <span className="text-zinc-400">{c.type}</span>
                      </div>
                      <p className="text-zinc-200">{c.message}</p>

                      {c.driverReply && (
                        <div className="mt-2 p-2 rounded bg-zinc-950 border border-zinc-800">
                          <span className="text-emerald-400 font-bold block">Driver Reply:</span>
                          <p className="text-zinc-300">{c.driverReply}</p>
                        </div>
                      )}

                      {!c.isClosed ? (
                        <button
                          onClick={() => handleCloseThread(viewTicket.id, c.id)}
                          className="mt-2 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px]"
                        >
                          Close Review Thread
                        </button>
                      ) : (
                        <span className="text-[10px] text-emerald-400 mt-1 block">✓ Thread Closed</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
