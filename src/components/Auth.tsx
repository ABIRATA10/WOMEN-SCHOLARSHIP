import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User as UserIcon, ArrowRight, Sparkles, LogIn, Phone, Eye, EyeOff } from 'lucide-react';
import { User } from '../types';
import { Logo } from './Logo';
import { useLanguage } from '../contexts/LanguageContext';
const API_URL = import.meta.env.VITE_API_URL || '';



interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const { t, language, setLanguage } = useLanguage();
  const [isLogin, setIsLogin] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetVerifying, setIsResetVerifying] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin is from AI Studio preview or localhost
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.endsWith('.railway.app')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        onLogin(event.data.user);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLogin]);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/google/url');
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to get auth URL');
      }
      const { url } = await response.json();
      
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      window.open(
        url,
        'google_oauth',
        `width=${width},height=${height},left=${left},top=${top}`
      );
    } catch (err: any) {
      setError(err.message || 'Google Sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isVerifying) {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, fullName, phoneNumber, code: verificationCode }),
        });
        const data = await response.json();
        if (response.ok) {
          onLogin(data);
        } else {
          setError(data.error || 'Signup failed');
        }
        return;
      }

      if (isResetMode) {
        if (newPassword !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        const response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code: verificationCode, newPassword }),
        });
        const data = await response.json();
        if (response.ok) {
          setIsResetMode(false);
          setIsLogin(true);
          setError('');
          alert('Password reset successfully! Please log in with your new password.');
        } else {
          setError(data.error || 'Reset failed');
        }
        return;
      }

      if (isResetVerifying) {
        // We'll just move to reset mode, the server will verify the code during the final reset step
        setIsResetVerifying(false);
        setIsResetMode(true);
        return;
      }

      if (isForgotPassword) {
        const response = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await response.json();
        if (response.ok) {
          setGeneratedCode(data.demoCode);
          setIsForgotPassword(false);
          setIsResetVerifying(true);
        } else {
          setError(data.error || 'User not found');
        }
        return;
      }

      if (isLogin) {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (response.ok) {
          onLogin(data);
        } else {
          setError(data.error || 'Invalid email or password');
        }
      } else {
        // Signup flow - first verify email
        const response = await fetch('/api/auth/send-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await response.json();
        if (response.ok) {
          setGeneratedCode(data.demoCode);
          setIsVerifying(true);
          setError('');
        } else {
          setError(data.error || 'Failed to send verification code');
        }
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all placeholder:text-slate-300 text-slate-800 font-medium";
  const labelClasses = "text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block ml-1";

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F8FAFC] relative overflow-hidden">
      <div className="absolute top-6 right-6 z-50">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as any)}
          className="bg-white border border-slate-200 text-xs font-bold text-slate-600 rounded-lg px-2 py-1.5 outline-none cursor-pointer hover:bg-slate-50 transition-colors shadow-sm"
        >
          <option value="en">EN</option>
          <option value="hi">HI</option>
          <option value="or">OR</option>
        </select>
      </div>
      {/* Decorative Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-200/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-[480px] bg-white/90 backdrop-blur-2xl rounded-[3rem] p-10 shadow-2xl shadow-indigo-100/50 border border-white relative z-10"
      >
        <div className="flex justify-center mb-8">
          <Logo size={64} showText={true} />
        </div>
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-3">
            {isVerifying || isResetVerifying ? 'Verification' : isResetMode ? 'New Password' : isForgotPassword ? 'Reset Password' : isLogin ? t('auth.welcome') : t('auth.create')}
          </h2>
          <p className="text-slate-500 font-medium">
            {isVerifying || isResetVerifying
              ? `Enter the 6-digit code sent to ${email}`
              : isResetMode
                ? 'Create a strong new password for your account'
                : isForgotPassword 
                  ? 'Enter your email to receive a reset code' 
                  : isLogin 
                    ? 'Sign in to access your scholarship matches' 
                    : 'Join MeritUs to find your funding'}
          </p>
        </div>

        {!isVerifying && !isResetVerifying && !isResetMode && (
          <div className="mb-8 space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-[#4285F4] to-[#34A853] hover:from-[#3367D6] hover:to-[#2b8a44] text-white font-black tracking-wide rounded-2xl transition-all flex items-center justify-center gap-3 shadow-md hover:shadow-lg group disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-4 text-slate-400 font-black tracking-widest">Or continue with email</span>
              </div>
            </div>
          </div>
        )}

        {isVerifying || isResetVerifying ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 text-center">
              <p className="text-xs text-indigo-600 font-black uppercase tracking-widest mb-2">
                {isResetVerifying ? 'Reset Code' : 'Demo OTP (Phone & Email)'}
              </p>
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
                disabled={loading}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 text-sm uppercase tracking-widest group disabled:opacity-50"
              >
                {loading ? 'Verifying...' : isResetVerifying ? 'Verify Code' : 'Verify & Create Account'}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsVerifying(false);
                  setIsResetVerifying(false);
                  if (isResetVerifying) setIsForgotPassword(true);
                }}
                className="w-full text-center text-slate-400 font-bold text-xs hover:text-slate-600 transition-colors"
              >
                {isResetVerifying ? 'Back to Email' : 'Back to Sign Up'}
              </button>
            </form>
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
                    <label className={labelClasses}>{t('auth.name')}</label>
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
                    <label className={labelClasses}>{t('auth.phone')}</label>
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
                <label className={labelClasses}>{t('auth.email')}</label>
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
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`${inputClasses} pr-12`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onMouseDown={() => setShowNewPassword(true)}
                      onMouseUp={() => setShowNewPassword(false)}
                      onMouseLeave={() => setShowNewPassword(false)}
                      onTouchStart={() => setShowNewPassword(true)}
                      onTouchEnd={() => setShowNewPassword(false)}
                      onTouchCancel={() => setShowNewPassword(false)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors"
                    >
                      {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className={labelClasses}>Confirm New Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    <input
                      required
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`${inputClasses} pr-12`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onMouseDown={() => setShowConfirmPassword(true)}
                      onMouseUp={() => setShowConfirmPassword(false)}
                      onMouseLeave={() => setShowConfirmPassword(false)}
                      onTouchStart={() => setShowConfirmPassword(true)}
                      onTouchEnd={() => setShowConfirmPassword(false)}
                      onTouchCancel={() => setShowConfirmPassword(false)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {!isForgotPassword && !isResetMode && (
              <div className="space-y-1">
                <div className="flex justify-between items-center px-1">
                  <label className={labelClasses}>{t('auth.password')}</label>
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
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClasses} pr-12`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onMouseDown={() => setShowPassword(true)}
                    onMouseUp={() => setShowPassword(false)}
                    onMouseLeave={() => setShowPassword(false)}
                    onTouchStart={() => setShowPassword(true)}
                    onTouchEnd={() => setShowPassword(false)}
                    onTouchCancel={() => setShowPassword(false)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
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
              disabled={loading}
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 text-sm uppercase tracking-widest group disabled:opacity-50"
            >
              {loading ? 'Processing...' : isResetMode ? 'Reset Password' : isForgotPassword ? 'Send Reset Code' : isLogin ? t('auth.signin') : t('auth.create')}
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
                setIsResetVerifying(false);
                setIsResetMode(false);
              }}
              className="ml-2 text-indigo-600 font-black hover:text-indigo-800 transition-colors uppercase tracking-widest text-[10px]"
            >
              {isLogin ? t('auth.signup') : t('auth.signin')}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
