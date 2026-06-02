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
    <div className="bg-khata-card border border-khata-border rounded-xl flex flex-col h-[400px]">
      <div className="px-5 py-4 border-b border-khata-border flex justify-between items-center bg-khata-card rounded-t-xl z-10 sticky top-0">
        <h2 className="text-lg font-semibold text-white">Live Transaction Feed</h2>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-khata-green opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-khata-green"></span>
          </span>
          Auto-updating
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        <div className="flex flex-col gap-2">
          {transactions.map((txn) => {
            const isSale = txn.type === 'sale';
            const isExpense = txn.type === 'expense';
            
            return (
              <div 
                key={txn.id} 
                className={`flex items-center justify-between p-3 rounded-lg border border-transparent hover:bg-gray-800/50 transition-colors ${txn.isNew ? 'animate-slide-in bg-paytm-blue/5 border-paytm-blue/20' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${isSale ? 'bg-khata-green/10 text-khata-green' : isExpense ? 'bg-khata-red/10 text-khata-red' : 'bg-yellow-500/10 text-yellow-500'}`}>
                    {isSale ? <ArrowUpRight size={16} /> : isExpense ? <ArrowDownLeft size={16} /> : <Clock size={16} />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-200">
                      {txn.description || (isSale ? 'Cash Sale' : isExpense ? 'Expense' : 'Udhar given')}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500">
                        {txn.created_at ? format(new Date(txn.created_at), 'HH:mm:ss') : 'Just now'}
                      </span>
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${isSale ? 'text-khata-green bg-khata-green/10' : isExpense ? 'text-khata-red bg-khata-red/10' : 'text-yellow-500 bg-yellow-500/10'}`}>
                        {txn.type}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className={`font-mono font-bold text-base ${isSale ? 'text-khata-green' : isExpense ? 'text-khata-red' : 'text-yellow-500'}`}>
                  {isSale ? '+' : '-'}{formatCurrency(txn.amount)}
                </div>
              </div>
            );
          })}
          
          {transactions.length === 0 && (
            <div className="text-center py-10 text-gray-500 text-sm">
              No transactions today. Waiting for live updates...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveFeed;
