import React from 'react';
import { format } from 'date-fns';
import { ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';

export interface FeedTransaction {
  id: string;
  type: 'sale' | 'expense' | 'udhar';
  description: string;
  amount: number;
  date: string;
  created_at?: string;
  isNew?: boolean;
}

interface LiveFeedProps {
  transactions: FeedTransaction[];
}

const LiveFeed: React.FC<LiveFeedProps> = ({ transactions }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#E8EBF0] rounded-2xl flex flex-col h-[400px] shadow-paytm">
      <div className="px-6 py-5 border-b border-[#E8EBF0] flex justify-between items-center bg-[#FFFFFF] rounded-t-2xl z-10 sticky top-0">
        <h2 className="text-xl font-bold text-[#101010]">Live Transaction Feed</h2>
        <div className="flex items-center gap-2 text-xs font-medium text-[#707070] bg-[#F5F8FA] px-3 py-1.5 rounded-full border border-[#E8EBF0]">
          <span className="relative flex h-2 w-2">
            <span className="animate-pulse-blue absolute inline-flex h-full w-full rounded-full bg-[#00BAF2] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00BAF2]"></span>
          </span>
          Auto-updating
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
        <div className="flex flex-col gap-2">
          {transactions.map((txn) => {
            const isSale = txn.type === 'sale';
            const isExpense = txn.type === 'expense';
            
            return (
              <div 
                key={txn.id} 
                className={`flex items-center justify-between p-4 rounded-xl border border-transparent hover:bg-[#F5F8FA] transition-colors cursor-pointer ${txn.isNew ? 'animate-slide-in bg-[#00BAF2]-light border-[#00BAF2]/20' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-full ${isSale ? 'bg-green-100 text-khata-green' : isExpense ? 'bg-red-100 text-khata-red' : 'bg-yellow-100 text-yellow-600'}`}>
                    {isSale ? <ArrowUpRight size={18} /> : isExpense ? <ArrowDownLeft size={18} /> : <Clock size={18} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#101010]">
                      {txn.description || (isSale ? 'Cash Sale' : isExpense ? 'Expense' : 'Udhar given')}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-medium text-[#707070]">
                        {txn.created_at ? format(new Date(txn.created_at), 'h:mm a') : 'Just now'}
                      </span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${isSale ? 'text-khata-green bg-green-50' : isExpense ? 'text-khata-red bg-red-50' : 'text-yellow-600 bg-yellow-50'}`}>
                        {txn.type}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className={`font-mono font-bold text-lg ${isSale ? 'text-khata-green' : isExpense ? 'text-[#101010]' : 'text-yellow-600'}`}>
                  {isSale ? '+' : '-'}{formatCurrency(txn.amount)}
                </div>
              </div>
            );
          })}
          
          {transactions.length === 0 && (
            <div className="text-center py-12 text-[#707070] font-medium text-sm">
              <div className="bg-[#F5F8FA] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock size={24} className="text-gray-400" />
              </div>
              No transactions today.<br/>Waiting for live updates...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveFeed;
