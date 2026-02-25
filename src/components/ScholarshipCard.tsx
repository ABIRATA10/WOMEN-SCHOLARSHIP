import React, { useState } from 'react';
import { Scholarship, MatchResult } from '../types';
import { ExternalLink, Award, Calendar, Building2, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ScholarshipCardProps {
  scholarship: Scholarship;
  match?: MatchResult;
}

export const ScholarshipCard: React.FC<ScholarshipCardProps> = ({ scholarship, match }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isHighMatch = match && match.matchScore >= 80;
  const isMediumMatch = match && match.matchScore >= 50 && match.matchScore < 80;

  const getCategoryStyles = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('government')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (cat.includes('private')) return 'bg-blue-50 text-blue-600 border-blue-100';
    if (cat.includes('ngo') || cat.includes('non-profit')) return 'bg-purple-50 text-purple-600 border-purple-100';
    if (cat.includes('university')) return 'bg-amber-50 text-amber-600 border-amber-100';
    if (cat.includes('international')) return 'bg-indigo-50 text-indigo-600 border-indigo-100';
    return 'bg-rose-50 text-rose-600 border-rose-100';
  };

  const getMatchStyles = (score: number) => {
    if (score >= 80) return 'bg-emerald-500 text-white shadow-lg shadow-emerald-200';
    if (score >= 50) return 'bg-amber-500 text-white shadow-lg shadow-amber-200';
    return 'bg-rose-500 text-white shadow-lg shadow-rose-200';
  };

  const categoryStyles = getCategoryStyles(scholarship.category);

  const isPastDeadline = (() => {
    const deadline = scholarship.deadline.toLowerCase();
    if (deadline.includes('rolling') || deadline.includes('upcoming')) return false;
    try {
      const deadlineDate = new Date(scholarship.deadline);
      if (isNaN(deadlineDate.getTime())) return false;
      const now = new Date('2026-02-24');
      return deadlineDate < now;
    } catch {
      return false;
    }
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-indigo-200/40 transition-all flex flex-col h-full group relative overflow-hidden ${isPastDeadline ? 'opacity-75 grayscale-[0.2]' : ''}`}
    >
      {/* Decorative gradient corner */}
      <div className={`absolute -top-12 -right-12 w-24 h-24 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity ${
        isHighMatch ? 'bg-emerald-400' : isMediumMatch ? 'bg-amber-400' : 'bg-rose-400'
      }`} />

      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex flex-wrap gap-2">
          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${categoryStyles}`}>
            {scholarship.category}
          </span>
          {isPastDeadline ? (
            <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-1">
              <AlertCircle size={10} /> Past Deadline
            </span>
          ) : (
            <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1">
              <CheckCircle2 size={10} /> Apply Now
            </span>
          )}
          {scholarship.targetCommunity && scholarship.targetCommunity.toLowerCase() !== 'general' && (
            <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white border border-slate-800">
              {scholarship.targetCommunity}
            </span>
          )}
        </div>
        {match && (
          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${getMatchStyles(match.matchScore)}`}>
            {isHighMatch ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
            {match.matchScore}% Match
          </span>
        )}
      </div>

      <h3 className="text-2xl font-black text-slate-900 mb-3 leading-[1.1] group-hover:text-indigo-600 transition-colors relative z-10">
        {scholarship.title}
      </h3>
      
      <div className="space-y-3 mb-6 flex-grow relative z-10">
        <div className="flex items-center gap-3 text-sm text-slate-400 font-bold uppercase tracking-wider">
          <Building2 size={16} className="text-indigo-300" />
          <span>{scholarship.provider}</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3 text-lg text-slate-900 font-black">
            <Award size={18} className="text-amber-500" />
            <span>{scholarship.amount}</span>
          </div>
          {match?.localCurrencyAmount && match.localCurrencyAmount !== scholarship.amount && (
            <div className="text-xs text-emerald-600 font-bold ml-7 bg-emerald-50 px-2 py-0.5 rounded-md inline-block w-fit border border-emerald-100">
              Local: {match.localCurrencyAmount}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-400 font-bold">
          <Calendar size={16} className={isPastDeadline ? "text-slate-400" : "text-rose-300"} />
          <span className={isPastDeadline ? "text-rose-500 line-through" : ""}>Deadline: {scholarship.deadline}</span>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-50 space-y-4 relative z-10">
        <p className="text-sm text-slate-600 font-medium leading-relaxed line-clamp-2">
          {scholarship.description}
        </p>

        <div className="flex items-center justify-start">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-700 transition-colors bg-indigo-50/50 px-4 py-2 rounded-full border border-indigo-100"
          >
            {isExpanded ? (
              <>Show Less <ChevronUp size={14} /></>
            ) : (
              <>View Details & Eligibility <ChevronDown size={14} /></>
            )}
          </button>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-4"
            >
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-4">
                <div>
                  <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <Building2 size={12} /> Provider
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed font-bold">
                    {scholarship.provider}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-1">
                    Full Description
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {scholarship.description}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <Info size={12} /> Eligibility Criteria
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {scholarship.eligibilityCriteria}
                  </p>
                </div>
                
                {match && (
                  <div className="pt-2 border-t border-slate-200/50">
                    <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mb-1">AI Match Analysis</p>
                    <p className="text-xs text-slate-600 italic leading-relaxed font-medium">
                      "{match.reasoning}"
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {isPastDeadline ? (
          <div className="w-full py-5 bg-slate-100 text-slate-400 text-sm font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 border border-slate-200 cursor-not-allowed">
            Deadline Passed <AlertCircle size={18} />
          </div>
        ) : (
          <a
            href={scholarship.link}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-200 group/btn"
          >
            Apply Now <ExternalLink size={18} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
          </a>
        )}
      </div>
    </motion.div>
  );
};
