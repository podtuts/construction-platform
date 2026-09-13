import React, { useState } from 'react';
import { HardHat, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBranding } from '../../context/BrandingContext';

export const LoginView: React.FC = () => {
  const { login, isLoading } = useAuth();
  const { settings } = useBranding();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessNotice('');

    if (!username.trim()) {
      setErrorMessage('Please enter your username');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password');
      return;
    }

    try {
      await login(username.trim(), password, rememberMe);
      setSuccessNotice('Authentication successful. Loading workspace...');
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid username or password credentials');
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen w-full bg-[#0B0F14] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle background ambient mesh */}
      <div className="absolute w-[500px] h-[500px] bg-[#0090FF]/5 rounded-full blur-3xl pointer-events-none -top-40 -left-40" />
      <div className="absolute w-[400px] h-[400px] bg-[#8F5FE8]/5 rounded-full blur-3xl pointer-events-none -bottom-20 -right-20" />

      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          {/* Company Banner Image (uploaded by system superuser) */}
          {settings.loginBannerUrl && (
            <img
              src={settings.loginBannerUrl}
              alt="Company Banner"
              referrerPolicy="no-referrer"
              className="w-full h-40 object-cover rounded-[10px] border border-[#2A2E38] shadow-lg mb-4"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          )}

          <div className="inline-flex items-center justify-center w-14 h-14 rounded-[10px] bg-[#191C24] border border-[#2A2E38] shadow-lg mb-3">
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt="Logo"
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-[6px] object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <HardHat className="w-7 h-7 text-[#0090FF]" />
            )}
          </div>
          <h1 className="text-[24px] font-semibold text-white tracking-wide">
            {settings.companyName || 'ConstructPulse SaaS'}
          </h1>
          <p className="text-[13px] text-[#8D93A1] mt-1">
            Enterprise Construction Operations & Status Management
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#191C24] border border-[#2A2E38] rounded-[10px] p-8 shadow-xl">
          <h2 className="text-[18px] font-medium text-white mb-2">Sign In to Dashboard</h2>
          <p className="text-[12px] text-[#8D93A1] mb-6">
            Enter your credentials to access your site operations portal.
          </p>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-[6px] bg-[#FC424A]/10 border border-[#FC424A]/30 text-[#FC424A] text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successNotice && (
            <div className="mb-5 p-3 rounded-[6px] bg-[#00D25B]/10 border border-[#00D25B]/30 text-[#00D25B] text-xs flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div>
              <label className="block text-[12px] font-medium text-[#8D93A1] mb-1.5">
                Username (Case Insensitive)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#626875] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin, manager, or staff"
                  autoComplete="username"
                  className="w-full bg-[#20232C] border border-[#2A2E38] focus:border-[#0090FF] focus:outline-none text-white text-[13px] rounded-[6px] pl-9 pr-3 py-2.5 placeholder-[#626875] transition-colors"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-[12px] font-medium text-[#8D93A1] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#626875] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-[#20232C] border border-[#2A2E38] focus:border-[#0090FF] focus:outline-none text-white text-[13px] rounded-[6px] pl-9 pr-10 py-2.5 placeholder-[#626875] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#626875] hover:text-[#8D93A1]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 cursor-pointer text-[12px] text-[#8D93A1]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#20232C] border-[#2A2E38] text-[#0090FF] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <span>Remember me</span>
              </label>
              <span className="text-[11px] text-[#626875]">JWT 30-day session</span>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-[#0090FF] hover:bg-[#0080E0] text-white font-medium text-[13px] py-2.5 rounded-[6px] transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Quick Credential Test Switcher */}
          <div className="mt-8 pt-5 border-t border-[#2A2E38]">
            <p className="text-[11px] font-medium text-[#8D93A1] uppercase tracking-wider mb-2.5 text-center">
              One-Click Seeded Accounts
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'niceday1%')}
                className="bg-[#20232C] hover:bg-[#2A2E38] border border-[#8F5FE8]/30 text-left p-2 rounded-[6px] transition-colors"
              >
                <div className="text-[11px] font-semibold text-white">admin</div>
                <div className="text-[10px] text-[#8F5FE8]">superuser</div>
                <div className="text-[9px] text-[#626875] font-mono mt-0.5 truncate">niceday1%</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('manager', 'qwerty1%')}
                className="bg-[#20232C] hover:bg-[#2A2E38] border border-[#0090FF]/30 text-left p-2 rounded-[6px] transition-colors"
              >
                <div className="text-[11px] font-semibold text-white">manager</div>
                <div className="text-[10px] text-[#0090FF]">admin</div>
                <div className="text-[9px] text-[#626875] font-mono mt-0.5 truncate">qwerty1%</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('staff', 'abc123%')}
                className="bg-[#20232C] hover:bg-[#2A2E38] border border-[#00D25B]/30 text-left p-2 rounded-[6px] transition-colors"
              >
                <div className="text-[11px] font-semibold text-white">staff</div>
                <div className="text-[10px] text-[#00D25B]">user</div>
                <div className="text-[9px] text-[#626875] font-mono mt-0.5 truncate">abc123%</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-[#626875] mt-6">
          ConstructPulse Single-Service SaaS Architecture • Supabase & Node.js
        </p>
      </div>
    </div>
  );
};
