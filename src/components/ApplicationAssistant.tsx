import React from 'react';
import { UserProfile } from '../types';
import { Copy, Check, X, User, GraduationCap, MapPin, DollarSign, BookOpen, ClipboardCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ApplicationAssistantProps {
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

const Sparkles = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
  </svg>
);

export const ApplicationAssistant: React.FC<ApplicationAssistantProps> = ({ profile, isOpen, onClose }) => {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const fields = [
    { label: 'Full Name', value: profile.fullName, icon: <User size={14} /> },
    { label: 'Education', value: profile.educationLevel, icon: <GraduationCap size={14} /> },
    { label: 'Field of Study', value: profile.fieldOfStudy, icon: <BookOpen size={14} /> },
    { label: 'GPA', value: profile.gpa, icon: <Sparkles size={14} /> },
    { label: 'Income', value: profile.incomeBracket, icon: <DollarSign size={14} /> },
    { label: 'Country', value: profile.country, icon: <MapPin size={14} /> },
    { label: 'State', value: profile.state, icon: <MapPin size={14} /> },
    { label: 'Pincode', value: profile.pincode, icon: <MapPin size={14} /> },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          className="fixed right-6 bottom-6 z-[100] w-80 bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden"
        >
          <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardCheck size={20} className="text-indigo-400" />
              <span className="font-black uppercase tracking-widest text-xs">Auto-Fill Assistant</span>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
              <X size={18} />
            </button>
          </div>
          
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">
              Click to copy your data for the application
            </p>
            
            {fields.map((field) => (
              <div key={field.label} className="group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight flex items-center gap-1.5">
                    {field.icon} {field.label}
                  </span>
                  {copiedField === field.label && (
                    <span className="text-[9px] font-black text-emerald-500 uppercase">Copied!</span>
                  )}
                </div>
                <button
                  onClick={() => copyToClipboard(field.value.toString(), field.label)}
                  className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 rounded-xl transition-all text-left"
                >
                  <span className="text-sm font-bold text-slate-700 truncate mr-2">{field.value}</span>
                  <Copy size={14} className="text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />
                </button>
              </div>
            ))}

            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  const summary = fields.map(f => `${f.label}: ${f.value}`).join('\n');
                  copyToClipboard(summary, 'Full Summary');
                }}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest"
              >
                {copiedField === 'Full Summary' ? <Check size={16} /> : <Copy size={16} />}
                Copy Full Profile Summary
              </button>
            </div>
          </div>
          
          <div className="p-4 bg-slate-50 text-center">
            <p className="text-[9px] text-slate-400 font-medium italic">
              Use this panel to quickly fill out the external application form.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
