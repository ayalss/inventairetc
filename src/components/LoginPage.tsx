import React, { useState } from 'react';
import { ShieldCheck, Eye, EyeOff, Lock, Mail } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (email: string) => void;
  defaultEmail: string;
}

export default function LoginPage({ onLoginSuccess, defaultEmail }: LoginPageProps) {
  const [email, setEmail] = useState(defaultEmail || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanEmail = String(email ?? '').trim();
    const cleanPassword = String(password ?? '').trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        onLoginSuccess(cleanEmail);
      } else {
        setErrorMessage(data.error || 'Authentication failed.');
      }
    } catch (err) {
      setErrorMessage('Could not connect to server.');
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Ambient glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-red-600/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-red-600/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6">

        {/* Branding */}
        <div className="text-center space-y-3">


          <div className="flex justify-center">

          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-widest text-white uppercase">TECHNOCERAM GROUP</h1>
            <p className="text-[10px] text-[#A1A1AA] uppercase tracking-[0.35em] mt-1">
               
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#121214] border border-slate-800 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-6 relative overflow-hidden">
          {/* Top red line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-[#FF1E1E] to-transparent" />

          <div>
            <h2 className="text-base font-semibold text-white">Authorized Sign-In</h2>
            <p className="text-xs text-[#A1A1AA] mt-1">
              Access is restricted. Identify yourself to decrypt records.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">

            {errorMessage && (
              <div className="p-3 bg-red-950/40 border border-red-900/40 rounded-xl text-xs text-red-400 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1 animate-ping" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider block">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  placeholder="name@luxestile.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full text-xs pl-10 pr-4 py-3 bg-[#18181B] border border-slate-800 focus:border-[#FF1E1E] text-white rounded-xl focus:outline-none transition-colors placeholder-slate-600"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full text-xs pl-10 pr-10 py-3 bg-[#18181B] border border-slate-800 focus:border-[#FF1E1E] text-white rounded-xl focus:outline-none transition-colors placeholder-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-linear-to-r from-red-500 via-[#FF1E1E] to-red-800 hover:brightness-110 active:scale-[0.99] text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            > LOGIN
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authorizing...</span>
                </>
              ) : (
                <span></span>
              )}
            </button>
          </form>


        </div>

      </div>
    </div>
  );
}