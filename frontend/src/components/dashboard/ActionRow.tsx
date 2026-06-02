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
          borderRadius: '10px',
          background: '#002E6E',
          color: '#fff',
          border: '1px solid #00B9F1'
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
      <div className="bg-khata-card border border-khata-border rounded-xl p-5 flex flex-col justify-center items-center text-center hover:border-gray-600 transition-colors cursor-pointer" onClick={onOpenManualEntry}>
        <div className="bg-gray-800 p-3 rounded-full mb-3">
          <PlusCircle size={24} className="text-gray-300" />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">Log Transaction</h3>
        <p className="text-sm text-gray-400">Manually record a sale, expense, or udhar entry.</p>
      </div>
      
    </div>
  );
};

export default ActionRow;
