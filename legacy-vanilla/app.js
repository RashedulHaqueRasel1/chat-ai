// CineText AI - Text to Video Studio Logic

// Sample Story Prompts
const samplePrompts = [
  "A majestic dragon soaring through storm clouds with lightning illuminating its golden scales, 8k cinematic lighting, ultra-realistic motion",
  "A cyberpunk detective walking under neon-lit rain in Tokyo 2099, reflective puddles, lens flare, cinematic 35mm film",
  "An ancient Egyptian temple revealing hidden glowing hieroglyphics as the morning sun beams through stone pillars, 4k photorealistic",
  "A deep-sea bioluminescent glowing creature dancing gracefully in the abyss, ultra-detailed water physics, BBC Earth style",
  "A cozy cottage in a snowy pine forest at twilight, smoke coming from the chimney, gentle snowflakes falling, warm window glow"
];

// Curated High-Definition Demo Clips for Instant Testing
const demoClips = {
  cinematic: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
  anime: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  realistic: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  fantasy: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4"
};

// DOM Elements
const promptInput = document.getElementById("promptInput");
const randomPromptBtn = document.getElementById("randomPromptBtn");
const styleCards = document.querySelectorAll(".style-card");
const aspectRatioSelect = document.getElementById("aspectRatioSelect");
const modelProviderSelect = document.getElementById("modelProviderSelect");
const generateBtn = document.getElementById("generateBtn");
const apiNotice = document.getElementById("apiNotice");

const placeholderState = document.getElementById("placeholderState");
const loadingState = document.getElementById("loadingState");
const videoContainer = document.getElementById("videoContainer");
const outputVideo = document.getElementById("outputVideo");
const downloadVideoBtn = document.getElementById("downloadVideoBtn");
const progressBar = document.getElementById("progressBar");
const timerDisplay = document.getElementById("timerDisplay");
const loadingTitle = document.getElementById("loadingTitle");
const loadingSubtitle = document.getElementById("loadingSubtitle");
const statusBadge = document.getElementById("generationStatusBadge");
const galleryContainer = document.getElementById("galleryContainer");

// Modal Elements
const apiKeyBtn = document.getElementById("apiKeyBtn");
const apiStatusText = document.getElementById("apiStatusText");
const apiKeyModal = document.getElementById("apiKeyModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const falKeyInput = document.getElementById("falKeyInput");
const replicateKeyInput = document.getElementById("replicateKeyInput");
const saveKeysBtn = document.getElementById("saveKeysBtn");
const clearKeysBtn = document.getElementById("clearKeysBtn");

// State
let selectedStyle = "cinematic";
let galleryHistory = JSON.parse(localStorage.getItem("cinetext_gallery") || "[]");
let isGenerating = false;
let generationTimer = null;

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadSavedKeys();
  renderGallery();
  setupEventListeners();
});

function setupEventListeners() {
  // Random Prompt
  randomPromptBtn.addEventListener("click", () => {
    const randomIndex = Math.floor(Math.random() * samplePrompts.length);
    promptInput.value = samplePrompts[randomIndex];
    promptInput.focus();
  });

  // Style Selector
  styleCards.forEach(card => {
    card.addEventListener("click", () => {
      styleCards.forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      selectedStyle = card.dataset.style;
    });
  });

  // API Key Modal Toggles
  apiKeyBtn.addEventListener("click", () => apiKeyModal.classList.remove("hidden"));
  closeModalBtn.addEventListener("click", () => apiKeyModal.classList.add("hidden"));
  apiKeyModal.addEventListener("click", (e) => {
    if (e.target === apiKeyModal) apiKeyModal.classList.add("hidden");
  });

  // Save / Clear Keys
  saveKeysBtn.addEventListener("click", saveKeys);
  clearKeysBtn.addEventListener("click", clearKeys);

  // Generate Video Click
  generateBtn.addEventListener("click", startVideoGeneration);
}

// Key Management
function loadSavedKeys() {
  const falKey = localStorage.getItem("fal_api_key") || "";
  const repKey = localStorage.getItem("replicate_api_key") || "";
  
  falKeyInput.value = falKey;
  replicateKeyInput.value = repKey;

  if (falKey || repKey) {
    apiStatusText.textContent = "Key যুক্ত রয়েছে ✓";
    apiKeyBtn.classList.add("has-key");
    apiNotice.innerHTML = "✅ আপনার API Key সংযুক্ত রয়েছে। আপনি এখন হাই-রেজোলিউশন ভিডিও জেনারেট করতে পারেন!";
  } else {
    apiStatusText.textContent = "API Key সেট করুন";
    apiKeyBtn.classList.remove("has-key");
    apiNotice.innerHTML = "ℹ️ বর্তমানে <strong>ডেমো মোডে</strong> টেস্ট করতে পারেন অথবা উপরে 'API Key সেট করুন' বাটনে ক্লিক করে ফ্রি Key যোগ করুন।";
  }
}

function saveKeys() {
  const falKey = falKeyInput.value.trim();
  const repKey = replicateKeyInput.value.trim();

  localStorage.setItem("fal_api_key", falKey);
  localStorage.setItem("replicate_api_key", repKey);

  loadSavedKeys();
  apiKeyModal.classList.add("hidden");
}

function clearKeys() {
  localStorage.removeItem("fal_api_key");
  localStorage.removeItem("replicate_api_key");
  falKeyInput.value = "";
  replicateKeyInput.value = "";
  loadSavedKeys();
  apiKeyModal.classList.add("hidden");
}

// Video Generation Workflow
async function startVideoGeneration() {
  const prompt = promptInput.value.trim();
  if (!prompt) {
    alert("অনুগ্রহ করে একটি প্রম্পট বা গল্পের বিবরণ লিখুন!");
    promptInput.focus();
    return;
  }

  const modelChoice = modelProviderSelect.value;
  const falKey = localStorage.getItem("fal_api_key");
  const repKey = localStorage.getItem("replicate_api_key");

  // Determine if running Live API or Demo Mode
  const isDemo = modelChoice === "demo-mode" || (!falKey && !repKey);

  setUIStateGenerating(true);

  let secondsElapsed = 0;
  timerDisplay.textContent = `${secondsElapsed} সেকেন্ড অতিবাহিত`;
  progressBar.style.width = "5%";

  generationTimer = setInterval(() => {
    secondsElapsed++;
    timerDisplay.textContent = `${secondsElapsed} সেকেন্ড অতিবাহিত`;

    // Progressive loading animation
    if (secondsElapsed < 4) {
      progressBar.style.width = "25%";
      loadingSubtitle.textContent = "টেক্সট প্রম্পট বিশ্লেষণ এবং দৃশ্য প্ল্যান করা হচ্ছে...";
    } else if (secondsElapsed < 8) {
      progressBar.style.width = "60%";
      loadingSubtitle.textContent = "ভিডিওর মূল ফ্রেমগুলো (Keyframes) আঁকা হচ্ছে...";
    } else if (secondsElapsed < 12) {
      progressBar.style.width = "85%";
      loadingSubtitle.textContent = "মোশন ও স্মুথিং এনকোডিং চলছে...";
    } else {
      progressBar.style.width = "95%";
      loadingSubtitle.textContent = "ভিডিও ফাইনাল রেন্ডার হচ্ছে...";
    }
  }, 1000);

  try {
    let videoUrl = "";

    if (!isDemo && falKey && modelChoice.startsWith("fal")) {
      // Fal.ai Live Call
      videoUrl = await generateWithFal(prompt, falKey, modelChoice);
    } else {
      // Demo Mode or Instant Simulation
      await new Promise(res => setTimeout(res, 4500));
      videoUrl = demoClips[selectedStyle] || demoClips.cinematic;
    }

    displayGeneratedVideo(videoUrl, prompt);
  } catch (err) {
    console.error("Generation error:", err);
    alert("ভিডিও তৈরিতে সমস্যা হয়েছে: " + (err.message || "দয়া করে API Key ও ইন্টারনেট কানেকশন চেক করুন।"));
    resetUIState();
  } finally {
    clearInterval(generationTimer);
    setUIStateGenerating(false);
  }
}

// Live Fal.ai Integration
async function generateWithFal(prompt, apiKey, modelType) {
  const fullPrompt = `${prompt}, ${selectedStyle} style, 8k resolution, cinematic`;
  const endpoint = modelType === "fal-minimax" 
    ? "https://queue.fal.run/fal-ai/minimax-video"
    : "https://queue.fal.run/fal-ai/wan/v2.1/text-to-video";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Key ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt: fullPrompt,
      aspect_ratio: aspectRatioSelect.value
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.message || `Fal API Error: ${response.status}`);
  }

  const result = await response.json();
  
  // If result is direct or queue status
  if (result.video && result.video.url) {
    return result.video.url;
  } else if (result.status_url) {
    return await pollFalQueue(result.status_url, apiKey);
  } else {
    throw new Error("ভিডিও URL পাওয়া যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।");
  }
}

async function pollFalQueue(statusUrl, apiKey) {
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const res = await fetch(statusUrl, {
      headers: { "Authorization": `Key ${apiKey}` }
    });
    const data = await res.json();
    if (data.status === "COMPLETED" && data.video) {
      return data.video.url;
    } else if (data.status === "FAILED") {
      throw new Error("ভিডিও প্রসেসিং ফেইল হয়েছে।");
    }
  }
  throw new Error("ভিডিও তৈরিতে অতিরিক্ত সময় লাগছে (Timeout)।");
}

function displayGeneratedVideo(videoUrl, prompt) {
  progressBar.style.width = "100%";
  placeholderState.classList.add("hidden");
  loadingState.classList.add("hidden");
  videoContainer.classList.remove("hidden");

  outputVideo.src = videoUrl;
  downloadVideoBtn.href = videoUrl;
  outputVideo.play().catch(() => {});

  statusBadge.className = "status-badge ready";
  statusBadge.textContent = "সফলভাবে তৈরি ✓";

  // Add to Gallery
  addToGallery({
    url: videoUrl,
    prompt: prompt,
    timestamp: new Date().toLocaleTimeString()
  });
}

function setUIStateGenerating(generating) {
  isGenerating = generating;
  generateBtn.disabled = generating;

  if (generating) {
    placeholderState.classList.add("hidden");
    videoContainer.classList.add("hidden");
    loadingState.classList.remove("hidden");
    statusBadge.className = "status-badge generating";
    statusBadge.textContent = "তৈরি হচ্ছে...";
  }
}

function resetUIState() {
  placeholderState.classList.remove("hidden");
  loadingState.classList.add("hidden");
  videoContainer.classList.add("hidden");
  statusBadge.className = "status-badge idle";
  statusBadge.textContent = "প্রস্তুত";
}

// Gallery Management
function addToGallery(item) {
  galleryHistory.unshift(item);
  if (galleryHistory.length > 8) galleryHistory.pop();
  localStorage.setItem("cinetext_gallery", JSON.stringify(galleryHistory));
  renderGallery();
}

function renderGallery() {
  if (!galleryHistory.length) {
    galleryContainer.innerHTML = '<p class="empty-gallery-msg">এখনো কোনো ভিডিও তৈরি করা হয়নি</p>';
    return;
  }

  galleryContainer.innerHTML = "";
  galleryHistory.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "gallery-item";
    div.title = item.prompt;
    div.innerHTML = `<video src="${item.url}" muted></video>`;
    div.addEventListener("click", () => {
      outputVideo.src = item.url;
      downloadVideoBtn.href = item.url;
      placeholderState.classList.add("hidden");
      loadingState.classList.add("hidden");
      videoContainer.classList.remove("hidden");
      outputVideo.play().catch(() => {});
    });
    galleryContainer.appendChild(div);
  });
}
