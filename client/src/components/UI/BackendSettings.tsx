import { useState } from 'react';
import { Settings, X, Server, Check, RotateCcw, AlertCircle } from 'lucide-react';
import {
  getRuntimeApiBase,
  setRuntimeApiBase,
  clearRuntimeApiBase,
  getApiBase
} from '../../config';

interface BackendSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BackendSettings({ isOpen, onClose }: BackendSettingsProps) {
  const currentRuntime = getRuntimeApiBase();
  const effectiveBase = getApiBase();
  const [inputUrl, setInputUrl] = useState(currentRuntime || effectiveBase || '');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    setError(null);
    const trimmed = inputUrl.trim();

    if (trimmed) {
      try {
        const parsed = new URL(trimmed);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          setError('URL must start with http:// or https://');
          return;
        }
      } catch {
        setError('Invalid URL format. Example: https://your-tunnel.trycloudflare.com');
        return;
      }
    }

    setRuntimeApiBase(trimmed);
    window.location.reload();
  };

  const handleReset = () => {
    clearRuntimeApiBase();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="pixel-card w-full max-w-md p-6 rounded-3xl shadow-2xl border border-white/10 text-white space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#a8c7fa]/10 text-[#a8c7fa] border border-[#a8c7fa]/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">Backend Connection</h3>
              <p className="text-xs text-white/50">Configure remote tunnel or local server URL</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white rounded-full hover:bg-white/10 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Status */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs space-y-1.5">
          <div className="flex justify-between text-white/60">
            <span>Active Origin:</span>
            <span className="font-mono text-white/80">{effectiveBase || 'Same-origin (relative /api)'}</span>
          </div>
          <div className="flex justify-between text-white/60">
            <span>Source:</span>
            <span className="font-medium text-[#6dd58c]">
              {currentRuntime ? 'Runtime Override (localStorage)' : effectiveBase ? 'Build-time (VITE_API_URL)' : 'Default (Local Host)'}
            </span>
          </div>
        </div>

        {/* URL Input */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-white/80 block">
            Remote Server / Tunnel URL
          </label>
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => {
              setInputUrl(e.target.value);
              if (error) setError(null);
            }}
            placeholder="https://xyz.trycloudflare.com or http://192.168.1.50:3000"
            className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#a8c7fa] font-mono transition"
          />
          <p className="text-[11px] text-white/40">
            Paste your Cloudflare tunnel or LAN server address. The app will update REST calls and WebSockets automatically.
          </p>
          {error && (
            <div className="flex items-center gap-1.5 text-xs text-rose-400 mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 rounded-2xl text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 border border-white/10 transition flex items-center gap-1.5"
            title="Clear override and use default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Default
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl text-xs font-medium text-white/70 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-2xl text-xs font-semibold bg-[#a8c7fa] text-slate-950 hover:bg-[#a8c7fa]/90 transition shadow-lg flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Save & Reload
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SettingsButton({ onClick }: { onClick: () => void }) {
  const hasOverride = Boolean(getRuntimeApiBase());
  return (
    <button
      onClick={onClick}
      className={`pixel-card p-3 rounded-full shadow-2xl transition-all border ${
        hasOverride
          ? 'bg-[#a8c7fa]/20 text-[#a8c7fa] border-[#a8c7fa]'
          : 'text-white border-white/10 hover:text-[#a8c7fa]'
      }`}
      title={hasOverride ? 'Backend URL: Custom Override Active' : 'Configure Backend Connection'}
      aria-label="Backend Connection Settings"
    >
      <Settings className="w-4 h-4" />
    </button>
  );
}
