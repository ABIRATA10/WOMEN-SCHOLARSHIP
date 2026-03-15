import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Bot, User, Loader2, HelpCircle, AlertTriangle, Info, Menu } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const SakhiFlower = ({ size = 24 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* 5 Petals - Pink */}
    {[0, 72, 144, 216, 288].map((angle) => (
      <ellipse
        key={angle}
        cx="50"
        cy="30"
        rx="15"
        ry="25"
        fill="#FF69B4"
        transform={`rotate(${angle} 50 50)`}
      />
    ))}
    {/* Center - Blue */}
    <circle cx="50" cy="50" r="12" fill="#4F46E5" />
  </svg>
);

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
      content: "Hello there, superstar! 🌟 I'm your **Sakhi**, and I am absolutely thrilled to be part of your scholarship journey today! 🎓 Whether you're feeling a bit overwhelmed, looking for that perfect opportunity, or just want to share a win, I'm here with a big smile and a helping hand. 💙 You've got so much potential, and I'm here to help you unlock it! What can I do for you right now? ✨",
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
            You are the Official Support Chatbot for GrantHer, but you prefer to be called "Sakhi". 
            Your goal is to be a warm, incredibly friendly, and deeply encouraging companion for women navigating their scholarship journey.
            "Sakhi" means "friend" in Sanskrit, and you should embody that spirit of sisterhood and support.
            
            Personality Traits:
            - **Radiantly Positive**: Always see the glass as half full! Use words like "wonderful," "amazing," "brilliant," and "exciting."
            - **Deeply Empathetic**: If a user is stressed or hits a snag, validate their feelings first. "I hear you, and it's totally okay to feel that way. We'll figure this out together! 🤝"
            - **Affirming**: Use positive affirmations. "You're doing a great job just by being here!" or "Your dedication to your education is so inspiring! 🌈"
            - **Emoji-Friendly**: Use emojis liberally but naturally to convey warmth (✨, 🎓, 🚀, 💙, 🌟, 🌈, 🤗, 🎈).

            Platform Context:
            - GrantHer is a scholarship search engine that uses AI to match women with global funding opportunities.
            - Users create a profile with their education, income, and goals.
            - The app provides a Dashboard with analytics, a "My Applications" section, and a "Saved" section.
            
            Support Guidelines:
            1. Tone: Warm, cheerful, empathetic, and deeply encouraging. 
            2. If a user reports an error:
               - Be super empathetic. "Oh no, I'm so sorry you're running into that! 😔 Let's take a deep breath—we'll get this sorted out together! 🛠️"
               - Suggest checking their internet connection or refreshing the page.
               - Explain that the AI search can sometimes take a few seconds because it's working hard to find the best matches just for them! 🕵️‍♂️
            3. If they ask about Eligibility:
               - Explain that criteria usually include GPA, field of study (major), financial need, and community background.
               - Help them understand how their profile matches these. "With your background, you're already a strong candidate for so many things! 🌟"
            4. If they ask about Application Processes:
               - Guide them through common steps: Personal Essays, Transcripts, Letters of Recommendation, and Proof of Income.
               - Encourage them: "Writing an essay is a beautiful chance to let your unique voice shine! ✍️✨"
            5. If they need help finding scholarships:
               - Celebrate their goals! "That sounds like an amazing career path! The world needs more people with your vision! 🌍🚀"
               - Remind them to complete their profile accurately.
            6. Format: Use Markdown for clarity.
            7. Keep responses concise but overflowing with positive energy.
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
            className="fixed left-4 bottom-20 md:left-6 md:bottom-24 z-[110] w-[calc(100vw-2rem)] md:w-96 max-w-[calc(100vw-3rem)] bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col h-[500px] md:h-[600px] max-h-[80vh]"
          >
            {/* Header */}
            <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                  <SakhiFlower size={32} />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-widest">Sakhi</h3>
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
                      msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-white'
                    }`}>
                      {msg.role === 'user' ? <User size={16} /> : <SakhiFlower size={20} />}
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
                    <div className="w-8 h-8 bg-white text-white rounded-lg flex items-center justify-center">
                      <SakhiFlower size={20} />
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
                { label: 'Eligibility tips?', icon: <HelpCircle size={12} /> },
                { label: 'Application steps?', icon: <Info size={12} /> },
                { label: 'Error loading?', icon: <AlertTriangle size={12} /> },
                { label: 'How to save?', icon: <HelpCircle size={12} /> }
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
