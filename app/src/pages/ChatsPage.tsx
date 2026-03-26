import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { chatsApi } from '../services/api';
import { ArrowLeft, Loader2, Send, MessageCircle } from 'lucide-react';

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

  if (authLoading) return <div className="min-h-screen bg-[#E9E3DA] flex items-center justify-center"><Loader2 size={32} className="animate-spin text-[#FF6A00]" /></div>;

  return (
    <div className="min-h-screen bg-[#E9E3DA]">
      <div className="bg-white/80 backdrop-blur-md border-b border-[#E9E3DA] sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#101214' }}>YantraSetu</Link>
            <span className="text-[#6F757C] text-sm">/ Messages</span>
          </div>
          <Link to="/" className="flex items-center gap-1.5 text-sm text-[#6F757C] hover:text-[#101214]"><ArrowLeft size={16} /> Home</Link>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-[#E9E3DA] overflow-hidden" style={{ height: '70vh' }}>
          <div className="flex h-full">
            {/* Sidebar */}
            <div className="w-80 border-r border-[#E9E3DA] flex flex-col">
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
            <div className="flex-1 flex flex-col">
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
                  <div className="p-4 border-t border-[#E9E3DA] flex gap-2">
                    <input value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()}
                      placeholder="Type a message…" className="flex-1 px-4 py-3 bg-[#E9E3DA]/40 border border-[#E9E3DA] rounded text-sm focus:outline-none focus:border-[#FF6A00]" />
                    <button onClick={handleSend} disabled={sending || !newMsg.trim()} className="btn-primary px-4 disabled:opacity-50"><Send size={16} /></button>
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
      </div>
    </div>
  );
}
