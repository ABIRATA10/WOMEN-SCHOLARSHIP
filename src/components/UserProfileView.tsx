import React from 'react';
import { UserProfile, ScholarshipMatch, Application } from '../types';
import { User, GraduationCap, MapPin, Briefcase, BookOpen, Heart, Edit3, Save, ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProfileForm } from './ProfileForm';
import { ScholarshipCard } from './ScholarshipCard';

interface UserProfileViewProps {
  profile: UserProfile;
  results: ScholarshipMatch[];
  savedIds: string[];
  applications: Application[];
  onSave: (id: string) => void;
  onApply: (id: string) => void;
  onUpdateProfile: (profile: UserProfile) => void;
  onUpdateStatus: (id: string, status: any) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  isLoading: boolean;
  onBack: () => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  profile,
  results,
  savedIds,
  applications,
  onSave,
  onApply,
  onUpdateProfile,
  onUpdateStatus,
  onUpdateNotes,
  isLoading,
  onBack
}) => {
  const [activeTab, setActiveTab] = React.useState<'overview' | 'edit' | 'saved'>('overview');

  const savedScholarships = results.filter(r => savedIds.includes(r.scholarship.id));

  const StatCard = ({ label, value, icon: Icon, color }: { label: string, value: string | number, icon: any, color: string }) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        <p className="text-lg font-black text-slate-900">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[3rem] border border-slate-50 shadow-xl shadow-slate-200/50">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-[2rem] flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <User size={40} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{profile.fullName}</h2>
            <p className="text-slate-400 font-medium flex items-center gap-2">
              <MapPin size={14} className="text-rose-400" /> {profile.state}, {profile.country}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="px-6 py-3 bg-slate-50 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100 flex items-center gap-2"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <button 
            onClick={() => setActiveTab('edit')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
          >
            <Edit3 size={14} /> Edit Profile
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/50 rounded-2xl w-fit border border-slate-100">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'overview' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('edit')}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'edit' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Edit Profile
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'saved' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Saved ({savedIds.length})
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard label="Education" value={profile.educationLevel} icon={GraduationCap} color="bg-indigo-50 text-indigo-600" />
              <StatCard label="Field" value={profile.fieldOfStudy} icon={BookOpen} color="bg-rose-50 text-rose-600" />
              <StatCard label="CGPA" value={profile.gpa} icon={Sparkles} color="bg-amber-50 text-amber-600" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Academic Details */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <GraduationCap size={20} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">Academic Details</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b border-slate-50">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Institution</span>
                    <span className="text-sm font-bold text-slate-700">{profile.institution}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-slate-50">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Year of Study</span>
                    <span className="text-sm font-bold text-slate-700">{profile.yearOfStudy}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-slate-50">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Field of Study</span>
                    <span className="text-sm font-bold text-slate-700">{profile.fieldOfStudy}</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">CGPA</span>
                    <span className="text-sm font-bold text-slate-700">{profile.gpa}</span>
                  </div>
                </div>
              </div>

              {/* Personal Details */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                    <User size={20} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">Personal Details</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b border-slate-50">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Age</span>
                    <span className="text-sm font-bold text-slate-700">{profile.age}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-slate-50">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gender</span>
                    <span className="text-sm font-bold text-slate-700">{profile.gender}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-slate-50">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category</span>
                    <span className="text-sm font-bold text-slate-700">{profile.caste || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Income Bracket</span>
                    <span className="text-sm font-bold text-slate-700">{profile.incomeBracket}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Background & Goals */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                      <BookOpen size={20} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900">Background</h3>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">
                    {profile.background || 'No background information provided.'}
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                      <Briefcase size={20} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900">Career Goals</h3>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">
                    {profile.careerGoals || 'No career goals provided.'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'edit' && (
          <motion.div
            key="edit"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ProfileForm 
              onSubmit={(updated) => {
                onUpdateProfile(updated);
                setActiveTab('overview');
              }} 
              isLoading={isLoading} 
              initialData={profile} 
            />
          </motion.div>
        )}

        {activeTab === 'saved' && (
          <motion.div
            key="saved"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-900">Bookmarked Scholarships</h3>
              <p className="text-slate-400 font-bold text-sm">{savedScholarships.length} Items</p>
            </div>

            {savedScholarships.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {savedScholarships.map((result) => (
                  <ScholarshipCard
                    key={result.scholarship.id}
                    scholarship={result.scholarship}
                    match={result.match}
                    applicationStatus={applications.find(a => a.scholarshipId === result.scholarship.id)?.status}
                    onUpdateStatus={onUpdateStatus}
                    onUpdateNotes={onUpdateNotes}
                    initialNotes={applications.find(a => a.scholarshipId === result.scholarship.id)?.notes}
                    onApply={onApply}
                    onSave={onSave}
                    isSaved={true}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white p-16 rounded-[3rem] text-center border border-slate-100 shadow-sm">
                <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Heart size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">No Bookmarks</h3>
                <p className="text-slate-500 font-medium mb-8">You haven't saved any scholarships yet.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
