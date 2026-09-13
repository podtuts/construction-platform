import React, { useState } from 'react';
import { Settings, Image, CheckCircle, Sparkles, Building, Globe, Mail, DollarSign, Database, Server, Upload, X } from 'lucide-react';
import { useBranding } from '../../context/BrandingContext';
import { useAuth } from '../../context/AuthContext';
import { fileToDataUri } from '../../services/upload';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings } = useBranding();
  const { user } = useAuth();

  const [companyName, setCompanyName] = useState(settings.companyName);
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl);
  const [faviconUrl, setFaviconUrl] = useState(settings.faviconUrl);
  const [contactEmail, setContactEmail] = useState(settings.contactEmail);
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol || '₱');
  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor || '#0090FF');
  const [loginBannerUrl, setLoginBannerUrl] = useState(settings.loginBannerUrl || '');
  const [dashboardBannerUrl, setDashboardBannerUrl] = useState(settings.dashboardBannerUrl || '');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  const presetLogos = [
    {
      label: 'Steel Frame Modern',
      url: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?w=128&auto=format&fit=crop&q=80'
    },
    {
      label: 'Tower Crane Industrial',
      url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=128&auto=format&fit=crop&q=80'
    },
    {
      label: 'Blueprint Minimalist',
      url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=128&auto=format&fit=crop&q=80'
    },
    {
      label: 'Heavy Excavator Gold',
      url: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=128&auto=format&fit=crop&q=80'
    }
  ];

  const presetFavicons = [
    {
      label: 'Cyan Hard Hat SVG',
      url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%230090FF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z"/><path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5"/><path d="M4 15v-3a8 8 0 0 1 16 0v3"/></svg>'
    },
    {
      label: 'Emerald Structure SVG',
      url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%2300D25B" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>'
    },
    {
      label: 'Amber Tower SVG',
      url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23FFAB00" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/></svg>'
    }
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError('');

    try {
      await updateSettings({
        companyName: companyName.trim(),
        logoUrl: logoUrl.trim(),
        faviconUrl: faviconUrl.trim(),
        loginBannerUrl: loginBannerUrl.trim(),
        dashboardBannerUrl: dashboardBannerUrl.trim(),
        contactEmail: contactEmail.trim(),
        currencySymbol: currencySymbol.trim(),
        primaryColor
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update company branding settings');
    } finally {
      setIsSaving(false);
    }
  };

  const canEdit = user?.role === 'superuser';

  // Reads an uploaded image file and stores it as a base64 data URI in the form state
  const handleFileSelect =
    (setter: (value: string) => void) =>
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const dataUri = await fileToDataUri(file);
        setter(dataUri);
        setSaveSuccess(false);
        setSaveError('');
      } catch (err: any) {
        setSaveError(err.message || 'Failed to read the selected image file');
      } finally {
        e.target.value = '';
      }
    };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-[20px] font-medium text-white tracking-tight flex items-center">
          <Settings className="w-5 h-5 mr-2 text-[#0090FF]" />
          Company Branding & System Settings
        </h2>
        <p className="text-[13px] text-[#8D93A1] mt-0.5">
          Customize your enterprise company name, header logo, browser favicon, and deployment details
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-[6px] bg-[#00D25B]/10 border border-[#00D25B]/30 text-[#00D25B] text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4" />
          <span>Company settings, logo, and dynamic favicon updated successfully!</span>
        </div>
      )}

      {saveError && (
        <div className="p-3 rounded-[6px] bg-[#FC424A]/10 border border-[#FC424A]/30 text-[#FC424A] text-xs">
          {saveError}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Core Company Branding Card */}
        <div className="bg-[#191C24] border border-[#2A2E38] rounded-[8px] p-6 space-y-5">
          <h3 className="text-[15px] font-medium text-white flex items-center">
            <Building className="w-4 h-4 text-[#0090FF] mr-2" />
            Company Identity & Name
          </h3>

          <div>
            <label className="block text-xs font-medium text-[#8D93A1] mb-1.5">Company Name</label>
            <input
              type="text"
              value={companyName}
              disabled={!canEdit}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. ApexBuild Construction & Engineering SaaS"
              required
              className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF] disabled:opacity-50"
            />
            <p className="text-[11px] text-[#626875] mt-1">
              Reflected immediately across the sidebar brand header, login portal, and document titles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#8D93A1] mb-1.5">Official Operations Email</label>
              <input
                type="email"
                value={contactEmail}
                disabled={!canEdit}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="operations@constructpulse.com"
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF] disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8D93A1] mb-1.5">Currency Symbol</label>
              <input
                type="text"
                value={currencySymbol}
                disabled={!canEdit}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                placeholder="₱ (PHP) or $ (USD)"
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF] disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* 2. Logo & Visual Assets Card */}
        <div className="bg-[#191C24] border border-[#2A2E38] rounded-[8px] p-6 space-y-5">
          <h3 className="text-[15px] font-medium text-white flex items-center">
            <Image className="w-4 h-4 text-[#0090FF] mr-2" />
            Company Logo & Favicon
          </h3>

          {/* Logo URL and preview */}
          <div>
            <label className="block text-xs font-medium text-[#8D93A1] mb-1.5">Company Logo (URL or Upload New Image)</label>
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={logoUrl}
                disabled={!canEdit}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-... or data:image/..."
                className="flex-1 bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF] disabled:opacity-50"
              />
              <div className="w-10 h-10 rounded-[6px] bg-[#20232C] border border-[#2A2E38] flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src={logoUrl}
                  alt="Preview"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                />
              </div>
            </div>

            {canEdit && (
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center px-3 py-1.5 rounded-[4px] bg-[#0090FF]/10 hover:bg-[#0090FF]/20 border border-[#0090FF]/30 text-[11px] text-[#0090FF] hover:text-white cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  <span>Upload New Logo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect(setLogoUrl)} />
                </label>
                <span className="text-[11px] text-[#626875]">PNG, JPG, or SVG up to 5MB</span>
              </div>
            )}

            {canEdit && (
              <div className="mt-2.5">
                <span className="text-[11px] text-[#626875] block mb-1.5">Quick Select Preset Logo:</span>
                <div className="flex flex-wrap gap-2">
                  {presetLogos.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setLogoUrl(preset.url)}
                      className="px-2.5 py-1 rounded-[4px] bg-[#20232C] hover:bg-[#2A2E38] border border-[#2A2E38] text-[11px] text-[#8D93A1] hover:text-white transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Favicon URL and preview */}
          <div className="pt-2 border-t border-[#2A2E38]/60">
            <label className="block text-xs font-medium text-[#8D93A1] mb-1.5">
              Browser Favicon (URL or SVG Data URI)
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={faviconUrl}
                disabled={!canEdit}
                onChange={(e) => setFaviconUrl(e.target.value)}
                placeholder="data:image/svg+xml,... or https://.../favicon.ico"
                className="flex-1 bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF] disabled:opacity-50 font-mono"
              />
              <div className="w-10 h-10 rounded-[6px] bg-[#20232C] border border-[#2A2E38] flex items-center justify-center p-2 shrink-0">
                <img
                  src={faviconUrl}
                  alt="Favicon"
                  className="w-5 h-5 object-contain"
                  onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                />
              </div>
            </div>

            {canEdit && (
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center px-3 py-1.5 rounded-[4px] bg-[#0090FF]/10 hover:bg-[#0090FF]/20 border border-[#0090FF]/30 text-[11px] text-[#0090FF] hover:text-white cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  <span>Upload New Favicon</span>
                  <input type="file" accept="image/png,image/x-icon,image/svg+xml,image/*" className="hidden" onChange={handleFileSelect(setFaviconUrl)} />
                </label>
                <span className="text-[11px] text-[#626875]">PNG, ICO, or SVG up to 5MB</span>
              </div>
            )}

            {canEdit && (
              <div className="mt-2.5">
                <span className="text-[11px] text-[#626875] block mb-1.5">Preset Favicon Icons:</span>
                <div className="flex flex-wrap gap-2">
                  {presetFavicons.map((fav) => (
                    <button
                      key={fav.label}
                      type="button"
                      onClick={() => setFaviconUrl(fav.url)}
                      className="px-2.5 py-1 rounded-[4px] bg-[#20232C] hover:bg-[#2A2E38] border border-[#2A2E38] text-[11px] text-[#8D93A1] hover:text-white transition-colors"
                    >
                      {fav.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. Site Banners Across the Portal */}
        <div className="bg-[#191C24] border border-[#2A2E38] rounded-[8px] p-6 space-y-5">
          <h3 className="text-[15px] font-medium text-white flex items-center">
            <Sparkles className="w-4 h-4 text-[#0090FF] mr-2" />
            Site Banners & Portal Imagery
          </h3>
          <p className="text-[11px] text-[#626875] leading-relaxed">
            Upload wide-format banner images displayed across the portal — the Login Page banner and the Dashboard hero banner.
          </p>

          {/* Login Page Banner */}
          <div>
            <label className="block text-xs font-medium text-[#8D93A1] mb-1.5">Login Page Banner (URL or Upload New Image)</label>
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={loginBannerUrl}
                disabled={!canEdit}
                onChange={(e) => setLoginBannerUrl(e.target.value)}
                placeholder="https://... or data:image/..."
                className="flex-1 bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF] disabled:opacity-50"
              />
              {loginBannerUrl && (
                <button
                  type="button"
                  onClick={() => setLoginBannerUrl('')}
                  title="Remove banner"
                  className="p-1.5 rounded-[4px] bg-[#20232C] hover:bg-[#FC424A]/20 text-[#8D93A1] hover:text-[#FC424A] border border-[#2A2E38] transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {canEdit && (
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center px-3 py-1.5 rounded-[4px] bg-[#0090FF]/10 hover:bg-[#0090FF]/20 border border-[#0090FF]/30 text-[11px] text-[#0090FF] hover:text-white cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  <span>Upload Login Banner</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect(setLoginBannerUrl)} />
                </label>
                <span className="text-[11px] text-[#626875]">Recommended: 1200 × 400 px, up to 5MB</span>
              </div>
            )}

            {loginBannerUrl && (
              <div className="mt-2.5">
                <img
                  src={loginBannerUrl}
                  alt="Login banner preview"
                  referrerPolicy="no-referrer"
                  className="w-full max-h-24 object-cover rounded-[6px] border border-[#2A2E38]"
                  onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                />
              </div>
            )}
          </div>

          {/* Dashboard Hero Banner */}
          <div className="pt-2 border-t border-[#2A2E38]/60">
            <label className="block text-xs font-medium text-[#8D93A1] mb-1.5">Dashboard Hero Banner (URL or Upload New Image)</label>
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={dashboardBannerUrl}
                disabled={!canEdit}
                onChange={(e) => setDashboardBannerUrl(e.target.value)}
                placeholder="https://... or data:image/..."
                className="flex-1 bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF] disabled:opacity-50"
              />
              {dashboardBannerUrl && (
                <button
                  type="button"
                  onClick={() => setDashboardBannerUrl('')}
                  title="Remove banner"
                  className="p-1.5 rounded-[4px] bg-[#20232C] hover:bg-[#FC424A]/20 text-[#8D93A1] hover:text-[#FC424A] border border-[#2A2E38] transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {canEdit && (
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center px-3 py-1.5 rounded-[4px] bg-[#0090FF]/10 hover:bg-[#0090FF]/20 border border-[#0090FF]/30 text-[11px] text-[#0090FF] hover:text-white cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  <span>Upload Dashboard Banner</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect(setDashboardBannerUrl)} />
                </label>
                <span className="text-[11px] text-[#626875]">Recommended: 1600 × 500 px, up to 5MB</span>
              </div>
            )}

            {dashboardBannerUrl && (
              <div className="mt-2.5">
                <img
                  src={dashboardBannerUrl}
                  alt="Dashboard banner preview"
                  referrerPolicy="no-referrer"
                  className="w-full max-h-24 object-cover rounded-[6px] border border-[#2A2E38]"
                  onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                />
              </div>
            )}
          </div>
        </div>

        {/* 4. Architecture & Cloud Status */}
        <div className="bg-[#191C24] border border-[#2A2E38] rounded-[8px] p-6 space-y-4">
          <h3 className="text-[15px] font-medium text-white flex items-center">
            <Server className="w-4 h-4 text-[#00D25B] mr-2" />
            Single Web Service & Supabase Infrastructure
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-[6px] bg-[#20232C] border border-[#2A2E38]">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-white">Unified Web Service</span>
                <span className="text-[#00D25B] font-mono">PORT 3000 ACTIVE</span>
              </div>
              <p className="text-[#8D93A1] text-[11px] leading-relaxed">
                Node.js + Express backend serving both REST API endpoints (`/api/*`) and bundled Vite frontend from a single web domain.
              </p>
            </div>

            <div className="p-3.5 rounded-[6px] bg-[#20232C] border border-[#2A2E38]">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-white">Database Engine</span>
                <span className="text-[#0090FF] font-mono">SUPABASE COMPLIANT</span>
              </div>
              <p className="text-[#8D93A1] text-[11px] leading-relaxed">
                PostgreSQL schema loaded with automatic fallback JSON storage engine (`database/db.ts`) with zero downtime.
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        {canEdit && (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-[#0090FF] hover:bg-[#0080E0] text-white text-xs font-medium rounded-[6px] transition-colors shadow-sm disabled:opacity-50 flex items-center space-x-2"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Save Company Branding</span>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
