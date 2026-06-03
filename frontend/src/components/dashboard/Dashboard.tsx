import React, { useState, useEffect } from 'react';
import TopBar from './TopBar';
import KPICards from './KPICards';
import LiveFeed from './LiveFeed';
import type { FeedTransaction } from './LiveFeed';
import { DonutChart, WeeklyTrendLine, TopExpensesBar } from './Charts';
import UdharTable from './UdharTable';
import type { UdharEntry } from './UdharTable';
import ActionRow from './ActionRow';
import AIAdvisor from '../AIAdvisor';
import { useWebSocket } from '../../hooks/useWebSocket';
import { format, subDays } from 'date-fns';

const USER_ID = 1;

interface DashboardProps {
  onOpenManualEntry: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onOpenManualEntry }) => {
  // Websocket connection (relative path for Vite proxy)
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const { isConnected, lastMessage } = useWebSocket(`${protocol}//${window.location.host}/ws/transactions/${USER_ID}`);

  // Data State
  const [liveFeed, setLiveFeed] = useState<FeedTransaction[]>([]);
  const [kpi, setKpi] = useState({ 
    sales: 0, expenses: 0, profit: 0, gstCredit: 0,
    salesChange: 0, expensesChange: 0, profitChange: 0, gstChange: 0,
    ySales: 0, yExpenses: 0, yProfit: 0, yGst: 0
  });
  const [donutData, setDonutData] = useState({ sales: 0, expenses: 0, udhar: 0 });
  const [trendData, setTrendData] = useState<any[]>([]);
  const [topExpenses, setTopExpenses] = useState<any[]>([]);
  const [udharData, setUdharData] = useState<UdharEntry[]>([]);
  const [totalUdhar, setTotalUdhar] = useState(0);

  // Initial Data Fetch
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // We'd ideally fetch these from real endpoints. Using mock/structure based on our built API
        
        // 1. Fetch Today's Summary
        const todayRes = await fetch(`/api/summary/today?user_id=${USER_ID}`);
        if (todayRes.ok) {
          const todayData = await todayRes.json();
          setKpi(prev => ({ 
            ...prev, 
            sales: todayData.total_sales, 
            expenses: todayData.total_expenses, 
            profit: todayData.profit,
            salesChange: todayData.sales_change,
            expensesChange: todayData.expenses_change,
            profitChange: todayData.profit_change,
            ySales: todayData.y_sales,
            yExpenses: todayData.y_expenses,
            yProfit: todayData.y_profit
          }));
          setDonutData(prev => ({ ...prev, sales: todayData.total_sales, expenses: todayData.total_expenses }));
        }

        // 2. Fetch Monthly for Category Breakdown and GST
        const monthlyRes = await fetch(`/api/summary/monthly?user_id=${USER_ID}`);
        if (monthlyRes.ok) {
          const monthlyData = await monthlyRes.json();
          setKpi(prev => ({ 
            ...prev, 
            gstCredit: monthlyData.gst_summary.total_gst_paid,
            gstChange: monthlyData.gst_summary.gst_change,
            yGst: monthlyData.gst_summary.y_itc
          }));
          setTopExpenses(monthlyData.category_breakdown.sort((a:any, b:any) => b.amount - a.amount).slice(0, 5));
        }

        // 3. Fetch Weekly Trend
        const weeklyRes = await fetch(`/api/summary/weekly?user_id=${USER_ID}`);
        if (weeklyRes.ok) {
          const weeklyData = await weeklyRes.json();
          const formattedTrend = weeklyData.daily_breakdown.map((d: any) => ({
            date: format(new Date(d.date), 'dd MMM'),
            sales: d.sales,
            expenses: d.expenses
          }));
          setTrendData(formattedTrend);
        }

        // 4. Fetch Recent Transactions for Live Feed
        const txnsRes = await fetch(`/api/transactions?user_id=${USER_ID}`);
        if (txnsRes.ok) {
          const txnsData = await txnsRes.json();
          // Map to feed format
          const mappedFeed = txnsData.slice(0, 50).map((t: any) => ({
            id: t.id,
            type: t.type,
            description: t.description,
            amount: t.amount,
            date: t.date,
            created_at: t.created_at,
            isNew: false
          }));
          setLiveFeed(mappedFeed);
          
          // Compute total udhar from txns (if we don't have a dedicated endpoint yet)
          const udhars = txnsData.filter((t:any) => t.type === 'udhar');
          const udharSum = udhars.reduce((acc: number, t:any) => acc + parseFloat(t.amount), 0);
          setDonutData(prev => ({ ...prev, udhar: udharSum }));
        }

        // Note: For Udhar table, we need to fetch from the actual Udhar table, but our endpoints currently only expose Transactions ledger.
        // We will use mock data for the Udhar Table for the demo if there's no endpoint.
        setUdharData([
          { id: '1', customer_name: 'Rahul Sharma', amount: 4500, due_date: format(subDays(new Date(), 2), 'yyyy-MM-dd'), status: 'pending' },
          { id: '2', customer_name: 'Anita Verma', amount: 1200, due_date: format(new Date(), 'yyyy-MM-dd'), status: 'pending' },
          { id: '3', customer_name: 'Vikas Traders', amount: 8500, due_date: '2026-06-10', status: 'pending' },
          { id: '4', customer_name: 'Suresh Kirana', amount: 300, due_date: '2026-05-20', status: 'settled' },
        ]);
        setTotalUdhar(14200);

      } catch (error) {
        console.error("Failed to fetch dashboard data. Make sure backend is running.", error);
      }
    };

    fetchDashboardData();
  }, []);

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage && lastMessage.event === 'transaction_created') {
      const newTxn = lastMessage.data;
      
      // 1. Add to live feed with animation flag
      const feedTxn: FeedTransaction = {
        id: newTxn.id,
        type: newTxn.type,
        amount: newTxn.amount,
        description: newTxn.description || (newTxn.type === 'sale' ? 'Sale Entry' : 'Expense'),
        date: newTxn.date,
        isNew: true
      };
      
      setLiveFeed(prev => [feedTxn, ...prev].slice(0, 50));
      
      // 2. Update KPIs if it's today
      const amount = parseFloat(newTxn.amount);
      if (newTxn.type === 'sale') {
        setKpi(prev => ({ ...prev, sales: prev.sales + amount, profit: prev.profit + amount }));
        setDonutData(prev => ({ ...prev, sales: prev.sales + amount }));
      } else if (newTxn.type === 'expense') {
        setKpi(prev => ({ ...prev, expenses: prev.expenses + amount, profit: prev.profit - amount }));
        setDonutData(prev => ({ ...prev, expenses: prev.expenses + amount }));
      }
      
      // Remove the 'isNew' flag after animation completes (approx 2s)
      setTimeout(() => {
        setLiveFeed(current => 
          current.map(t => t.id === newTxn.id ? { ...t, isNew: false } : t)
        );
      }, 2000);
    }
  }, [lastMessage]);

  return (
    <div className="min-h-screen bg-[#F5F8FA] text-[#101010] pb-10 font-sans">
      <TopBar isConnected={isConnected} />
      
      <div className="flex flex-col xl:flex-row px-4 lg:px-6 py-6 max-w-[1800px] mx-auto gap-6 items-start">
        
        {/* Main Left Content */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          {/* Row 1: KPI Cards */}
          <KPICards {...kpi} />

          {/* Row 2: Actions (Demo Tools) */}
          <ActionRow userId={USER_ID} onOpenManualEntry={onOpenManualEntry} />

          {/* Row 3: Trend & Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WeeklyTrendLine data={trendData} />
            <DonutChart {...donutData} />
          </div>

          {/* Row 4: Live Feed */}
          <div>
            <LiveFeed transactions={liveFeed} />
          </div>

          {/* Row 5: Top Expenses */}
          <div>
            <TopExpensesBar data={topExpenses} />
          </div>

          {/* Row 6: Udhar Summary */}
          <div>
            <UdharTable data={udharData} totalOutstanding={totalUdhar} />
          </div>
        </div>

        {/* Right Sidebar Area: AI Advisor */}
        <div className="w-full xl:w-[400px] shrink-0 xl:sticky xl:top-6">
          <AIAdvisor userId="demo-rajesh-001" />
        </div>
        
      </div>
    </div>
  );
};

export default Dashboard;
