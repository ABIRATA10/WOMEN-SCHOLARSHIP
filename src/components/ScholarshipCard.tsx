import React, { useState } from 'react';
import { Scholarship, MatchResult, ApplicationStatus } from '../types';
import { ExternalLink, Award, Calendar, Building2, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Info, Search, Share2, Check, Heart, Clock, Trophy, XCircle, Edit3, Save, X, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

interface ScholarshipCardProps {
  scholarship: Scholarship;
  match?: MatchResult;
  onApply?: (id: string) => void;
  applicationStatus?: ApplicationStatus;
  onUpdateStatus?: (id: string, status: ApplicationStatus) => void;
  onUpdateNotes?: (id: string, notes: string) => void;
  initialNotes?: string;
  onSave?: (id: string) => void;
  isSaved?: boolean;
  onView?: (id: string) => void;
  onSetReminder?: (scholarshipId: string, scholarshipTitle: string, time: string) => void;
}

export const ScholarshipCard: React.FC<ScholarshipCardProps> = ({ 
  scholarship, 
  match, 
  onApply, 
  applicationStatus, 
  onUpdateStatus,
  onUpdateNotes,
  initialNotes = '',
  onSave, 
  isSaved,
  onView,
  onSetReminder
}) => {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [reminderTime, setReminderTime] = useState('');
  const [notes, setNotes] = useState(initialNotes);
  const [copied, setCopied] = useState(false);
  const isHighMatch = match && match.matchScore >= 80;
  const isMediumMatch = match && match.matchScore >= 50 && match.matchScore < 80;

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(scholarship.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

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
      onClick={() => {
        setIsExpanded(!isExpanded);
        onView?.(scholarship.id);
      }}
      className={`bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-indigo-200/40 transition-all flex flex-col h-full group relative overflow-hidden cursor-pointer ${isPastDeadline ? 'opacity-75 grayscale-[0.2]' : ''}`}
    >
      {/* Decorative gradient corner */}
      <div className={`absolute -top-12 -right-12 w-24 h-24 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity ${
        isHighMatch ? 'bg-emerald-400' : isMediumMatch ? 'bg-amber-400' : 'bg-rose-400'
      }`} />

      <div className="flex flex-col sm:flex-row justify-between items-start mb-6 relative z-10 gap-4">
        <div className="flex flex-wrap gap-2">
          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${categoryStyles}`}>
            {scholarship.category}
          </span>
          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
            scholarship.scope === 'State' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
            scholarship.scope === 'National' ? 'bg-blue-50 text-blue-600 border-blue-100' :
            'bg-slate-50 text-slate-600 border-slate-100'
          }`}>
            {scholarship.scope}
          </span>
          {isPastDeadline ? (
            <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-1">
              <AlertCircle size={10} /> Past Deadline
            </span>
          ) : (
            <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1">
              <CheckCircle2 size={10} /> {t('scholarship.apply')}
            </span>
          )}
          {applicationStatus === 'Applied' && (
            <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white border border-emerald-400 flex items-center gap-1 shadow-sm">
              <CheckCircle2 size={10} /> Applied
            </span>
          )}
          {applicationStatus === 'In Progress' && (
            <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500 text-white border border-amber-400 flex items-center gap-1 shadow-sm">
              <Clock size={10} /> In Progress
            </span>
          )}
          {applicationStatus === 'Awarded' && (
            <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white border border-indigo-500 flex items-center gap-1 shadow-sm">
              <Trophy size={10} /> Awarded
            </span>
          )}
          {applicationStatus === 'Rejected' && (
            <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-600 text-white border border-rose-500 flex items-center gap-1 shadow-sm">
              <XCircle size={10} /> Not Awarded
            </span>
          )}
          {isSaved && (
            <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-500 text-white border border-rose-400 flex items-center gap-1 shadow-sm">
              <Heart size={10} className="fill-current" /> {t('scholarship.saved')}
            </span>
          )}
          {scholarship.targetCommunity && scholarship.targetCommunity.toLowerCase() !== 'general' && (
            <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white border border-slate-800">
              {scholarship.targetCommunity}
            </span>
          )}
          {scholarship.major && (
            <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-100">
              {scholarship.major}
            </span>
          )}
          {scholarship.type && (
            <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100">
              {scholarship.type}
            </span>
          )}
        </div>
        {match && (
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-col items-end">
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${getMatchStyles(match.matchScore)}`}>
                {match.matchScore >= 80 ? <CheckCircle2 size={12} /> : match.matchScore >= 50 ? <Info size={12} /> : <AlertCircle size={12} />}
                {match.matchScore}% {t('scholarship.match')}
              </span>
              <span className={`text-[8px] font-black uppercase tracking-tighter mt-1 ${
                match.matchScore >= 80 ? 'text-emerald-600' : 
                match.matchScore >= 50 ? 'text-amber-600' : 'text-rose-600'
              }`}>
                {match.matchScore >= 80 ? t('scholarship.excellentMatch') : 
                 match.matchScore >= 50 ? t('scholarship.goodMatch') : t('scholarship.potentialMatch')}
              </span>
            </div>
            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${match.matchScore}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full ${
                  match.matchScore >= 80 ? 'bg-emerald-500' : 
                  match.matchScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
              />
            </div>
          </div>
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
            {scholarship.scope === 'Global' && match?.localCurrencyAmount && match.localCurrencyAmount !== scholarship.amount && (
              <span className="text-sm text-slate-400 font-medium">
                ({t('scholarship.approx')} {match.localCurrencyAmount})
              </span>
            )}
          </div>
          {scholarship.scope !== 'Global' && match?.localCurrencyAmount && match.localCurrencyAmount !== scholarship.amount && (
            <div className="text-xs text-emerald-600 font-bold ml-7 bg-emerald-50 px-2 py-0.5 rounded-md inline-block w-fit border border-emerald-100">
              {t('scholarship.local')}: {match.localCurrencyAmount}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-400 font-bold">
          <Calendar size={16} className={isPastDeadline ? "text-slate-400" : "text-rose-300"} />
          <span className={isPastDeadline ? "text-rose-500 line-through" : ""}>{t('scholarship.deadline')}: {scholarship.deadline}</span>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-50 space-y-4 relative z-10">
        <p className="text-sm text-slate-600 font-medium leading-relaxed line-clamp-2">
          {scholarship.description}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-700 transition-colors bg-indigo-50/50 px-4 py-2 rounded-full border border-indigo-100"
          >
            {isExpanded ? (
              <>{t('scholarship.less')} <ChevronUp size={14} /></>
            ) : (
              <>{t('scholarship.details')} <ChevronDown size={14} /></>
            )}
          </button>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleShare();
              }}
              className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all px-4 py-2 rounded-full border ${
                copied 
                  ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-100' 
                  : 'text-slate-400 hover:text-slate-600 bg-slate-50/50 border-slate-100'
              }`}
            >
              {copied ? <Check size={14} /> : <Share2 size={14} />}
              <span className="hidden sm:inline">{copied ? t('scholarship.copied') : t('scholarship.share')}</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onSave?.(scholarship.id);
              }}
              className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all px-4 py-2 rounded-full border ${
                isSaved 
                  ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-100' 
                  : 'text-slate-400 hover:text-rose-500 bg-slate-50/50 border-slate-100'
              }`}
            >
              <Heart size={14} className={isSaved ? "fill-current" : ""} />
              <span className="hidden sm:inline">{isSaved ? t('scholarship.saved') : t('scholarship.save')}</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowReminderPicker(!showReminderPicker);
              }}
              className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all px-4 py-2 rounded-full border ${
                showReminderPicker 
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-100' 
                  : 'text-slate-400 hover:text-indigo-600 bg-slate-50/50 border-slate-100'
              }`}
            >
              <Bell size={14} />
              <span className="hidden sm:inline">{t('scholarship.remind')}</span>
            </button>
          </div>
        </div>

        {/* Reminder Picker */}
        <AnimatePresence>
          {showReminderPicker && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="overflow-hidden"
            >
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 mt-4 space-y-3">
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
                  <Clock size={12} /> {t('scholarship.setReminder')}
                </p>
                <div className="flex gap-2">
                  <input
                    type="datetime-local"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="flex-grow p-2 bg-white border border-indigo-100 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button
                    onClick={() => {
                      if (reminderTime) {
                        onSetReminder?.(scholarship.id, scholarship.title, reminderTime);
                        setShowReminderPicker(false);
                        setReminderTime('');
                      }
                    }}
                    disabled={!reminderTime}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {t('scholarship.set')}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                    <Building2 size={12} /> {t('scholarship.provider')}
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed font-bold">
                    {scholarship.provider}
                  </p>
                </div>

                {scholarship.minGpa && (
                  <div>
                    <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-1">
                      {t('scholarship.minGpa')}
                    </p>
                    <p className="text-xs text-slate-700 leading-relaxed font-bold">
                      {scholarship.minGpa}
                    </p>
                  </div>
                )}

                {scholarship.location && (
                  <div>
                    <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-1">
                      {t('scholarship.specificLocation')}
                    </p>
                    <p className="text-xs text-slate-700 leading-relaxed font-bold">
                      {scholarship.location}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-1">
                    {t('scholarship.fullDescription')}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {scholarship.description}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <Info size={12} /> {t('scholarship.eligibilityCriteria')}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {scholarship.eligibilityCriteria}
                  </p>
                </div>

                {scholarship.requirements && scholarship.requirements.length > 0 && (
                  <div>
                    <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-1 flex items-center gap-1.5">
                      <CheckCircle2 size={12} /> {t('scholarship.thingsRequired')}
                    </p>
                    <ul className="list-disc list-inside text-xs text-slate-600 leading-relaxed font-medium space-y-1">
                      {scholarship.requirements.map((req, idx) => (
                        <li key={idx}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {match && (
                  <div className="pt-2 border-t border-slate-200/50">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">{t('scholarship.aiMatchAnalysis')}</p>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                        match.matchScore >= 80 ? 'bg-emerald-50 text-emerald-600' : 
                        match.matchScore >= 50 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {match.matchScore >= 80 ? t('scholarship.excellent') : match.matchScore >= 50 ? t('scholarship.good') : t('scholarship.fair')} {t('scholarship.match')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 italic leading-relaxed font-medium">
                      "{match.reasoning}"
                    </p>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200/50">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <Search size={12} /> {t('scholarship.linkNotWorking')}
                  </p>
                  <a 
                    href={`https://www.google.com/search?q=${encodeURIComponent(scholarship.title + ' ' + scholarship.provider + ' scholarship')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-indigo-600 hover:underline font-bold flex items-center gap-1"
                  >
                    {t('scholarship.searchGoogle')} <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {isPastDeadline ? (
          <div className="w-full py-5 bg-slate-100 text-slate-400 text-sm font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 border border-slate-200 cursor-not-allowed">
            {t('scholarship.deadlinePassed')} <AlertCircle size={18} />
          </div>
        ) : (
          <div className="space-y-4">
            {!applicationStatus ? (
              <a
                href={scholarship.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.stopPropagation();
                  onApply?.(scholarship.id);
                }}
                className="w-full py-5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-200 group/btn"
              >
                {t('scholarship.apply')} <ExternalLink size={18} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
              </a>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={scholarship.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:bg-black transition-all"
                >
                  {t('scholarship.visitPortal')} <ExternalLink size={14} />
                </a>
                <div className="relative group/status">
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className={`w-full py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl border transition-all flex items-center justify-center gap-2 ${
                      applicationStatus === 'Awarded' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                      applicationStatus === 'Applied' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      applicationStatus === 'Rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                      'bg-amber-50 text-amber-600 border-amber-100'
                    }`}
                  >
                    {applicationStatus === 'Applied' ? t('scholarship.status.applied') :
                     applicationStatus === 'In Progress' ? t('scholarship.status.inProgress') :
                     applicationStatus === 'Awarded' ? t('scholarship.status.awarded') :
                     applicationStatus === 'Rejected' ? t('scholarship.status.rejected') : applicationStatus} <ChevronDown size={14} />
                  </button>
                  <div className="absolute bottom-full left-0 w-full mb-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden opacity-0 invisible group-hover/status:opacity-100 group-hover/status:visible transition-all z-50">
                    {(['In Progress', 'Applied', 'Awarded', 'Rejected'] as ApplicationStatus[]).map((status) => (
                      <button
                        key={status}
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateStatus?.(scholarship.id, status);
                        }}
                        className={`w-full px-4 py-3 text-[10px] font-black uppercase tracking-widest text-left hover:bg-slate-50 transition-colors flex items-center justify-between ${
                          applicationStatus === status ? 'text-indigo-600 bg-indigo-50/30' : 'text-slate-600'
                        }`}
                      >
                        {status === 'Applied' ? t('scholarship.status.applied') :
                         status === 'In Progress' ? t('scholarship.status.inProgress') :
                         status === 'Awarded' ? t('scholarship.status.awarded') :
                         status === 'Rejected' ? t('scholarship.status.rejected') : status}
                        {applicationStatus === status && <Check size={12} />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {applicationStatus && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNotes(!showNotes);
                }}
                className={`p-4 rounded-2xl border transition-all ${showNotes ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-slate-600'}`}
                title={t('scholarship.addNotes')}
              >
                <Edit3 size={18} />
              </button>
            )}
          </div>
        )}

        {/* Notes Section */}
        <AnimatePresence>
          {showNotes && applicationStatus && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-slate-50">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('scholarship.notes')}</label>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        onUpdateNotes?.(scholarship.id, notes);
                        setShowNotes(false);
                      }}
                      className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      <Save size={12} /> {t('scholarship.saveNotes')}
                    </button>
                    <button 
                      onClick={() => setShowNotes(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('scholarship.addNotes') + "..."}
                  className="w-full h-24 p-4 bg-slate-50 border-none rounded-2xl text-xs text-slate-600 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 resize-none font-medium"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
