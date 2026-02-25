import React from 'react';
import { ProfileForm } from './components/ProfileForm';
import { ScholarshipCard } from './components/ScholarshipCard';
import { Auth } from './components/Auth';
import { UserProfile, Scholarship, MatchResult, User as UserType } from './types';
import { findScholarships, ScholarshipMatch } from './services/gemini';
import { Sparkles, GraduationCap, Filter, Search, ArrowLeft, Globe, MapPin, User, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
  const [filter, setFilter] = React.useState<'All' | 'Government' | 'Private'>('All');
  const [communityOnly, setCommunityOnly] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [view, setView] = React.useState<'Landing' | 'Results' | 'Profile'>(() => {
    const saved = localStorage.getItem('scholar_profile');
    return saved ? 'Results' : 'Landing';
  });
  const [sortBy, setSortBy] = React.useState<'Match' | 'DeadlineAsc' | 'DeadlineDesc'>('Match');

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

  const handleProfileSubmit = async (newProfile: UserProfile) => {
    setIsLoading(true);
    setProfile(newProfile);
    setView('Results');
    try {
      const searchResults = await findScholarships(newProfile);
      setResults(searchResults);
    } catch (error) {
      console.error(error);
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

  const filteredResults = results.filter(r => {
    const s = r.scholarship;
    const matchesFilter = filter === 'All' || s.category === filter;
    const matchesCommunity = !communityOnly || (s.targetCommunity && s.targetCommunity.toLowerCase() !== 'general' && s.targetCommunity.toLowerCase() !== 'none');
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         s.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (s.targetCommunity && s.targetCommunity.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesCommunity && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === 'Match') {
      return b.match.matchScore - a.match.matchScore;
    }
    const dateA = parseDeadline(a.scholarship.deadline);
    const dateB = parseDeadline(b.scholarship.deadline);
    return sortBy === 'DeadlineAsc' ? dateA - dateB : dateB - dateA;
  });

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
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => { 
            localStorage.clear();
            setProfile(null); 
            setResults([]); 
            setView('Landing'); 
          }}>
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
              <Sparkles className="text-white" size={24} />
            </div>
            <span className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              ScholarMatch AI
            </span>
          </div>
          
          {profile && (
            <div className="flex items-center gap-4">
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
                onClick={() => { 
                  localStorage.removeItem('scholar_current_user');
                  localStorage.removeItem('scholar_profile');
                  localStorage.removeItem('scholar_results');
                  setCurrentUser(null);
                  setProfile(null); 
                  setResults([]); 
                  setView('Landing'); 
                }}
                className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-black text-white rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-slate-200"
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
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
                    <GraduationCap size={28} />
                  </div>
                  <h3 className="font-black text-slate-900 mb-2">Career First</h3>
                  <p className="text-sm text-slate-400 font-medium">Funding that aligns with your professional dreams.</p>
                </div>
              </div>
            </motion.div>
          ) : view === 'Profile' ? (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-3xl mx-auto"
            >
              <div className="mb-12 flex items-center justify-between">
                <div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight">User Profile</h2>
                  <p className="text-slate-400 font-medium">Update your details to refine your scholarship matches.</p>
                </div>
                <button 
                  onClick={() => setView('Results')}
                  className="px-6 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100"
                >
                  Cancel
                </button>
              </div>
              <ProfileForm onSubmit={handleProfileSubmit} isLoading={isLoading} initialData={profile} />
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12"
            >
              <div className="bg-white p-8 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="space-y-2">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">
                      Found <span className="text-indigo-600">{results.length}</span> Opportunities
                    </h2>
                    <p className="text-slate-400 font-medium flex items-center gap-2">
                      <MapPin size={14} className="text-rose-400" /> 
                      Matches for {profile.fullName} in {profile.country}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="relative flex-grow md:flex-grow-0">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input
                        type="text"
                        placeholder="Search title or provider..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 pr-6 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all text-sm font-medium w-full md:w-64"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-100">
                      {(['All', 'Government', 'Private'] as const).map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setFilter(cat)}
                          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            filter === cat 
                              ? 'bg-white text-indigo-600 shadow-sm' 
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-100">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-slate-600 focus:ring-0 px-4 py-2 cursor-pointer outline-none"
                      >
                        <option value="Match">Sort: Match Score</option>
                        <option value="DeadlineAsc">Sort: Deadline (Closest)</option>
                        <option value="DeadlineDesc">Sort: Deadline (Furthest)</option>
                      </select>
                    </div>

                    <button
                      onClick={() => setCommunityOnly(!communityOnly)}
                      className={`px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${
                        communityOnly 
                          ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200' 
                          : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-200'
                      }`}
                    >
                      <Filter size={14} /> Community Specific
                    </button>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-[450px] bg-white rounded-[2.5rem] animate-pulse border border-slate-50 shadow-xl shadow-slate-200/30" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredResults.map((item) => (
                    <ScholarshipCard 
                      key={item.scholarship.id} 
                      scholarship={item.scholarship} 
                      match={item.match} 
                    />
                  ))}
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

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-100">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 opacity-50">
            <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <span className="text-sm font-black tracking-tighter text-slate-900">
              ScholarMatch AI
            </span>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
            © 2026 ScholarMatch AI • Empowering Global Education
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
