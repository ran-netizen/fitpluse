import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Dumbbell,
  Lock,
  Mail,
  User,
  Flame,
  TrendingUp,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const AuthView = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Email Verification OTP flow state
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [otpNotice, setOtpNotice] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  const { login, register, verifyEmail, resendCode, error: authError, setError } = useAuth();

  // Handle countdown for resend button
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setError(null);

    if (!email || !password || (!isLogin && !name)) {
      setFormError('Please fill out all required fields');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long');
      return;
    }

    setSubmitting(true);

    if (isLogin) {
      // Standard Password Login (no OTP required)
      const result = await login(email, password);
      setSubmitting(false);

      if (!result.success) {
        if (result.requireVerification) {
          // Account unverified: prompt user to enter pending code
          setTargetEmail(result.email || email);
          setFormError(result.error || 'Please verify your email to continue');
        } else {
          setFormError(result.error || 'Invalid email or password');
        }
      }
    } else {
      // Create Account (Dispatches OTP to email)
      const result = await register(name, email, password);
      setSubmitting(false);

      if (result.success && result.requireVerification) {
        setTargetEmail(result.email || email);
        setIsVerifying(true);
        setOtpCode('');
        setOtpNotice(result.message || 'Verification code sent to your email.');
        setResendCooldown(30);
      } else {
        setFormError(result.error || 'Failed to create account');
      }
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setOtpNotice('');

    const cleanOtp = otpCode.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setFormError('Please enter the full 6-digit verification code');
      return;
    }

    setSubmitting(true);
    const result = await verifyEmail(targetEmail, cleanOtp);
    setSubmitting(false);

    if (!result.success) {
      setFormError(result.error || 'Verification failed. Please check your code.');
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending) return;

    setResending(true);
    setFormError('');
    const result = await resendCode(targetEmail);
    setResending(false);

    if (result.success) {
      setOtpNotice(result.message || 'A fresh 6-digit code was sent to your email.');
      setResendCooldown(45);
    } else {
      setFormError(result.error || 'Failed to resend code');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl grid md:grid-cols-2 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-2xl shadow-emerald-950/20">
        
        {/* Left Side: Athletic Showcase */}
        <div className="hidden md:flex flex-col justify-between p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 border-r border-slate-800 relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-6">
              <Flame className="w-3.5 h-3.5" />
              Build Consistency
            </div>
            <h2 className="text-3xl font-extrabold text-white leading-tight mb-4">
              Track Workouts. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500">
                Crush Your Goals.
              </span>
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Log daily exercises, reps, sets, and load. Monitor nutrition targets tailored to your body weight, and track weekly volume.
            </p>
          </div>

          <div className="space-y-4 my-8">
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span>Weight-based dynamic macro & calorie targets</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span>Secure 6-digit email activation & JWT auth</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <p className="text-xs text-slate-400 italic">
              "Consistency beats motivation every single time. Keep showing up."
            </p>
          </div>
        </div>

        {/* Right Side: Auth Container */}
        <div className="p-6 sm:p-10 flex flex-col justify-center">

          {/* STEP 2: VERIFICATION OTP VIEW */}
          {isVerifying ? (
            <div>
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsVerifying(false);
                    setFormError('');
                    setOtpNotice('');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-4 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to registration</span>
                </button>

                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">
                  Verify Your Email
                </h3>
                <p className="text-xs text-slate-400">
                  We sent a 6-digit verification code to: <br />
                  <strong className="text-emerald-400 font-medium">{targetEmail}</strong>
                </p>
              </div>

              {/* Status / Error notifications */}
              {otpNotice && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{otpNotice}</span>
                </div>
              )}

              {formError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="123456"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] text-emerald-400 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-bold"
                  />
                  <p className="text-[11px] text-slate-500 mt-1.5 text-center">
                    Expires in 10 minutes. Check spam/junk folder if needed.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting || otpCode.length !== 6}
                  className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] disabled:opacity-50 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Activate & Enter Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Resend actions */}
              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">Didn't receive the code?</span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || resending}
                  className="text-emerald-400 hover:underline font-semibold disabled:text-slate-500 disabled:no-underline flex items-center gap-1 cursor-pointer"
                >
                  {resending ? (
                    'Sending...'
                  ) : resendCooldown > 0 ? (
                    `Resend in ${resendCooldown}s`
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Resend Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* STEP 1: NORMAL SIGN IN OR REGISTRATION FORM */
            <div>
              {/* Header tabs */}
              <div className="flex p-1 bg-slate-800/70 rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true);
                    setFormError('');
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    isLogin
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(false);
                    setFormError('');
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    !isLogin
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-1">
                  {isLogin ? 'Welcome Back!' : 'Get Started with FitPulse'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isLogin
                    ? 'Enter your credentials to access your fitness dashboard.'
                    : 'Create your account to start logging and tracking workouts.'}
                </p>
              </div>

              {/* Error Banner */}
              {(formError || authError) && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{formError || authError}</span>
                  </div>
                  {/* If account unverified on login attempt, offer quick link to verify */}
                  {targetEmail && (formError?.includes('verify') || authError?.includes('verify')) && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsVerifying(true);
                        setFormError('');
                      }}
                      className="self-start text-[11px] font-bold text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Enter verification code for {targetEmail} &rarr;</span>
                    </button>
                  )}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {!isLogin && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Alex Johnson"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@domain.com"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Minimum 6 characters</p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] disabled:opacity-50 text-slate-950 font-bold text-sm rounded-lg shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : isLogin ? (
                    'Sign In'
                  ) : (
                    'Create Account & Send Code'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setFormError('');
                  }}
                  className="text-xs text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  {isLogin
                    ? "Don't have an account? Sign up"
                    : 'Already have an account? Sign in'}
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default AuthView;
