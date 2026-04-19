import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { notificationsApi } from '../services/api';
import { Loader2, Bell, BellOff, Check, CheckCheck, MessageCircle, Calendar, ShieldCheck, Star, AlertTriangle } from 'lucide-react';
import PageShell from '../components/PageShell';

const ICON_MAP: Record<string, any> = {
  booking_created: Calendar,
  booking_confirmed: CheckCheck,
  booking_cancelled: AlertTriangle,
  booking_completed: Check,
  message_received: MessageCircle,
  listing_approved: ShieldCheck,
  listing_rejected: AlertTriangle,
  review_received: Star,
  system: Bell,
};

const COLOR_MAP: Record<string, string> = {
  booking_created: 'bg-blue-100 text-blue-600',
  booking_confirmed: 'bg-green-100 text-green-600',
  booking_cancelled: 'bg-red-100 text-red-600',
  booking_completed: 'bg-emerald-100 text-emerald-600',
  message_received: 'bg-orange-100 text-orange-600',
  listing_approved: 'bg-green-100 text-green-600',
  listing_rejected: 'bg-red-100 text-red-600',
  review_received: 'bg-yellow-100 text-yellow-600',
  system: 'bg-gray-100 text-gray-600',
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  useEffect(() => { if (!authLoading && !isAuthenticated) navigate('/login'); }, [authLoading, isAuthenticated, navigate]);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({ total: 0, pages: 1 });

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    notificationsApi.getAll(page)
      .then(d => { setNotifications(d.notifications); setPagination(d.pagination); })
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, [isAuthenticated, page]);

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {}
  };

  const handleClick = async (n: any) => {
    if (!n.isRead) {
      try { await notificationsApi.markAsRead(n.id); } catch {}
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x));
    }
    // Navigate based on notification type
    const data = n.data || {};
    if (data.chatId) navigate('/chats');
    else if (data.bookingId) navigate('/bookings');
    else if (data.listingId) navigate(`/listing/${data.listingId}`);
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  if (authLoading) return <PageShell breadcrumb="Notifications"><div className="flex items-center justify-center py-32"><Loader2 size={32} className="animate-spin text-[#FF6A00]" /></div></PageShell>;

  return (
    <PageShell breadcrumb="Notifications" backTo="/" backLabel="Home" title="Notifications">
      {/* Actions */}
      {notifications.some(n => !n.isRead) && (
        <div className="flex justify-end mb-4">
          <button
            onClick={handleMarkAllRead}
            className="text-xs px-3 py-2 bg-white border border-[#E9E3DA] rounded-lg hover:border-[#FF6A00] text-[#6F757C] hover:text-[#FF6A00] transition-colors flex items-center gap-1.5 min-h-[36px]"
          >
            <CheckCheck size={14} /> Mark all read
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-32"><Loader2 size={32} className="animate-spin text-[#FF6A00]" /></div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-32">
          <BellOff size={48} className="mx-auto text-[#6F757C] mb-4 opacity-40" />
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}>No notifications yet</h2>
          <p className="text-sm text-[#6F757C] mt-2">You'll see booking updates, messages, and more here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const Icon = ICON_MAP[n.type] || Bell;
            const colorClass = COLOR_MAP[n.type] || COLOR_MAP.system;
            return (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3 ${
                  n.isRead
                    ? 'bg-white border-[#E9E3DA] hover:border-[#D1CBC2]'
                    : 'bg-[#FF6A00]/[0.03] border-[#FF6A00]/20 hover:border-[#FF6A00]/40'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${n.isRead ? 'font-medium' : 'font-bold'}`} style={{ fontFamily: 'Sora, sans-serif' }}>
                      {n.title}
                    </p>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-[#FF6A00] flex-shrink-0 mt-1.5" />}
                  </div>
                  {n.body && <p className="text-xs text-[#6F757C] mt-0.5 line-clamp-2">{n.body}</p>}
                  <p className="text-[10px] text-[#6F757C]/60 mt-1" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                    {timeAgo(n.createdAt)}
                  </p>
                </div>
              </button>
            );
          })}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-6">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 bg-white border border-[#E9E3DA] rounded-lg text-sm disabled:opacity-40 min-h-[44px]"
              >
                Previous
              </button>
              <span className="text-xs text-[#6F757C]" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                {page} / {pagination.pages}
              </span>
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 bg-white border border-[#E9E3DA] rounded-lg text-sm disabled:opacity-40 min-h-[44px]"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}
