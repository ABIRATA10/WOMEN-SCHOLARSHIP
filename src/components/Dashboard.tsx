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
  Calendar, 
  PieChart as PieChartIcon, 
  BarChart3,
  Activity,
  Search
} from 'lucide-react';
import { ScholarshipMatch, UserProfile } from '../types';

interface DashboardProps {
  results: ScholarshipMatch[];
  profile: UserProfile | null;
  appliedIds: string[];
  searchHistory: string[];
}

export const Dashboard: React.FC<DashboardProps> = ({ results, profile, appliedIds, searchHistory }) => {
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

  const stats = [
    { label: 'Total Matches', value: results.length, icon: <Target className="text-indigo-500" />, color: 'bg-indigo-50' },
    { label: 'Avg Amount', value: profile ? `${profile.country === 'India' ? '₹' : '$'}${scholarshipStats.avgAmount.toLocaleString()}` : scholarshipStats.avgAmount.toLocaleString(), icon: <TrendingUp className="text-emerald-500" />, color: 'bg-emerald-50' },
    { label: 'Earliest Deadline', value: scholarshipStats.earliestDeadline, icon: <Calendar className="text-rose-500" />, color: 'bg-rose-50' },
    { label: 'Rolling Deadlines', value: scholarshipStats.rollingCount, icon: <Activity className="text-amber-500" />, color: 'bg-amber-50' },
  ];

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
            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center mb-4`}>
              {stat.icon}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-2xl font-black text-slate-900">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Topic Interest Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <BarChart3 size={20} className="text-indigo-600" /> Topic Interest Analysis
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-1">Based on your scholarship matches and profile</p>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={interestData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }}
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 10, 10, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Category Distribution Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <PieChartIcon size={20} className="text-rose-600" /> Category Distribution
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-1">Breakdown of scholarship types</p>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Recommendations Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-slate-900 p-10 rounded-[3rem] text-white relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <h3 className="text-2xl font-black mb-4">AI Insight</h3>
            <p className="text-slate-300 leading-relaxed max-w-2xl">
              Based on our analysis, you are most eligible for <span className="text-indigo-400 font-bold">{interestData[0]?.name || 'various'}</span> scholarships. 
              We recommend focusing on <span className="text-rose-400 font-bold">{categoryData.sort((a,b) => b.value - a.value)[0]?.name || 'all'}</span> opportunities 
              to maximize your chances of success.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden">
                    <img src={`https://picsum.photos/seed/${i + 10}/40/40`} alt="User" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 font-medium">Join 2,000+ students finding their future here.</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm"
        >
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
            <Search size={18} className="text-slate-400" /> Recent Queries
          </h3>
          <div className="space-y-3">
            {searchHistory.length > 0 ? (
              searchHistory.map((query, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-2 h-2 rounded-full bg-indigo-400" />
                  <span className="text-sm font-bold text-slate-600 truncate">{query}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 italic">No search history yet.</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
