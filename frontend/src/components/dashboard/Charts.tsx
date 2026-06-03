import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, Legend } from 'recharts';

interface CompositionProps {
  sales: number;
  expenses: number;
  udhar: number;
}

export const DonutChart: React.FC<CompositionProps> = ({ sales, expenses, udhar }) => {
  const data = [
    { name: 'Sales', value: sales, color: '#27AE60' },
    { name: 'Expenses', value: expenses, color: '#EB5757' },
    { name: 'Udhar', value: udhar, color: '#F59E0B' },
  ];

  return (
    <div className="bg-[#FFFFFF] border border-[#E8EBF0] rounded-2xl p-6 h-[400px] flex flex-col shadow-paytm hover:shadow-paytm-hover transition-shadow">
      <h2 className="text-xl font-bold text-[#101010] mb-6">Transaction Composition</h2>
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={110}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: any) => [`₹${value.toLocaleString('en-IN')}`, '']}
              contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E8EBF0', borderRadius: '12px', color: '#101010', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
              itemStyle={{ color: '#101010', fontWeight: 'bold' }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontWeight: 600, fontSize: '12px', color: '#4F4F4F' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

interface WeeklyTrendProps {
  data: any[];
}

export const WeeklyTrendLine: React.FC<WeeklyTrendProps> = ({ data }) => {
  return (
    <div className="bg-[#FFFFFF] border border-[#E8EBF0] rounded-2xl p-6 h-[350px] flex flex-col shadow-paytm hover:shadow-paytm-hover transition-shadow">
      <h2 className="text-xl font-bold text-[#101010] mb-6">Weekly Trend (Sales vs Expenses)</h2>
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EBF0" vertical={false} />
            <XAxis dataKey="date" stroke="#E8EBF0" tick={{ fill: '#707070', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} />
            <YAxis stroke="#E8EBF0" tick={{ fill: '#707070', fontSize: 12, fontFamily: 'monospace', fontWeight: 600 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
            <Tooltip 
              formatter={(value: any) => [`₹${value.toLocaleString('en-IN')}`, '']}
              contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E8EBF0', borderRadius: '12px', color: '#101010', fontFamily: 'monospace', fontWeight: 'bold', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontWeight: 600, fontSize: '12px', color: '#4F4F4F' }} />
            <Line type="monotone" dataKey="sales" name="Sales" stroke="#27AE60" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
            <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#EB5757" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

interface TopCategoriesProps {
  data: any[];
}

export const TopExpensesBar: React.FC<TopCategoriesProps> = ({ data }) => {
  return (
    <div className="bg-[#FFFFFF] border border-[#E8EBF0] rounded-2xl p-6 h-[350px] flex flex-col shadow-paytm hover:shadow-paytm-hover transition-shadow">
      <h2 className="text-xl font-bold text-[#101010] mb-6">Top Expenses (This Month)</h2>
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EBF0" horizontal={false} />
            <XAxis type="number" stroke="#E8EBF0" tick={{ fill: '#707070', fontSize: 12, fontFamily: 'monospace', fontWeight: 600 }} axisLine={false} tickLine={false} />
            <YAxis dataKey="category" type="category" stroke="#E8EBF0" tick={{ fill: '#4F4F4F', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} width={100} />
            <Tooltip 
              formatter={(value: any) => [`₹${value.toLocaleString('en-IN')}`, '']}
              cursor={{ fill: '#F5F8FA' }}
              contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E8EBF0', borderRadius: '12px', color: '#101010', fontFamily: 'monospace', fontWeight: 'bold', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
            />
            <Bar dataKey="amount" fill="#00BAF2" radius={[0, 4, 4, 0]} barSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
