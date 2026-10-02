import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { API_BASE } from '../../config';

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/health`, { timeout: 3000 } as any);
        setIsOnline(res.ok);
      } catch (e) {
        setIsOnline(false);
      }
    };
    
    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  if (isOnline) return null;

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
      <WifiOff size={18} />
      <span className="text-sm font-semibold">Backend Offline</span>
    </div>
  );
}
