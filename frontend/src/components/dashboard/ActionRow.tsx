import React from 'react';
import { PlusCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import SoundboxListener from './SoundboxListener';

interface ActionRowProps {
  userId: number;
  onOpenManualEntry: () => void;
}

const ActionRow: React.FC<ActionRowProps> = ({ userId, onOpenManualEntry }) => {
  const handlePaymentDetected = async (amount: number) => {
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          type: 'sale',
          amount: amount,
          description: 'Soundbox Payment Received',
          source: 'soundbox',
          category: 'General',
          date: new Date().toISOString().split('T')[0]
        })
      });

      if (!response.ok) throw new Error("Failed to post");

      toast.success(`Paytm Soundbox: ₹${amount} mil gaye 🎉`, {
        icon: '🔊',
        style: {
          borderRadius: '12px',
          background: '#002970',
          color: '#fff',
          border: '1px solid #00BAF2'
        },
      });
    } catch (error) {
      toast.error("Failed to log Soundbox payment. Is backend running?");
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      
      {/* Soundbox Listener Component */}
      <SoundboxListener 
        isActive={true} 
        onPaymentDetected={handlePaymentDetected} 
      />

      {/* Manual Entry Quick Action */}
      <div className="bg-[#FFFFFF] border border-[#E8EBF0] rounded-2xl p-6 flex flex-col justify-center items-center text-center hover:shadow-paytm-hover transition-all cursor-pointer shadow-paytm group" onClick={onOpenManualEntry}>
        <div className="bg-[#00BAF2]-light p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
          <PlusCircle size={28} className="text-[#00BAF2]" />
        </div>
        <h3 className="text-xl font-bold text-[#101010] mb-1">Log Transaction</h3>
        <p className="text-sm text-[#707070] font-medium">Manually record a sale, expense, or udhar entry.</p>
      </div>
      
    </div>
  );
};

export default ActionRow;
