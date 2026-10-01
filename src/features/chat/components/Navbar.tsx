'use client';

import React from 'react';

interface NavbarProps {
  hasMessages?: boolean;
  onShare?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  hasMessages,
  onShare,
}) => {
  if (!hasMessages) return null;

  return (
    <header className="chat-top-header">
      <div className="header-left" />
      <div className="header-right">
        {/* ChatGPT Style Share Button in Top Right */}
        <button
          type="button"
          className="header-share-btn"
          onClick={onShare}
          title="Share public link to chat"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
            <polyline points="16 6 12 2 8 6"></polyline>
            <line x1="12" y1="2" x2="12" y2="15"></line>
          </svg>
          <span>Share</span>
        </button>
      </div>
    </header>
  );
};
