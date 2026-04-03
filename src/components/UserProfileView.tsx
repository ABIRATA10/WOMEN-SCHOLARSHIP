import React from 'react';
import { UserProfile, ScholarshipMatch, Application } from '../types';
import { User, GraduationCap, MapPin, Briefcase, BookOpen, Heart, Edit3, Save, ArrowLeft, CheckCircle2, Sparkles, FileText, Download, Phone } from 'lucide-react';
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
  onAutoSave?: (profile: UserProfile) => void;
  onUpdateStatus: (id: string, status: any) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onDeleteApplication?: (id: string) => void;
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
  onAutoSave,
  onUpdateStatus,
  onUpdateNotes,
  onDeleteApplication,
  isLoading,
  onBack
}) => {
  const [activeTab, setActiveTab] = React.useState<'overview' | 'edit' | 'saved'>('overview');
  const [profileImageUrl, setProfileImageUrl] = React.useState<string | null>(profile.profileImageUrl || null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setProfileImageUrl(result);
        onUpdateProfile({ ...profile, profileImageUrl: result });
      };
      reader.readAsDataURL(file);
    }
  };

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-slate-50 shadow-xl shadow-slate-200/50">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <div className="flex flex-col items-center sm:items-start gap-3">
            <div 
              className="relative w-24 h-24 rounded-[2rem] flex items-center justify-center text-white shadow-lg shadow-blue-200 shrink-0 overflow-hidden cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                  <User size={48} />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Edit3 size={24} className="text-white" />
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
            >
              <Edit3 size={12} /> Upload Photo
            </button>
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{profile.fullName}</h2>
            <p className="text-slate-400 font-medium flex items-center justify-center sm:justify-start gap-2 mt-1">
              <MapPin size={14} className="text-rose-400" /> {profile.state}, {profile.country}
            </p>
            {profile.phoneNumber && (
              <p className="text-slate-400 font-medium flex items-center justify-center sm:justify-start gap-2 mt-1">
                <Phone size={14} className="text-blue-400" /> {profile.phoneNumber}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <button 
            onClick={onBack}
            className="w-full sm:w-auto px-6 py-3 bg-slate-50 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100 flex items-center justify-center gap-2"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <button 
            onClick={() => setActiveTab('edit')}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
          >
            <Edit3 size={14} /> Edit Profile
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/50 rounded-2xl w-full sm:w-fit overflow-x-auto no-scrollbar border border-slate-100">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'overview' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('edit')}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'edit' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
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
              <StatCard label="Education" value={profile.educationLevel} icon={GraduationCap} color="bg-blue-50 text-blue-600" />
              <StatCard label="Field" value={profile.fieldOfStudy} icon={BookOpen} color="bg-rose-50 text-rose-600" />
              <StatCard label="CGPA" value={profile.gpa} icon={Sparkles} color="bg-amber-50 text-amber-600" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Academic Details */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
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

            {/* Documents */}
            {profile.documents && profile.documents.length > 0 && (
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <FileText size={20} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">Documents</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {profile.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                          <FileText size={18} />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold text-slate-900 truncate">{doc.name}</p>
                          <p className="text-xs text-slate-500 truncate">{doc.type}</p>
                        </div>
                      </div>
                      <a 
                        href={doc.url} 
                        download={doc.name}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors shrink-0"
                      >
                        <Download size={16} />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
              onAutoSave={onAutoSave}
              isLoading={isLoading} 
              initialData={null} 
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
                {savedScholarships.map((result, index) => (
                  <ScholarshipCard
                    key={`${result.scholarship.id}-${index}`}
                    scholarship={result.scholarship}
                    match={result.match}
                    applicationStatus={applications.find(a => a.scholarshipId === result.scholarship.id)?.status}
                    onUpdateStatus={onUpdateStatus}
                    onUpdateNotes={onUpdateNotes}
                    onDeleteApplication={onDeleteApplication}
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
