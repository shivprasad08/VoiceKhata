import React from 'react';
import { TrendingUp, TrendingDown, IndianRupee, ShieldCheck } from 'lucide-react';
import { CryptoCard } from '@/components/ui/crypto-card';

interface KPICardsProps {
  sales: number;
  expenses: number;
  profit: number;
  gstCredit: number;
  ySales?: number;
  yExpenses?: number;
  yProfit?: number;
  yGst?: number;
  // Kept for backwards compatibility with Dashboard state but ignored
  salesChange?: number;
  expensesChange?: number;
  profitChange?: number;
  gstChange?: number;
}

const KPICards: React.FC<KPICardsProps> = ({
  sales, expenses, profit, gstCredit,
  ySales = 0, yExpenses = 0, yProfit = 0, yGst = 0
}) => {

  const calcChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : (current < 0 ? -100 : 0);
    return ((current - previous) / Math.abs(previous)) * 100;
  };

  const currentSalesChange = calcChange(sales, ySales);
  const currentExpensesChange = calcChange(expenses, yExpenses);
  const currentProfitChange = calcChange(profit, yProfit);
  const currentGstChange = calcChange(gstCredit, yGst);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      <CryptoCard
        icon={<TrendingUp size={18} className="text-white" />}
        name="Today's Sales"
        ticker="INR"
        percentageChange={currentSalesChange}
        currentPrice={ySales}
        portfolioValue={sales}
        portfolioChange={sales - ySales}
        leverage={1}
        colorClass="bg-green-600"
      />
      <CryptoCard
        icon={<TrendingDown size={18} className="text-white" />}
        name="Today's Expenses"
        ticker="INR"
        percentageChange={currentExpensesChange}
        currentPrice={yExpenses}
        portfolioValue={expenses}
        portfolioChange={expenses - yExpenses}
        leverage={1}
        colorClass="bg-red-500"
      />
      <CryptoCard
        icon={<IndianRupee size={18} className="text-white" />}
        name="Today's Profit"
        ticker="INR"
        percentageChange={currentProfitChange}
        currentPrice={yProfit}
        portfolioValue={profit}
        portfolioChange={profit - yProfit}
        leverage={1}
        colorClass="bg-blue-500"
      />
      <CryptoCard
        icon={<ShieldCheck size={18} className="text-white" />}
        name="GST Input Credit"
        ticker="INR"
        percentageChange={currentGstChange}
        currentPrice={yGst}
        portfolioValue={gstCredit}
        portfolioChange={gstCredit - yGst}
        leverage={1}
        colorClass="bg-yellow-500"
      />
    </div>
  );
};

export default KPICards;
