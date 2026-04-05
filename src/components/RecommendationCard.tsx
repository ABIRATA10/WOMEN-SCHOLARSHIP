import React from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Target, 
  Calendar, 
  DollarSign, 
  ArrowUpRight, 
  Bookmark, 
  BookmarkCheck,
  CheckCircle2,
  Clock,
  Info
} from 'lucide-react';
import { ScholarshipMatch, ApplicationStatus } from '../types';

interface RecommendationCardProps {
  match: ScholarshipMatch;
  onApply: (id: string) => void;
  onSave: (id: string) => void;
  isSaved: boolean;
  applicationStatus?: ApplicationStatus;
  onUpdateStatus: (id: string, status: ApplicationStatus) => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  match,
  onApply,
  onSave,
  isSaved,
  applicationStatus,
  onUpdateStatus
}) => {
  const { scholarship, match: matchDetails } = match || {};
  
  if (!scholarship || !matchDetails) return null;

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case 'Awarded': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'Applied': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'Rejected': return 'text-rose-600 bg-rose-50 border-rose-100';
      default: return 'text-amber-600 bg-amber-50 border-amber-100';
    }
  };

  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="group bg-white rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-100 transition-all duration-500 overflow-hidden flex flex-col h-full"
    >
      {/* Header with Match Score */}
      <div className="relative p-5 md:p-6 pb-0">
        <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100">
              {scholarship.category || 'General'}
            </span>
            <span className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-slate-100">
              {scholarship.scope}
            </span>
          </div>
          
          <div className="relative w-14 h-14 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="24"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                className="text-slate-100"
              />
              <motion.circle
                initial={{ strokeDashoffset: 150 }}
                animate={{ strokeDashoffset: 150 - (150 * matchDetails.matchScore) / 100 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                cx="28"
                cy="28"
                r="24"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray="150"
                fill="transparent"
                className="text-blue-600"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs font-black text-slate-900 leading-none">{matchDetails.matchScore}%</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Match</span>
            </div>
          </div>
        </div>

        <h3 className="text-lg font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors mb-2 line-clamp-2">
          {scholarship.title}
        </h3>
        <p className="text-xs font-bold text-slate-400 mb-4">{scholarship.provider}</p>
      </div>

      {/* Main Content Area */}
      <div className="px-6 flex-grow">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <DollarSign size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Amount</span>
            </div>
            <p className="text-lg font-black text-emerald-700">{scholarship.amount}</p>
          </div>
          <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100/50">
            <div className="flex items-center gap-2 text-rose-600 mb-1">
              <Calendar size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Deadline</span>
            </div>
            <p className="text-sm font-black text-rose-700">{scholarship.deadline}</p>
          </div>
        </div>

        {/* AI Insight Snippet */}
        <div className="p-4 bg-blue-50/30 rounded-2xl border border-blue-100/30 mb-6">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Sparkles size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">AI Insight</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-medium italic">
            "{matchDetails?.reasoning?.split('.')[0] || 'Great match for your profile'}."
          </p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-6 pt-0 mt-auto">
        <div className="flex items-center gap-3">
          {applicationStatus ? (
            <div className={`flex-grow flex items-center justify-between px-4 py-3 rounded-2xl border ${getStatusColor(applicationStatus)}`}>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span className="text-xs font-black uppercase tracking-widest">{applicationStatus}</span>
              </div>
              <select
                value={applicationStatus}
                onChange={(e) => onUpdateStatus(scholarship.id, e.target.value as ApplicationStatus)}
                className="bg-transparent text-[10px] font-bold focus:outline-none cursor-pointer"
              >
                <option value="In Progress">Update</option>
                <option value="Applied">Applied</option>
                <option value="Awarded">Awarded</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          ) : (
            <a
              href={scholarship.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onApply(scholarship.id)}
              className="flex-grow flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-slate-200 hover:shadow-blue-200"
            >
              Apply Now <ArrowUpRight size={16} />
            </a>
          )}
          
          <button
            onClick={() => onSave(scholarship.id)}
            className={`p-3 rounded-2xl border transition-all ${
              isSaved 
                ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-100' 
                : 'bg-white border-slate-100 text-slate-400 hover:text-rose-500 hover:border-rose-100 hover:bg-rose-50'
            }`}
          >
            {isSaved ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
