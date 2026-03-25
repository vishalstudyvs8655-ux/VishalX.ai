/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Plus, 
  Mic, 
  Send, 
  LayoutGrid, 
  GraduationCap, 
  Briefcase, 
  HeartPulse, 
  Scale, 
  Download,
  User,
  Bot,
  ArrowLeft,
  Menu,
  X,
  Camera,
  FileText,
  HardDrive,
  Search,
  Zap,
  SquarePen,
  Terminal,
  FolderOpen,
  ChevronRight,
  Settings,
  MessageSquare,
  Globe,
  Bell,
  Palette,
  Cpu,
  Sun,
  Database,
  Shield,
  Info,
  HelpCircle,
  FileSignature,
  UserCircle,
  History,
  Key,
  LogOut,
  Trash2,
  DownloadCloud,
  Image as ImageIcon,
  Share2,
  Copy,
  Check,
  Edit3,
  UserPlus,
  LogIn,
  MoreVertical,
  Share,
  Pin,
  Archive,
  Edit2,
  Phone,
  Mail,
  MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Initialize Gemini API
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  isPinned?: boolean;
  isArchived?: boolean;
}

const CATEGORIES = [
  { id: 'sarkari', label: 'Sarkari Sathi', icon: Sparkles, color: 'bg-orange-100 text-orange-600', prompt: 'Help me with ' },
  { id: 'student', label: 'Student Help', icon: GraduationCap, color: 'bg-blue-100 text-blue-600', prompt: 'I need help with ' },
  { id: 'business', label: 'Business Help', icon: Briefcase, color: 'bg-emerald-100 text-emerald-600', prompt: 'Give me business advice for ' },
  { id: 'image', label: 'Create Image', icon: ImageIcon, color: 'bg-purple-100 text-purple-600', prompt: 'Create an image of ' },
  { id: 'health', label: 'Health Sathi', icon: HeartPulse, color: 'bg-rose-100 text-rose-600', prompt: 'Health tips for ' },
  { id: 'legal', label: 'Legal Help', icon: Scale, color: 'bg-slate-100 text-slate-600', prompt: 'Legal advice for ' },
];

const TRANSLATIONS: Record<string, Record<string, string>> = {
  English: {
    newChat: 'New Chat',
    settings: 'Settings',
    recentChats: 'Recent Chats',
    pinned: 'Pinned',
    recent: 'Recent',
    archived: 'Archived',
    howCanIHelp: 'How can I help you today?',
    messagePlaceholder: 'Message VishalX.ai...',
    footerNote: 'VishalX.ai can make mistakes. Check important info.',
    upgrade: 'Upgrade',
    downloadChat: 'Download Chat',
    downloadAPK: 'Download APK',
  },
  Hindi: {
    newChat: 'नया चैट',
    settings: 'सेटिंग्स',
    recentChats: 'हालिया चैट',
    pinned: 'पिन किया गया',
    recent: 'हालिया',
    archived: 'संग्रहीत',
    howCanIHelp: 'आज मैं आपकी क्या मदद कर सकता हूँ?',
    messagePlaceholder: 'VishalX.ai को संदेश भेजें...',
    footerNote: 'VishalX.ai गलतियाँ कर सकता है। महत्वपूर्ण जानकारी की जाँच करें।',
    upgrade: 'अपग्रेड',
    downloadChat: 'चैट डाउनलोड करें',
    downloadAPK: 'APK डाउनलोड करें',
  },
  Spanish: {
    newChat: 'Nuevo chat',
    settings: 'Ajustes',
    recentChats: 'Chats recientes',
    pinned: 'Fijado',
    recent: 'Reciente',
    archived: 'Archivado',
    howCanIHelp: '¿Cómo puedo ayudarte hoy?',
    messagePlaceholder: 'Mensaje a VishalX.ai...',
    footerNote: 'VishalX.ai puede cometer errores. Verifique la información importante.',
    upgrade: 'Mejorar',
    downloadChat: 'Descargar chat',
    downloadAPK: 'Descargar APK',
  }
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState('General');
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [activeMessageId, setActiveMessageId] = useState<number | null>(null);
  const [activeChatMenuId, setActiveChatMenuId] = useState<string | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showSignInOptions, setShowSignInOptions] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [settings, setSettings] = useState({
    language: 'English',
    model: 'Gemini 3 Flash',
    shortcuts: true,
    autoArchive: false,
    pushNotifications: true,
    soundEffects: true,
    emailDigest: false,
    responseTone: 'Professional',
    customInstructions: '',
    aiMemory: true,
    realTimeSearch: true,
    offlineMode: false,
    experimentalFeatures: false,
    theme: 'System',
    fontSize: 'Medium',
    chatHistoryTraining: true,
    twoFactorAuth: false,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.English;

  const Logo = ({ className = "w-6 h-6" }: { className?: string }) => (
    <div className={cn("relative flex items-center justify-center", className)}>
      <div className="absolute inset-0 bg-orange-500 rounded-lg rotate-45 opacity-20 animate-pulse" />
      <Sparkles className="w-full h-full text-orange-500 relative z-10" />
    </div>
  );

  // Apply theme and font size
  useEffect(() => {
    const root = window.document.documentElement;
    if (settings.theme === 'Dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'Light') {
      root.classList.remove('dark');
    } else {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.toggle('dark', systemTheme === 'dark');
    }
  }, [settings.theme]);

  // Load chats from localStorage on mount
  useEffect(() => {
    const savedChats = localStorage.getItem('vishalx_chats');
    if (savedChats) {
      setChats(JSON.parse(savedChats));
    }
  }, []);

  // Save chats to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('vishalx_chats', JSON.stringify(chats));
  }, [chats]);

  const downloadAPK = () => {
    const blob = new Blob(['This is a dummy APK file for VishalX.ai'], { type: 'application/vnd.android.package-archive' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'VishalX.apk';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.start();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setShowChat(true);

    // Update or create chat session
    let chatId = currentChatId;
    if (!chatId) {
      chatId = Date.now().toString();
      const newChat: ChatSession = {
        id: chatId,
        title: text.slice(0, 30) + (text.length > 30 ? '...' : ''),
        messages: newMessages
      };
      setChats(prev => [newChat, ...prev]);
      setCurrentChatId(chatId);
    } else {
      setChats(prev => prev.map(c => 
        c.id === chatId ? { ...c, messages: newMessages } : c
      ));
    }

    try {
      const stream = await genAI.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: [
          ...newMessages.map(m => ({
            role: m.role,
            parts: [{ text: m.content }],
          }))
        ],
      });

      let fullContent = '';
      const modelMessage: Message = { role: 'model', content: '' };
      setMessages(prev => [...prev, modelMessage]);

      for await (const chunk of stream) {
        const chunkText = chunk.text;
        fullContent += chunkText;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'model', content: fullContent };
          return updated;
        });
      }
      
      // Update chat with final model response
      const finalMessages: Message[] = [...newMessages, { role: 'model', content: fullContent }];
      setChats(prev => prev.map(c => 
        c.id === chatId ? { ...c, messages: finalMessages } : c
      ));
    } catch (error) {
      console.error('Error calling Gemini:', error);
      setMessages(prev => [...prev, { role: 'model', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteChat = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this chat?')) {
      setActiveChatMenuId(null);
      setTimeout(() => {
        setChats(prev => prev.filter(c => c.id !== id));
        if (currentChatId === id) {
          resetChat();
        }
      }, 100);
    }
  };

  const downloadChat = () => {
    if (messages.length === 0) {
      alert('No chat history to download.');
      return;
    }
    const chatContent = messages.map(m => `${m.role === 'user' ? 'User' : 'VishalX.ai'}: ${m.content}`).join('\n\n');
    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vishalx-chat-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const togglePinChat = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updatedChats = chats.map(c => 
      c.id === id ? { ...c, isPinned: !c.isPinned } : c
    );
    setChats(updatedChats);
    setActiveChatMenuId(null);
  };

  const toggleArchiveChat = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updatedChats = chats.map(c => 
      c.id === id ? { ...c, isArchived: !c.isArchived } : c
    );
    setChats(updatedChats);
    setActiveChatMenuId(null);
  };

  const startRenaming = (e: React.MouseEvent, chat: ChatSession) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditTitle(chat.title);
    setActiveChatMenuId(null);
  };

  const saveRename = (id: string) => {
    if (editTitle.trim()) {
      const updatedChats = chats.map(c => 
        c.id === id ? { ...c, title: editTitle.trim() } : c
      );
      setChats(updatedChats);
    }
    setEditingChatId(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard');
  };

  const shareContent = (text: string) => {
    if (navigator.share) {
      navigator.share({
        title: 'VishalX.ai Chat',
        text: text,
        url: window.location.href,
      }).catch(console.error);
    } else {
      alert('Sharing not supported on this browser');
    }
  };

  const handleCategoryClick = (prompt: string) => {
    setInput(prompt);
    setIsSidebarOpen(false);
  };

  const resetChat = () => {
    setMessages([]);
    setShowChat(false);
    setIsSidebarOpen(false);
    setCurrentChatId(null);
  };

  const renderChatLink = (chat: ChatSession) => {
    const isActive = currentChatId === chat.id;
    const isEditing = editingChatId === chat.id;

    return (
      <div 
        key={chat.id} 
        className="relative group"
        onContextMenu={(e) => {
          e.preventDefault();
          setActiveChatMenuId(chat.id);
        }}
      >
        {isEditing ? (
          <div className={cn(
            "flex items-center gap-2 p-2 rounded-xl border transition-all",
            settings.theme === 'Dark' ? "bg-slate-800 border-orange-500/50" : "bg-slate-50 border-orange-300"
          )}>
            <input
              autoFocus
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveRename(chat.id);
                if (e.key === 'Escape') setEditingChatId(null);
              }}
              onBlur={() => saveRename(chat.id)}
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm p-0"
            />
          </div>
        ) : (
          <button
            onClick={() => loadChat(chat)}
            className={cn(
              "w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left pr-10",
              isActive 
                ? (settings.theme === 'Dark' ? "bg-slate-800 text-slate-100" : "bg-slate-50 text-slate-900") 
                : (settings.theme === 'Dark' ? "hover:bg-slate-800/50 text-slate-400 hover:text-slate-200" : "hover:bg-slate-50 text-slate-600")
            )}
          >
            <MessageSquare className={cn("w-3 h-3 shrink-0", chat.isPinned ? "text-orange-500" : "text-slate-400")} />
            <span className="text-sm font-medium truncate">{chat.title}</span>
            {chat.isPinned && <Pin className="w-2 h-2 text-orange-500 absolute right-10 top-1/2 -translate-y-1/2" />}
          </button>
        )}

        <button 
          onClick={(e) => {
            e.stopPropagation();
            setActiveChatMenuId(activeChatMenuId === chat.id ? null : chat.id);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-slate-500/10 rounded-lg transition-all text-slate-400"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {/* Chat Context Menu */}
        <AnimatePresence>
          {activeChatMenuId === chat.id && (
            <>
              <div 
                className="fixed inset-0 z-[60]" 
                onClick={() => setActiveChatMenuId(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className={cn(
                  "absolute right-0 top-full mt-1 w-48 border rounded-xl shadow-xl z-[70] overflow-hidden transition-colors",
                  settings.theme === 'Dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                )}
              >
                <div className="p-1">
                  <button
                    onClick={(e) => togglePinChat(e, chat.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 rounded-lg text-sm transition-colors",
                      settings.theme === 'Dark' ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-50 text-slate-700"
                    )}
                  >
                    <Pin className="w-4 h-4" />
                    {chat.isPinned ? 'Unpin' : 'Pin'}
                  </button>
                  <button
                    onClick={(e) => startRenaming(e, chat)}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 rounded-lg text-sm transition-colors",
                      settings.theme === 'Dark' ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-50 text-slate-700"
                    )}
                  >
                    <Edit2 className="w-4 h-4" />
                    Rename
                  </button>
                  <button
                    onClick={(e) => toggleArchiveChat(e, chat.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 rounded-lg text-sm transition-colors",
                      settings.theme === 'Dark' ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-50 text-slate-700"
                    )}
                  >
                    <Archive className="w-4 h-4" />
                    {chat.isArchived ? 'Unarchive' : 'Archive'}
                  </button>
                  <div className={cn("h-px my-1", settings.theme === 'Dark' ? "bg-slate-800" : "bg-slate-100")} />
                  <button
                    onClick={(e) => deleteChat(e, chat.id)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg text-sm transition-colors text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const loadChat = (chat: ChatSession) => {
    setMessages(chat.messages);
    setCurrentChatId(chat.id);
    setShowChat(true);
    setIsSidebarOpen(false);
  };

  return (
    <div className={cn(
      "flex h-screen max-w-4xl mx-auto overflow-hidden relative transition-colors duration-300",
      settings.theme === 'Dark' ? "bg-slate-950 text-slate-100" : "bg-white text-slate-900",
      settings.fontSize === 'Small' ? "text-[12px]" : settings.fontSize === 'Large' ? "text-[18px]" : "text-[14px]"
    )}>
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
        <motion.aside
          initial={false}
          animate={{ x: isSidebarOpen ? 0 : -280 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={cn(
            "fixed top-0 left-0 bottom-0 w-[280px] border-r z-50 p-4 flex flex-col transition-colors",
            settings.theme === 'Dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
          )}
        >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <Logo className="w-7 h-7" />
            <span className={cn("font-bold text-xl transition-colors", settings.theme === 'Dark' ? "text-slate-100" : "text-slate-900")}>VishalX.ai</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className={cn("p-1 rounded-full transition-colors", settings.theme === 'Dark' ? "hover:bg-slate-800" : "hover:bg-slate-100")}>
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar">
          <button 
            onClick={resetChat}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left shadow-sm",
              settings.theme === 'Dark' ? "bg-slate-800 border-slate-700 hover:bg-slate-700" : "bg-white border-slate-200 hover:bg-slate-50"
            )}
          >
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span className={cn("text-base font-semibold", settings.theme === 'Dark' ? "text-slate-100" : "text-slate-800")}>{t.newChat}</span>
          </button>

          <div>
            <p className={cn("text-[10px] font-bold uppercase tracking-[0.1em] px-1 mb-4", settings.theme === 'Dark' ? "text-slate-500" : "text-slate-400")}>{t.recentChats}</p>
            <div className="space-y-1">
              {chats.length === 0 ? (
                <p className="px-1 text-sm text-slate-400 italic">No history yet</p>
              ) : (
                <div className="space-y-4">
                  {/* Pinned Chats */}
                  {chats.filter(c => c.isPinned && !c.isArchived).length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1 mb-2">{t.pinned}</p>
                      {chats.filter(c => c.isPinned && !c.isArchived).map(chat => renderChatLink(chat))}
                    </div>
                  )}
                  
                  {/* Recent Chats */}
                  <div className="space-y-1">
                    {chats.filter(c => c.isPinned && !c.isArchived).length > 0 && (
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1 mb-2">{t.recent}</p>
                    )}
                    {chats.filter(c => !c.isPinned && !c.isArchived).slice(0, 10).map(chat => renderChatLink(chat))}
                  </div>

                  {/* Archived Chats */}
                  {chats.filter(c => c.isArchived).length > 0 && (
                    <div className="space-y-1 pt-4 border-t border-slate-800/50">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1 mb-2">{t.archived}</p>
                      {chats.filter(c => c.isArchived).map(chat => renderChatLink(chat))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-4 mt-auto">
          <button 
            onClick={() => { setIsSettingsOpen(true); setIsSidebarOpen(false); }}
            className={cn(
              "w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left shadow-sm",
              settings.theme === 'Dark' ? "bg-slate-800 border-slate-700 hover:bg-slate-700" : "bg-white border-slate-200 hover:bg-slate-50"
            )}
          >
            <div className="flex items-center gap-3">
              <Settings className={cn("w-3 h-3", settings.theme === 'Dark' ? "text-slate-400" : "text-slate-600")} />
              <span className={cn("text-base font-semibold", settings.theme === 'Dark' ? "text-slate-100" : "text-slate-800")}>{t.settings}</span>
            </div>
            <ChevronRight className="w-2.5 h-2.5 text-slate-400" />
          </button>
        </div>
      </motion.aside>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={cn(
                "relative w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col h-[600px] transition-colors",
                settings.theme === 'Dark' ? "bg-slate-900 border border-slate-800" : "bg-white"
              )}
            >
              <div className={cn(
                "p-6 border-b flex items-center justify-between transition-colors",
                settings.theme === 'Dark' ? "border-slate-800" : "border-slate-100"
              )}>
                <h2 className={cn("text-[10px] font-bold uppercase tracking-[0.2em]", settings.theme === 'Dark' ? "text-slate-500" : "text-slate-400")}>Settings</h2>
                <button onClick={() => setIsSettingsOpen(false)} className={cn("p-1 rounded-full transition-colors", settings.theme === 'Dark' ? "hover:bg-slate-800" : "hover:bg-slate-100")}>
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* Tabs Sidebar */}
                <div className={cn(
                  "w-1/3 border-r p-4 space-y-1 overflow-y-auto custom-scrollbar transition-colors",
                  settings.theme === 'Dark' ? "border-slate-800 bg-slate-900/50" : "border-slate-100"
                )}>
                  {[
                    { icon: Settings, label: 'General' },
                    { icon: Bell, label: 'Notifications' },
                    { icon: User, label: 'Personalization' },
                    { icon: Cpu, label: 'App' },
                    { icon: Sun, label: 'Appearance' },
                    { icon: Database, label: 'Data controls' },
                    { icon: Shield, label: 'Security' },
                    { icon: UserCircle, label: 'Account' },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => setActiveSettingsTab(item.label)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group",
                        activeSettingsTab === item.label 
                          ? (settings.theme === 'Dark' ? "bg-slate-800 border border-slate-700 shadow-sm" : "bg-slate-50 border border-slate-200 shadow-sm") 
                          : (settings.theme === 'Dark' ? "hover:bg-slate-800/50" : "hover:bg-slate-50")
                      )}
                    >
                      <item.icon className={cn("w-4 h-4", activeSettingsTab === item.label ? (settings.theme === 'Dark' ? "text-slate-100" : "text-slate-900") : "text-slate-500 group-hover:text-slate-900")} />
                      <span className={cn("text-sm font-medium", activeSettingsTab === item.label ? (settings.theme === 'Dark' ? "text-slate-100" : "text-slate-900") : "text-slate-600 group-hover:text-slate-900")}>{item.label}</span>
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                  <h3 className={cn("text-lg font-bold mb-6 transition-colors", settings.theme === 'Dark' ? "text-slate-100" : "text-slate-800")}>{activeSettingsTab}</h3>
                  
                  <div className="space-y-6">
                    {activeSettingsTab === 'General' && (
                      <>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={cn("text-sm font-semibold", settings.theme === 'Dark' ? "text-slate-200" : "text-slate-800")}>Language</p>
                            <p className="text-xs text-slate-500">Choose your preferred language</p>
                          </div>
                          <select 
                            value={settings.language}
                            onChange={(e) => setSettings({...settings, language: e.target.value})}
                            className={cn(
                              "text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 transition-colors",
                              settings.theme === 'Dark' ? "bg-slate-800 border-slate-700 text-slate-100" : "border-slate-200"
                            )}
                          >
                            <option>English</option>
                            <option>Hindi</option>
                            <option>Spanish</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={cn("text-sm font-semibold", settings.theme === 'Dark' ? "text-slate-200" : "text-slate-800")}>Model</p>
                            <p className="text-xs text-slate-500">Select AI model version</p>
                          </div>
                          <select 
                            value={settings.model}
                            onChange={(e) => setSettings({...settings, model: e.target.value})}
                            className={cn(
                              "text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 transition-colors",
                              settings.theme === 'Dark' ? "bg-slate-800 border-slate-700 text-slate-100" : "border-slate-200"
                            )}
                          >
                            <option>Gemini 3 Flash</option>
                            <option>Gemini 3 Pro</option>
                            <option>Gemini 2.5 Flash</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={cn("text-sm font-semibold", settings.theme === 'Dark' ? "text-slate-200" : "text-slate-800")}>Keyboard Shortcuts</p>
                            <p className="text-xs text-slate-500">Enable keyboard shortcuts</p>
                          </div>
                          <button 
                            onClick={() => setSettings({...settings, shortcuts: !settings.shortcuts})}
                            className={cn("w-10 h-5 rounded-full transition-colors relative", settings.shortcuts ? "bg-orange-500" : "bg-slate-200")}
                          >
                            <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all", settings.shortcuts ? "right-1" : "left-1")} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={cn("text-sm font-semibold", settings.theme === 'Dark' ? "text-slate-200" : "text-slate-800")}>Auto Archive</p>
                            <p className="text-xs text-slate-500">Automatically archive old chats</p>
                          </div>
                          <button 
                            onClick={() => setSettings({...settings, autoArchive: !settings.autoArchive})}
                            className={cn("w-10 h-5 rounded-full transition-colors relative", settings.autoArchive ? "bg-orange-500" : "bg-slate-200")}
                          >
                            <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all", settings.autoArchive ? "right-1" : "left-1")} />
                          </button>
                        </div>
                      </>
                    )}

                    {activeSettingsTab === 'Notifications' && (
                      <>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={cn("text-sm font-semibold", settings.theme === 'Dark' ? "text-slate-200" : "text-slate-800")}>Push Notifications</p>
                            <p className="text-xs text-slate-500">Receive alerts on your device</p>
                          </div>
                          <button 
                            onClick={() => setSettings({...settings, pushNotifications: !settings.pushNotifications})}
                            className={cn("w-10 h-5 rounded-full transition-colors relative", settings.pushNotifications ? "bg-orange-500" : "bg-slate-200")}
                          >
                            <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all", settings.pushNotifications ? "right-1" : "left-1")} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={cn("text-sm font-semibold", settings.theme === 'Dark' ? "text-slate-200" : "text-slate-800")}>Sound Effects</p>
                            <p className="text-xs text-slate-500">Play sounds for messages</p>
                          </div>
                          <button 
                            onClick={() => setSettings({...settings, soundEffects: !settings.soundEffects})}
                            className={cn("w-10 h-5 rounded-full transition-colors relative", settings.soundEffects ? "bg-orange-500" : "bg-slate-200")}
                          >
                            <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all", settings.soundEffects ? "right-1" : "left-1")} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={cn("text-sm font-semibold", settings.theme === 'Dark' ? "text-slate-200" : "text-slate-800")}>Email Digest</p>
                            <p className="text-xs text-slate-500">Weekly summary of activity</p>
                          </div>
                          <button 
                            onClick={() => setSettings({...settings, emailDigest: !settings.emailDigest})}
                            className={cn("w-10 h-5 rounded-full transition-colors relative", settings.emailDigest ? "bg-orange-500" : "bg-slate-200")}
                          >
                            <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all", settings.emailDigest ? "right-1" : "left-1")} />
                          </button>
                        </div>
                      </>
                    )}

                    {activeSettingsTab === 'Personalization' && (
                      <>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={cn("text-sm font-semibold", settings.theme === 'Dark' ? "text-slate-200" : "text-slate-800")}>Response Tone</p>
                            <p className="text-xs text-slate-500">Adjust AI personality</p>
                          </div>
                          <select 
                            value={settings.responseTone}
                            onChange={(e) => setSettings({...settings, responseTone: e.target.value})}
                            className={cn(
                              "text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 transition-colors",
                              settings.theme === 'Dark' ? "bg-slate-800 border-slate-700 text-slate-100" : "border-slate-200"
                            )}
                          >
                            <option>Professional</option>
                            <option>Casual</option>
                            <option>Creative</option>
                          </select>
                        </div>
                        <div>
                          <p className={cn("text-sm font-semibold mb-2", settings.theme === 'Dark' ? "text-slate-200" : "text-slate-800")}>Custom Instructions</p>
                          <textarea 
                            value={settings.customInstructions}
                            onChange={(e) => setSettings({...settings, customInstructions: e.target.value})}
                            placeholder="Tell AI how to respond..."
                            className={cn(
                              "w-full text-sm rounded-xl focus:ring-orange-500 focus:border-orange-500 h-24 transition-colors",
                              settings.theme === 'Dark' ? "bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-600" : "border-slate-200"
                            )}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={cn("text-sm font-semibold", settings.theme === 'Dark' ? "text-slate-200" : "text-slate-800")}>AI Memory</p>
                            <p className="text-xs text-slate-500">Remember details across chats</p>
                          </div>
                          <button 
                            onClick={() => setSettings({...settings, aiMemory: !settings.aiMemory})}
                            className={cn("w-10 h-5 rounded-full transition-colors relative", settings.aiMemory ? "bg-orange-500" : "bg-slate-200")}
                          >
                            <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all", settings.aiMemory ? "right-1" : "left-1")} />
                          </button>
                        </div>
                      </>
                    )}

                    {activeSettingsTab === 'App' && (
                      <>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={cn("text-sm font-semibold", settings.theme === 'Dark' ? "text-slate-200" : "text-slate-800")}>Real-time Search</p>
                            <p className="text-xs text-slate-500">Search the web for current info</p>
                          </div>
                          <button 
                            onClick={() => setSettings({...settings, realTimeSearch: !settings.realTimeSearch})}
                            className={cn("w-10 h-5 rounded-full transition-colors relative", settings.realTimeSearch ? "bg-orange-500" : "bg-slate-200")}
                          >
                            <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all", settings.realTimeSearch ? "right-1" : "left-1")} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={cn("text-sm font-semibold", settings.theme === 'Dark' ? "text-slate-200" : "text-slate-800")}>Offline Mode</p>
                            <p className="text-xs text-slate-500">Access cached chats without internet</p>
                          </div>
                          <button 
                            onClick={() => setSettings({...settings, offlineMode: !settings.offlineMode})}
                            className={cn("w-10 h-5 rounded-full transition-colors relative", settings.offlineMode ? "bg-orange-500" : "bg-slate-200")}
                          >
                            <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all", settings.offlineMode ? "right-1" : "left-1")} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={cn("text-sm font-semibold", settings.theme === 'Dark' ? "text-slate-200" : "text-slate-800")}>Experimental Features</p>
                            <p className="text-xs text-slate-500">Try beta features early</p>
                          </div>
                          <button 
                            onClick={() => setSettings({...settings, experimentalFeatures: !settings.experimentalFeatures})}
                            className={cn("w-10 h-5 rounded-full transition-colors relative", settings.experimentalFeatures ? "bg-orange-500" : "bg-slate-200")}
                          >
                            <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all", settings.experimentalFeatures ? "right-1" : "left-1")} />
                          </button>
                        </div>
                      </>
                    )}

                    {activeSettingsTab === 'Appearance' && (
                      <>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={cn("text-sm font-semibold", settings.theme === 'Dark' ? "text-slate-200" : "text-slate-800")}>Theme</p>
                            <p className="text-xs text-slate-500">Customize the look of the app</p>
                          </div>
                          <select 
                            value={settings.theme}
                            onChange={(e) => setSettings({...settings, theme: e.target.value})}
                            className={cn(
                              "text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 transition-colors",
                              settings.theme === 'Dark' ? "bg-slate-800 border-slate-700 text-slate-100" : "border-slate-200"
                            )}
                          >
                            <option>Light</option>
                            <option>Dark</option>
                            <option>System</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={cn("text-sm font-semibold", settings.theme === 'Dark' ? "text-slate-200" : "text-slate-800")}>Font Size</p>
                            <p className="text-xs text-slate-500">Adjust text size for readability</p>
                          </div>
                          <select 
                            value={settings.fontSize}
                            onChange={(e) => setSettings({...settings, fontSize: e.target.value})}
                            className={cn(
                              "text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 transition-colors",
                              settings.theme === 'Dark' ? "bg-slate-800 border-slate-700 text-slate-100" : "border-slate-200"
                            )}
                          >
                            <option>Small</option>
                            <option>Medium</option>
                            <option>Large</option>
                          </select>
                        </div>
                      </>
                    )}

                    {activeSettingsTab === 'Data controls' && (
                      <>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={cn("text-sm font-semibold", settings.theme === 'Dark' ? "text-slate-200" : "text-slate-800")}>Chat History & Training</p>
                            <p className="text-xs text-slate-500">Save chats and allow them to be used for training</p>
                          </div>
                          <button 
                            onClick={() => setSettings({...settings, chatHistoryTraining: !settings.chatHistoryTraining})}
                            className={cn("w-10 h-5 rounded-full transition-colors relative", settings.chatHistoryTraining ? "bg-orange-500" : "bg-slate-200")}
                          >
                            <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all", settings.chatHistoryTraining ? "right-1" : "left-1")} />
                          </button>
                        </div>
                        <button 
                          onClick={() => { if(confirm('Are you sure you want to clear all chats?')) { setChats([]); resetChat(); } }}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                            settings.theme === 'Dark' ? "border-red-900/30 text-red-400 hover:bg-red-950/30" : "border-red-100 text-red-600 hover:bg-red-50"
                          )}
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="text-sm font-medium">Clear all chats</span>
                        </button>
                        <button 
                          onClick={() => alert('Exporting data...')}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                            settings.theme === 'Dark' ? "border-slate-800 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"
                          )}
                        >
                          <DownloadCloud className="w-4 h-4" />
                          <span className="text-sm font-medium">Export data</span>
                        </button>
                      </>
                    )}

                    {activeSettingsTab === 'Security' && (
                      <>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={cn("text-sm font-semibold", settings.theme === 'Dark' ? "text-slate-200" : "text-slate-800")}>Two-factor Authentication</p>
                            <p className="text-xs text-slate-500">Add an extra layer of security</p>
                          </div>
                          <button 
                            onClick={() => setSettings({...settings, twoFactorAuth: !settings.twoFactorAuth})}
                            className={cn("w-10 h-5 rounded-full transition-colors relative", settings.twoFactorAuth ? "bg-orange-500" : "bg-slate-200")}
                          >
                            <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all", settings.twoFactorAuth ? "right-1" : "left-1")} />
                          </button>
                        </div>
                        <button 
                          onClick={() => alert('Login history: \n- Today, 10:00 AM (Current)\n- Yesterday, 09:00 PM')}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                            settings.theme === 'Dark' ? "border-slate-800 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"
                          )}
                        >
                          <History className="w-4 h-4" />
                          <span className="text-sm font-medium">Login history</span>
                        </button>
                        <button 
                          onClick={() => alert('API Key Management opened')}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                            settings.theme === 'Dark' ? "border-slate-800 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"
                          )}
                        >
                          <Key className="w-4 h-4" />
                          <span className="text-sm font-medium">API key management</span>
                        </button>
                      </>
                    )}

                    {activeSettingsTab === 'Account' && (
                      <>
                        {!isLoggedIn ? (
                          <div className="space-y-6">
                            {!showSignInOptions ? (
                              <div className={cn(
                                "p-8 rounded-3xl border text-center transition-colors",
                                settings.theme === 'Dark' ? "bg-slate-800/30 border-slate-800" : "bg-slate-50 border-slate-100"
                              )}>
                                <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <UserCircle className="w-8 h-8 text-orange-500" />
                                </div>
                                <h4 className={cn("text-xl font-bold mb-2", settings.theme === 'Dark' ? "text-slate-100" : "text-slate-900")}>Sign in to VishalX.ai</h4>
                                <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">Sync your chats across devices and unlock advanced AI features.</p>
                                
                                <div className="space-y-3">
                                  <button 
                                    onClick={() => setShowSignInOptions(true)}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
                                  >
                                    <LogIn className="w-4 h-4" />
                                    Sign In
                                  </button>
                                  <button 
                                    onClick={() => alert('Redirecting to Sign Up...')}
                                    className={cn(
                                      "w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold transition-all border",
                                      settings.theme === 'Dark' ? "bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                    )}
                                  >
                                    <UserPlus className="w-4 h-4" />
                                    Create Account
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <button 
                                  onClick={() => setShowSignInOptions(false)}
                                  className="flex items-center gap-2 text-sm text-slate-500 hover:text-orange-500 transition-colors mb-2"
                                >
                                  <ArrowLeft className="w-4 h-4" />
                                  Back
                                </button>
                                <h4 className={cn("text-xl font-bold mb-4", settings.theme === 'Dark' ? "text-slate-100" : "text-slate-900")}>Choose Sign In Method</h4>
                                
                                <div className="space-y-3">
                                  <button 
                                    onClick={() => { setIsLoggedIn(true); setShowSignInOptions(false); alert('Signed in with Google!'); }}
                                    className={cn(
                                      "w-full flex items-center gap-3 p-4 rounded-2xl border transition-all font-medium",
                                      settings.theme === 'Dark' ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-100" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                                    )}
                                  >
                                    <Globe className="w-5 h-5 text-blue-500" />
                                    Continue with Google
                                  </button>
                                  <button 
                                    onClick={() => { setIsLoggedIn(true); setShowSignInOptions(false); alert('Signed in with Email!'); }}
                                    className={cn(
                                      "w-full flex items-center gap-3 p-4 rounded-2xl border transition-all font-medium",
                                      settings.theme === 'Dark' ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-100" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                                    )}
                                  >
                                    <Mail className="w-5 h-5 text-orange-500" />
                                    Continue with Email
                                  </button>
                                  <button 
                                    onClick={() => { setIsLoggedIn(true); setShowSignInOptions(false); alert('Signed in with Phone!'); }}
                                    className={cn(
                                      "w-full flex items-center gap-3 p-4 rounded-2xl border transition-all font-medium",
                                      settings.theme === 'Dark' ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-100" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                                    )}
                                  >
                                    <Phone className="w-5 h-5 text-emerald-500" />
                                    Continue with Phone
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className={cn(
                            "p-4 rounded-2xl border mb-4 transition-colors",
                            settings.theme === 'Dark' ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"
                          )}>
                            <div className="flex items-center gap-4 mb-4">
                              <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-xl">
                                V
                              </div>
                              <div>
                                <p className={cn("text-base font-bold", settings.theme === 'Dark' ? "text-slate-100" : "text-slate-800")}>Vishal Kumar</p>
                                <p className="text-xs text-slate-500">vishalstudyvs8655@gmail.com</p>
                              </div>
                            </div>
                            <div className={cn(
                              "flex items-center justify-between p-3 rounded-xl border transition-colors",
                              settings.theme === 'Dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
                            )}>
                              <span className="text-sm font-medium text-slate-400">Current Plan</span>
                              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded uppercase">Free</span>
                            </div>
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <button 
                            onClick={() => {
                              const plan = confirm('Upgrade to Pro for $20/month?') ? 'Pro' : 'Free';
                              alert(`Plan updated to ${plan}`);
                            }}
                            className={cn(
                              "w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left",
                              settings.theme === 'Dark' ? "border-slate-800 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"
                            )}
                          >
                            <span className="text-sm font-medium">Manage Subscription</span>
                            <ChevronRight className="w-3 h-3 text-slate-400" />
                          </button>
                          
                          <div className="pt-2 pb-1">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1 mb-2">Support & Legal</p>
                          </div>

                          <button 
                            onClick={() => window.open('https://help.openai.com', '_blank')}
                            className={cn(
                              "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                              settings.theme === 'Dark' ? "border-slate-800 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"
                            )}
                          >
                            <HelpCircle className="w-3 h-3 text-slate-400" />
                            <span className="text-sm font-medium">Help Center</span>
                          </button>

                          <button 
                            onClick={() => alert('Terms of Use: \n1. Be respectful\n2. Do not spam\n3. Enjoy the AI')}
                            className={cn(
                              "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                              settings.theme === 'Dark' ? "border-slate-800 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"
                            )}
                          >
                            <FileSignature className="w-3 h-3 text-slate-400" />
                            <span className="text-sm font-medium">Terms of Use</span>
                          </button>

                          <button 
                            onClick={() => alert('Privacy Policy: \nYour data is encrypted and never sold to third parties.')}
                            className={cn(
                              "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                              settings.theme === 'Dark' ? "border-slate-800 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"
                            )}
                          >
                            <Shield className="w-3 h-3 text-slate-400" />
                            <span className="text-sm font-medium">Privacy Policy</span>
                          </button>

                          <div className="pt-4">
                            <button 
                              onClick={() => {
                                setIsLoggedIn(false);
                                alert('Logged out successfully');
                              }}
                              className={cn(
                                "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                                settings.theme === 'Dark' ? "border-slate-800 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"
                              )}
                            >
                              <LogOut className="w-3 h-3 text-slate-400" />
                              <span className="text-sm font-medium">Log out</span>
                            </button>
                            <button 
                              onClick={() => { 
                                if(confirm('Are you sure you want to delete your account? This cannot be undone.')) {
                                  setIsLoggedIn(false);
                                  setChats([]);
                                  alert('Account and all data deleted');
                                }
                              }}
                              className={cn(
                                "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left mt-2",
                                settings.theme === 'Dark' ? "border-red-900/30 text-red-400 hover:bg-red-950/30" : "border-red-100/50 text-red-500 hover:bg-red-500/10"
                              )}
                            >
                              <Trash2 className="w-3 h-3" />
                              <span className="text-sm font-medium">Delete account</span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Redundant coming soon removed */}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className={cn(
          "flex items-center justify-between px-4 py-3 border-b shrink-0 transition-colors",
          settings.theme === 'Dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
        )}>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                settings.theme === 'Dark' ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-600"
              )}
            >
              <Menu className="w-4 h-4" />
            </button>
            {showChat && (
              <button 
                onClick={resetChat}
                className={cn(
                  "p-1 rounded-full transition-colors",
                  settings.theme === 'Dark' ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-600"
                )}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2.5">
              <Logo className="w-6 h-6" />
              <h1 className={cn("text-2xl font-bold tracking-tight transition-colors", settings.theme === 'Dark' ? "text-slate-100" : "text-slate-900")}>VishalX.ai</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={downloadAPK}
              className={cn(
                "p-2 rounded-full transition-colors",
                settings.theme === 'Dark' ? "text-slate-400 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100"
              )}
              title={t.downloadAPK}
            >
              <DownloadCloud className="w-5 h-5" />
            </button>
            <button className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white rounded-full text-sm font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 active:scale-95">
              <Sparkles className="w-2.5 h-2.5" />
              {t.upgrade}
            </button>
          </div>
        </header>

      {/* Main Content */}
      <main className={cn(
        "flex-1 overflow-y-auto relative transition-colors",
        settings.theme === 'Dark' ? "bg-slate-950" : "bg-white"
      )}>
        <AnimatePresence mode="wait">
          {!showChat ? (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center min-h-full p-6"
            >
              <h2 className={cn("text-2xl font-bold mb-8 text-center", settings.theme === 'Dark' ? "text-slate-100" : "text-slate-800")}>
                {t.howCanIHelp}
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-2xl">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.prompt)}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 border rounded-2xl transition-all group",
                      settings.theme === 'Dark' ? "bg-slate-900 border-slate-800 hover:border-orange-500/50 hover:bg-slate-800" : "bg-white border-slate-200 hover:border-orange-200 hover:bg-orange-50/30"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-lg flex items-center justify-center mb-2 transition-transform group-hover:scale-110",
                      cat.color,
                      settings.theme === 'Dark' && "brightness-110"
                    )}>
                      <cat.icon className="w-2.5 h-2.5" />
                    </div>
                    <span className={cn("text-xs font-semibold transition-colors", settings.theme === 'Dark' ? "text-slate-400 group-hover:text-slate-100" : "text-slate-700")}>{cat.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col p-4 space-y-6"
            >
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "flex gap-3 max-w-[85%] relative group/msg",
                    msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    msg.role === 'user' ? (settings.theme === 'Dark' ? "bg-slate-800" : "bg-slate-100") : "bg-orange-500"
                  )}>
                    {msg.role === 'user' ? <User className={cn("w-5 h-5", settings.theme === 'Dark' ? "text-slate-400" : "text-slate-600")} /> : <Bot className="w-5 h-5 text-white" />}
                  </div>
                  <div className="relative group/actions">
                    <div className={cn(
                      "p-4 rounded-2xl text-sm transition-colors",
                      msg.role === 'user' 
                        ? (settings.theme === 'Dark' ? "bg-slate-800 text-slate-100 rounded-tr-none" : "bg-slate-900 text-white rounded-tr-none") 
                        : (settings.theme === 'Dark' ? "bg-slate-900 text-slate-300 rounded-tl-none border border-slate-800" : "bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100")
                    )}>
                      <div className={cn("markdown-body", settings.theme === 'Dark' && "dark-markdown")}>
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    </div>

                    <div className={cn(
                      "absolute -bottom-8 flex items-center gap-1 opacity-0 group-hover/actions:opacity-100 transition-opacity",
                      msg.role === 'user' ? "right-0" : "left-0"
                    )}>
                      <button onClick={() => copyToClipboard(msg.content)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors" title="Copy">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { setInput(msg.content); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors" title="Edit">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => shareContent(msg.content)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors" title="Share">
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 mr-auto">
                  <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center animate-pulse">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className={cn(
                    "p-4 border rounded-2xl rounded-tl-none flex gap-1 transition-colors",
                    settings.theme === 'Dark' ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-100"
                  )}>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Input Area */}
      <footer className={cn(
        "p-4 shrink-0 relative transition-colors",
        settings.theme === 'Dark' ? "bg-slate-950 border-t border-slate-900" : "bg-white"
      )}>
        <div className="relative max-w-2xl mx-auto">
          {/* Plus Menu Dropdown */}
          <AnimatePresence>
            {isPlusMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className={cn(
                  "absolute bottom-full right-0 mb-4 w-56 border rounded-2xl shadow-xl z-50 overflow-hidden transition-colors",
                  settings.theme === 'Dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                )}
              >
                <div className="p-2 grid grid-cols-1 gap-1">
                  {[
                    { icon: ImageIcon, label: 'Photo', color: 'text-purple-500', action: () => fileInputRef.current?.click() },
                    { icon: Camera, label: 'Camera', color: 'text-blue-500', action: () => cameraInputRef.current?.click() },
                    { icon: FileText, label: 'File', color: 'text-orange-500', action: () => fileInputRef.current?.click() },
                    { icon: HardDrive, label: 'Drive', color: 'text-emerald-500', action: () => alert('Opening Drive...') },
                    { icon: Zap, label: 'Deep Research', color: 'text-yellow-500', action: () => setInput('Deep Research: ') },
                    { icon: Search, label: 'Web Search', color: 'text-cyan-500', action: () => setInput('Web Search: ') },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => {
                        setIsPlusMenuOpen(false);
                        item.action();
                      }}
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-xl transition-colors text-left group",
                        settings.theme === 'Dark' ? "hover:bg-slate-800" : "hover:bg-slate-50"
                      )}
                    >
                      <div className={cn("w-5 h-5 rounded-lg flex items-center justify-center transition-colors", settings.theme === 'Dark' ? "bg-slate-800" : "bg-slate-50")}>
                        <item.icon className={cn("w-2.5 h-2.5", item.color)} />
                      </div>
                      <span className={cn("text-sm font-medium", settings.theme === 'Dark' ? "text-slate-300 group-hover:text-slate-100" : "text-slate-700")}>{item.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={cn(
            "flex items-center gap-2 p-2 border rounded-2xl transition-all",
            settings.theme === 'Dark' 
              ? "bg-slate-900 border-slate-800 focus-within:border-orange-500/30" 
              : "bg-slate-50 border-slate-200 focus-within:border-orange-300"
          )}>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setMessages(prev => [...prev, { role: 'user', content: `Attached file: ${file.name}` }]);
                  setShowChat(true);
                }
              }} 
            />
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              ref={cameraInputRef} 
              className="hidden" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setMessages(prev => [...prev, { role: 'user', content: `Captured photo: ${file.name}` }]);
                  setShowChat(true);
                }
              }} 
            />
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t.messagePlaceholder}
              className={cn(
                "flex-1 bg-transparent border-none focus:ring-0 outline-none text-sm py-2 px-3 placeholder:text-slate-500",
                settings.theme === 'Dark' ? "text-slate-100" : "text-slate-800"
              )}
            />
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                className={cn(
                  "p-2 transition-all rounded-full shrink-0",
                  isPlusMenuOpen ? "bg-orange-500 text-white rotate-45" : (settings.theme === 'Dark' ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600")
                )}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={startListening}
                className={cn(
                  "p-2 transition-colors rounded-full shrink-0",
                  isListening ? "bg-red-500 text-white animate-pulse" : (settings.theme === 'Dark' ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600")
                )}
              >
                <Mic className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className={cn(
                  "p-2 rounded-xl transition-all shrink-0",
                  input.trim() && !isLoading 
                    ? (settings.theme === 'Dark' ? "bg-orange-500 text-white" : "bg-slate-900 text-white") 
                    : (settings.theme === 'Dark' ? "text-slate-700" : "text-slate-300")
                )}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <p className="text-[10px] text-center text-slate-500 mt-2">
            {t.footerNote}
          </p>
        </div>
      </footer>
    </div>
  </div>
  );
}
