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
    <div className="flex justify-between items-center py-4 px-6 bg-white border-b border-[#E8EBF0] shadow-paytm-header sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#002970] tracking-tight flex items-center gap-2">
            <span className="text-[#00BAF2]">Voice</span>Khata
            <span className="text-[10px] bg-[#00BAF2]-light text-[#002970] px-2 py-0.5 rounded-full font-bold">
              Powered by Sarvam AI
            </span>
          </h1>
          <p className="text-sm text-[#707070] mt-1 font-medium">Rajesh Kirana Store, Pune</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-xl font-mono font-bold text-[#101010]">{timeString} <span className="text-sm text-[#707070]">IST</span></p>
          <p className="text-sm text-[#707070] font-medium">{time.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium' })}</p>
        </div>

        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold shadow-sm ${isConnected ? 'bg-[#002970] text-white' : 'bg-khata-red text-white'}`}>
          {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
          {isConnected ? 'Live' : 'Disconnected'}
        </div>
      </div>
    </div>
  );
};

export default TopBar;
