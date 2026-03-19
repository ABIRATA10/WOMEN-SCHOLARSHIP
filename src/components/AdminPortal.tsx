import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  GraduationCap, 
  Users, 
  BarChart3, 
  Bell, 
  LogOut,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Download,
  Eye
} from 'lucide-react';
import { User as UserType } from '../types';
import { ScholarshipManagement } from './admin/ScholarshipManagement';
import { StudentManagement } from './admin/StudentManagement';
import { AnalyticsDashboard } from './admin/AnalyticsDashboard';
import { NoticeManagement } from './admin/NoticeManagement';

const API_URL = import.meta.env.VITE_API_URL || '';

interface AdminPortalProps {
  currentUser: UserType;
  onLogout: () => void;
  onClose: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ currentUser, onLogout, onClose }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scholarships' | 'students' | 'analytics' | 'notices'>('dashboard');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/admin/dashboard`, {
        headers: {
          'x-user-email': currentUser.email
        }
      });
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Access denied. You are not an admin.');
        }
        throw new Error('Failed to fetch dashboard data');
      }
      const data = await res.json();
      setDashboardData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <button 
            onClick={onClose}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-colors"
          >
            Return to App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col fixed inset-y-0 left-0 z-20">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <LayoutDashboard size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-black tracking-tight text-lg leading-tight">Admin Portal</h1>
            <p className="text-xs text-slate-400 font-medium">MeritUs Management</p>
          </div>
        </div>

        <div className="flex-1 py-6 px-4 space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button
            onClick={() => setActiveTab('scholarships')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'scholarships' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <GraduationCap size={18} /> Scholarships
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'students' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Users size={18} /> Students
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'analytics' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <BarChart3 size={18} /> Analytics
          </button>
          <button
            onClick={() => setActiveTab('notices')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'notices' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Bell size={18} /> Notices
          </button>
        </div>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all mb-2"
          >
            Exit Admin
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl text-sm font-bold transition-all"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 p-8">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && dashboardData && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Overview</h2>
                  <p className="text-slate-500 font-medium">Welcome back, {currentUser.fullName}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                        <Users size={24} />
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Total Students</p>
                    <h3 className="text-3xl font-black text-slate-900">{dashboardData.metrics.totalStudents}</h3>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                        <GraduationCap size={24} />
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Scholarships</p>
                    <h3 className="text-3xl font-black text-slate-900">{dashboardData.metrics.totalScholarships}</h3>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                        <Search size={24} />
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">AI Matches Run</p>
                    <h3 className="text-3xl font-black text-slate-900">{dashboardData.metrics.totalAiRequests}</h3>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                        <CheckCircle size={24} />
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Bookmarks</p>
                    <h3 className="text-3xl font-black text-slate-900">{dashboardData.metrics.totalBookmarks}</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-black text-slate-900 mb-6">Recent Signups</h3>
                    <div className="space-y-4">
                      {dashboardData.recentSignups.map((user: any) => (
                        <div key={user.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{user.name}</p>
                              <p className="text-xs text-slate-500">{user.email}</p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-slate-400">
                            {new Date(user.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-black text-slate-900 mb-6">Top Matched Scholarships</h3>
                    <div className="space-y-4">
                      {dashboardData.topMatchedScholarships.map((scholarship: any, index: number) => (
                        <div key={scholarship.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                          <div className="w-8 h-8 bg-slate-200 text-slate-600 rounded-lg flex items-center justify-center font-black text-sm">
                            #{index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 truncate">{scholarship.title}</p>
                            <p className="text-xs text-slate-500 truncate">{scholarship.provider}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-indigo-600">{scholarship.match_count}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Matches</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'scholarships' && (
              <motion.div
                key="scholarships"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="mb-8">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Scholarships</h2>
                  <p className="text-slate-500 font-medium">Manage the scholarship database</p>
                </div>
                <ScholarshipManagement adminEmail={currentUser.email} />
              </motion.div>
            )}

            {activeTab === 'students' && (
              <motion.div
                key="students"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="mb-8">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Students</h2>
                  <p className="text-slate-500 font-medium">Manage user accounts and profiles</p>
                </div>
                <StudentManagement adminEmail={currentUser.email} />
              </motion.div>
            )}

            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="mb-8">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Analytics</h2>
                  <p className="text-slate-500 font-medium">Platform usage and trends</p>
                </div>
                <AnalyticsDashboard adminEmail={currentUser.email} />
              </motion.div>
            )}

            {activeTab === 'notices' && (
              <motion.div
                key="notices"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="mb-8">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Notices</h2>
                  <p className="text-slate-500 font-medium">Manage platform announcements</p>
                </div>
                <NoticeManagement adminEmail={currentUser.email} />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
