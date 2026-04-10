import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { chatsApi } from '../services/api';
import { Loader2, Send, MessageCircle } from 'lucide-react';
import PageShell from '../components/PageShell';

export default function ChatsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  useEffect(() => { if (!authLoading && !isAuthenticated) navigate('/login'); }, [authLoading, isAuthenticated, navigate]);

  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const msgEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    chatsApi.getMyChats().then(d => setChats(d.chats)).catch(() => {}).finally(() => setLoading(false));
  }, [isAuthenticated]);

  useEffect(() => {
    if (!activeChat) return;
    const load = () => chatsApi.getMessages(activeChat).then(d => setMessages(d.messages)).catch(() => {});
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [activeChat]);

  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!newMsg.trim() || !activeChat) return;
    setSending(true);
    try { await chatsApi.sendMessage(activeChat, newMsg.trim()); setNewMsg(''); const d = await chatsApi.getMessages(activeChat); setMessages(d.messages); } catch {}
    finally { setSending(false); }
  };

  const getOtherUser = (chat: any) => chat.buyerId === user?.id ? chat.seller : chat.buyer;

  if (authLoading) return <PageShell breadcrumb="Messages"><div className="flex items-center justify-center py-32"><Loader2 size={32} className="animate-spin text-[#FF6A00]" /></div></PageShell>;

  return (
    <PageShell breadcrumb="Messages" backTo="/" backLabel="Home">
        <div className="bg-white rounded-xl shadow-sm border border-[#E9E3DA] overflow-hidden" style={{ height: 'calc(100vh - 200px)', minHeight: '400px' }}>
          <div className="flex h-full">
            {/* Sidebar */}
            <div className={`${activeChat ? 'hidden sm:flex' : 'flex'} w-full sm:w-72 md:w-80 border-r border-[#E9E3DA] flex-col`}>
              <div className="p-4 border-b border-[#E9E3DA]"><h2 className="font-bold text-sm" style={{ fontFamily: 'Sora, sans-serif' }}>Conversations</h2></div>
              <div className="flex-1 overflow-y-auto">
                {loading ? <div className="p-4 text-center"><Loader2 size={20} className="animate-spin text-[#FF6A00] mx-auto" /></div>
                : chats.length === 0 ? <div className="p-4 text-center text-sm text-[#6F757C]">No conversations yet</div>
                : chats.map(chat => {
                  const other = getOtherUser(chat);
                  return (
                    <button key={chat.id} onClick={() => setActiveChat(chat.id)}
                      className={`w-full p-4 text-left border-b border-[#E9E3DA] hover:bg-[#E9E3DA]/30 transition-colors ${activeChat === chat.id ? 'bg-[#E9E3DA]/50' : ''}`}>
                      <p className="font-medium text-sm">{other?.firstName} {other?.lastName}</p>
                      <p className="text-xs text-[#6F757C] truncate mt-0.5">{chat.lastMessagePreview || 'No messages yet'}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Chat area */}
            <div className={`${activeChat ? 'flex' : 'hidden sm:flex'} flex-1 flex-col`}>
              {activeChat ? (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] px-4 py-2.5 rounded-lg text-sm ${
                          msg.senderId === user?.id ? 'bg-[#FF6A00] text-white rounded-br-none' : 'bg-[#E9E3DA] text-[#101214] rounded-bl-none'
                        }`}>
                          <p>{msg.content}</p>
                          <p className={`text-[10px] mt-1 ${msg.senderId === user?.id ? 'text-white/60' : 'text-[#6F757C]'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={msgEnd} />
                  </div>
                  <div className="p-3 sm:p-4 border-t border-[#E9E3DA] flex gap-2">
                    <input value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()}
                      placeholder="Type a message…" className="flex-1 px-4 py-3 bg-[#E9E3DA]/40 border border-[#E9E3DA] rounded-lg text-sm focus:outline-none focus:border-[#FF6A00] min-h-[44px]" />
                    <button onClick={handleSend} disabled={sending || !newMsg.trim()} className="btn-primary px-4 disabled:opacity-50 min-h-[44px]"><Send size={16} /></button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-[#6F757C]">
                  <div className="text-center">
                    <MessageCircle size={48} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Select a conversation</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
    </PageShell>
  );
}
