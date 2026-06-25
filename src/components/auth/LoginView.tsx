import React, { useState } from 'react';
import { useAuth } from '../../features/auth/useAuth';
import { INDIAN_CITIES } from '../../types';
import { 
  Sparkles, 
  MapPin, 
  Building2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  KeyRound, 
  Mail, 
  User, 
  ChevronRight, 
  Globe 
} from 'lucide-react';

export function LoginView() {
  const { 
    loginWithGoogle, 
    loginWithEmail, 
    signUpWithEmail, 
    loginAnonymously, 
    error, 
    loading, 
    clearError 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'guest'>('login');
  
  // Email/Password states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedCity, setSelectedCity] = useState('Mumbai');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleTabChange = (tab: 'login' | 'signup' | 'guest') => {
    setActiveTab(tab);
    setFormError(null);
    clearError();
  };

  const validateEmail = (input: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(input);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (activeTab === 'login') {
      if (!email || !password) {
        setFormError('Please enter both email and password.');
        return;
      }
      if (!validateEmail(email)) {
        setFormError('Please double-check your email syntax (e.g. user@domain.com).');
        return;
      }
      try {
        await loginWithEmail(email, password);
      } catch (err: any) {
        // Error is handled inside AuthProvider / useAuth
      }
    } else if (activeTab === 'signup') {
      if (!name.trim()) {
        setFormError('Citizenship record requires your full name.');
        return;
      }
      if (!email || !password) {
        setFormError('Email credentials and security password are mandatory.');
        return;
      }
      if (!validateEmail(email)) {
        setFormError('Please double-check your email format.');
        return;
      }
      if (password.length < 6) {
        setFormError('Safety standard: Password must be at least 6 characters.');
        return;
      }
      try {
        await signUpWithEmail(email, password, name.trim(), selectedCity);
      } catch (err: any) {
        // Error is handled inside AuthProvider / useAuth
      }
    } else if (activeTab === 'guest') {
      try {
        await loginAnonymously(selectedCity);
      } catch (err: any) {
        // Error state handled inside AuthProvider
      }
    }
  };

  // Inspiring Indian Quotes on Civic Responsibility
  const quotes = [
    { text: "Be the change that you wish to see in the world.", author: "Mahatma Gandhi" },
    { text: "Do your duty and be a hero to your community. India needs active, vigilant citizens.", author: "Dr. A.P.J. Abdul Kalam" },
    { text: "Cleanliness is next to Godliness. Let us build a Swachh Bharat, hand in hand.", author: "National Civic Motto" }
  ];

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center p-4 md:p-8 font-sans transition-all">
      <div className="max-w-5xl w-full bg-white rounded-3xl overflow-hidden shadow-xl border border-amber-900/10 flex flex-col md:flex-row antialiased">
        
        {/* LEFT COMPONENT - EMPOWERING CIVIC BANNER */}
        <div className="md:w-5/12 bg-gradient-to-br from-amber-600 via-amber-700 to-emerald-800 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-15" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1598977123418-45f04b615a52?auto=format&fit=crop&q=80&w=600')` }}></div>
          
          <div className="relative z-10">
            {/* National Citizen Logo Flag Design */}
            <div className="flex items-center gap-2 mb-8 bg-black/30 self-start py-1.5 px-3 rounded-full border border-white/10 w-fit">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-mono tracking-widest uppercase text-amber-200">National Civic Portal</span>
            </div>

            <div className="mt-8">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-widest block mb-1">Empowering Ward Guardians</span>
              <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
                Community Hero <br className="hidden md:inline" />of India
              </h1>
              <p className="text-white/80 text-xs mt-3 leading-relaxed max-w-sm">
                A unified citizen action gateway to flag local grievances, crowdsource resolutions, and lead municipal hygiene transformations across Indian neighborhoods.
              </p>
            </div>
          </div>

          {/* Citizen Quotes Rotate widget */}
          <div className="relative z-10 mt-12 bg-black/25 p-5 rounded-2xl border border-white/5">
            <p className="text-sm italic font-medium text-amber-100 leading-relaxed">
              "{quotes[1].text}"
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div className="h-[1px] w-4 bg-emerald-400"></div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300">
                {quotes[1].author}
              </span>
            </div>
          </div>

          <div className="relative z-10 text-[10px] text-white/50 font-mono mt-8 flex justify-between items-center">
            <span>PORTAL REQ: SECURE-AES-256</span>
            <span>v1.2.0-CRA</span>
          </div>
        </div>

        {/* RIGHT COMPONENT - PREMIUM SIGN-IN EXPERIENCE */}
        <div className="flex-1 p-6 md:p-12 flex flex-col justify-center bg-white">
          <div className="max-w-md w-full mx-auto space-y-6">
            
            {/* Header */}
            <div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs uppercase tracking-wide mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Join the Swachh Movement</span>
              </div>
              <h2 className="text-2xl font-display font-extrabold text-slate-800 tracking-tight">
                {activeTab === 'login' ? 'Citizen Authentication' : activeTab === 'signup' ? 'Enroll as a Hero' : 'Guest Exploration Terminal'}
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {activeTab === 'login' ? 'Access your civic workspace dashboard and view submitted files.' : 
                 activeTab === 'signup' ? 'Create a secure citizen credential profiles with your municipal city.' : 
                 'Gain snapshot view. Anonymous submissions are logged with limited ranking points.'}
              </p>
            </div>

            {/* TAB SELECTION SWITCHER */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
              <button 
                type="button"
                onClick={() => handleTabChange('login')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'login' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Sign In
              </button>
              <button 
                type="button"
                onClick={() => handleTabChange('signup')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'signup' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Sign Up
              </button>
              <button 
                type="button"
                onClick={() => handleTabChange('guest')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'guest' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Guest Mode
              </button>
            </div>

            {/* STATUS FEEDBACK BOXES */}
            {(error || formError) && (
              <div className="bg-red-50 border border-red-200/50 text-red-700 p-3.5 rounded-xl flex items-start gap-2.5 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block">Action Blocked</span>
                  <p className="leading-normal">{formError || error}</p>
                </div>
              </div>
            )}

            {/* MAIN FORM ENGINE */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'signup' && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input 
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Zahid Hamdule"
                      disabled={loading}
                      required
                      className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 focus:bg-white text-sm py-2.5 pl-10 pr-4 rounded-xl outline-none transition-all placeholder:text-slate-400 font-medium"
                    />
                  </div>
                </div>
              )}

              {activeTab !== 'guest' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="yourname@gmail.com"
                        disabled={loading}
                        required
                        className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 focus:bg-white text-sm py-2.5 pl-10 pr-4 rounded-xl outline-none transition-all placeholder:text-slate-400 font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Security Password</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input 
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        disabled={loading}
                        required
                        className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 focus:bg-white text-sm py-2.5 pl-10 pr-10 rounded-xl outline-none transition-all placeholder:text-slate-400 font-medium"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* CITY DROPDOWN (Shown on Signup or Guest configuration) */}
              {(activeTab === 'signup' || activeTab === 'guest') && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Default Municipal City</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      disabled={loading}
                      className="w-full bg-slate-50 appearance-none border border-slate-200 focus:border-amber-600 focus:bg-white text-sm py-2.5 pl-10 pr-4 rounded-xl outline-none transition-all font-medium"
                    >
                      {INDIAN_CITIES.map((city) => (
                        <option key={city.name} value={city.name}>{city.name} - {city.state}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* SUBMIT HERO ENTRY BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-amber-600/60 text-white font-semibold py-2.5 rounded-xl transition-all shadow-md shadow-amber-600/10 active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer mt-6 text-sm"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Enlisting Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {activeTab === 'login' ? 'Proceed with Identity' : activeTab === 'signup' ? 'Initiate Account Enrollment' : 'Open Temporary Desk'}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* ALTERNATIVE SSO OPTIONS (Only relevant for real Auth logins) */}
            {activeTab !== 'guest' && (
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-150"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-3.5 text-slate-400 font-medium">Or continue using National SSO</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={loginWithGoogle}
                  disabled={loading}
                  className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2.5 active:scale-98 shadow-xs cursor-pointer text-sm"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Authenticate with Google</span>
                </button>
              </div>
            )}

            {/* Decorative Footnote */}
            <div className="text-[10px] text-center text-slate-400 font-medium">
              We secure all citizen data locally. In compliance with the Swachh Bharat Initiative open standards database framework.
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
