'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, ChatSession } from '@/features/chat/types';
import { 
  DEFAULT_TOKEN, 
  DEFAULT_MODEL, 
  VISION_MODEL, 
  DEFAULT_SYSTEM_PROMPT,
  AVAILABLE_MODELS
} from '@/config/models';
import { useUIStore } from '@/store/ui.store';
import { Sidebar } from '@/features/chat/components/Sidebar';
import { Navbar } from '@/features/chat/components/Navbar';
import { MessageItem } from '@/features/chat/components/MessageItem';
import { ChatInput } from '@/features/chat/components/ChatInput';
import { ShareModal } from '@/features/chat/components/ShareModal';
import { chatApi } from '@/features/chat/api/chat.api';

// Helper to generate UUIDs matching ChatGPT URLs (/c/6abdecf3-6910-83ee-92d2-8ec621144b4a)
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const PROMPT_SUGGESTIONS = [
  {
    title: 'Code Assistant',
    desc: 'Write clean code, build functions, or debug issues',
    prompt: 'Write a clean, efficient TypeScript function and explain how it works.',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="16 18 22 12 16 6"></polyline>
        <polyline points="8 6 2 12 8 18"></polyline>
      </svg>
    ),
  },
  {
    title: 'Brainstorm Ideas',
    desc: 'Explore creative project, startup, or product concepts',
    prompt: 'Give me 5 innovative, practical startup and project ideas with high potential.',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 18h6"></path>
        <path d="M10 22h4"></path>
        <path d="M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3 6h8c1.5-1.5 3-3.5 3-6a7 7 0 0 0-7-7z"></path>
      </svg>
    ),
  },
  {
    title: 'Explain Concepts',
    desc: 'Break down complex topics into easy, understandable terms',
    prompt: 'Explain how neural networks and modern AI models work in simple terms.',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
    ),
  },
  {
    title: 'Draft & Polish',
    desc: 'Write professional emails, summaries, or structured plans',
    prompt: 'Draft a polite, professional, and persuasive follow-up email.',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 20h9"></path>
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
      </svg>
    ),
  },
];

interface ChatStudioPageProps {
  initialChatId?: string;
}

export default function ChatStudioPage({ initialChatId }: ChatStudioPageProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(initialChatId || null);
  const [token, setToken] = useState<string>(DEFAULT_TOKEN);
  const [systemPrompt, setSystemPrompt] = useState<string>(DEFAULT_SYSTEM_PROMPT);
  const [activeLightboxImg, setActiveLightboxImg] = useState<string | null>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Zustand Store
  const { 
    isSidebarOpen,
    selectedModel, 
    toggleSidebar,
    setSidebarOpen,
    setSelectedModel 
  } = useUIStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize from LocalStorage, environment, and initialChatId
  useEffect(() => {
    const savedToken = localStorage.getItem('hf_app_token') || DEFAULT_TOKEN;
    const savedPrompt = localStorage.getItem('app_system_prompt') || DEFAULT_SYSTEM_PROMPT;
    const savedModel = localStorage.getItem('app_selected_model') || DEFAULT_MODEL;
    const savedSessions = localStorage.getItem('app_chat_sessions');

    setToken(savedToken);
    setSystemPrompt(savedPrompt);
    setSelectedModel(savedModel);

    if (savedSessions) {
      try {
        const parsed: ChatSession[] = JSON.parse(savedSessions);
        const valid = parsed.filter((s) => s.messages && s.messages.length > 0);
        setSessions(valid);

        if (initialChatId) {
          const match = valid.find((s) => s.id === initialChatId);
          if (match) {
            setCurrentSessionId(match.id);
          } else {
            // Load shared chat snapshot from server
            fetch(`/api/share?id=${initialChatId}`)
              .then((res) => (res.ok ? res.json() : null))
              .then((data) => {
                if (data && data.session) {
                  const fetchedSession: ChatSession = data.session;
                  setSessions((prev) => [fetchedSession, ...prev.filter((p) => p.id !== initialChatId)]);
                  setCurrentSessionId(fetchedSession.id);
                }
              })
              .catch((e) => console.error('Failed to load shared chat:', e));
          }
        }
      } catch (e) {
        console.error('Failed to parse sessions from localStorage:', e);
      }
    } else if (initialChatId) {
      fetch(`/api/share?id=${initialChatId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.session) {
            const fetchedSession: ChatSession = data.session;
            setSessions([fetchedSession]);
            setCurrentSessionId(fetchedSession.id);
          }
        })
        .catch((e) => console.error('Failed to load shared chat:', e));
    } else {
      // Create empty initial state without dummy messages
      const initialSessionId = generateUUID();
      const firstSession: ChatSession = {
        id: initialSessionId,
        title: 'New Chat',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setSessions([firstSession]);
      setCurrentSessionId(initialSessionId);
    }
  }, [initialChatId, setSelectedModel]);

  // Sync browser URL dynamically with the active chat session (ChatGPT /c/[id] format)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (currentSessionId) {
      const targetUrl = `/c/${currentSessionId}`;
      if (window.location.pathname !== targetUrl) {
        window.history.replaceState(null, '', targetUrl);
      }
    } else {
      if (window.location.pathname !== '/') {
        window.history.replaceState(null, '', '/');
      }
    }
  }, [currentSessionId]);

  const updateSessions = (newSessions: ChatSession[]) => {
    const valid = newSessions.filter((s) => s.messages && s.messages.length > 0);
    setSessions(valid);
    localStorage.setItem('app_chat_sessions', JSON.stringify(valid));
  };

  const currentSession = sessions.find((s) => s.id === currentSessionId);
  const currentMessages = currentSession?.messages || [];

  // Smooth scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (currentMessages.length > 0) {
      scrollToBottom();
    }
  }, [currentMessages, isGenerating]);

  // Track scroll position
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 150;
    setShowScrollDown(isUp);
  };

  // Stop active AI generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  };

  // Handle New Chat (ChatGPT behavior: resets to '/' empty state without blank clutter)
  const handleNewChat = () => {
    if (isGenerating) {
      handleStopGeneration();
    }
    if (!currentSessionId || currentMessages.length === 0) {
      return;
    }
    const valid = sessions.filter((s) => s.messages && s.messages.length > 0);
    if (valid.length !== sessions.length) {
      updateSessions(valid);
    }
    setCurrentSessionId(null);
  };

  // Handle Delete Session
  const handleDeleteSession = (id: string) => {
    if (isGenerating && currentSessionId === id) {
      handleStopGeneration();
    }
    const updated = sessions.filter((s) => s.id !== id);
    updateSessions(updated);
    if (currentSessionId === id) {
      setCurrentSessionId(updated.length > 0 ? updated[0].id : null);
    }
  };

  // Send Message Logic with Real-time Token Streaming for Instant Responses
  const handleSendMessage = async (text: string, images: string[]) => {
    if (isGenerating) return;

    let activeSessionId = currentSessionId;
    let currentSessionList = [...sessions];

    // If starting from a new chat, generate a UUID like ChatGPT (/c/6abdecf3-6910-83ee-92d2-8ec621144b4a)
    if (!activeSessionId) {
      activeSessionId = generateUUID();
      const newSession: ChatSession = {
        id: activeSessionId,
        title: (images.length > 0 ? '📸 ' : '') + (text ? text.slice(0, 36) : 'Image Analysis'),
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      currentSessionList = [newSession, ...currentSessionList];
      setCurrentSessionId(activeSessionId);
    }

    // Auto-switch to Vision model if images attached and current model is not vision-capable
    let modelToUse = selectedModel;
    const isCurrentModelVision = AVAILABLE_MODELS.find((m) => m.id === selectedModel)?.isVision;
    if (images.length > 0 && !isCurrentModelVision) {
      modelToUse = VISION_MODEL;
      setSelectedModel(VISION_MODEL);
    }

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text || (images.length > 1 ? 'Analyze and compare these images.' : 'Analyze this image.'),
      images: images.length > 0 ? images : undefined,
      timestamp: Date.now(),
    };

    const assistantMsgId = `msg_${Date.now() + 1}`;
    const initialAssistantMessage: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      reasoning: undefined,
      model: modelToUse,
      timestamp: Date.now(),
    };

    const sessionIndex = currentSessionList.findIndex((s) => s.id === activeSessionId);
    if (sessionIndex !== -1) {
      if (currentSessionList[sessionIndex].messages.length === 0) {
        currentSessionList[sessionIndex].title = 
          (images.length > 0 ? '📸 ' : '') + userMessage.content.slice(0, 36);
      }
      currentSessionList[sessionIndex].messages.push(userMessage);
      currentSessionList[sessionIndex].messages.push(initialAssistantMessage);
      currentSessionList[sessionIndex].updatedAt = Date.now();
    }

    updateSessions([...currentSessionList]);

    const payloadMessages = [
      { role: 'system', content: systemPrompt },
      ...currentSessionList[sessionIndex].messages
        .filter((m) => m.id !== assistantMsgId)
        .map((m) => ({
          role: m.role,
          content: m.content,
          images: m.images,
        })),
    ];

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsGenerating(true);

    let accumulatedContent = '';
    let accumulatedReasoning = '';

    await chatApi.streamMessage({
      payload: {
        messages: payloadMessages,
        model: modelToUse,
        token: token,
      },
      signal: controller.signal,
      onDelta: (chunk) => {
        accumulatedContent += chunk;

        // Auto-extract <think>...</think> if model streams it in content (like DeepSeek R1)
        let displayContent = accumulatedContent;
        let displayReasoning = accumulatedReasoning;

        const thinkMatch = displayContent.match(/<think>([\s\S]*?)(?:<\/think>|$)/);
        if (thinkMatch) {
          displayReasoning = thinkMatch[1].trim();
          displayContent = displayContent.replace(/<think>[\s\S]*?<\/think>/, '').trimStart();
          if (displayContent.startsWith('<think>')) {
            displayContent = '';
          }
        }

        setSessions((prev) => {
          return prev.map((s) => {
            if (s.id !== activeSessionId) return s;
            const updatedMsgs = s.messages.map((m) => {
              if (m.id !== assistantMsgId) return m;
              return {
                ...m,
                content: displayContent,
                reasoning: displayReasoning || undefined,
              };
            });
            return { ...s, messages: updatedMsgs, updatedAt: Date.now() };
          });
        });
      },
      onReasoningDelta: (chunk) => {
        accumulatedReasoning += chunk;
        setSessions((prev) => {
          return prev.map((s) => {
            if (s.id !== activeSessionId) return s;
            const updatedMsgs = s.messages.map((m) => {
              if (m.id !== assistantMsgId) return m;
              return {
                ...m,
                reasoning: accumulatedReasoning,
              };
            });
            return { ...s, messages: updatedMsgs, updatedAt: Date.now() };
          });
        });
      },
      onDone: () => {
        setIsGenerating(false);
        abortControllerRef.current = null;
        setTimeout(() => {
          setSessions((prev) => {
            localStorage.setItem('app_chat_sessions', JSON.stringify(prev));
            return prev;
          });
        }, 50);
      },
      onError: (err) => {
        setIsGenerating(false);
        abortControllerRef.current = null;
        if (err.name === 'AbortError') return;
        setSessions((prev) => {
          const updated = prev.map((s) => {
            if (s.id !== activeSessionId) return s;
            const updatedMsgs = s.messages.map((m) => {
              if (m.id !== assistantMsgId) return m;
              return {
                ...m,
                content: accumulatedContent || `⚠️ **Error:** ${err.message || 'Failed to retrieve response from AI.'}`,
              };
            });
            return { ...s, messages: updatedMsgs };
          });
          localStorage.setItem('app_chat_sessions', JSON.stringify(updated));
          return updated;
        });
      },
    });
  };

  // Regenerate last response
  const handleRegenerate = () => {
    if (isGenerating || currentMessages.length === 0) return;

    const lastUserMessage = [...currentMessages].reverse().find((m) => m.role === 'user');
    if (!lastUserMessage) return;

    const updatedMessages = [...currentMessages];
    if (updatedMessages[updatedMessages.length - 1].role === 'assistant') {
      updatedMessages.pop();
    }

    const currentSessionList = sessions.map((s) => {
      if (s.id === currentSessionId) {
        return { ...s, messages: updatedMessages };
      }
      return s;
    });

    updateSessions(currentSessionList);
    handleSendMessage(lastUserMessage.content, lastUserMessage.images || []);
  };

  // Handle clicking Share button: persist session to server API and open modal
  const handleShareClick = () => {
    if (!currentSession) return;
    fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session: currentSession }),
    }).catch((e) => console.error('Share sync error:', e));

    setIsShareModalOpen(true);
  };

  const isHomeEmpty = !currentSessionId || currentMessages.length === 0;

  return (
    <div className="chat-app-root">
      {/* Sidebar: Handles both Open 260px and Collapsed slim rail 52px */}
      <Sidebar
        isOpen={isSidebarOpen}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={(id) => setCurrentSessionId(id)}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onToggleSidebar={toggleSidebar}
        onCloseMobile={() => setSidebarOpen(false)}
      />

      {/* Main Workspace */}
      <main className="chat-workspace">
        <Navbar
          hasMessages={currentMessages.length > 0}
          onShare={handleShareClick}
        />

        {/* Home Empty State */}
        {isHomeEmpty ? (
          <div className="home-centered-hero">
            <h1 className="home-hero-greeting">Hello Chief, how can I help you today?</h1>
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isGenerating}
              onStopGeneration={handleStopGeneration}
              selectedModel={selectedModel}
              onSelectModel={setSelectedModel}
            />

            {/* Quick Suggestion Cards */}
            <div className="home-suggestions-grid">
              {PROMPT_SUGGESTIONS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="home-suggestion-card"
                  onClick={() => handleSendMessage(item.prompt, [])}
                >
                  <div className="suggestion-icon-title">
                    <span className="suggestion-icon">{item.icon}</span>
                    <span className="suggestion-title">{item.title}</span>
                  </div>
                  <div className="suggestion-desc">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Active Chat Feed */
          <>
            <div 
              className="chat-scroll-area" 
              ref={scrollContainerRef}
              onScroll={handleScroll}
            >
              <div className="chat-center-column">
                {currentMessages.map((msg, index) => (
                  <MessageItem
                    key={msg.id}
                    message={msg}
                    isLast={index === currentMessages.length - 1}
                    onRegenerate={handleRegenerate}
                    onImageClick={(url) => setActiveLightboxImg(url)}
                  />
                ))}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Floating Down-Arrow Button (↓) */}
            {showScrollDown && (
              <button
                type="button"
                className="floating-scroll-down-btn"
                onClick={() => scrollToBottom('smooth')}
                title="Scroll to bottom"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <polyline points="19 12 12 19 5 12"></polyline>
                </svg>
              </button>
            )}

            {/* Bottom Input Dock */}
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isGenerating}
              onStopGeneration={handleStopGeneration}
              selectedModel={selectedModel}
              onSelectModel={setSelectedModel}
            />
          </>
        )}
      </main>

      {/* Share Modal Dialog */}
      {currentSession && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          chatId={currentSession.id}
          chatTitle={currentSession.title}
        />
      )}

      {/* Image Lightbox Backdrop */}
      {activeLightboxImg && (
        <div className="image-lightbox-backdrop" onClick={() => setActiveLightboxImg(null)}>
          <img src={activeLightboxImg} alt="Enlarged screenshot" />
        </div>
      )}
    </div>
  );
}
