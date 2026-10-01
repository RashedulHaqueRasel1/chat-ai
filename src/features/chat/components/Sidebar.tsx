'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { ChatSession } from '@/types/chat';

interface SidebarProps {
  isOpen: boolean;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onToggleSidebar: () => void;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onToggleSidebar,
  onCloseMobile,
}) => {
  const sidebarRef = useRef<HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Close the expanded sidebar drawer when clicking outside or pressing Escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (isOpen && sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        onToggleSidebar();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        onToggleSidebar();
      }
    };

    if (isOpen) {
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('keydown', handleEscape);
      }, 50);

      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleOutsideClick);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onToggleSidebar]);

  // Filter out any blank sessions and match search query
  const validSessions = useMemo(
    () => sessions.filter((s) => s.messages && s.messages.length > 0),
    [sessions]
  );

  const filteredSessions = useMemo(
    () =>
      validSessions.filter((s) =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [validSessions, searchQuery]
  );

  // Group chat history into Today, Yesterday, Previous 7 Days, Older (ChatGPT design)
  const groupedSessions = useMemo(() => {
    if (searchQuery.trim()) {
      return [{ title: `Search (${filteredSessions.length})`, items: filteredSessions }];
    }

    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;

    const today: ChatSession[] = [];
    const yesterday: ChatSession[] = [];
    const prev7Days: ChatSession[] = [];
    const older: ChatSession[] = [];

    filteredSessions.forEach((s) => {
      const time = s.updatedAt || s.createdAt || now;
      const diff = now - time;
      if (diff < ONE_DAY) {
        today.push(s);
      } else if (diff < 2 * ONE_DAY) {
        yesterday.push(s);
      } else if (diff < 7 * ONE_DAY) {
        prev7Days.push(s);
      } else {
        older.push(s);
      }
    });

    const groups: { title: string; items: ChatSession[] }[] = [];
    if (today.length > 0) groups.push({ title: 'Today', items: today });
    if (yesterday.length > 0) groups.push({ title: 'Yesterday', items: yesterday });
    if (prev7Days.length > 0) groups.push({ title: 'Previous 7 Days', items: prev7Days });
    if (older.length > 0) groups.push({ title: 'Older', items: older });

    return groups;
  }, [filteredSessions, searchQuery]);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        className={`sidebar-mobile-backdrop ${isOpen ? 'active' : ''}`}
        onClick={onCloseMobile}
      />

      {/* -------------------------------------------------------------
          1. COLLAPSED SLIM ICON RAIL (52px)
          Items: Toggle, New chat, Search (Clean, no bottom clutter)
      ------------------------------------------------------------- */}
      {!isOpen && (
        <aside className="chatgpt-slim-rail">
          <div className="rail-top-icons">
            {/* Toggle / Open Sidebar */}
            <button
              type="button"
              className="rail-btn"
              onClick={onToggleSidebar}
              title="Open sidebar"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="3" ry="3"></rect>
                <line x1="9" y1="3" x2="9" y2="21"></line>
              </svg>
            </button>

            {/* New Chat */}
            <button
              type="button"
              className="rail-btn"
              onClick={onNewChat}
              title="New chat"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>

            {/* Search (Opens sidebar and focuses search) */}
            <button
              type="button"
              className="rail-btn"
              onClick={() => {
                onToggleSidebar();
                setTimeout(() => searchInputRef.current?.focus(), 100);
              }}
              title="Search history"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </div>
        </aside>
      )}

      {/* -------------------------------------------------------------
          2. EXPANDED FULL SIDEBAR (260px)
          Items: Header, New chat, Search, ChatGPT-style Grouped History
      ------------------------------------------------------------- */}
      {isOpen && (
        <aside ref={sidebarRef} className="chatgpt-full-sidebar open">
          <div className="full-sidebar-inner">
            {/* Header: Title + Collapse Button */}
            <div className="full-sidebar-header">
              <span className="sidebar-brand-title">ChatGPT</span>
              <button
                type="button"
                className="sidebar-tool-icon-btn"
                title="Close sidebar"
                onClick={onToggleSidebar}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="3" ry="3"></rect>
                  <line x1="9" y1="3" x2="9" y2="21"></line>
                </svg>
              </button>
            </div>

            {/* 1. New Chat Button */}
            <div style={{ padding: '0 10px 8px' }}>
              <button
                type="button"
                className="sidebar-new-chat-pill"
                onClick={() => {
                  onNewChat();
                  onCloseMobile();
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                <span>New chat</span>
              </button>
            </div>

            {/* 2. Search Input Field */}
            <div style={{ padding: '0 10px 10px' }}>
              <div className="sidebar-search-box">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  className="sidebar-search-input"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: '13px' }}
                    onClick={() => setSearchQuery('')}
                  >
                    &times;
                  </button>
                )}
              </div>
            </div>

            {/* 3. Chat History List (Grouped by Today, Yesterday, etc.) */}
            <div className="sidebar-scrollable-content">
              {filteredSessions.length === 0 ? (
                <div className="history-empty-notice">
                  {searchQuery ? 'No chats found' : 'No chat history yet'}
                </div>
              ) : (
                groupedSessions.map((group, gIdx) => (
                  <div key={gIdx} className="sidebar-history-group">
                    <div className="section-label">{group.title}</div>
                    <div className="history-chats-list">
                      {group.items.map((session) => (
                        <div
                          key={session.id}
                          className={`sidebar-chat-item ${session.id === currentSessionId ? 'active' : ''}`}
                          onClick={() => {
                            onSelectSession(session.id);
                            onCloseMobile();
                          }}
                        >
                          <span className="chat-item-label">{session.title}</span>
                          <button
                            type="button"
                            className="chat-delete-action-btn"
                            title="Delete chat"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSession(session.id);
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      )}
    </>
  );
};
