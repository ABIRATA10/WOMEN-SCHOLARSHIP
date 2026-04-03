import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Bot, User, Loader2, HelpCircle, AlertTriangle, Info, Menu } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { User as UserType, UserProfile } from '../types';

const ZigIcon = ({ size = 24 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" rx="20" fill="#4F46E5" />
    <path d="M30 30 L70 30 L30 70 L70 70" stroke="white" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface Message {
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface SupportChatbotProps {
  user: UserType | null;
  profile?: UserProfile | null;
}

export const SupportChatbot: React.FC<SupportChatbotProps> = ({ user, profile }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    let timeOfDay = 'evening';
    if (hour < 12) timeOfDay = 'morning';
    else if (hour < 18) timeOfDay = 'afternoon';
    
    const name = profile?.preferredName || profile?.fullName?.split(' ')[0] || user?.fullName?.split(' ')[0] || 'there';
    return `Hi ${name}, good ${timeOfDay}! How can I help you?`;
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot',
      content: getGreeting(),
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
            You are "Zig", the official AI Scholarship Advisor and Mentor for MeritUs.
            The user you are talking to is named ${profile?.preferredName || profile?.fullName || user?.fullName || 'User'}. Always address them by their name occasionally to make it personal.
            
            Your Persona:
            - **Empowering & Professional**: You are a highly knowledgeable mentor. You believe in the potential of every student and provide strategic, actionable advice to help them secure funding.
            - **Empathetic & Grounded**: You understand the systemic challenges students face in education and finance. You validate their experiences and offer practical solutions.
            - **Clear & Concise**: Your advice is structured, easy to follow, and directly addresses the user's query. Avoid overwhelming them with too much text.
            - **Multilingual Support**: You MUST understand and respond to Hindi and Odia written in English (Latin script/Hinglish/Odi-lish). For example, if a user says "kesa hai" or "kemiti achu" (how are you), you must understand it and respond appropriately, either in the same language (written in English) or in English, depending on the user's preference or context.
            
            Platform Context:
            - MeritUs is a platform dedicated to matching students with global scholarships, grants, and fellowships.
            - Users have profiles detailing their academic background, financial need, and career goals.
            - The platform features an AI-driven matching system, a dashboard for tracking applications, and personalized recommendations.

            Support Guidelines:
            1. **Actionable Advice**: Always provide clear next steps. If they ask about essays, give them a 3-point structure. If they ask about eligibility, tell them exactly what to check.
            2. **Encouragement through Strategy**: Instead of just saying "You can do it!", say "Your background in [Field] is a strong asset. Let's highlight that in your application."
            3. **Troubleshooting**: If they report an issue, be clear and helpful: "Let's get that fixed. Please try refreshing the page, or check your internet connection. If the issue persists, our technical team is on it."
            4. **Formatting**: Use bolding for key terms, bullet points for lists, and keep paragraphs short.
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
        className="fixed left-4 bottom-4 md:left-6 md:bottom-6 z-[110] w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform group"
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
            className="fixed left-4 bottom-20 md:left-6 md:bottom-24 z-[110] w-[calc(100vw-2rem)] sm:w-96 max-w-full bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col h-[500px] md:h-[600px] max-h-[80vh]"
          >
            {/* Header */}
            <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                  <ZigIcon size={32} />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-widest">Zig</h3>
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
                      msg.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-white text-white'
                    }`}>
                      {msg.role === 'user' ? <User size={16} /> : <ZigIcon size={20} />}
                    </div>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
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
                    <div className="w-8 h-8 bg-white text-white rounded-lg flex items-center justify-center">
                      <ZigIcon size={20} />
                    </div>
                    <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
                      <Loader2 className="animate-spin text-blue-500" size={18} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="px-6 py-3 bg-white border-t border-slate-50 flex gap-2 overflow-x-auto no-scrollbar">
              {[
                { label: 'Eligibility tips?', icon: <HelpCircle size={12} /> },
                { label: 'Application steps?', icon: <Info size={12} /> },
                { label: 'Error loading?', icon: <AlertTriangle size={12} /> },
                { label: 'How to save?', icon: <HelpCircle size={12} /> }
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => setInput(action.label)}
                  className="whitespace-nowrap px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 rounded-lg border border-slate-100 transition-colors flex items-center gap-1.5"
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
                  className="w-full pl-6 pr-14 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-sm font-medium"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-100"
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
