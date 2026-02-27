import React from 'react';
import { UserProfile } from '../types';
import { User, GraduationCap, MapPin, Briefcase, BookOpen, DollarSign, Building2, Home, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface ProfileFormProps {
  onSubmit: (profile: UserProfile) => void;
  isLoading: boolean;
  initialData?: UserProfile | null;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ onSubmit, isLoading, initialData }) => {
  const [formData, setFormData] = React.useState<UserProfile>(initialData || {
    fullName: '',
    age: 20,
    gender: 'Female',
    educationLevel: 'Undergraduate',
    yearOfStudy: '1st Year',
    institution: '',
    fieldOfStudy: '',
    gpa: '',
    country: 'India',
    state: '',
    pincode: '',
    address: '',
    caste: '',
    incomeBracket: '',
    background: '',
    careerGoals: '',
    profileDeadline: '',
  });

  const [isFetchingAddress, setIsFetchingAddress] = React.useState(false);
  const [lookupError, setLookupError] = React.useState<string | null>(null);

  const getCurrencySymbol = (country: string) => {
    const c = country.toLowerCase().trim();
    if (c === 'india') return '₹';
    if (['usa', 'united states', 'us'].includes(c)) return '$';
    if (['uk', 'united kingdom', 'britain'].includes(c)) return '£';
    if (['europe', 'germany', 'france', 'italy', 'spain'].includes(c)) return '€';
    return '$'; // Default
  };

  const currencySymbol = getCurrencySymbol(formData.country);

  const essentialFields: (keyof UserProfile)[] = [
    'fullName', 'educationLevel', 'country', 'incomeBracket', 'gpa', 'gender', 'fieldOfStudy'
  ];

  const calculateCompletion = () => {
    const totalFields = Object.keys(formData).length;
    const filledFields = Object.values(formData).filter(value => 
      value !== '' && value !== null && value !== undefined
    ).length;
    return Math.round((filledFields / totalFields) * 100);
  };

  const completionPercentage = calculateCompletion();

  const fetchAddress = async (pincode: string) => {
    if (formData.country.toLowerCase() === 'india' && pincode.length === 6) {
      setIsFetchingAddress(true);
      setLookupError(null);
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await response.json();
        if (data[0].Status === 'Success') {
          const postOffice = data[0].PostOffice[0];
          setFormData(prev => ({
            ...prev,
            state: postOffice.State,
            address: `${postOffice.Name}, ${postOffice.District}, ${postOffice.State}`
          }));
        } else {
          setLookupError("Pincode not found. Please enter address manually.");
        }
      } catch (error) {
        console.error('Error fetching address:', error);
        setLookupError("Lookup failed. Please enter address manually.");
      } finally {
        setIsFetchingAddress(false);
      }
    }
  };

  // Auto-lookup logic (India specific)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.pincode.length === 6 && !isFetchingAddress) {
        fetchAddress(formData.pincode);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [formData.pincode, formData.country]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: name === 'age' ? parseInt(value) : value }));
    if (name === 'pincode') setLookupError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const inputClasses = "w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all placeholder:text-slate-300 text-slate-800";
  const labelClasses = (color: string, isEssential?: boolean) => `text-[10px] font-black uppercase tracking-widest ${color} flex items-center gap-2 mb-1 ${isEssential ? 'after:content-["*"] after:ml-0.5 after:text-rose-500' : ''}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-10 bg-white p-10 rounded-[3rem] shadow-2xl shadow-slate-200/60 border border-slate-50 relative overflow-hidden">
      {/* Progress Bar */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md -mx-10 -mt-10 px-10 py-6 border-b border-slate-100 mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${completionPercentage === 100 ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
              {completionPercentage === 100 ? <CheckCircle2 size={16} /> : <Sparkles size={16} />}
            </div>
            <span className="text-sm font-black text-slate-900 uppercase tracking-tight">
              Profile Completion
            </span>
          </div>
          <span className={`text-sm font-black ${completionPercentage === 100 ? 'text-emerald-600' : 'text-indigo-600'}`}>
            {completionPercentage}%
          </span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            className={`h-full transition-colors duration-500 ${
              completionPercentage < 30 ? 'bg-rose-500' : 
              completionPercentage < 70 ? 'bg-amber-500' : 
              'bg-emerald-500'
            }`}
          />
        </div>
        {completionPercentage < 100 && (
          <p className="text-[10px] text-slate-400 font-medium mt-2 flex items-center gap-1">
            <AlertCircle size={10} className="text-amber-500" />
            Fill in all fields for the most accurate AI matching
          </p>
        )}
      </div>

      {/* Decorative background elements */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-rose-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-50/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <MapPin size={20} />
          </div>
          <h3 className="text-xl font-black text-slate-900">Location Details</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-1">
            <label className={labelClasses('text-indigo-500', true)}>
              Country
            </label>
            <input
              required
              name="country"
              value={formData.country}
              onChange={handleChange}
              className={inputClasses}
              placeholder="e.g. India"
            />
          </div>

          <div className="space-y-1">
            <label className={labelClasses('text-indigo-500')}>
              Pincode / Zip
            </label>
            <div className="relative group">
              <input
                required
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                className={`${inputClasses} pr-12`}
                placeholder="e.g. 400001"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {isFetchingAddress ? (
                  <div className="w-5 h-5 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
                ) : (
                  formData.pincode.length === 6 && (
                    <button 
                      type="button"
                      onClick={() => fetchAddress(formData.pincode)}
                      className="p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Retry Lookup"
                    >
                      <Sparkles size={14} />
                    </button>
                  )
                )}
              </div>
            </div>
            {lookupError && (
              <p className="text-[10px] text-rose-500 font-medium mt-1 animate-pulse">{lookupError}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className={labelClasses('text-indigo-500')}>
              State / Region
            </label>
            <input
              required
              name="state"
              value={formData.state}
              onChange={handleChange}
              className={inputClasses}
              placeholder="e.g. Maharashtra"
            />
          </div>
        </div>

        <div className="mt-8 space-y-1">
          <label className={labelClasses('text-indigo-500')}>
            Full Address {formData.country.toLowerCase() === 'india' && "(Auto-fills via Pincode)"}
          </label>
          <input
            required
            name="address"
            value={formData.address}
            onChange={handleChange}
            className={inputClasses}
            placeholder="Enter your full address (or wait for auto-fill)"
          />
          <p className="text-[9px] text-slate-400 font-medium italic">
            Tip: If auto-fill doesn't work, you can type your address manually.
          </p>
        </div>
      </div>

      <div className="relative z-10 pt-10 border-t border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200">
            <GraduationCap size={20} />
          </div>
          <h3 className="text-xl font-black text-slate-900">Academic & Personal</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-1">
            <label className={labelClasses('text-rose-500', true)}>
              Full Name
            </label>
            <input
              required
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className={inputClasses}
              placeholder="Jane Doe"
            />
          </div>

          <div className="space-y-1">
            <label className={labelClasses('text-rose-500', true)}>
              Gender
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className={inputClasses}
            >
              <option>Female</option>
              <option>Male</option>
              <option>Non-binary</option>
              <option>Other</option>
              <option>Prefer not to say</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className={labelClasses('text-rose-500', true)}>
              Education Level
            </label>
            <select
              name="educationLevel"
              value={formData.educationLevel}
              onChange={handleChange}
              className={inputClasses}
            >
              <option>High School</option>
              <option>Undergraduate</option>
              <option>Postgraduate</option>
              <option>Doctorate</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className={labelClasses('text-rose-500')}>
              Year of Study
            </label>
            <select
              name="yearOfStudy"
              value={formData.yearOfStudy}
              onChange={handleChange}
              className={inputClasses}
            >
              <option>1st Year</option>
              <option>2nd Year</option>
              <option>3rd Year</option>
              <option>4th Year</option>
              <option>Final Year</option>
              <option>Completed</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className={labelClasses('text-rose-500')}>
              University / School
            </label>
            <input
              required
              name="institution"
              value={formData.institution}
              onChange={handleChange}
              className={inputClasses}
              placeholder="e.g. Mumbai University"
            />
          </div>

          <div className="space-y-1">
            <label className={labelClasses('text-rose-500', true)}>
              Field of Study
            </label>
            <input
              required
              name="fieldOfStudy"
              value={formData.fieldOfStudy}
              onChange={handleChange}
              className={inputClasses}
              placeholder="e.g. Computer Science"
            />
          </div>

          <div className="space-y-1">
            <label className={labelClasses('text-rose-500')}>
              Caste / Category
            </label>
            <input
              name="caste"
              value={formData.caste}
              onChange={handleChange}
              className={inputClasses}
              placeholder="e.g. General, OBC, SC, ST"
            />
          </div>

          <div className="space-y-1">
            <label className={labelClasses('text-rose-500', true)}>
              Annual Family Income ({currencySymbol})
            </label>
            <input
              required
              name="incomeBracket"
              value={formData.incomeBracket}
              onChange={handleChange}
              className={inputClasses}
              placeholder={`e.g. ${currencySymbol} 5,00,000`}
            />
          </div>

          <div className="space-y-1">
            <label className={labelClasses('text-rose-500', true)}>
              GPA / Academic Standing
            </label>
            <input
              required
              name="gpa"
              value={formData.gpa}
              onChange={handleChange}
              className={inputClasses}
              placeholder="e.g. 3.8/4.0"
            />
          </div>
          
          <div className="space-y-1">
            <label className={labelClasses('text-rose-500')}>
              Age
            </label>
            <input
              required
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              className={inputClasses}
            />
          </div>

          <div className="space-y-1">
            <label className={labelClasses('text-rose-500')}>
              Profile Completion Deadline
            </label>
            <input
              type="date"
              name="profileDeadline"
              value={formData.profileDeadline}
              onChange={handleChange}
              className={inputClasses}
            />
            <p className="text-[9px] text-slate-400 font-medium italic">
              Setting a deadline helps prioritize your scholarship search.
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 pt-10 border-t border-slate-100 space-y-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200">
            <BookOpen size={20} />
          </div>
          <h3 className="text-xl font-black text-slate-900">Your Story</h3>
        </div>
        
        <div className="space-y-1">
          <label className={labelClasses('text-amber-500')}>
            Background & Challenges
          </label>
          <textarea
            name="background"
            value={formData.background}
            onChange={handleChange}
            rows={3}
            className={inputClasses}
            placeholder="Tell us about your background (e.g. first-generation student, minority group, specific hardships)..."
          />
        </div>

        <div className="space-y-1">
          <label className={labelClasses('text-amber-500')}>
            Career Goals
          </label>
          <textarea
            name="careerGoals"
            value={formData.careerGoals}
            onChange={handleChange}
            rows={3}
            className={inputClasses}
            placeholder="What are your long-term professional aspirations?"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-[2rem] transition-all shadow-2xl shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-xl uppercase tracking-widest relative z-10"
      >
        {isLoading ? (
          <>
            <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            Searching Global Opportunities...
          </>
        ) : (
          <>
            <Sparkles size={24} />
            Find My Scholarships
          </>
        )}
      </button>
    </form>
  );
};
