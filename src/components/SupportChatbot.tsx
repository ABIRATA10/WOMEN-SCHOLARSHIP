import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Bot, User, Loader2, HelpCircle, AlertTriangle, Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface Message {
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export const SupportChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot',
      content: "Hello! I'm your ScholarMatch Support Assistant. How can I help you today? Whether you're facing an error or need help finding scholarships, I'm here to support you!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-support-chat', handleOpen);
    return () => window.removeEventListener('open-support-chat', handleOpen);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: `
            You are the Official Support Chatbot for ScholarMatch AI. 
            Your goal is to help users resolve errors, understand how the platform works, and provide general support.
            
            Platform Context:
            - ScholarMatch AI is a scholarship search engine that uses AI to match users with global funding opportunities.
            - Users create a profile with their education, income, and goals.
            - The app provides a Dashboard with analytics, a "My Applications" section, and a "Saved" section.
            - There is an "Auto-Fill Assistant" to help copy profile data.
            
            Support Guidelines:
            1. If a user reports an error (e.g., "scholarships not loading", "profile won't save"):
               - Ask for details.
               - Suggest checking their internet connection.
               - Suggest refreshing the page.
               - Explain that the AI search can sometimes take a few seconds.
            2. If they need help finding scholarships:
               - Remind them to complete their profile accurately.
               - Suggest broadening their "Background" or "Career Goals".
            3. Tone: Professional, empathetic, and encouraging.
            4. Format: Use Markdown for clarity (bolding, lists).
            5. Keep responses concise but helpful.
          `,
        },
      });

      const response = await chat.sendMessage({ message: input });
      
      const botMessage: Message = {
        role: 'bot',
        content: response.text || "I'm sorry, I encountered an issue processing your request. Please try again.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Chatbot error:", error);
      setMessages(prev => [...prev, {
        role: 'bot',
        content: "I'm having trouble connecting right now. Please check your connection or try again later.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-6 bottom-6 z-[110] w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform group"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        <span className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold">1</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-6 bottom-24 z-[110] w-96 max-w-[calc(100vw-3rem)] bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col h-[600px] max-h-[70vh]"
          >
            {/* Header */}
            <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-widest">Support AI</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Online & Ready</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/50">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-900 text-white'
                    }`}>
                      {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-white text-slate-700 border border-slate-100 shadow-sm rounded-tl-none'
                    }`}>
                      <div className="markdown-body">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                      <span className={`text-[9px] mt-2 block opacity-50 font-bold uppercase ${
                        msg.role === 'user' ? 'text-right' : 'text-left'
                      }`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center">
                      <Bot size={16} />
                    </div>
                    <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
                      <Loader2 className="animate-spin text-indigo-500" size={18} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="px-6 py-3 bg-white border-t border-slate-50 flex gap-2 overflow-x-auto no-scrollbar">
              {[
                { label: 'Error loading?', icon: <AlertTriangle size={12} /> },
                { label: 'How to save?', icon: <HelpCircle size={12} /> },
                { label: 'About AI', icon: <Info size={12} /> }
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => setInput(action.label)}
                  className="whitespace-nowrap px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 rounded-lg border border-slate-100 transition-colors flex items-center gap-1.5"
                >
                  {action.icon} {action.label}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="p-6 bg-white border-t border-slate-100">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask for support..."
                  className="w-full pl-6 pr-14 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all text-sm font-medium"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-100"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
