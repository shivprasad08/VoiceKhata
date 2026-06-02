import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface TopBarProps {
  isConnected: boolean;
}

const TopBar: React.FC<TopBarProps> = ({ isConnected }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format to IST
  const timeString = time.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour12: true,
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div className="flex justify-between items-center py-4 px-6 bg-khata-card border-b border-khata-border">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            VoiceKhata
            <span className="text-xs bg-paytm-dark text-paytm-blue px-2 py-0.5 rounded-full border border-paytm-blue/30 tracking-normal font-medium">
              Powered by Sarvam AI
            </span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">Rajesh Kirana Store, Pune</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-xl font-mono font-medium text-white">{timeString} <span className="text-sm text-gray-500">IST</span></p>
          <p className="text-sm text-gray-400">{time.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium' })}</p>
        </div>

        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${isConnected ? 'bg-khata-green/10 text-khata-green border-khata-green/20' : 'bg-khata-red/10 text-khata-red border-khata-red/20'}`}>
          {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
          {isConnected ? 'Live' : 'Disconnected'}
        </div>
      </div>
    </div>
  );
};

export default TopBar;
