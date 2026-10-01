'use client';

import React, { useState, useMemo } from 'react';
import { marked } from 'marked';
import { ChatMessage } from '@/types/chat';

// Configure marked with custom ChatGPT-style renderer
const customRenderer = new marked.Renderer();

// Code block renderer with language bar and copy button
customRenderer.code = function (token: { text: string; lang?: string }) {
  const lang = (token.lang || 'code').trim().split(/\s+/)[0] || 'code';
  const escaped = token.text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return `<div class="chat-code-block">
    <div class="chat-code-header">
      <span class="code-lang-label">${lang}</span>
      <button type="button" class="chat-code-copy-btn" title="Copy code">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <span>Copy code</span>
      </button>
    </div>
    <pre><code class="language-${lang}">${escaped}</code></pre>
  </div>`;
};

// Wrap tables in responsive wrapper
customRenderer.table = function (token: any) {
  const defaultHtml = marked.Renderer.prototype.table.call(this, token);
  return `<div class="chat-table-wrapper">${defaultHtml}</div>`;
};

// Open external links safely in new tab
customRenderer.link = function (token: any) {
  const defaultHtml = marked.Renderer.prototype.link.call(this, token);
  return defaultHtml.replace('<a ', '<a target="_blank" rel="noopener noreferrer" ');
};

marked.use({
  renderer: customRenderer,
  gfm: true,
  breaks: true,
});

interface MessageItemProps {
  message: ChatMessage;
  isLast?: boolean;
  onRegenerate?: () => void;
  onImageClick?: (imgUrl: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isLast,
  onRegenerate,
  onImageClick,
}) => {
  const [showReasoning, setShowReasoning] = useState(false);
  const [isCopiedAll, setIsCopiedAll] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Parse markdown into clean GFM HTML
  const renderedHtml = useMemo(() => {
    if (!message.content) return '';
    return marked.parse(message.content) as string;
  }, [message.content]);

  // Handle clicking "Copy code" button inside generated code blocks
  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const copyBtn = (e.target as HTMLElement).closest('.chat-code-copy-btn');
    if (!copyBtn) return;
    const pre = copyBtn.closest('.chat-code-block')?.querySelector('pre code');
    if (pre) {
      const codeText = pre.textContent || '';
      navigator.clipboard.writeText(codeText);
      const span = copyBtn.querySelector('span');
      if (span) {
        const origText = span.textContent;
        span.textContent = '✓ Copied';
        setTimeout(() => {
          span.textContent = origText;
        }, 2000);
      }
    }
  };

  // Copy full message
  const copyAllText = () => {
    navigator.clipboard.writeText(message.content);
    setIsCopiedAll(true);
    setTimeout(() => setIsCopiedAll(false), 2000);
  };

  // Web Speech API text-to-speech
  const handleReadAloud = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in your browser.');
      return;
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message.content);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  // 1. User Message (Screenshot match: Attached image on top + Deep Slate-Navy blue bubble below)
  if (message.role === 'user') {
    return (
      <div className="user-msg-block">
        {/* Attached image preview (matching the user's screenshot layout!) */}
        {message.images && message.images.length > 0 && (
          <div className={message.images.length > 1 ? 'user-images-multi-grid' : ''}>
            {message.images.map((imgBase64, idx) => (
              <div
                key={idx}
                className="user-attached-image-wrapper"
                onClick={() => onImageClick?.(imgBase64)}
                title="Click to expand"
              >
                <img src={imgBase64} alt={`Attachment ${idx + 1}`} />
              </div>
            ))}
          </div>
        )}

        {/* User text bubble (Deep Slate Blue: er mane ki ?) */}
        {message.content && (
          <div className="user-slate-bubble">
            {message.content}
          </div>
        )}
      </div>
    );
  }

  // 2. Assistant Message (Clean text, no box, crisp white text, bullet dots, tables, toolbar)
  return (
    <div className="assistant-msg-block">
      {/* DeepSeek R1 Thinking Process Accordion */}
      {message.reasoning && (
        <div className="reasoning-accordion">
          <div
            className="reasoning-trigger"
            onClick={() => setShowReasoning(!showReasoning)}
          >
            <span>Thought for a few seconds</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              style={{
                transform: showReasoning ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.15s ease',
              }}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
          {showReasoning && (
            <div style={{ marginTop: '8px', fontSize: '13px', color: '#9ca3af', whiteSpace: 'pre-wrap' }}>
              {message.reasoning}
            </div>
          )}
        </div>
      )}

      {/* Full ChatGPT Markdown Response or Typing Loader */}
      {!message.content && !message.reasoning ? (
        <div className="typing-dots-loader">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
        </div>
      ) : (
        <div
          className="chat-markdown"
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
          onClick={handleContentClick}
        />
      )}

      {/* Bottom Action Bar */}
      {message.content && (
        <div className="assistant-toolbar">
        {/* Copy */}
        <button
          type="button"
          className="toolbar-icon-btn"
          onClick={copyAllText}
          title={isCopiedAll ? 'Copied' : 'Copy'}
        >
          {isCopiedAll ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          )}
        </button>

        {/* Read Aloud */}
        <button
          type="button"
          className={`toolbar-icon-btn ${isSpeaking ? 'active' : ''}`}
          onClick={handleReadAloud}
          title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          </svg>
        </button>

        {/* Thumbs Up */}
        <button
          type="button"
          className={`toolbar-icon-btn ${feedback === 'up' ? 'active' : ''}`}
          onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
          title="Good response"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
          </svg>
        </button>

        {/* Thumbs Down */}
        <button
          type="button"
          className={`toolbar-icon-btn ${feedback === 'down' ? 'active' : ''}`}
          onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
          title="Bad response"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path>
          </svg>
        </button>

        {/* Regenerate if latest */}
        {isLast && onRegenerate && (
          <button
            type="button"
            className="toolbar-icon-btn"
            onClick={onRegenerate}
            title="Regenerate"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
          </button>
        )}
      </div>
      )}
    </div>
  );
};
