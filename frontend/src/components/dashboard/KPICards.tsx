import React from 'react';
import { TrendingUp, TrendingDown, IndianRupee, ShieldCheck } from 'lucide-react';

interface KPICardsProps {
  sales: number;
  expenses: number;
  profit: number;
  gstCredit: number;
}

const KPICards: React.FC<KPICardsProps> = ({ sales, expenses, profit, gstCredit }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-khata-card border border-khata-border rounded-xl p-5 shadow-sm">
        <div className="flex justify-between items-start mb-2">
          <p className="text-sm font-medium text-gray-400">Today's Sales</p>
          <div className="bg-khata-green/10 p-2 rounded-lg">
            <TrendingUp size={18} className="text-khata-green" />
          </div>
        </div>
        <p className="text-3xl font-mono font-bold text-khata-green">{formatCurrency(sales)}</p>
      </div>

      <div className="bg-khata-card border border-khata-border rounded-xl p-5 shadow-sm">
        <div className="flex justify-between items-start mb-2">
          <p className="text-sm font-medium text-gray-400">Today's Expenses</p>
          <div className="bg-khata-red/10 p-2 rounded-lg">
            <TrendingDown size={18} className="text-khata-red" />
          </div>
        </div>
        <p className="text-3xl font-mono font-bold text-khata-red">{formatCurrency(expenses)}</p>
      </div>

      <div className="bg-khata-card border border-khata-border rounded-xl p-5 shadow-sm">
        <div className="flex justify-between items-start mb-2">
          <p className="text-sm font-medium text-gray-400">Today's Profit</p>
          <div className="bg-khata-green/10 p-2 rounded-lg">
            <IndianRupee size={18} className="text-khata-green" />
          </div>
        </div>
        <p className="text-3xl font-mono font-bold text-white">{formatCurrency(profit)}</p>
      </div>

      <div className="bg-khata-card border border-paytm-blue/30 rounded-xl p-5 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-paytm-blue/10 blur-2xl rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="flex justify-between items-start mb-2 relative z-10">
          <p className="text-sm font-medium text-gray-400">GST Input Credit</p>
          <div className="bg-paytm-blue/10 p-2 rounded-lg">
            <ShieldCheck size={18} className="text-paytm-blue" />
          </div>
        </div>
        <p className="text-3xl font-mono font-bold text-paytm-blue relative z-10">{formatCurrency(gstCredit)}</p>
        <p className="text-xs text-paytm-blue mt-1 font-medium relative z-10">Claimable</p>
      </div>
    </div>
  );
};

export default KPICards;
