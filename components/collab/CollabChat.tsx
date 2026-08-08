'use client';

import { useEffect, useRef, useState } from 'react';
import { ChatMessage } from '@/lib/realtime/presence';

interface CollabChatProps {
  roomId: string;
  userId: string;
  userName: string;
}

const POLL_INTERVAL = 2000;

export function CollabChat({ roomId, userId, userName }: CollabChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  async function loadMessages() {
    try {
      const res = await fetch(`/api/collab/messages?room_id=${encodeURIComponent(roomId)}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {
      // ignore poll errors
    }
  }

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [roomId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput('');
    try {
      await fetch('/api/collab/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: roomId, user_id: userId, name: userName, text }),
      });
      await loadMessages();
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-col h-full bg-surface border border-gray-800 rounded-lg overflow-hidden">
      <div className="px-3 py-2 border-b border-gray-800 text-sm font-medium text-white">
        Chat
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
        {messages.length === 0 && (
          <p className="text-xs text-gray-500 text-center mt-4">No messages yet. Say hello!</p>
        )}
        {messages.map((m) => {
          const isMe = m.userId === userId;
          return (
            <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <span className="text-[10px] text-gray-500 mb-0.5">{m.name}</span>
              <div
                className={`max-w-[80%] px-3 py-1.5 rounded-lg text-sm ${
                  m.type === 'annotation'
                    ? 'bg-yellow-900/30 border border-yellow-700/50 text-yellow-100'
                    : isMe
                    ? 'bg-cyan/20 text-white'
                    : 'bg-gray-800 text-gray-200'
                }`}
              >
                {m.text}
              </div>
            </div>
          );
        })}
      </div>
      <form onSubmit={handleSend} className="border-t border-gray-800 p-2 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-3 py-1.5 bg-bg border border-gray-700 rounded text-sm text-white focus:outline-none focus:border-cyan"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="px-3 py-1.5 bg-cyan text-bg rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
}
