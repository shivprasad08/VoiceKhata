import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, Legend } from 'recharts';

interface CompositionProps {
  sales: number;
  expenses: number;
  udhar: number;
}

export const DonutChart: React.FC<CompositionProps> = ({ sales, expenses, udhar }) => {
  const data = [
    { name: 'Sales', value: sales, color: '#00C853' },
    { name: 'Expenses', value: expenses, color: '#FF3B30' },
    { name: 'Udhar', value: udhar, color: '#F59E0B' },
  ];

  return (
    <div className="bg-khata-card border border-khata-border rounded-xl p-5 h-[400px] flex flex-col">
      <h2 className="text-lg font-semibold text-white mb-4">Transaction Composition</h2>
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
              contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#333', borderRadius: '8px', color: '#fff' }}
              itemStyle={{ color: '#fff' }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
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
    <div className="bg-khata-card border border-khata-border rounded-xl p-5 h-[350px] flex flex-col">
      <h2 className="text-lg font-semibold text-white mb-4">Weekly Trend (Sales vs Expenses)</h2>
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
            <XAxis dataKey="date" stroke="#666" tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 12, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
            <Tooltip 
              formatter={(value: any) => [`₹${value.toLocaleString('en-IN')}`, '']}
              contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#333', borderRadius: '8px', color: '#fff', fontFamily: 'monospace' }}
            />
            <Legend iconType="circle" />
            <Line type="monotone" dataKey="sales" name="Sales" stroke="#00C853" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#FF3B30" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
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
    <div className="bg-khata-card border border-khata-border rounded-xl p-5 h-[350px] flex flex-col">
      <h2 className="text-lg font-semibold text-white mb-4">Top Expenses (This Month)</h2>
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
            <XAxis type="number" stroke="#666" tick={{ fill: '#888', fontSize: 12, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
            <YAxis dataKey="category" type="category" stroke="#666" tick={{ fill: '#ccc', fontSize: 12 }} axisLine={false} tickLine={false} width={100} />
            <Tooltip 
              formatter={(value: any) => [`₹${value.toLocaleString('en-IN')}`, '']}
              cursor={{ fill: '#333' }}
              contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#333', borderRadius: '8px', color: '#fff', fontFamily: 'monospace' }}
            />
            <Bar dataKey="amount" fill="#00B9F1" radius={[0, 4, 4, 0]} barSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
