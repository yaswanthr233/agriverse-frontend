import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  Sparkles,
  Send,
  Upload,
  X,
  Minus,
  Maximize2,
  Copy,
  Check,
  RotateCcw,
  ShieldAlert,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  Wheat,
  Droplets,
  Sprout,
  CloudSun,
  Coins,
  Bug,
  Landmark,
  Milk,
} from "lucide-react";
import { aiApi } from "@/api/endpoints/ai";
import type { AiChatResponse, AiDiseaseScanResponse } from "@/api/types";
import { cn } from "@/lib/cn";

export type LanguageCode = "en" | "te" | "hi";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  source?: string;
  disclaimer?: string;
  suggestedFollowUps?: string[];
  scanData?: AiDiseaseScanResponse;
  timestamp: string;
}

const LANGUAGES: { code: LanguageCode; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
];

const LOCALIZED_UI = {
  en: {
    title: "Agri-Verse AI",
    subtitle: "Intelligent Farming Assistant",
    greetingTitle: "Hello! I'm Agri-Verse AI.",
    greetingDesc: "How can I help you with your crops, irrigation, fertilizers, weather, market prices, livestock, or government schemes today?",
    suggestedLabel: "Suggested questions:",
    placeholder: "Ask about crops, soil, water, prices...",
    placeholderAttached: "Add details (optional) and hit send...",
    thinking: "Agri-Verse AI is thinking...",
    analyzingImage: "Analyzing crop image with AI vision...",
    sendAria: "Send message",
    openAria: "Open Agri-Verse AI Assistant",
    uploadAria: "Upload crop image",
    prompts: [
      { icon: Wheat, text: "Which crop is suitable for my soil?" },
      { icon: Droplets, text: "Should I irrigate today?" },
      { icon: Sprout, text: "Which fertilizer is suitable for wheat?" },
      { icon: CloudSun, text: "What is the weather for my farm?" },
      { icon: Coins, text: "What is the wheat market price?" },
      { icon: Bug, text: "Analyze my crop image" },
      { icon: Landmark, text: "Which government schemes can I apply for?" },
      { icon: Milk, text: "Help me with my livestock" },
    ],
  },
  te: {
    title: "అగ్రివర్స్ ఏఐ",
    subtitle: "రైతు డిజిటల్ సహాయకుడు",
    greetingTitle: "నమస్కారం! నేను అగ్రివర్స్ ఏఐ.",
    greetingDesc: "పంటల ఎంపిక, ఎరువులు, నీటిపారుదల, వాతావరణం, మార్కెట్ ధరలు లేదా ప్రభుత్వ పథకాల గురించి నన్ను అడగండి.",
    suggestedLabel: "ముఖ్యమైన ప్రశ్నలు:",
    placeholder: "వ్యవసాయం గురించి అడగండి...",
    placeholderAttached: "వివరాలు జతచేసి పంపండి...",
    thinking: "అగ్రివర్స్ ఏఐ ఆలోచిస్తోంది...",
    analyzingImage: "తెగులు చిత్రాన్ని విశ్లేషిస్తోంది...",
    sendAria: "సందేశం పంపండి",
    openAria: "అగ్రివర్స్ ఏఐ సహాయకుడిని తెరవండి",
    uploadAria: "పంట చిత్రాన్ని అప్‌లోడ్ చేయండి",
    prompts: [
      { icon: Wheat, text: "నల్ల నేలలో ఏ పంట మంచిది?" },
      { icon: Droplets, text: "ఈ రోజు నీరు పెట్టాలా?" },
      { icon: Sprout, text: "గోధుమ పంటకు ఏ ఎరువు వేయాలి?" },
      { icon: CloudSun, text: "నా ప్రాంత వాతావరణం ఎలా ఉంది?" },
      { icon: Coins, text: "గోధుమ మార్కెట్ ధర ఎంత?" },
      { icon: Bug, text: "పంట తెగులు చిత్రాన్ని విశ్లేషించండి" },
      { icon: Landmark, text: "రైతు ప్రభుత్వ పథకాలు ఏమిటి?" },
      { icon: Milk, text: "పాడి పశువుల సంరక్షణ సలహాలు" },
    ],
  },
  hi: {
    title: "एग्रीवर्स एआई",
    subtitle: "स्मार्ट किसान सहायक",
    greetingTitle: "नमस्ते! मैं एग्रीवर्स एआई हूँ।",
    greetingDesc: "फसल चयन, खाद, सिंचाई, मौसम, मंडी भाव, पशुपालन या सरकारी योजनाओं के बारे में मुझसे पूछें।",
    suggestedLabel: "सुझाए गए प्रश्न:",
    placeholder: "खेती के बारे में पूछें...",
    placeholderAttached: "विवरण जोड़ें और भेजें...",
    thinking: "एग्रीवर्स एआई सोच रहा है...",
    analyzingImage: "फसल रोग का विश्लेषण हो रहा है...",
    sendAria: "संदेश भेजें",
    openAria: "एग्रीवर्स एआई सहायक खोलें",
    uploadAria: "फसल की फोटो अपलोड करें",
    prompts: [
      { icon: Wheat, text: "काली मिट्टी के लिए कौन सी फसल उपयुक्त है?" },
      { icon: Droplets, text: "क्या आज मुझे सिंचाई करनी चाहिए?" },
      { icon: Sprout, text: "गेहूं के लिए कौन सी खाद अच्छी है?" },
      { icon: CloudSun, text: "मेरे खेत का मौसम कैसा रहेगा?" },
      { icon: Coins, text: "गेहूं का आज का मंडी भाव क्या है?" },
      { icon: Bug, text: "मेरी फसल की फोटो जांचें" },
      { icon: Landmark, text: "मैं किन सरकारी योजनाओं के लिए आवेदन कर सकता हूँ?" },
      { icon: Milk, text: "पशुपालन के लिए सहायता दें" },
    ],
  },
};

/** Markdown text renderer for bold, bullets, numbered lists, and external links */
function FormattedText({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        const isBullet = trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("*");
        const isNumbered = /^\d+\./.test(trimmed);

        const cleanLine = isBullet
          ? trimmed.replace(/^([•\-*])\s*/, "")
          : isNumbered
          ? trimmed.replace(/^\d+\.\s*/, "")
          : trimmed;

        const formatted = renderInlineMarkdown(cleanLine);

        if (isBullet) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary-600" />
              <span>{formatted}</span>
            </div>
          );
        }

        if (isNumbered) {
          const match = trimmed.match(/^(\d+)\./);
          const num = match ? match[1] : "";
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="font-semibold text-primary-700">{num}.</span>
              <span>{formatted}</span>
            </div>
          );
        }

        return <p key={idx}>{formatted}</p>;
      })}
    </div>
  );
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const tokens = text.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g);

  return tokens.map((token, i) => {
    if (token.startsWith("**") && token.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-ink-900">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith("[") && token.includes("](") && token.endsWith(")")) {
      const labelMatch = token.match(/\[(.*?)\]/);
      const urlMatch = token.match(/\((.*?)\)/);
      const label = labelMatch ? labelMatch[1] : "Link";
      const url = urlMatch ? urlMatch[1] : "#";
      return (
        <a
          key={i}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 font-medium text-primary-600 underline hover:text-primary-700"
        >
          {label}
          <ExternalLink className="inline size-3" />
        </a>
      );
    }
    return token;
  });
}

export function FloatingAiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  
  // Persisted language selection
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem("agriverse_ai_lang");
    return (saved === "te" || saved === "hi" || saved === "en") ? saved : "en";
  });

  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string>(() => `conv_${Date.now()}`);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Attached image state for analysis
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [scanType, setScanType] = useState<"crop" | "animal">("crop");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const location = useLocation();

  const currentUi = LOCALIZED_UI[selectedLanguage] || LOCALIZED_UI.en;

  // Persist language change
  const handleLanguageChange = (lang: LanguageCode) => {
    setSelectedLanguage(lang);
    localStorage.setItem("agriverse_ai_lang", lang);
    localStorage.setItem("agriverse_lang", lang);
    setLangDropdownOpen(false);
  };

  // Sync language with Settings changes
  useEffect(() => {
    function handleLangEvent(e: Event) {
      const customEvent = e as CustomEvent<LanguageCode>;
      if (customEvent.detail && (customEvent.detail === "en" || customEvent.detail === "te" || customEvent.detail === "hi")) {
        setSelectedLanguage(customEvent.detail);
      }
    }

    function handleStorageEvent(e: StorageEvent) {
      if (e.key === "agriverse_lang" || e.key === "agriverse_ai_lang") {
        if (e.newValue === "en" || e.newValue === "te" || e.newValue === "hi") {
          setSelectedLanguage(e.newValue);
        }
      }
    }

    window.addEventListener("agriverse_language_changed", handleLangEvent);
    window.addEventListener("storage", handleStorageEvent);
    return () => {
      window.removeEventListener("agriverse_language_changed", handleLangEvent);
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen && !isMinimized && typeof messagesEndRef.current?.scrollIntoView === "function") {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimized]);

  // Handle Escape key to close/minimize
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Determine current page context
  const getPageContext = useCallback(() => {
    const path = location.pathname;
    if (path.includes("/crops")) return "crops";
    if (path.includes("/farm")) return "farm";
    if (path.includes("/weather")) return "weather";
    if (path.includes("/market")) return "market";
    if (path.includes("/livestock")) return "livestock";
    if (path.includes("/schemes")) return "schemes";
    if (path.includes("/orders")) return "orders";
    if (path.includes("/expenses")) return "expenses";
    return "general";
  }, [location.pathname]);

  // Chat mutation
  const chatMutation = useMutation({
    mutationFn: (msgText: string) =>
      aiApi.chat({
        message: msgText,
        language: selectedLanguage,
        conversationId,
        pageContext: getPageContext(),
      }),
    onSuccess: (res: AiChatResponse) => {
      const aiMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: "assistant",
        text: res.reply || res.message || "",
        source: res.source,
        disclaimer: res.disclaimer,
        suggestedFollowUps: res.suggestedFollowUps,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    },
    onError: () => {
      const errorMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: "assistant",
        text: "AI is temporarily unavailable. Please try again.",
        disclaimer: "Agricultural AI suggestions should be verified with local agronomy experts.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    },
  });

  // Image scan mutation
  const scanMutation = useMutation({
    mutationFn: ({ file, type }: { file: File; type: string }) =>
      aiApi.analyzeImage(file, type, selectedLanguage),
    onSuccess: (res: AiDiseaseScanResponse) => {
      const scanMsg: ChatMessage = {
        id: `scan_${Date.now()}`,
        role: "assistant",
        text: `**${res.disease}**\n\n` +
          `• **Likelihood:** ${res.confidence.toFixed(1)}% (${res.severity} Severity)\n` +
          `• **Symptoms Observed:** ${res.affected}\n` +
          (res.possibleCauses ? `• **Possible Cause:** ${res.possibleCauses}\n` : "") +
          `• **Actionable Treatments:**\n${res.treatment.map((t) => `  - ${t}`).join("\n")}\n` +
          `• **Prevention:** ${res.prevention}\n\n` +
          (res.whenToConsultExpert ? `*Expert Advisory:* ${res.whenToConsultExpert}` : ""),
        source: res.source,
        disclaimer: res.disclaimer,
        scanData: res,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, scanMsg]);
      handleRemoveAttachment();
    },
    onError: () => {
      const errorMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: "assistant",
        text: "Unable to analyze this image. Please try another image in JPEG, PNG, or WebP format.",
        disclaimer: "Agricultural AI suggestions should be verified with local agronomy experts.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
      handleRemoveAttachment();
    },
  });

  const isBusy = chatMutation.isPending || scanMutation.isPending;

  function handleSend(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (isBusy) return;

    if (attachedFile) {
      const userMsg: ChatMessage = {
        id: `usr_${Date.now()}`,
        role: "user",
        text: inputMessage.trim() || `[Uploaded ${scanType === "crop" ? "crop leaf" : "livestock"} image for diagnosis]`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInputMessage("");
      scanMutation.mutate({ file: attachedFile, type: scanType });
      return;
    }

    const text = inputMessage.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    chatMutation.mutate(text);
  }

  function handlePromptClick(promptText: string) {
    if (isBusy) return;
    if (
      promptText === "Analyze my crop image" ||
      promptText === "పంట తెగులు చిత్రాన్ని విశ్లేషించండి" ||
      promptText === "मेरी फसल की फोटो जांचें"
    ) {
      fileInputRef.current?.click();
      return;
    }

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: "user",
      text: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    chatMutation.mutate(promptText);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      alert("Please upload a valid JPEG, PNG, or WebP image.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("Image size exceeds 10MB limit.");
      return;
    }

    setAttachedFile(file);
    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);

    if (!isOpen) {
      setIsOpen(true);
      setIsMinimized(false);
    }
  }

  function handleRemoveAttachment() {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setAttachedFile(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleResetChat() {
    setMessages([]);
    handleRemoveAttachment();
    setConversationId(`conv_${Date.now()}`);
  }

  return (
    <>
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        aria-label={currentUi.uploadAria}
      />

      {/* ── 1. GLOBAL FLOATING TRIGGER BUTTON (BOTTOM RIGHT) ──────────────── */}
      <div className="fixed bottom-4 right-4 z-50 md:bottom-6 md:right-6">
        {!isOpen && (
          <div className="group relative flex items-center">
            {/* Tooltip on Hover */}
            <div className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-lg bg-ink-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg transition-opacity duration-200 group-hover:block">
              {currentUi.title}
              <div className="absolute -right-1 top-1/2 -translate-y-1/2 border-4 border-transparent border-l-ink-900" />
            </div>

            {/* Floating Button */}
            <button
              onClick={() => {
                setIsOpen(true);
                setIsMinimized(false);
              }}
              aria-label={currentUi.openAria}
              className="relative flex items-center gap-2 rounded-full bg-primary-600 px-4 py-3 text-white shadow-xl transition-all duration-300 hover:scale-105 hover:bg-primary-700 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-primary-400/40 active:scale-95"
            >
              <span className="absolute -inset-0.5 animate-ping rounded-full bg-primary-500 opacity-25" />
              <span className="text-xl leading-none">🌱</span>
              <span className="font-display text-sm font-semibold tracking-wide md:inline">
                {selectedLanguage === "te" ? "ఏఐ సహాయం" : selectedLanguage === "hi" ? "पूछें AI" : "Ask AI"}
              </span>
              <Sparkles className="size-4 animate-pulse text-amber-300" />
            </button>
          </div>
        )}
      </div>

      {/* ── 2. FLOATING OVERLAY CHAT WINDOW ────────────────────────────────── */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Agri-Verse AI Assistant Chat"
          className={cn(
            "fixed z-50 flex flex-col rounded-2xl border border-border bg-surface shadow-2xl transition-all duration-200",
            "bottom-4 right-4 md:bottom-6 md:right-6",
            isMinimized
              ? "h-14 w-72 overflow-hidden"
              : "w-[calc(100vw-32px)] max-w-[385px] h-[calc(100vh-100px)] max-h-[620px]"
          )}
        >
          {/* Header */}
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-gradient-to-r from-primary-700 to-primary-800 px-4 text-white rounded-t-2xl">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-full bg-white/15 text-lg shadow-inner">
                🌱
              </div>
              <div className="min-w-0">
                <h3 className="truncate font-display text-sm font-bold tracking-tight text-white">
                  {currentUi.title}
                </h3>
                {!isMinimized && (
                  <p className="text-[11px] text-primary-100">
                    {currentUi.subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Language Selector in Header */}
              {!isMinimized && (
                <div className="relative">
                  <button
                    onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                    className="flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-xs font-medium text-white hover:bg-white/20"
                    title="Change language"
                  >
                    <span>{LANGUAGES.find((l) => l.code === selectedLanguage)?.native}</span>
                    <ChevronDown className="size-3" />
                  </button>

                  {langDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-28 rounded-lg border border-border bg-surface py-1 shadow-lg z-50">
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => handleLanguageChange(lang.code)}
                          className={cn(
                            "flex w-full items-center justify-between px-3 py-1.5 text-left text-xs transition-colors",
                            selectedLanguage === lang.code
                              ? "bg-primary-50 font-semibold text-primary-700"
                              : "text-ink-700 hover:bg-surface-alt"
                          )}
                        >
                          <span>{lang.native}</span>
                          {selectedLanguage === lang.code && <Check className="size-3 text-primary-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Reset Conversation */}
              {!isMinimized && messages.length > 0 && (
                <button
                  onClick={handleResetChat}
                  title="New Conversation"
                  aria-label="Start new conversation"
                  className="rounded-lg p-1.5 text-white/80 hover:bg-white/15 hover:text-white"
                >
                  <RotateCcw className="size-4" />
                </button>
              )}

              {/* Minimize / Maximize */}
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? "Expand" : "Minimize"}
                aria-label={isMinimized ? "Expand AI Assistant" : "Minimize AI Assistant"}
                className="rounded-lg p-1.5 text-white/80 hover:bg-white/15 hover:text-white"
              >
                {isMinimized ? <Maximize2 className="size-4" /> : <Minus className="size-4" />}
              </button>

              {/* Close */}
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                aria-label="Close AI Assistant"
                className="rounded-lg p-1.5 text-white/80 hover:bg-white/15 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Chat Body */}
          {!isMinimized && (
            <div className="flex flex-1 flex-col overflow-hidden bg-surface-alt">
              {/* Message List */}
              <div
                className="flex-1 space-y-3.5 overflow-y-auto p-4"
                aria-live="polite"
              >
                {/* Initial Welcome Screen */}
                {messages.length === 0 && (
                  <div className="space-y-4 py-2">
                    <div className="flex items-start gap-3 rounded-xl bg-surface p-3.5 border border-border shadow-xs">
                      <span className="text-2xl">🌱</span>
                      <div>
                        <h4 className="font-display text-sm font-semibold text-ink-900">
                          {currentUi.greetingTitle}
                        </h4>
                        <p className="mt-0.5 text-xs text-ink-700">
                          {currentUi.greetingDesc}
                        </p>
                      </div>
                    </div>

                    {/* Localized Clickable Suggested Prompts */}
                    <div>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                        {currentUi.suggestedLabel}
                      </p>
                      <div className="grid grid-cols-1 gap-1.5">
                        {currentUi.prompts.map((prompt, i) => {
                          const Icon = prompt.icon;
                          return (
                            <button
                              key={i}
                              onClick={() => handlePromptClick(prompt.text)}
                              className="group flex items-center gap-2.5 rounded-lg border border-border/80 bg-surface px-3 py-2 text-left text-xs text-ink-800 shadow-2xs transition-all hover:border-primary-400 hover:bg-primary-50/50 hover:text-primary-900"
                            >
                              <Icon className="size-4 shrink-0 text-primary-600 transition-transform group-hover:scale-110" />
                              <span className="truncate">{prompt.text}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Render Messages */}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex flex-col gap-1",
                      msg.role === "user" ? "items-end" : "items-start"
                    )}
                  >
                    {/* Role Header / Timestamp */}
                    <div className="flex items-center gap-1.5 px-1 text-[10px] text-ink-400">
                      <span>{msg.role === "user" ? "You" : currentUi.title}</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    {/* Bubble Content */}
                    <div
                      className={cn(
                        "relative max-w-[88%] rounded-2xl px-3.5 py-2.5 shadow-2xs",
                        msg.role === "user"
                          ? "rounded-tr-xs bg-primary-600 text-white"
                          : "rounded-tl-xs border border-border bg-surface text-ink-900"
                      )}
                    >
                      {msg.role === "user" ? (
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {msg.text}
                        </p>
                      ) : (
                        <div className="space-y-2">
                          <FormattedText content={msg.text} />

                          {/* Source Attribution Badge */}
                          {msg.source && (
                            <div className="mt-2 flex items-center gap-1 border-t border-border/60 pt-1.5 text-[10px] text-ink-500">
                              <HelpCircle className="size-3 text-primary-500" />
                              <span>Source: {msg.source}</span>
                            </div>
                          )}

                          {/* Safety Disclaimer */}
                          {msg.disclaimer && (
                            <div className="flex items-start gap-1.5 rounded-md bg-amber-50/80 p-2 text-[10px] text-amber-800 border border-amber-200/50">
                              <ShieldAlert className="mt-0.5 size-3 shrink-0 text-amber-600" />
                              <p className="leading-tight">{msg.disclaimer}</p>
                            </div>
                          )}

                          {/* Copy Action */}
                          <div className="flex justify-end pt-1">
                            <button
                              onClick={() => handleCopy(msg.text, msg.id)}
                              className="flex items-center gap-1 text-[10px] text-ink-400 hover:text-ink-700"
                              title="Copy response"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check className="size-3 text-primary-600" />
                                  <span className="text-primary-600">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="size-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Suggested Follow-up Chips */}
                    {msg.role === "assistant" && msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1.5 pl-1">
                        {msg.suggestedFollowUps.map((fUp, fIdx) => (
                          <button
                            key={fIdx}
                            onClick={() => handlePromptClick(fUp)}
                            className="rounded-full border border-primary-200 bg-primary-50/80 px-2.5 py-1 text-[11px] font-medium text-primary-800 hover:bg-primary-100 transition-colors"
                          >
                            {fUp}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Loading / Typing Indicator */}
                {isBusy && (
                  <div className="flex items-start gap-2">
                    <div className="flex size-7 items-center justify-center rounded-full bg-primary-100 text-sm">
                      🌱
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl rounded-tl-xs border border-border bg-surface px-3.5 py-2.5 shadow-2xs">
                      <span className="size-2 animate-bounce rounded-full bg-primary-600 [animation-delay:-0.3s]" />
                      <span className="size-2 animate-bounce rounded-full bg-primary-600 [animation-delay:-0.15s]" />
                      <span className="size-2 animate-bounce rounded-full bg-primary-600" />
                      <span className="ml-1 text-xs text-ink-600">
                        {scanMutation.isPending ? currentUi.analyzingImage : currentUi.thinking}
                      </span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Image Preview Banner if an image is selected */}
              {imagePreviewUrl && (
                <div className="mx-3 mb-2 flex items-center justify-between rounded-xl border border-primary-200 bg-primary-50/90 p-2 shadow-xs">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <img
                      src={imagePreviewUrl}
                      alt="Crop preview"
                      className="size-10 rounded-lg object-cover border border-primary-300 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-primary-900">
                        {attachedFile?.name}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-primary-700">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="scanType"
                            checked={scanType === "crop"}
                            onChange={() => setScanType("crop")}
                            className="size-3 text-primary-600"
                          />
                          Crop
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="scanType"
                            checked={scanType === "animal"}
                            onChange={() => setScanType("animal")}
                            className="size-3 text-primary-600"
                          />
                          Livestock
                        </label>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleRemoveAttachment}
                    className="rounded-full p-1 text-primary-700 hover:bg-primary-200/60"
                    title="Remove image"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              )}

              {/* Chat Input Bar */}
              <div className="border-t border-border bg-surface p-3">
                <form onSubmit={handleSend} className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload crop/livestock photo"
                    aria-label={currentUi.uploadAria}
                    className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border text-ink-600 transition-colors hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700"
                  >
                    <Upload className="size-4" />
                  </button>

                  <div className="relative flex-1">
                    <textarea
                      ref={inputRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder={attachedFile ? currentUi.placeholderAttached : currentUi.placeholder}
                      rows={1}
                      maxLength={4000}
                      disabled={isBusy}
                      className="max-h-24 min-h-[38px] w-full resize-none rounded-xl border border-border bg-surface-alt px-3 py-2 text-xs text-ink-900 placeholder:text-ink-400 focus:border-primary-500 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isBusy || (!inputMessage.trim() && !attachedFile)}
                    aria-label={currentUi.sendAria}
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-xl text-white shadow-xs transition-all",
                      isBusy || (!inputMessage.trim() && !attachedFile)
                        ? "cursor-not-allowed bg-ink-200 text-ink-400"
                        : "bg-primary-600 hover:bg-primary-700 active:scale-95"
                    )}
                  >
                    <Send className="size-4" />
                  </button>
                </form>

                <div className="mt-1.5 flex items-center justify-between px-1 text-[10px] text-ink-400">
                  <span className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Agri-Verse Agent
                  </span>
                  <span>Shift + Enter for new line</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
