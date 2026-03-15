import React from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  TrendingUp, 
  Target, 
  Award, 
  Calendar as CalendarIcon, 
  PieChart as PieChartIcon, 
  BarChart3,
  Activity,
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { ScholarshipMatch, UserProfile, Application, ApplicationStatus } from '../types';
import { getRecommendations } from '../services/gemini';
import { RecommendationCard } from './RecommendationCard';
import { Sparkles as SparklesIcon, Lightbulb } from 'lucide-react';

interface DashboardProps {
  results: ScholarshipMatch[];
  profile: UserProfile | null;
  applications: Application[];
  searchHistory: string[];
  viewedIds: string[];
  savedIds: string[];
  onApply: (id: string) => void;
  onUpdateStatus: (id: string, status: ApplicationStatus) => void;
  onSave: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  results, 
  profile, 
  applications, 
  searchHistory,
  viewedIds,
  savedIds,
  onApply,
  onUpdateStatus,
  onSave
}) => {
  const [recommendations, setRecommendations] = React.useState<ScholarshipMatch[]>([]);
  const [isRecLoading, setIsRecLoading] = React.useState(false);

  React.useEffect(() => {
    async function fetchRecs() {
      if (!profile || results.length === 0) return;
      setIsRecLoading(true);
      const recs = await getRecommendations(profile, results, viewedIds, savedIds, applications);
      setRecommendations(recs);
      setIsRecLoading(false);
    }
    fetchRecs();
  }, [profile, results, viewedIds, savedIds, applications]);

  // Process data for charts
  const categoryData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    results.forEach(r => {
      const cat = r.scholarship.category || 'Other';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [results]);

  const interestData = React.useMemo(() => {
    // Extract keywords from reasoning or description to simulate "topics talked about"
    const keywords: Record<string, number> = {
      'STEM': 0,
      'Merit': 0,
      'Need-based': 0,
      'International': 0,
      'Research': 0,
      'Community': 0,
      'Leadership': 0
    };

    results.forEach(r => {
      const text = (r.match.reasoning + ' ' + r.scholarship.description).toLowerCase();
      if (text.includes('stem') || text.includes('science') || text.includes('tech')) keywords['STEM']++;
      if (text.includes('merit') || text.includes('academic') || text.includes('gpa')) keywords['Merit']++;
      if (text.includes('income') || text.includes('need') || text.includes('financial')) keywords['Need-based']++;
      if (text.includes('international') || text.includes('abroad') || text.includes('global')) keywords['International']++;
      if (text.includes('research') || text.includes('project')) keywords['Research']++;
      if (text.includes('community') || text.includes('social') || text.includes('service')) keywords['Community']++;
      if (text.includes('leader') || text.includes('initiative')) keywords['Leadership']++;
    });

    return Object.entries(keywords)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [results]);

  const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#3b82f6'];

  const scholarshipStats = React.useMemo(() => {
    let totalAmount = 0;
    let countWithAmount = 0;
    let rollingCount = 0;
    let earliestDate: Date | null = null;

    results.forEach(r => {
      // Amount calculation
      const amountStr = r.scholarship.amount.replace(/[^0-9]/g, '');
      const amount = parseInt(amountStr);
      if (!isNaN(amount)) {
        totalAmount += amount;
        countWithAmount++;
      }

      // Deadline calculation
      const deadline = r.scholarship.deadline.toLowerCase();
      if (deadline.includes('rolling')) {
        rollingCount++;
      } else {
        const date = new Date(r.scholarship.deadline);
        if (!isNaN(date.getTime())) {
          if (!earliestDate || date < earliestDate) {
            earliestDate = date;
          }
        }
      }
    });

    return {
      avgAmount: countWithAmount > 0 ? Math.round(totalAmount / countWithAmount) : 0,
      rollingCount,
      earliestDeadline: earliestDate ? (earliestDate as Date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'
    };
  }, [results]);

  const applicationStatusData = React.useMemo(() => {
    const counts: Record<string, number> = {
      'In Progress': 0,
      'Applied': 0,
      'Awarded': 0,
      'Rejected': 0
    };
    applications.forEach(a => {
      counts[a.status] = (counts[a.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [applications]);

  const stats = [
    { label: 'Total Matches', value: results.length, icon: <Target className="text-indigo-600" />, color: 'from-indigo-500/10 to-indigo-500/5', textColor: 'text-indigo-600' },
    { label: 'Avg Amount', value: profile ? `${profile.country === 'India' ? '₹' : '$'}${scholarshipStats.avgAmount.toLocaleString()}` : scholarshipStats.avgAmount.toLocaleString(), icon: <TrendingUp className="text-emerald-600" />, color: 'from-emerald-500/10 to-emerald-500/5', textColor: 'text-emerald-600' },
    { label: 'Applications', value: applications.length, icon: <Activity className="text-amber-600" />, color: 'from-amber-500/10 to-amber-500/5', textColor: 'text-amber-600' },
    { label: 'Awarded', value: applications.filter(a => a.status === 'Awarded').length, icon: <Award className="text-rose-600" />, color: 'from-rose-500/10 to-rose-500/5', textColor: 'text-rose-600' },
  ];

  // Calendar Logic
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);

  const scholarshipsByDate = React.useMemo(() => {
    const map: Record<string, ScholarshipMatch[]> = {};
    results.forEach(r => {
      const deadline = r.scholarship.deadline;
      if (!deadline.toLowerCase().includes('rolling') && !deadline.toLowerCase().includes('upcoming')) {
        const date = new Date(deadline);
        if (!isNaN(date.getTime())) {
          const key = date.toISOString().split('T')[0];
          if (!map[key]) map[key] = [];
          map[key].push(r);
        }
      }
    });
    return map;
  }, [results]);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const calendarDays = [];
  for (let i = 0; i < startDay; i++) calendarDays.push(null);
  for (let i = 1; i <= totalDays; i++) calendarDays.push(i);

  const selectedScholarships = selectedDate ? scholarshipsByDate[selectedDate] : null;

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all duration-300 group"
          >
            <div className={`w-14 h-14 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
              {stat.icon}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className={`text-3xl font-black ${stat.textColor} tracking-tight`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Recommendations Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <SparklesIcon size={20} className="text-indigo-600" /> Recommended for You
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1">Personalized matches based on your activity</p>
          </div>
        </div>

        {isRecLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-80 bg-slate-50 rounded-[2.5rem] animate-pulse border border-slate-100" />
            ))}
          </div>
        ) : recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {recommendations.map(r => (
              <RecommendationCard 
                key={r.scholarship.id}
                match={r}
                onApply={onApply}
                onSave={onSave}
                isSaved={savedIds.includes(r.scholarship.id)}
                applicationStatus={applications.find(a => a.scholarshipId === r.scholarship.id)?.status}
                onUpdateStatus={onUpdateStatus}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-sm text-slate-400 font-medium">Start browsing or saving scholarships to get personalized recommendations!</p>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Topic Interest Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-7 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <BarChart3 size={20} className="text-indigo-600" />
                </div>
                Topic Interest Analysis
              </h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Based on your scholarship matches</p>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={interestData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fontWeight: 800, fill: '#64748b' }}
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '1rem' }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 12, 12, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Category Distribution Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-5 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                  <PieChartIcon size={20} className="text-rose-600" />
                </div>
                Category Distribution
              </h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Scholarship types breakdown</p>
            </div>
          </div>

          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '1rem' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  formatter={(value) => <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Application Status Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-12 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <Activity size={20} className="text-emerald-600" />
                </div>
                Application Pipeline
              </h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Track your application progress</p>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={applicationStatusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fontWeight: 800, fill: '#64748b' }}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 800, fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '1rem' }}
                />
                <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={60}>
                  {applicationStatusData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={
                        entry.name === 'Awarded' ? '#10b981' : 
                        entry.name === 'Applied' ? '#6366f1' : 
                        entry.name === 'Rejected' ? '#ef4444' : '#f59e0b'
                      } 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Calendar View */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <div>
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                <CalendarIcon size={20} className="text-rose-600" />
              </div>
              Deadline Calendar
            </h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Track upcoming scholarship deadlines</p>
          </div>
          
          <div className="flex items-center gap-6 bg-slate-50 p-3 rounded-[1.5rem] border border-slate-100 shadow-inner">
            <button onClick={prevMonth} className="p-3 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-indigo-600 shadow-sm hover:shadow-indigo-100">
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-black uppercase tracking-[0.2em] text-slate-900 min-w-[160px] text-center">
              {monthName} {year}
            </span>
            <button onClick={nextMonth} className="p-3 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-indigo-600 shadow-sm hover:shadow-indigo-100">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8">
            <div className="grid grid-cols-7 gap-3 mb-6">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400 py-3">
                  {day}
                </div>
              ))}
              {calendarDays.map((day, i) => {
                if (day === null) return <div key={`empty-${i}`} className="aspect-square" />;
                
                const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const hasDeadlines = scholarshipsByDate[dateKey];
                const isSelected = selectedDate === dateKey;
                const isToday = new Date().toISOString().split('T')[0] === dateKey;

                return (
                  <motion.button
                    key={day}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedDate(dateKey)}
                    className={`aspect-square rounded-[1.25rem] flex flex-col items-center justify-center relative transition-all border-2 ${
                      isSelected 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-100 z-10' 
                        : hasDeadlines
                        ? 'bg-rose-50 text-rose-600 border-rose-100 hover:border-rose-300'
                        : 'bg-white text-slate-600 border-slate-50 hover:border-slate-200'
                    } ${isToday && !isSelected ? 'ring-2 ring-indigo-500 ring-offset-4' : ''}`}
                  >
                    <span className="text-base font-black">{day}</span>
                    {hasDeadlines && !isSelected && (
                      <div className="absolute bottom-3 w-1.5 h-1.5 bg-rose-500 rounded-full shadow-sm shadow-rose-200" />
                    )}
                    {hasDeadlines && (
                      <span className={`absolute top-2 right-2 text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-600'
                      }`}>
                        {hasDeadlines.length}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 h-full min-h-[400px]">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <Activity size={16} className="text-indigo-600" />
                </div>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {selectedDate ? `Deadlines for ${new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'Select a date'}
                </h4>
              </div>
              
              <div className="space-y-4">
                {selectedScholarships ? (
                  selectedScholarships.map((r, i) => (
                    <motion.div
                      key={r.scholarship.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all group cursor-pointer"
                    >
                      <p className="text-sm font-black text-slate-900 line-clamp-2 group-hover:text-indigo-600 transition-colors leading-snug">{r.scholarship.title}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-wider">{r.scholarship.provider}</p>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">{r.scholarship.amount}</span>
                        <a 
                          href={r.scholarship.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-slate-100 hover:border-indigo-100"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 bg-white rounded-[1.5rem] flex items-center justify-center mb-6 shadow-sm border border-slate-50">
                      <CalendarIcon size={24} className="text-slate-200" />
                    </div>
                    <p className="text-xs text-slate-400 font-black uppercase tracking-widest leading-loose max-w-[200px]">
                      {selectedDate ? 'No deadlines on this day' : 'Click a highlighted date to see scholarships'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recommendations Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-slate-900 p-12 rounded-[3.5rem] text-white relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] -mr-32 -mt-32 group-hover:bg-indigo-500/30 transition-all duration-700" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/10 rounded-full blur-[80px] -ml-32 -mb-32" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
                <Lightbulb className="text-indigo-400" size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight">AI Strategic Insight</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Personalized Strategy</p>
              </div>
            </div>

            <p className="text-xl text-slate-200 leading-relaxed max-w-3xl font-medium">
              Based on your profile and browsing history, you have a high affinity for <span className="text-indigo-400 font-black underline decoration-indigo-400/30 underline-offset-8">{interestData[0]?.name || 'specialized'}</span> programs. 
              We've identified that <span className="text-rose-400 font-black underline decoration-rose-400/30 underline-offset-8">{categoryData.sort((a,b) => b.value - a.value)[0]?.name || 'merit-based'}</span> scholarships 
              currently offer your best success rate. Focus your next 3 applications here to build momentum.
            </p>

            <div className="mt-12 flex flex-wrap items-center gap-8">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-12 h-12 rounded-full border-4 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden ring-1 ring-white/10">
                      <img src={`https://picsum.photos/seed/${i + 20}/48/48`} alt="User" referrerPolicy="no-referrer" />
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-sm font-black">2,481 Students</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Matching your profile</p>
                </div>
              </div>

              <div className="h-10 w-px bg-white/10 hidden md:block" />

              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                  <span className="text-indigo-400 font-black text-lg">84%</span>
                  <span className="ml-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Avg Match</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
              <Search size={18} className="text-slate-400" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Recent Queries</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Your search history</p>
            </div>
          </div>

          <div className="space-y-4">
            {searchHistory.length > 0 ? (
              searchHistory.map((query, i) => (
                <motion.div 
                  key={i} 
                  whileHover={{ x: 5 }}
                  className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all cursor-pointer group"
                >
                  <div className="w-2 h-2 rounded-full bg-indigo-400 group-hover:scale-150 transition-transform" />
                  <span className="text-sm font-bold text-slate-600 truncate">{query}</span>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-sm text-slate-400 italic font-medium">No search history yet.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
