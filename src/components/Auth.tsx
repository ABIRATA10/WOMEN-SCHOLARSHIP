import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User as UserIcon, ArrowRight, Sparkles, LogIn } from 'lucide-react';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      const users = JSON.parse(localStorage.getItem('scholar_users') || '[]');
      const user = users.find((u: any) => u.email === email && u.password === password);
      if (user) {
        onLogin(user);
      } else {
        setError('Invalid email or password');
      }
    } else {
      const users = JSON.parse(localStorage.getItem('scholar_users') || '[]');
      if (users.find((u: any) => u.email === email)) {
        setError('User already exists');
        return;
      }
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        password,
        fullName,
      };
      localStorage.setItem('scholar_users', JSON.stringify([...users, newUser]));
      onLogin(newUser);
    }
  };

  const inputClasses = "w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all placeholder:text-slate-300 text-slate-800 font-medium";
  const labelClasses = "text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block ml-1";

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F8FAFC] relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-200/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[480px] bg-white rounded-[3rem] p-10 shadow-2xl shadow-slate-200/60 border border-slate-50 relative z-10"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200 mx-auto mb-6">
            <Sparkles className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            {isLogin ? 'Welcome' : 'Create Account'}
          </h2>
          <p className="text-slate-400 font-medium">
            {isLogin ? 'Sign in to access your scholarship matches' : 'Join ScholarMatch AI to find your funding'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1 overflow-hidden"
              >
                <label className={labelClasses}>Full Name</label>
                <div className="relative group">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                  <input
                    required
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={inputClasses}
                    placeholder="Jane Doe"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1">
            <label className={labelClasses}>Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClasses}
                placeholder="jane@example.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className={labelClasses}>Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClasses}
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xs text-rose-500 font-bold text-center bg-rose-50 py-2 rounded-lg border border-rose-100"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 text-sm uppercase tracking-widest group"
          >
            {isLogin ? 'Welcome' : 'Create Account'}
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-50 text-center">
          <p className="text-sm text-slate-400 font-medium">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-indigo-600 font-black hover:text-indigo-800 transition-colors uppercase tracking-widest text-[10px]"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
