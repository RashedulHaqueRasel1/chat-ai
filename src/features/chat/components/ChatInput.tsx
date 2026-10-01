'use client';

import React, { useRef, useState, useEffect } from 'react';
import { AVAILABLE_MODELS } from '@/config/models';

interface ChatInputProps {
  onSendMessage: (text: string, images: string[]) => void;
  isLoading: boolean;
  onStopGeneration?: () => void;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  onStopGeneration,
  selectedModel,
  onSelectModel,
}) => {
  const [input, setInput] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);

  // Close model menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
        setIsModelMenuOpen(false);
      }
    };
    if (isModelMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isModelMenuOpen]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    addFiles(Array.from(files));
    e.target.value = '';
  };

  const addFiles = (files: File[]) => {
    const validImageFiles = files.filter((f) => f.type.startsWith('image/'));

    if (validImageFiles.length === 0) {
      alert('Please select valid image files (JPG, PNG, WebP).');
      return;
    }

    validImageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const base64 = evt.target?.result as string;
        if (base64) {
          setSelectedImages((prev) => [...prev, base64]);
        }
      };
      reader.readAsDataURL(file);
    });

    textareaRef.current?.focus();
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (isLoading) return;
    if (!input.trim() && selectedImages.length === 0) return;

    onSendMessage(input.trim(), selectedImages);
    setInput('');
    setSelectedImages([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // Clipboard paste support (e.g. screenshot paste via Ctrl+V)
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }

    if (files.length > 0) {
      addFiles(files);
    }
  };

  // Speech-to-text recognition
  const toggleSpeech = () => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice typing is not supported in this browser. Please use Google Chrome.');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'bn-BD';
      recognition.interimResults = false;

      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? prev + ' ' + transcript : transcript));
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);

      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  const hasContent = Boolean(input.trim() || selectedImages.length > 0);
  const activeModelObj = AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];
  const isDeepSeek = selectedModel.includes('DeepSeek-R1');

  return (
    <div className="input-pill-dock">
      {/* Attached Images Tray */}
      {selectedImages.length > 0 && (
        <div className="pill-attached-images-tray">
          {selectedImages.map((img, idx) => (
            <div key={idx} className="pill-attached-chip">
              <img src={img} alt={`Preview ${idx + 1}`} />
              <button
                type="button"
                className="chip-del-btn"
                onClick={() => handleRemoveImage(idx)}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Pill */}
      <div className="chatgpt-input-pill">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Plus / Attachment Button on Left */}
        <button
          type="button"
          className="input-attach-plus-btn"
          title="Attach photos or files"
          onClick={() => fileInputRef.current?.click()}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>

        {/* Text Input Field */}
        <textarea
          ref={textareaRef}
          className="chatgpt-input-field"
          rows={1}
          value={input}
          placeholder="Ask anything"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
        />

        {/* Right Tools Group (Model Selector in Think Button, Mic, Voice Waveform) */}
        <div className="input-right-tools">
          {/* Model Selector / Think Pill Button */}
          <div style={{ position: 'relative' }} ref={modelMenuRef}>
            <button
              type="button"
              className={`think-mode-pill ${isDeepSeek ? 'active' : ''}`}
              onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
              title="Select Model / Reasoning"
            >
              {/* Brain / Lightbulb Icon */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9"></circle>
                <path d="M9 12h6"></path>
                <path d="M12 9v6"></path>
              </svg>
              <span>{activeModelObj.name}</span>
              {/* Small Down Chevron */}
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {/* Model Selection Dropdown (Floating upward from the input pill) */}
            {isModelMenuOpen && (
              <div className="input-model-popover-menu">
                <div className="popover-title-row">
                  <span>Select Model</span>
                  <span style={{ fontSize: '11px', color: '#71717a' }}>{AVAILABLE_MODELS.length} models</span>
                </div>

                <div className="popover-models-scroll">
                  {AVAILABLE_MODELS.map((m, idx) => {
                    const isSelected = m.id === selectedModel;
                    const prevCategory = idx > 0 ? AVAILABLE_MODELS[idx - 1].category : null;
                    const isNewCategory = m.category !== prevCategory;

                    const categoryLabels: Record<string, string> = {
                      chat: 'Flagship Chat',
                      fast: 'Ultra Fast',
                      vision: 'Any-to-Any & Vision',
                      reasoning: 'Deep Reasoning',
                      coding: 'Coding Specialist',
                    };

                    return (
                      <React.Fragment key={m.id}>
                        {isNewCategory && (
                          <div className="popover-category-heading">
                            {categoryLabels[m.category] || m.category}
                          </div>
                        )}
                        <button
                          type="button"
                          className={`popover-model-row ${isSelected ? 'active' : ''}`}
                          onClick={() => {
                            onSelectModel(m.id);
                            setIsModelMenuOpen(false);
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 500, color: '#ffffff' }}>
                              {m.name}
                            </div>
                            <span style={{ fontSize: '11px', color: '#8e8e93' }}>{m.description}</span>
                          </div>
                          {isSelected && <span style={{ color: '#22c55e', fontSize: '14px', fontWeight: 700 }}>✓</span>}
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Microphone Button */}
          <button
            type="button"
            className={`mic-icon-btn ${isRecording ? 'recording' : ''}`}
            onClick={toggleSpeech}
            title={isRecording ? 'Recording...' : 'Voice Input'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          </button>

          {/* Blue Circular Voice Mode Button (or Send Button) */}
          {isLoading ? (
            <button
              type="button"
              className="stop-generation-circle-btn"
              title="Stop generating"
              onClick={onStopGeneration}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <rect x="4" y="4" width="16" height="16" rx="2"></rect>
              </svg>
            </button>
          ) : hasContent ? (
            <button
              type="button"
              className="send-arrow-circle-btn"
              title="Send"
              onClick={handleSubmit}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="19" x2="12" y2="5"></line>
                <polyline points="5 12 12 5 19 12"></polyline>
              </svg>
            </button>
          ) : (
            <button
              type="button"
              className="voice-wave-circle-btn"
              title="Voice Mode"
              onClick={toggleSpeech}
            >
              {/* Vertical Soundwave Bars */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="10" width="3" height="4" rx="1.5"></rect>
                <rect x="8.5" y="6" width="3" height="12" rx="1.5"></rect>
                <rect x="14" y="8" width="3" height="8" rx="1.5"></rect>
                <rect x="19.5" y="11" width="3" height="2" rx="1"></rect>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
