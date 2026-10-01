'use client';

import React, { useState } from 'react';
import { DEFAULT_TOKEN, DEFAULT_SYSTEM_PROMPT } from '@/config/models';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  systemPrompt: string;
  onSave: (token: string, systemPrompt: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  token,
  systemPrompt,
  onSave,
}) => {
  const [currentToken, setCurrentToken] = useState(token);
  const [currentPrompt, setCurrentPrompt] = useState(systemPrompt);
  const [showToken, setShowToken] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(currentToken.trim(), currentPrompt.trim());
    onClose();
  };

  const handleReset = () => {
    setCurrentToken(DEFAULT_TOKEN);
    setCurrentPrompt(DEFAULT_SYSTEM_PROMPT);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Settings</div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-field">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label className="modal-label">API Token</label>
              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8e8e8e',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              type={showToken ? 'text' : 'password'}
              className="modal-input"
              value={currentToken}
              onChange={(e) => setCurrentToken(e.target.value)}
              placeholder="hf_..."
            />
            <span className="modal-hint">
              Stored securely in your browser's local storage.
            </span>
          </div>

          <div className="modal-field">
            <label className="modal-label">System Prompt</label>
            <textarea
              rows={4}
              className="modal-input"
              value={currentPrompt}
              onChange={(e) => setCurrentPrompt(e.target.value)}
              placeholder="You are an advanced AI assistant..."
            />
            <span className="modal-hint">
              Instructions to customize the AI's behavior and personality.
            </span>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={handleReset}>
            Reset
          </button>
          <button type="button" className="btn-primary" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
