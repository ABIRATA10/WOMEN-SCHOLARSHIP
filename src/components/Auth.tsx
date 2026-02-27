import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User as UserIcon, ArrowRight, Sparkles, LogIn, Phone } from 'lucide-react';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isVerifying) {
      if (verificationCode === generatedCode) {
        const users = JSON.parse(localStorage.getItem('scholar_users') || '[]');
        const newUser: User = {
          id: Math.random().toString(36).substr(2, 9),
          email,
          password,
          fullName,
          phoneNumber,
        };
        localStorage.setItem('scholar_users', JSON.stringify([...users, newUser]));
        onLogin(newUser);
      } else {
        setError('Invalid verification code');
      }
      return;
    }

    if (isResetMode) {
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      const users = JSON.parse(localStorage.getItem('scholar_users') || '[]');
      const userIndex = users.findIndex((u: any) => u.email === email);
      if (userIndex !== -1) {
        users[userIndex].password = newPassword;
        localStorage.setItem('scholar_users', JSON.stringify(users));
        setIsResetMode(false);
        setIsLogin(true);
        setError('');
        alert('Password reset successfully! Please log in with your new password.');
      } else {
        setError('User not found');
      }
      return;
    }

    if (isForgotPassword) {
      const users = JSON.parse(localStorage.getItem('scholar_users') || '[]');
      const user = users.find((u: any) => u.email === email);
      if (user) {
        // Simulate email sending
        setResetEmailSent(true);
      } else {
        setError('No account found with this email');
      }
      return;
    }

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
      
      // Generate and "send" code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);
      setIsVerifying(true);
      setError('');
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
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-[480px] bg-white/90 backdrop-blur-2xl rounded-[3rem] p-10 shadow-2xl shadow-indigo-100/50 border border-white relative z-10"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ rotate: -10 }}
            animate={{ rotate: 0 }}
            className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-200 mx-auto mb-8"
          >
            <Sparkles className="text-white" size={40} />
          </motion.div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-3">
            {isVerifying ? 'Verification' : isResetMode ? 'New Password' : isForgotPassword ? 'Reset Password' : isLogin ? 'Welcome Back' : 'Get Started'}
          </h2>
          <p className="text-slate-500 font-medium">
            {isVerifying
              ? `Enter the 6-digit code sent to ${email} and ${phoneNumber}`
              : isResetMode
                ? 'Create a strong new password for your account'
                : isForgotPassword 
                  ? 'Enter your email to receive a reset link' 
                  : isLogin 
                    ? 'Sign in to access your scholarship matches' 
                    : 'Join ScholarMatch AI to find your funding'}
          </p>
        </div>

        {isVerifying ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 text-center">
              <p className="text-xs text-indigo-600 font-black uppercase tracking-widest mb-2">Demo OTP (Phone & Email)</p>
              <p className="text-4xl font-black text-indigo-600 tracking-[0.5em] ml-[0.5em]">{generatedCode}</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1">
                <label className={labelClasses}>6-Digit Code</label>
                <input
                  required
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className={`${inputClasses} text-center text-2xl tracking-[0.5em] font-black pl-4`}
                  placeholder="000000"
                />
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
                Verify & Create Account
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => setIsVerifying(false)}
                className="w-full text-center text-slate-400 font-bold text-xs hover:text-slate-600 transition-colors"
              >
                Back to Sign Up
              </button>
            </form>
          </motion.div>
        ) : resetEmailSent && !isResetMode ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto">
              <Mail size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">Check your email</h3>
              <p className="text-slate-500 text-sm font-medium">
                We've sent a password reset link to <span className="text-indigo-600 font-bold">{email}</span>.
              </p>
              <p className="text-[10px] text-slate-400 italic mt-4">
                (Demo: Click the button below to simulate clicking the link in your email)
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setResetEmailSent(false);
                  setIsForgotPassword(false);
                  setIsResetMode(true);
                }}
                className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-lg shadow-indigo-100"
              >
                Simulate Reset Link Click
              </button>
              <button
                onClick={() => {
                  setResetEmailSent(false);
                  setIsForgotPassword(false);
                  setIsLogin(true);
                }}
                className="w-full py-4 bg-slate-50 text-slate-400 font-black rounded-2xl uppercase tracking-widest text-xs"
              >
                Back to Login
              </button>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {!isLogin && !isForgotPassword && !isResetMode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="space-y-1">
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
                  </div>

                  <div className="space-y-1">
                    <label className={labelClasses}>Phone Number</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                      <input
                        required
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className={inputClasses}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!isResetMode && (
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
                    disabled={isResetMode}
                  />
                </div>
              </div>
            )}

            {isResetMode && (
              <>
                <div className="space-y-1">
                  <label className={labelClasses}>New Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    <input
                      required
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={inputClasses}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className={labelClasses}>Confirm New Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    <input
                      required
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={inputClasses}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </>
            )}

            {!isForgotPassword && !isResetMode && (
              <div className="space-y-1">
                <div className="flex justify-between items-center px-1">
                  <label className={labelClasses}>Password</label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest mb-1.5"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
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
            )}

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
              {isResetMode ? 'Reset Password' : isForgotPassword ? 'Send Reset Link' : isLogin ? 'Welcome' : 'Create Account'}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            
            {(isForgotPassword || isResetMode) && (
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setIsResetMode(false);
                  setIsLogin(true);
                }}
                className="w-full text-center text-slate-400 font-bold text-xs hover:text-slate-600 transition-colors"
              >
                Back to Login
              </button>
            )}
          </form>
        )}

        <div className="mt-8 pt-8 border-t border-slate-50 text-center">
          <p className="text-sm text-slate-400 font-medium">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setIsForgotPassword(false);
                setResetEmailSent(false);
              }}
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
