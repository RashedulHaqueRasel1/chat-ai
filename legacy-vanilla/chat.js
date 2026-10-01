// Multi-Model AI Chat Application Logic (Qwen, DeepSeek, Llama)

// Default configuration (loaded from user settings or environment)
const DEFAULT_TOKEN = "";
const DEFAULT_MODEL = "Qwen/Qwen2.5-72B-Instruct";
const API_URL = "https://router.huggingface.co/v1/chat/completions";

// Model Metadata
const MODEL_CONFIGS = {
  "Qwen/Qwen2.5-VL-72B-Instruct": { name: "Qwen 2.5 VL (Vision)", icon: "👁️", color: "#ec4899" },
  "Qwen/Qwen2.5-72B-Instruct": { name: "Qwen 2.5 72B", icon: "🌟", color: "#6366f1" },
  "Qwen/Qwen3.8-27B": { name: "Qwen 3.8 27B", icon: "🔥", color: "#f97316" },
  "deepseek-ai/DeepSeek-V3": { name: "DeepSeek V3", icon: "⚡", color: "#06b6d4" },
  "deepseek-ai/DeepSeek-R1": { name: "DeepSeek R1", icon: "🧠", color: "#a855f7" },
  "meta-llama/Llama-3.3-70B-Instruct": { name: "Llama 3.3 70B", icon: "🦙", color: "#3b82f6" },
  "meta-llama/Llama-3.1-8B-Instruct": { name: "Llama 3.1 8B", icon: "🚀", color: "#10b981" },
  "google/gemma-3-27b-it": { name: "Google Gemma 3 27B", icon: "💎", color: "#4285f4" },
  "MiniMaxAI/MiniMax-M2.5": { name: "MiniMax M2.5", icon: "🎬", color: "#ec4899" },
  "microsoft/phi-4": { name: "Microsoft Phi-4", icon: "🔬", color: "#14b8a6" },
  "Qwen/Qwen2.5-Coder-32B-Instruct": { name: "Qwen 2.5 Coder 32B", icon: "💻", color: "#8b5cf6" }
};

// Default System Prompt
const DEFAULT_SYSTEM_PROMPT = "You are a helpful, brilliant, and friendly AI assistant. You answer questions accurately with clear formatting, and you are fluent in both Bengali (বাংলা) and English. When analyzing images, provide clear descriptions and insights.";

// State
let currentChatId = null;
let chatSessions = [];
let isGenerating = false;
let currentModel = localStorage.getItem("selected_ai_model") || DEFAULT_MODEL;
let selectedImageBase64 = null;

// DOM Elements
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const newChatBtn = document.getElementById("newChatBtn");
const historyList = document.getElementById("historyList");
const clearChatBtn = document.getElementById("clearChatBtn");
const modelSelect = document.getElementById("modelSelect");

const chatMessages = document.getElementById("chatMessages");
const welcomeScreen = document.getElementById("welcomeScreen");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");

// Image Attachment Elements
const attachBtn = document.getElementById("attachBtn");
const imageFileInput = document.getElementById("imageFileInput");
const imagePreviewContainer = document.getElementById("imagePreviewContainer");
const imagePreview = document.getElementById("imagePreview");
const removeImageBtn = document.getElementById("removeImageBtn");

// Settings Modal Elements
const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settingsModal");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");
const hfTokenInput = document.getElementById("hfTokenInput");
const systemPromptInput = document.getElementById("systemPromptInput");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const resetSettingsBtn = document.getElementById("resetSettingsBtn");

// Initialize on Load
document.addEventListener("DOMContentLoaded", () => {
  initStorage();
  setupEventListeners();
  loadSessions();
  startNewChat();
});

function initStorage() {
  // Save default token if none exists
  if (!localStorage.getItem("hf_chat_token")) {
    localStorage.setItem("hf_chat_token", DEFAULT_TOKEN);
  }
  if (!localStorage.getItem("system_prompt")) {
    localStorage.setItem("system_prompt", DEFAULT_SYSTEM_PROMPT);
  }

  hfTokenInput.value = localStorage.getItem("hf_chat_token");
  systemPromptInput.value = localStorage.getItem("system_prompt");
}

function setupEventListeners() {
  // Mobile Sidebar Toggle
  sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });

  // Close sidebar on message area click (mobile)
  chatMessages.addEventListener("click", () => {
    if (window.innerWidth <= 768) sidebar.classList.remove("open");
  });

  // New Chat
  newChatBtn.addEventListener("click", () => {
    startNewChat();
    if (window.innerWidth <= 768) sidebar.classList.remove("open");
  });

  // Clear current chat
  clearChatBtn.addEventListener("click", () => {
    if (confirm("আপনি কি বর্তমান চ্যাটের সকল মেসেজ মুছে ফেলতে চান?")) {
      startNewChat();
    }
  });

  // Input Auto-expand & Enter handling
  chatInput.addEventListener("input", () => {
    chatInput.style.height = "auto";
    chatInput.style.height = Math.min(chatInput.scrollHeight, 160) + "px";
    sendBtn.disabled = chatInput.value.trim().length === 0 || isGenerating;
  });

  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled) {
        handleSendMessage();
      }
    }
  });

  // Send Button Click
  sendBtn.addEventListener("click", handleSendMessage);

  // Image Upload Listeners
  if (attachBtn && imageFileInput) {
    attachBtn.addEventListener("click", () => imageFileInput.click());
    imageFileInput.addEventListener("change", handleImageSelection);
    removeImageBtn.addEventListener("click", clearImageSelection);

    // Paste image from clipboard
    document.addEventListener("paste", (e) => {
      const items = e.clipboardData && e.clipboardData.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          processImageFile(file);
          break;
        }
      }
    });

    // Drag & Drop image
    chatInput.addEventListener("dragover", (e) => e.preventDefault());
    chatInput.addEventListener("drop", (e) => {
      e.preventDefault();
      const files = e.dataTransfer && e.dataTransfer.files;
      if (files && files[0] && files[0].type.startsWith("image/")) {
        processImageFile(files[0]);
      }
    });
  }

  // Model Select Change
  if (modelSelect) {
    modelSelect.value = currentModel;
    modelSelect.addEventListener("change", () => {
      currentModel = modelSelect.value;
      localStorage.setItem("selected_ai_model", currentModel);
    });
  }

  // Prompt Suggestion Cards
  document.querySelectorAll(".prompt-card").forEach(card => {
    card.addEventListener("click", () => {
      const prompt = card.dataset.prompt;
      if (prompt) {
        chatInput.value = prompt;
        chatInput.style.height = "auto";
        sendBtn.disabled = false;
        handleSendMessage();
      }
    });
  });

  // Settings Modal Handlers
  settingsBtn.addEventListener("click", () => settingsModal.classList.remove("hidden"));
  closeSettingsBtn.addEventListener("click", () => settingsModal.classList.add("hidden"));
  settingsModal.addEventListener("click", (e) => {
    if (e.target === settingsModal) settingsModal.classList.add("hidden");
  });

  saveSettingsBtn.addEventListener("click", () => {
    const token = hfTokenInput.value.trim();
    const sysPrompt = systemPromptInput.value.trim();
    if (token) localStorage.setItem("hf_chat_token", token);
    if (sysPrompt) localStorage.setItem("system_prompt", sysPrompt);
    settingsModal.classList.add("hidden");
    alert("সেটিংস সফলভাবে সংরক্ষিত হয়েছে!");
  });

  resetSettingsBtn.addEventListener("click", () => {
    hfTokenInput.value = DEFAULT_TOKEN;
    systemPromptInput.value = DEFAULT_SYSTEM_PROMPT;
    localStorage.setItem("hf_chat_token", DEFAULT_TOKEN);
    localStorage.setItem("system_prompt", DEFAULT_SYSTEM_PROMPT);
    alert("ডিফল্ট সেটিংসে ফিরিয়ে নেওয়া হয়েছে।");
  });
}

// Session Management
function loadSessions() {
  const saved = localStorage.getItem("qwen_chat_sessions");
  chatSessions = saved ? JSON.parse(saved) : [];
  renderHistoryList();
}

function saveSessions() {
  localStorage.setItem("qwen_chat_sessions", JSON.stringify(chatSessions));
  renderHistoryList();
}

function startNewChat() {
  currentChatId = "chat_" + Date.now();
  renderCurrentChat([]);
  chatInput.value = "";
  chatInput.style.height = "auto";
  sendBtn.disabled = true;
  chatInput.focus();
}

function renderHistoryList() {
  historyList.innerHTML = "";
  if (chatSessions.length === 0) {
    historyList.innerHTML = '<div style="padding: 10px; font-size: 0.8rem; color: #64748b;">কোনো হিস্ট্রি নেই</div>';
    return;
  }

  chatSessions.forEach(session => {
    const item = document.createElement("div");
    item.className = `history-item ${session.id === currentChatId ? "active" : ""}`;
    item.innerHTML = `
      <span class="history-item-title">${escapeHTML(session.title || "নতুন বার্তা")}</span>
      <button class="history-item-delete" title="মুছে ফেলুন">&times;</button>
    `;

    item.addEventListener("click", (e) => {
      if (e.target.classList.contains("history-item-delete")) {
        deleteSession(session.id);
        return;
      }
      loadSessionById(session.id);
    });

    historyList.appendChild(item);
  });
}

function loadSessionById(id) {
  const session = chatSessions.find(s => s.id === id);
  if (!session) return;
  currentChatId = id;
  renderCurrentChat(session.messages || []);
  renderHistoryList();
  if (window.innerWidth <= 768) sidebar.classList.remove("open");
}

function deleteSession(id) {
  chatSessions = chatSessions.filter(s => s.id !== id);
  saveSessions();
  if (currentChatId === id) {
    startNewChat();
  }
}

// Image File Helpers
function handleImageSelection(e) {
  const file = e.target.files && e.target.files[0];
  if (file) processImageFile(file);
}

function processImageFile(file) {
  if (!file.type.startsWith("image/")) {
    alert("অনুগ্রহ করে একটি ইমেজ ফাইল (JPG/PNG/WebP) সিলেক্ট করুন!");
    return;
  }

  // 10MB limit check
  if (file.size > 10 * 1024 * 1024) {
    alert("ছবির সাইজ ১০MB এর চেয়ে কম হতে হবে!");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(evt) {
    selectedImageBase64 = evt.target.result;
    imagePreview.src = selectedImageBase64;
    imagePreviewContainer.classList.remove("hidden");

    // Automatically switch to Qwen Vision model
    currentModel = "Qwen/Qwen2.5-VL-72B-Instruct";
    if (modelSelect) modelSelect.value = currentModel;
    localStorage.setItem("selected_ai_model", currentModel);

    sendBtn.disabled = false;
    chatInput.focus();
  };
  reader.readAsDataURL(file);
}

function clearImageSelection() {
  selectedImageBase64 = null;
  imagePreview.src = "";
  imagePreviewContainer.classList.add("hidden");
  imageFileInput.value = "";
  sendBtn.disabled = chatInput.value.trim().length === 0;
}

// Session Management
function renderCurrentChat(messages) {
  chatMessages.innerHTML = "";

  if (!messages || messages.length === 0) {
    chatMessages.appendChild(welcomeScreen);
    welcomeScreen.style.display = "block";
    return;
  }

  welcomeScreen.style.display = "none";

  messages.forEach(msg => {
    appendMessageUI(msg.role, msg.content, msg.model || currentModel, msg.reasoning || null, msg.image || null);
  });

  scrollToBottom();
}

function appendMessageUI(role, content, modelKey = currentModel, reasoning = null, image = null) {
  welcomeScreen.style.display = "none";

  const row = document.createElement("div");
  row.className = `message-row ${role}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  const modelInfo = MODEL_CONFIGS[modelKey] || { icon: "⚡" };
  avatar.textContent = role === "user" ? "👤" : modelInfo.icon;

  const contentBox = document.createElement("div");
  contentBox.className = "message-content";

  if (role === "user") {
    if (image) {
      const imgEl = document.createElement("img");
      imgEl.src = image;
      imgEl.className = "message-image";
      imgEl.alt = "Uploaded image";
      contentBox.appendChild(imgEl);
    }
    const textNode = document.createElement("div");
    textNode.textContent = content;
    contentBox.appendChild(textNode);
  } else {
    let html = "";
    if (reasoning) {
      html += `
        <div class="reasoning-box">
          <div class="reasoning-toggle" onclick="this.nextElementSibling.classList.toggle('hidden')">
            🧠 চিন্তাভাবনা প্রক্রিয়া (Thought Process) ▾
          </div>
          <div class="reasoning-content">${escapeHTML(reasoning)}</div>
        </div>
      `;
    }
    html += formatMarkdown(content);
    contentBox.innerHTML = html;
    setupCodeCopyButtons(contentBox);
  }

  row.appendChild(avatar);
  row.appendChild(contentBox);

  chatMessages.appendChild(row);
  scrollToBottom();
  return contentBox;
}

function showTypingIndicator() {
  const row = document.createElement("div");
  row.className = "message-row assistant typing-row";
  row.id = "typingIndicator";

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  const modelInfo = MODEL_CONFIGS[currentModel] || { icon: "⚡" };
  avatar.textContent = modelInfo.icon;

  const contentBox = document.createElement("div");
  contentBox.className = "message-content";
  contentBox.innerHTML = `
    <div class="typing-indicator">
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="dot"></div>
    </div>
  `;

  row.appendChild(avatar);
  row.appendChild(contentBox);
  chatMessages.appendChild(row);
  scrollToBottom();
}

function removeTypingIndicator() {
  const el = document.getElementById("typingIndicator");
  if (el) el.remove();
}

function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Message Sending & API Flow
async function handleSendMessage() {
  const text = chatInput.value.trim();
  const imageToSend = selectedImageBase64;

  if (!text && !imageToSend) return;
  if (isGenerating) return;

  const token = localStorage.getItem("hf_chat_token") || DEFAULT_TOKEN;
  const systemPrompt = localStorage.getItem("system_prompt") || DEFAULT_SYSTEM_PROMPT;

  // If image is attached, auto switch to Qwen Vision model
  if (imageToSend && currentModel !== "Qwen/Qwen2.5-VL-72B-Instruct") {
    currentModel = "Qwen/Qwen2.5-VL-72B-Instruct";
    if (modelSelect) modelSelect.value = currentModel;
    localStorage.setItem("selected_ai_model", currentModel);
  }

  const promptText = text || "অনুগ্রহ করে এই ছবিটি বিস্তারিতভাবে ব্যাখ্যা ও বিশ্লেষণ করো।";

  // Append user message with image to UI
  appendMessageUI("user", promptText, currentModel, null, imageToSend);
  chatInput.value = "";
  chatInput.style.height = "auto";
  sendBtn.disabled = true;

  // Clear preview
  clearImageSelection();

  // Find or create current session
  let session = chatSessions.find(s => s.id === currentChatId);
  if (!session) {
    session = {
      id: currentChatId,
      title: (imageToSend ? "📸 " : "") + (promptText.slice(0, 30) + (promptText.length > 30 ? "..." : "")),
      messages: [],
      createdAt: Date.now()
    };
    chatSessions.unshift(session);
  }

  // Push to session
  session.messages.push({ 
    role: "user", 
    content: promptText,
    image: imageToSend
  });
  saveSessions();

  // Show typing indicator
  isGenerating = true;
  showTypingIndicator();

  // Prepare full conversation messages for the AI model
  const apiMessages = [
    { role: "system", content: systemPrompt }
  ];

  session.messages.forEach(m => {
    if (m.role === "user" && m.image) {
      apiMessages.push({
        role: "user",
        content: [
          { type: "text", text: m.content },
          { type: "image_url", image_url: { url: m.image } }
        ]
      });
    } else {
      apiMessages.push({ role: m.role, content: m.content });
    }
  });

  try {
    const replyObj = await callQwenAPI(apiMessages, token, currentModel);
    removeTypingIndicator();
    appendMessageUI("assistant", replyObj.content, currentModel, replyObj.reasoning);

    session.messages.push({ 
      role: "assistant", 
      content: replyObj.content, 
      model: currentModel,
      reasoning: replyObj.reasoning 
    });
    saveSessions();
  } catch (err) {
    removeTypingIndicator();
    appendMessageUI("assistant", `⚠️ **ত্রুটি হয়েছে:** ${err.message || "সার্ভার থেকে উত্তর পাওয়া যায়নি। আপনার টোকেনটি চেক করুন।"}`, currentModel);
  } finally {
    isGenerating = false;
    sendBtn.disabled = chatInput.value.trim().length === 0 && !selectedImageBase64;
    chatInput.focus();
  }
}

// Hugging Face Router API Call (Supports multiple models)
async function callQwenAPI(messages, token, model = currentModel) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      max_tokens: 1500,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const errMsg = errData.error?.message || errData.error || errData.message || `HTTP ${response.status}`;
    throw new Error(errMsg);
  }

  const data = await response.json();
  if (data.choices && data.choices[0] && data.choices[0].message) {
    return {
      content: data.choices[0].message.content || "",
      reasoning: data.choices[0].message.reasoning_content || null
    };
  }
  throw new Error("অনাকাঙ্ক্ষিত ফরম্যাটে রেসপন্স এসেছে।");
}

// Markdown Parser Helper
function formatMarkdown(text) {
  if (!text) return "";

  // 1. Code blocks with language
  text = text.replace(/```([a-zA-Z0-9_\-\+]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const language = lang.trim() || "code";
    return `
      <pre>
        <div class="code-header">
          <span>${language}</span>
          <button class="copy-code-btn" data-code="${escapeAttribute(code.trim())}">
            📋 কপি করুন
          </button>
        </div>
        <code>${escapeHTML(code.trim())}</code>
      </pre>
    `;
  });

  // 2. Inline code
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");

  // 3. Bold text
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  // 4. Line breaks to paragraphs
  const paragraphs = text.split(/\n\n+/);
  return paragraphs.map(p => {
    // If it's already a <pre> block, don't wrap in <p>
    if (p.trim().startsWith("<pre>")) return p;
    return `<p>${p.replace(/\n/g, "<br>")}</p>`;
  }).join("");
}

function setupCodeCopyButtons(container) {
  container.querySelectorAll(".copy-code-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const code = btn.getAttribute("data-code");
      navigator.clipboard.writeText(code).then(() => {
        const originalText = btn.innerHTML;
        btn.innerHTML = "✓ কপি হয়েছে!";
        btn.style.color = "#34d399";
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.style.color = "";
        }, 2000);
      });
    });
  });
}

function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(str) {
  return str
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
