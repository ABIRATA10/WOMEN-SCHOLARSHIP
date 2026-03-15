import React from 'react';
import { ProfileForm } from './components/ProfileForm';
import { UserProfileView } from './components/UserProfileView';
import { ScholarshipCard } from './components/ScholarshipCard';
import { Auth } from './components/Auth';
import { ApplicationAssistant } from './components/ApplicationAssistant';
import { Dashboard } from './components/Dashboard';
import { SupportChatbot } from './components/SupportChatbot';
import { NotificationManager } from './components/NotificationManager';
import { UserProfile, Scholarship, MatchResult, User as UserType, ScholarshipMatch, Application, ApplicationStatus, Reminder } from './types';
import { findScholarships } from './services/gemini';
import { Sparkles, GraduationCap, Filter, Search, ArrowLeft, Globe, MapPin, User, LogOut, LayoutDashboard, BookmarkCheck, Heart, Bot, AlertTriangle, Clock, RefreshCw, History, Bell, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Logo = ({ size = 24 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-sm"
  >
    <path d="M2 10l10-5 10 5-10 5-10-5Z" fill="black" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 10v6" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function App() {
  const [currentUser, setCurrentUser] = React.useState<UserType | null>(() => {
    const saved = localStorage.getItem('scholar_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [profile, setProfile] = React.useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('scholar_profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [results, setResults] = React.useState<ScholarshipMatch[]>(() => {
    const saved = localStorage.getItem('scholar_results');
    return saved ? JSON.parse(saved) : [];
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<'All' | 'Government' | 'Private'>('All');
  const [scopeFilter, setScopeFilter] = React.useState<'All' | 'State' | 'National' | 'Global'>('All');
  const [majorFilter, setMajorFilter] = React.useState<string>('All');
  const [gpaFilter, setGpaFilter] = React.useState<string>('All');
  const [locationFilter, setLocationFilter] = React.useState<string>('All');
  const [typeFilter, setTypeFilter] = React.useState<'All' | 'Merit-based' | 'Need-based' | 'Other'>('All');
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);
  const [communityOnly, setCommunityOnly] = React.useState(false);
  const [amountFilter, setAmountFilter] = React.useState<string>('All');
  const [providerFilter, setProviderFilter] = React.useState<string>('All');
  const [communityFilter, setCommunityFilter] = React.useState<string>('All');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [view, setView] = React.useState<'Landing' | 'Results' | 'Profile' | 'Dashboard' | 'Applications' | 'Saved'>(() => {
    const saved = localStorage.getItem('scholar_profile');
    return saved ? 'Results' : 'Landing';
  });
  const [sortBy, setSortBy] = React.useState<'Match' | 'DeadlineAsc' | 'DeadlineDesc' | 'AmountDesc'>('Match');
  const [applications, setApplications] = React.useState<Application[]>(() => {
    const saved = localStorage.getItem('scholar_applications');
    if (saved) return JSON.parse(saved);
    
    // Migration from old appliedIds if exists
    const oldApplied = localStorage.getItem('scholar_applied_ids');
    if (oldApplied) {
      const ids = JSON.parse(oldApplied) as string[];
      return ids.map(id => ({
        scholarshipId: id,
        status: 'Applied' as ApplicationStatus,
        updatedAt: new Date().toISOString()
      }));
    }
    return [];
  });
  const [savedIds, setSavedIds] = React.useState<string[]>(() => {
    const saved = localStorage.getItem('scholar_saved_ids');
    return saved ? JSON.parse(saved) : [];
  });
  const [viewedIds, setViewedIds] = React.useState<string[]>(() => {
    const saved = localStorage.getItem('scholar_viewed_ids');
    return saved ? JSON.parse(saved) : [];
  });
  const [searchHistory, setSearchHistory] = React.useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('scholar_search_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load search history", e);
      return [];
    }
  });
  const [isAssistantOpen, setIsAssistantOpen] = React.useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [reminders, setReminders] = React.useState<Reminder[]>([]);

  // Persist data
  React.useEffect(() => {
    if (currentUser) {
      localStorage.setItem('scholar_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('scholar_current_user');
    }
  }, [currentUser]);

  React.useEffect(() => {
    if (profile) {
      localStorage.setItem('scholar_profile', JSON.stringify(profile));
    } else {
      localStorage.removeItem('scholar_profile');
    }
  }, [profile]);

  React.useEffect(() => {
    if (results.length > 0) {
      localStorage.setItem('scholar_results', JSON.stringify(results));
    } else {
      localStorage.removeItem('scholar_results');
    }
  }, [results]);

  React.useEffect(() => {
    localStorage.setItem('scholar_applications', JSON.stringify(applications));
  }, [applications]);

  React.useEffect(() => {
    localStorage.setItem('scholar_saved_ids', JSON.stringify(savedIds));
  }, [savedIds]);

  React.useEffect(() => {
    localStorage.setItem('scholar_viewed_ids', JSON.stringify(viewedIds));
  }, [viewedIds]);

  React.useEffect(() => {
    localStorage.setItem('scholar_search_history', JSON.stringify(searchHistory));
  }, [searchHistory]);

  // Fetch reminders
  React.useEffect(() => {
    if (currentUser) {
      fetch(`/api/reminders/${currentUser.id}`)
        .then(res => res.json())
        .then(data => setReminders(data))
        .catch(err => console.error("Failed to fetch reminders", err));
    }
  }, [currentUser]);

  // Reminder polling
  React.useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      reminders.forEach(reminder => {
        if (!reminder.triggered && new Date(reminder.reminderTime) <= now) {
          // Trigger notification
          window.dispatchEvent(new CustomEvent('add-notification', {
            detail: {
              title: "Scholarship Reminder! ⏰",
              message: `It's time to work on your application for: ${reminder.scholarshipTitle}`,
              type: 'scholarship'
            }
          }));

          // Mark as triggered in DB
          fetch(`/api/reminders/${reminder.id}/trigger`, { method: 'POST' })
            .catch(err => console.error("Failed to trigger reminder", err));

          // Update local state
          setReminders(prev => prev.filter(r => r.id !== reminder.id));
        }
      });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [reminders]);

  React.useEffect(() => {
    if (searchQuery.trim().length > 2) {
      const timer = setTimeout(() => {
        setSearchHistory(prev => {
          const filtered = prev.filter(q => q !== searchQuery.trim());
          return [searchQuery.trim(), ...filtered].slice(0, 5);
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  const handleProfileSubmit = async (newProfile: UserProfile) => {
    setIsLoading(true);
    setError(null);
    setProfile(newProfile);
    setView('Results');
    try {
      const searchResults = await findScholarships(newProfile);
      setResults(searchResults);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const parseDeadline = (deadline: string): number => {
    const d = deadline.toLowerCase();
    if (d.includes('rolling') || d.includes('upcoming')) return 4102444800000; // Year 2100
    const date = new Date(deadline);
    return isNaN(date.getTime()) ? 4102444800000 : date.getTime();
  };

  const parseAmount = (amountStr: string): number => {
    const numericStr = amountStr.replace(/[^0-9.]/g, '');
    return parseFloat(numericStr) || 0;
  };

  const filteredResults = results.filter(r => {
    const s = r.scholarship;
    const m = r.match;
    const matchesFilter = filter === 'All' || s.category === filter;
    const matchesScope = scopeFilter === 'All' || 
                         s.scope === scopeFilter || 
                         (scopeFilter === 'State' && profile && s.location?.toLowerCase().includes(profile.state.toLowerCase()));
    const matchesMajor = majorFilter === 'All' || (s.major && s.major.toLowerCase().includes(majorFilter.toLowerCase()));
    const matchesGpa = gpaFilter === 'All' || (s.minGpa !== undefined && s.minGpa <= parseFloat(gpaFilter));
    const matchesLocation = locationFilter === 'All' || (s.location && s.location.toLowerCase().includes(locationFilter.toLowerCase()));
    const matchesType = typeFilter === 'All' || s.type === typeFilter;
    const matchesCommunityOnly = !communityOnly || (s.targetCommunity && s.targetCommunity.toLowerCase() !== 'general' && s.targetCommunity.toLowerCase() !== 'none');
    
    const matchesProvider = providerFilter === 'All' || s.provider.toLowerCase().includes(providerFilter.toLowerCase());
    const matchesCommunity = communityFilter === 'All' || (s.targetCommunity && s.targetCommunity.toLowerCase().includes(communityFilter.toLowerCase()));
    
    let matchesAmount = true;
    if (amountFilter !== 'All') {
      const amount = parseAmount(m.localCurrencyAmount || s.amount);
      if (amountFilter === '0-1000') matchesAmount = amount <= 1000;
      else if (amountFilter === '1000-5000') matchesAmount = amount > 1000 && amount <= 5000;
      else if (amountFilter === '5000-10000') matchesAmount = amount > 5000 && amount <= 10000;
      else if (amountFilter === '10000+') matchesAmount = amount > 10000;
    }

    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         s.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.eligibilityCriteria.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (s.targetCommunity && s.targetCommunity.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesFilter && matchesScope && matchesMajor && matchesGpa && matchesLocation && 
           matchesType && matchesCommunityOnly && matchesSearch && matchesProvider && 
           matchesCommunity && matchesAmount;
  }).sort((a, b) => {
    // Primary sort: Scope (State > National > Global)
    const scopePriority = { 'State': 1, 'National': 2, 'Global': 3 };
    const scopeA = scopePriority[a.scholarship.scope] || 4;
    const scopeB = scopePriority[b.scholarship.scope] || 4;
    
    if (scopeA !== scopeB) {
      return scopeA - scopeB;
    }

    // Secondary sort: Match Score, Deadline, or Amount
    if (sortBy === 'Match') {
      return b.match.matchScore - a.match.matchScore;
    }
    if (sortBy === 'AmountDesc') {
      const amountA = parseAmount(a.match.localCurrencyAmount || a.scholarship.amount);
      const amountB = parseAmount(b.match.localCurrencyAmount || b.scholarship.amount);
      return amountB - amountA;
    }
    const dateA = parseDeadline(a.scholarship.deadline);
    const dateB = parseDeadline(b.scholarship.deadline);
    return sortBy === 'DeadlineAsc' ? dateA - dateB : dateB - dateA;
  });

  const handleApply = (id: string) => {
    const existing = applications.find(a => a.scholarshipId === id);
    if (!existing) {
      handleUpdateApplicationStatus(id, 'In Progress');
    }
    setIsAssistantOpen(true);
  };

  const handleUpdateApplicationStatus = (id: string, status: ApplicationStatus) => {
    setApplications(prev => {
      const existing = prev.find(a => a.scholarshipId === id);
      if (existing) {
        return prev.map(a => a.scholarshipId === id ? { ...a, status, updatedAt: new Date().toISOString() } : a);
      }
      return [...prev, { scholarshipId: id, status, updatedAt: new Date().toISOString(), notes: '' }];
    });
  };

  const handleUpdateApplicationNotes = (id: string, notes: string) => {
    setApplications(prev => {
      const existing = prev.find(a => a.scholarshipId === id);
      if (existing) {
        return prev.map(a => a.scholarshipId === id ? { ...a, notes, updatedAt: new Date().toISOString() } : a);
      }
      return prev;
    });
  };

  const handleSave = (id: string) => {
    setSavedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      }
      return [...prev, id];
    });
  };

  const handleView = (id: string) => {
    setViewedIds(prev => {
      const filtered = prev.filter(i => i !== id);
      return [id, ...filtered].slice(0, 20); // Keep last 20 views
    });
  };

  const handleSetReminder = async (scholarshipId: string, scholarshipTitle: string, time: string) => {
    if (!currentUser) return;
    
    try {
      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          scholarshipId,
          scholarshipTitle,
          reminderTime: time
        })
      });
      
      if (response.ok) {
        const newReminder = await response.json();
        setReminders(prev => [...prev, newReminder]);
        
        window.dispatchEvent(new CustomEvent('add-notification', {
          detail: {
            title: "Reminder Set! ✨",
            message: `We'll remind you about ${scholarshipTitle} on ${new Date(time).toLocaleString()}`,
            type: 'success'
          }
        }));
      }
    } catch (error) {
      console.error("Failed to set reminder", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('scholar_current_user');
    localStorage.removeItem('scholar_profile');
    localStorage.removeItem('scholar_results');
    setCurrentUser(null);
    setProfile(null); 
    setResults([]); 
    setView('Landing'); 
    setShowLogoutConfirm(false);
  };

  if (!currentUser) {
    return <Auth onLogin={setCurrentUser} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-200/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[40%] right-[10%] w-[30%] h-[30%] bg-amber-200/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => { 
            localStorage.clear();
            setProfile(null); 
            setResults([]); 
            setView('Landing'); 
          }}>
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
              <Logo size={24} />
            </div>
            <span className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              GrantHer
            </span>
          </div>
          
          {profile && (
            <>
              {/* Desktop Menu */}
              <div className="hidden lg:flex items-center gap-4">
                <NotificationManager />
                <button 
                  onClick={() => setView(view === 'Dashboard' ? 'Results' : 'Dashboard')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-lg ${
                    view === 'Dashboard' 
                      ? 'bg-indigo-600 text-white shadow-indigo-200' 
                      : 'bg-white text-slate-900 border border-slate-100 shadow-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <LayoutDashboard size={14} /> {view === 'Dashboard' ? 'Back to Results' : 'Dashboard'}
                </button>
                <button 
                  onClick={() => setView(view === 'Applications' ? 'Results' : 'Applications')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-lg ${
                    view === 'Applications' 
                      ? 'bg-indigo-600 text-white shadow-indigo-200' 
                      : 'bg-white text-slate-900 border border-slate-100 shadow-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <BookmarkCheck size={14} /> {view === 'Applications' ? 'Back to Results' : 'My Applications'}
                </button>
                <button 
                  onClick={() => setView(view === 'Saved' ? 'Results' : 'Saved')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-lg ${
                    view === 'Saved' 
                      ? 'bg-rose-600 text-white shadow-rose-200' 
                      : 'bg-white text-slate-900 border border-slate-100 shadow-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Heart size={14} className={savedIds.length > 0 ? "fill-current" : ""} /> {view === 'Saved' ? 'Back to Results' : 'Saved'}
                </button>
                <button 
                  onClick={() => setView(view === 'Profile' ? 'Results' : 'Profile')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-lg ${
                    view === 'Profile' 
                      ? 'bg-indigo-600 text-white shadow-indigo-200' 
                      : 'bg-white text-slate-900 border border-slate-100 shadow-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <User size={14} /> {view === 'Profile' ? 'Back to Results' : 'My Profile'}
                </button>
                <button 
                  onClick={() => setShowLogoutConfirm(true)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-black text-white rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-slate-200"
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>

              {/* Mobile Menu Toggle */}
              <div className="lg:hidden flex items-center gap-3">
                <NotificationManager />
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2.5 bg-slate-50 text-slate-900 rounded-xl border border-slate-100"
                >
                  {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white border-b border-slate-100 overflow-hidden"
            >
              <div className="p-4 space-y-2">
                <button 
                  onClick={() => { setView(view === 'Dashboard' ? 'Results' : 'Dashboard'); setIsMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                    view === 'Dashboard' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-900'
                  }`}
                >
                  <LayoutDashboard size={16} /> {view === 'Dashboard' ? 'Back to Results' : 'Dashboard'}
                </button>
                <button 
                  onClick={() => { setView(view === 'Applications' ? 'Results' : 'Applications'); setIsMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                    view === 'Applications' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-900'
                  }`}
                >
                  <BookmarkCheck size={16} /> {view === 'Applications' ? 'Back to Results' : 'My Applications'}
                </button>
                <button 
                  onClick={() => { setView(view === 'Saved' ? 'Results' : 'Saved'); setIsMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                    view === 'Saved' ? 'bg-rose-600 text-white' : 'bg-slate-50 text-slate-900'
                  }`}
                >
                  <Heart size={16} className={savedIds.length > 0 ? "fill-current" : ""} /> {view === 'Saved' ? 'Back to Results' : 'Saved'}
                </button>
                <button 
                  onClick={() => { setView(view === 'Profile' ? 'Results' : 'Profile'); setIsMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                    view === 'Profile' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-900'
                  }`}
                >
                  <User size={16} /> {view === 'Profile' ? 'Back to Results' : 'My Profile'}
                </button>
                <button 
                  onClick={() => { setShowLogoutConfirm(true); setIsMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-12 relative z-10">
        <AnimatePresence mode="wait">
          {view === 'Landing' ? (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto"
            >
              <div className="text-center mb-16 space-y-6">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 mb-4"
                >
                  <Globe size={12} /> Global Scholarship Search Engine
                </motion.div>
                <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tight leading-[0.9]">
                  Your Education, <br/>
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-rose-600">Fully Funded.</span>
                </h1>
                <p className="text-lg text-slate-500 leading-relaxed font-medium max-w-2xl mx-auto">
                  We use advanced AI to scan worldwide government and private databases in real-time. 
                  <span className="block text-indigo-600 font-bold mt-2">Complete your profile below to unlock personalized funding opportunities.</span>
                </p>
              </div>
              
              <ProfileForm onSubmit={handleProfileSubmit} isLoading={isLoading} />
              
              <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
                <div className="p-6 group">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-transform group-hover:scale-110 group-hover:rotate-3">
                    <Globe size={28} />
                  </div>
                  <h3 className="font-black text-slate-900 mb-2">Global Reach</h3>
                  <p className="text-sm text-slate-400 font-medium">Access scholarships from 190+ countries instantly.</p>
                </div>
                <div className="p-6 group">
                  <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-transform group-hover:scale-110 group-hover:-rotate-3">
                    <Sparkles size={28} />
                  </div>
                  <h3 className="font-black text-slate-900 mb-2">AI Precision</h3>
                  <p className="text-sm text-slate-400 font-medium">Smart matching based on your unique story and goals.</p>
                </div>
                <div className="p-6 group">
                  <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-transform group-hover:scale-110 group-hover:rotate-3">
                    <Logo size={28} />
                  </div>
                  <h3 className="font-black text-slate-900 mb-2">Career First</h3>
                  <p className="text-sm text-slate-400 font-medium">Funding that aligns with your professional dreams.</p>
                </div>
              </div>
            </motion.div>
          ) : view === 'Dashboard' ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="mb-12">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Interest Dashboard</h2>
                <p className="text-slate-500 font-medium">Visualizing your scholarship journey and AI-detected interests.</p>
              </div>
              <Dashboard 
                results={filteredResults} 
                profile={profile} 
                applications={applications} 
                searchHistory={searchHistory}
                viewedIds={viewedIds}
                savedIds={savedIds}
                onApply={handleApply}
                onUpdateStatus={handleUpdateApplicationStatus}
                onSave={handleSave}
              />
            </motion.div>
          ) : view === 'Applications' ? (
            <motion.div
              key="applications"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-2">
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight">My Applications</h2>
                  <p className="text-slate-500 font-medium">Tracking {applications.length} scholarships you've started or completed.</p>
                </div>
                <button 
                  onClick={() => setView('Results')}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 border border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all"
                >
                  <ArrowLeft size={14} /> Back to All Matches
                </button>
              </div>

              {applications.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {results
                    .filter(r => applications.some(a => a.scholarshipId === r.scholarship.id))
                    .map((result) => (
                      <ScholarshipCard
                        key={result.scholarship.id}
                        scholarship={result.scholarship}
                        match={result.match}
                        applicationStatus={applications.find(a => a.scholarshipId === result.scholarship.id)?.status}
                        onUpdateStatus={handleUpdateApplicationStatus}
                        onUpdateNotes={handleUpdateApplicationNotes}
                        initialNotes={applications.find(a => a.scholarshipId === result.scholarship.id)?.notes}
                        onApply={handleApply}
                        onSave={handleSave}
                        isSaved={savedIds.includes(result.scholarship.id)}
                      />
                    ))}
                </div>
              ) : (
                <div className="bg-white p-16 rounded-[3rem] text-center border border-slate-100 shadow-sm">
                  <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <BookmarkCheck size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">No Applications Yet</h3>
                  <p className="text-slate-500 font-medium mb-8">Start exploring matches and click "Apply Now" to track them here.</p>
                  <button 
                    onClick={() => setView('Results')}
                    className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
                  >
                    Explore Scholarships
                  </button>
                </div>
              )}
            </motion.div>
          ) : view === 'Saved' ? (
            <motion.div
              key="saved"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-2">
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight">Saved Scholarships</h2>
                  <p className="text-slate-500 font-medium">You have {savedIds.length} scholarships saved for later.</p>
                </div>
                <button 
                  onClick={() => setView('Results')}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 border border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all"
                >
                  <ArrowLeft size={14} /> Back to All Matches
                </button>
              </div>

              {savedIds.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {results
                    .filter(r => savedIds.includes(r.scholarship.id))
                    .map((result) => (
                      <ScholarshipCard
                        key={result.scholarship.id}
                        scholarship={result.scholarship}
                        match={result.match}
                        applicationStatus={applications.find(a => a.scholarshipId === result.scholarship.id)?.status}
                        onUpdateStatus={handleUpdateApplicationStatus}
                        onUpdateNotes={handleUpdateApplicationNotes}
                        initialNotes={applications.find(a => a.scholarshipId === result.scholarship.id)?.notes}
                        onApply={handleApply}
                        onSave={handleSave}
                        isSaved={true}
                      />
                    ))}
                </div>
              ) : (
                <div className="bg-white p-16 rounded-[3rem] text-center border border-slate-100 shadow-sm">
                  <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Heart size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">No Saved Scholarships</h3>
                  <p className="text-slate-500 font-medium mb-8">Click the heart icon on any scholarship to save it for later.</p>
                  <button 
                    onClick={() => setView('Results')}
                    className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
                  >
                    Find Scholarships
                  </button>
                </div>
              )}
            </motion.div>
          ) : view === 'Profile' ? (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {profile && (
                <UserProfileView 
                  profile={profile}
                  results={results}
                  savedIds={savedIds}
                  applications={applications}
                  onSave={handleSave}
                  onApply={handleApply}
                  onUpdateProfile={handleProfileSubmit}
                  onUpdateStatus={handleUpdateApplicationStatus}
                  onUpdateNotes={handleUpdateApplicationNotes}
                  isLoading={isLoading}
                  onBack={() => setView('Results')}
                />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8 md:space-y-12"
            >
              <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-50">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8">
                  <div className="space-y-1 md:space-y-2">
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                      Found <span className="text-indigo-600">{results.length}</span> Opportunities
                    </h2>
                    <p className="text-slate-400 text-xs md:text-sm font-medium flex items-center gap-2">
                      <MapPin size={14} className="text-rose-400" /> 
                      Matches for {profile.fullName} in {profile.country}
                    </p>
                  </div>

                  <div className="flex flex-col md:flex-row flex-wrap items-start md:items-center gap-4">
                    <div className="relative w-full md:w-auto flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-grow">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input
                          type="text"
                          placeholder="Search keywords..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-12 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all text-sm font-medium w-full md:w-64"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => profile && handleProfileSubmit(profile)}
                          className="p-3 bg-white border border-slate-100 hover:border-indigo-200 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all shadow-sm flex items-center justify-center flex-grow sm:flex-grow-0"
                          title="Refresh search results"
                        >
                          <motion.div
                            animate={isLoading ? { rotate: 360 } : {}}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          >
                            <Sparkles size={18} />
                          </motion.div>
                        </button>
                        <button
                          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                          className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 flex-grow sm:flex-grow-0 ${
                            showAdvancedFilters 
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200' 
                              : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-200'
                          }`}
                        >
                          <Filter size={14} /> {showAdvancedFilters ? 'Hide' : 'Filters'}
                        </button>
                      </div>
                      
                      {searchHistory.length > 0 && (
                        <div className="hidden sm:flex absolute top-full left-0 mt-2 flex-wrap gap-2 z-20">
                          {searchHistory.map((query, idx) => (
                            <button
                              key={idx}
                              onClick={() => setSearchQuery(query)}
                              className="px-3 py-1 bg-white border border-slate-100 hover:border-indigo-200 text-slate-400 hover:text-indigo-600 rounded-full text-[10px] font-bold transition-all flex items-center gap-1.5 shadow-sm"
                            >
                              <Clock size={10} /> {query}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                      <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
                        <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-100 shrink-0">
                          {(['All', 'Government', 'Private'] as const).map((cat) => (
                            <button
                              key={cat}
                              onClick={() => setFilter(cat)}
                              className={`px-4 md:px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                filter === cat 
                                  ? 'bg-white text-indigo-600 shadow-sm' 
                                  : 'text-slate-400 hover:text-slate-600'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                        
                        <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-100 shrink-0">
                          {(['All', 'State', 'National', 'Global'] as const).map((scope) => (
                            <button
                              key={scope}
                              onClick={() => setScopeFilter(scope)}
                              className={`px-3 md:px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                scopeFilter === scope 
                                  ? 'bg-white text-indigo-600 shadow-sm' 
                                  : 'text-slate-400 hover:text-slate-600'
                              }`}
                            >
                              {scope}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="flex-grow sm:flex-grow-0 p-1 bg-slate-50 rounded-2xl border border-slate-100">
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="w-full bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-slate-600 focus:ring-0 px-4 py-2 cursor-pointer outline-none"
                          >
                            <option value="Match">Sort: Match</option>
                            <option value="AmountDesc">Sort: Amount</option>
                            <option value="DeadlineAsc">Sort: Deadline</option>
                          </select>
                        </div>

                        <button
                          onClick={() => setCommunityOnly(!communityOnly)}
                          className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 flex-grow sm:flex-grow-0 ${
                            communityOnly 
                              ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200' 
                              : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-200'
                          }`}
                        >
                          <Filter size={14} /> <span className="hidden sm:inline">Community</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {showAdvancedFilters && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-8 pt-8 border-t border-slate-50 overflow-hidden"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Major / Field</label>
                          <input
                            type="text"
                            placeholder="e.g. Computer Science"
                            value={majorFilter === 'All' ? '' : majorFilter}
                            onChange={(e) => setMajorFilter(e.target.value || 'All')}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-medium"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Max Min GPA</label>
                          <select
                            value={gpaFilter}
                            onChange={(e) => setGpaFilter(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-medium"
                          >
                            <option value="All">Any CGPA</option>
                            <option value="5.0">Up to 5.0</option>
                            <option value="6.0">Up to 6.0</option>
                            <option value="7.0">Up to 7.0</option>
                            <option value="8.0">Up to 8.0</option>
                            <option value="9.0">Up to 9.0</option>
                            <option value="10.0">Up to 10.0</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Location</label>
                          <input
                            type="text"
                            placeholder="e.g. California"
                            value={locationFilter === 'All' ? '' : locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value || 'All')}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-medium"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Scholarship Type</label>
                          <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value as any)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-medium"
                          >
                            <option value="All">All Types</option>
                            <option value="Merit-based">Merit-based</option>
                            <option value="Need-based">Need-based</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        {/* New Filters */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Amount Range</label>
                          <select
                            value={amountFilter}
                            onChange={(e) => setAmountFilter(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-medium"
                          >
                            <option value="All">Any Amount</option>
                            <option value="0-1000">Up to 1,000</option>
                            <option value="1000-5000">1,000 - 5,000</option>
                            <option value="5000-10000">5,000 - 10,000</option>
                            <option value="10000+">10,000+</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Specific Provider</label>
                          <input
                            type="text"
                            placeholder="e.g. Google, Tata"
                            value={providerFilter === 'All' ? '' : providerFilter}
                            onChange={(e) => setProviderFilter(e.target.value || 'All')}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-medium"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Target Community</label>
                          <select
                            value={communityFilter}
                            onChange={(e) => setCommunityFilter(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-medium"
                          >
                            <option value="All">All Communities</option>
                            <option value="Women in STEM">Women in STEM</option>
                            <option value="Minority">Minority</option>
                            <option value="SC/ST">SC/ST</option>
                            <option value="Differently Abled">Differently Abled</option>
                            <option value="Single Mother">Single Mother</option>
                            <option value="Rural Background">Rural Background</option>
                          </select>
                        </div>
                      </div>
                      <div className="mt-6 flex justify-end">
                        <button
                          onClick={() => {
                            setMajorFilter('All');
                            setGpaFilter('All');
                            setLocationFilter('All');
                            setTypeFilter('All');
                            setAmountFilter('All');
                            setProviderFilter('All');
                            setCommunityFilter('All');
                          }}
                          className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-700 transition-colors"
                        >
                          Reset Advanced Filters
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-rose-50 border border-rose-100 p-8 rounded-[2.5rem] text-center"
                >
                  <div className="w-16 h-16 bg-white text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <AlertTriangle size={32} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">Something went wrong</h3>
                  <p className="text-slate-600 font-medium max-w-lg mx-auto mb-8 leading-relaxed">
                    {error}
                  </p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <button 
                      onClick={() => profile && handleProfileSubmit(profile)}
                      className="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
                    >
                      Try Again
                    </button>
                    <button 
                      onClick={() => setView('Profile')}
                      className="px-8 py-3 bg-white text-slate-600 border border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                    >
                      Update Profile
                    </button>
                  </div>
                </motion.div>
              )}

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-[450px] bg-white rounded-[2.5rem] animate-pulse border border-slate-50 shadow-xl shadow-slate-200/30" />
                  ))}
                </div>
              ) : (
                <div className="space-y-16">
                  {/* Active Scholarships */}
                  {filteredResults.filter(item => !item.scholarship.deadline.toLowerCase().includes('upcoming')).length > 0 && (
                    <section>
                      <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                          <Sparkles size={20} />
                        </div>
                        <div>
                          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Active Scholarships</h2>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Open for applications now</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredResults
                          .filter(item => !item.scholarship.deadline.toLowerCase().includes('upcoming'))
                          .map((item) => (
                            <ScholarshipCard 
                              key={item.scholarship.id} 
                              scholarship={item.scholarship} 
                              match={item.match} 
                              onApply={handleApply}
                              applicationStatus={applications.find(a => a.scholarshipId === item.scholarship.id)?.status}
                              onUpdateStatus={handleUpdateApplicationStatus}
                              onUpdateNotes={handleUpdateApplicationNotes}
                              initialNotes={applications.find(a => a.scholarshipId === item.scholarship.id)?.notes}
                              onSave={handleSave}
                              isSaved={savedIds.includes(item.scholarship.id)}
                              onView={handleView}
                              onSetReminder={handleSetReminder}
                            />
                          ))}
                      </div>
                    </section>
                  )}

                  {/* Upcoming Scholarships */}
                  {filteredResults.filter(item => item.scholarship.deadline.toLowerCase().includes('upcoming')).length > 0 && (
                    <section className="pt-16 border-t border-slate-100">
                      <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                          <GraduationCap size={20} />
                        </div>
                        <div>
                          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Upcoming Opportunities</h2>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Opening soon - Get your documents ready!</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredResults
                          .filter(item => item.scholarship.deadline.toLowerCase().includes('upcoming'))
                          .map((item) => (
                            <ScholarshipCard 
                              key={item.scholarship.id} 
                              scholarship={item.scholarship} 
                              match={item.match} 
                              onApply={handleApply}
                              applicationStatus={applications.find(a => a.scholarshipId === item.scholarship.id)?.status}
                              onUpdateStatus={handleUpdateApplicationStatus}
                              onUpdateNotes={handleUpdateApplicationNotes}
                              initialNotes={applications.find(a => a.scholarshipId === item.scholarship.id)?.notes}
                              onSave={handleSave}
                              isSaved={savedIds.includes(item.scholarship.id)}
                              onView={handleView}
                              onSetReminder={handleSetReminder}
                            />
                          ))}
                      </div>
                    </section>
                  )}
                </div>
              )}

              {filteredResults.length === 0 && !isLoading && (
                <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-slate-200">
                  <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-8">
                    <Search size={48} />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900">
                    {results.length === 0 ? "No scholarships found for your profile" : "No matches for current filters"}
                  </h3>
                  <div className="max-w-md mx-auto mt-6 space-y-6">
                    <p className="text-slate-400 font-medium leading-relaxed">
                      {results.length === 0 
                        ? "Our AI couldn't find specific matches. Try broadening your 'Background' or 'Career Goals' in your profile to help the AI find more relevant results."
                        : "Your current filters might be too restrictive. Try these suggestions to see more results:"}
                    </p>
                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-3">Facing an issue?</p>
                      <button 
                        onClick={() => {
                          // This is a bit hacky since we don't have a global state for the chatbot, 
                          // but the floating bubble is always there. We could use a custom event.
                          window.dispatchEvent(new CustomEvent('open-support-chat'));
                        }}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200"
                      >
                        <Bot size={14} /> Talk to Support AI
                      </button>
                    </div>
                    {results.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-3">
                        {searchQuery && (
                          <button onClick={() => setSearchQuery('')} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 hover:bg-indigo-100 transition-colors">
                            Clear Search
                          </button>
                        )}
                        {filter !== 'All' && (
                          <button onClick={() => setFilter('All')} className="px-4 py-2 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100 hover:bg-amber-100 transition-colors">
                            Show All Categories
                          </button>
                        )}
                        {scopeFilter !== 'All' && (
                          <button onClick={() => setScopeFilter('All')} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 hover:bg-indigo-100 transition-colors">
                            Show All Scopes
                          </button>
                        )}
                        {communityOnly && (
                          <button onClick={() => setCommunityOnly(false)} className="px-4 py-2 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-100 hover:bg-rose-100 transition-colors">
                            Disable Community Filter
                          </button>
                        )}
                      </div>
                    )}
                    <button 
                      onClick={() => setView('Profile')}
                      className="mt-6 text-indigo-600 font-black uppercase tracking-widest text-[10px] hover:text-indigo-800 flex items-center justify-center gap-2 mx-auto group"
                    >
                      <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Edit your profile
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {profile && (
        <ApplicationAssistant 
          profile={profile} 
          isOpen={isAssistantOpen} 
          onClose={() => setIsAssistantOpen(false)} 
        />
      )}

      <SupportChatbot />

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <LogOut size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Confirm Logout</h3>
              <p className="text-slate-500 font-medium mb-10">Are you sure you want to logout? You'll need to sign in again to access your matches.</p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleLogout}
                  className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-rose-100 uppercase tracking-widest text-xs"
                >
                  Yes, Logout
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 font-black rounded-2xl transition-all uppercase tracking-widest text-xs"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-100">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 opacity-50">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <Logo size={16} />
            </div>
            <span className="text-sm font-black tracking-tighter text-slate-900">
              GrantHer
            </span>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
            © 2026 GrantHer • Empowering Global Education
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors font-bold text-xs uppercase tracking-widest">Privacy</a>
            <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors font-bold text-xs uppercase tracking-widest">Terms</a>
            <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors font-bold text-xs uppercase tracking-widest">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
