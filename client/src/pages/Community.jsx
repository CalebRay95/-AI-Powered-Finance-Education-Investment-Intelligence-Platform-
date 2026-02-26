import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { getSocket, disconnectSocket } from '../utils/socket.js';

// Room definitions — slug must match VALID_ROOMS on the server
const ROOMS = [
  { slug: 'general',            name: 'General Chat' },
  { slug: 'options-trading',    name: 'Options Trading' },
  { slug: 'crypto-analysis',    name: 'Crypto Analysis' },
  { slug: 'dividend-investing', name: 'Dividend Investing' },
];

const COLORS = ['bg-blue-600', 'bg-purple-600', 'bg-emerald-600', 'bg-red-600', 'bg-yellow-600'];
const getAvatarColor = (name = '') => COLORS[name.length % COLORS.length];

export default function Community() {
  const { user } = useAuth();

  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState('');
  const [activeRoom,  setActiveRoom]  = useState('general');
  const [isConnected, setIsConnected] = useState(false);
  const [roomCount,   setRoomCount]   = useState(0);

  const [replyingTo, setReplyingTo] = useState(null); // { _id, userName, content }

  const scrollRef     = useRef(null);
  const prevRoomRef   = useRef(null);   // track previous room for leave_room emit
  const activeRoomRef = useRef('general'); // always holds the current activeRoom value

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // ── Connection lifecycle (once on mount) ─────────────────────────────────
  useEffect(() => {
    const socket = getSocket();

    // On (re)connect, rejoin the current room so history and messages resume.
    const onConnect = () => {
      setIsConnected(true);
      const room = activeRoomRef.current;
      socket.emit('join_room', room);
      prevRoomRef.current = room;
    };
    const onDisconnect = () => setIsConnected(false);
    const onHistory    = (history) => setMessages(history);
    const onNewMessage = (msg) => setMessages((prev) => [...prev, msg]);
    // Read activeRoomRef instead of the stale closure value so room switches
    // continue to update the count correctly.
    const onRoomCount  = ({ room, count }) => {
      if (room === activeRoomRef.current) setRoomCount(count);
    };

    socket.on('connect',      onConnect);
    socket.on('disconnect',   onDisconnect);
    socket.on('room_history', onHistory);
    socket.on('new_message',  onNewMessage);
    socket.on('room_count',   onRoomCount);

    socket.connect();
    socket.emit('join_room', activeRoom);
    prevRoomRef.current = activeRoom;

    return () => {
      socket.off('connect',      onConnect);
      socket.off('disconnect',   onDisconnect);
      socket.off('room_history', onHistory);
      socket.off('new_message',  onNewMessage);
      socket.off('room_count',   onRoomCount);
      disconnectSocket();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Room switching — also keeps activeRoomRef current ──────────────────
  useEffect(() => {
    activeRoomRef.current = activeRoom; // always stays fresh
    const prev = prevRoomRef.current;
    if (!prev || prev === activeRoom) return;

    const socket = getSocket();
    socket.emit('leave_room', prev);
    setMessages([]);
    setReplyingTo(null);
    socket.emit('join_room', activeRoom);
    prevRoomRef.current = activeRoom;
    setRoomCount(0);
  }, [activeRoom]);

  // ── Send message ─────────────────────────────────────────────────────────
  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    getSocket().emit('send_message', {
      room: activeRoom,
      content: input.trim(),
      parentId: replyingTo?._id ?? null,
    });
    setInput('');
    setReplyingTo(null);
  };

  // ── Room click ────────────────────────────────────────────────────────────
  const handleRoomClick = (slug) => {
    if (slug === activeRoom) return;
    setActiveRoom(slug);
  };

  // ── Render helpers ────────────────────────────────────────────────────────
  const formatTime = (ts) =>
    ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  // Build a flat-ordered thread view:
  //   top-level messages in chronological order, each immediately followed
  //   by its replies (also chronological) so threads read naturally.
  const buildThreaded = (msgs) => {
    const byId = {};
    const topLevel = [];
    const replyMap = {}; // parentId -> [reply, ...]

    for (const m of msgs) {
      byId[m._id] = m;
      const pid = m.parentId ? String(m.parentId) : null;
      if (pid) {
        (replyMap[pid] = replyMap[pid] || []).push(m);
      } else {
        topLevel.push(m);
      }
    }

    const ordered = [];
    for (const m of topLevel) {
      ordered.push({ msg: m, isReply: false });
      for (const r of replyMap[String(m._id)] || []) {
        ordered.push({ msg: r, isReply: true, parentName: m.userName });
      }
    }
    // Orphaned replies (parent pruned by limit) appended at end
    for (const m of msgs) {
      if (m.parentId && !byId[String(m.parentId)]) {
        ordered.push({ msg: m, isReply: true, parentName: '…' });
      }
    }
    return ordered;
  };

  const renderMessage = ({ msg, isReply, parentName }) => {
    if (msg.type === 'alert') {
      return (
        <div key={msg._id ?? msg.timestamp} className="flex justify-center">
          <div className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium tracking-wide">
            {msg.content} • {formatTime(msg.timestamp)}
          </div>
        </div>
      );
    }

    const senderName = msg.userName || msg.user || 'Unknown';
    const isMe = senderName === user?.name;

    return (
      <div
        key={msg._id ?? msg.timestamp}
        className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''} ${isReply ? 'ml-12 mt-2' : ''}`}
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shrink-0 text-xs ${
          isMe ? 'bg-emerald-600' : getAvatarColor(senderName)
        }`}>
          {senderName[0]?.toUpperCase() ?? '?'}
        </div>
        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
          {isReply && (
            <p className="text-xs text-gray-500 mb-0.5">
              ↩ replying to <span className="text-gray-400">{parentName}</span>
            </p>
          )}
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-300">{senderName}</span>
            <span className="text-xs text-gray-500">{formatTime(msg.timestamp)}</span>
          </div>
          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isReply ? 'text-[0.8rem]' : ''
          } ${
            isMe
              ? 'bg-emerald-600 text-white rounded-tr-none'
              : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-tl-none'
          }`}>
            {msg.content}
          </div>
          {!isReply && (
            <button
              onClick={() => setReplyingTo({ _id: msg._id, userName: senderName, content: msg.content })}
              className="mt-1 text-xs text-gray-500 hover:text-emerald-400 transition-colors"
            >
              ↩ Reply
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh)] max-h-screen">
      {/* ── Header ── */}
      <header className="p-6 border-b border-gray-800 bg-gray-900 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold">
            GIFT <span className="text-emerald-400">Community</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Real-time discussions and market insights.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-full border border-gray-700">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-500'}`} />
          <span className="text-xs font-semibold text-gray-300">
            {isConnected
              ? roomCount > 0 ? `${roomCount} Online` : 'Live'
              : 'Connecting…'}
          </span>
        </div>
      </header>

      {/* ── Main Layout ── */}
      <div className="flex flex-1 overflow-hidden bg-gray-950">

        {/* Chat Feed */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-gray-800 relative">

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="flex justify-center pt-10">
                <p className="text-gray-600 text-sm">
                  {isConnected ? 'No messages yet. Start the conversation!' : 'Connecting to room…'}
                </p>
              </div>
            )}
            {buildThreaded(messages).map((item) => renderMessage(item))}
          </div>

          {/* Input */}
          <div className="p-4 bg-gray-900 border-t border-gray-800 shrink-0">
            {/* Reply context banner */}
            {replyingTo && (
              <div className="flex items-center justify-between mb-2 px-3 py-1.5 bg-gray-800 rounded-lg border border-gray-700">
                <p className="text-xs text-gray-400 truncate">
                  ↩ Replying to <span className="text-emerald-400 font-medium">{replyingTo.userName}</span>:
                  <span className="text-gray-500 ml-1">{replyingTo.content.slice(0, 60)}{replyingTo.content.length > 60 ? '…' : ''}</span>
                </p>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="ml-3 text-gray-500 hover:text-white text-xs shrink-0"
                >
                  ✕
                </button>
              </div>
            )}
            <form onSubmit={handleSend} className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isConnected ? 'Share your thoughts…' : 'Connecting…'}
                disabled={!isConnected}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl pl-4 pr-16 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder-gray-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || !isConnected}
                className="absolute right-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Send
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-64 bg-gray-900 p-6 hidden lg:block shrink-0 overflow-y-auto">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Trending Topics
          </h2>
          <ul className="space-y-3">
            {[
              { tag: '#NVDAEarnings',  volume: '12.4k' },
              { tag: '#FedDecision',   volume: '8.2k'  },
              { tag: '#CryptoBullRun', volume: '5.1k'  },
              { tag: '#AAPL',          volume: '3.8k'  },
            ].map((topic, i) => (
              <li key={i} className="flex justify-between items-center group cursor-pointer">
                <span className="text-sm font-medium text-gray-300 group-hover:text-emerald-400 transition-colors">{topic.tag}</span>
                <span className="text-xs text-gray-500">{topic.volume}</span>
              </li>
            ))}
          </ul>

          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-10 mb-4">
            Active Rooms
          </h2>
          <ul className="space-y-3">
            {ROOMS.map((room) => (
              <li
                key={room.slug}
                onClick={() => handleRoomClick(room.slug)}
                className={`flex items-center gap-3 text-sm font-medium p-2 rounded-lg cursor-pointer transition-colors ${
                  room.slug === activeRoom
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span>#</span> {room.name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
