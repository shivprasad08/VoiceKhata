import React from 'react';
import { format, isPast, isToday } from 'date-fns';

export interface UdharEntry {
  id: string;
  customer_name: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'settled';
}

interface UdharTableProps {
  data: UdharEntry[];
  totalOutstanding: number;
}

const UdharTable: React.FC<UdharTableProps> = ({ data, totalOutstanding }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  return (
    <div className="bg-khata-card border border-khata-border rounded-xl flex flex-col h-[350px]">
      <div className="px-5 py-4 border-b border-khata-border flex justify-between items-center bg-khata-card rounded-t-xl sticky top-0">
        <h2 className="text-lg font-semibold text-white">Udhar Summary</h2>
        <div className="bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full text-sm font-medium border border-yellow-500/20">
          Total Outstanding: <span className="font-mono">{formatCurrency(totalOutstanding)}</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="text-xs text-gray-500 uppercase bg-khata-dark/50 sticky top-0 z-10">
            <tr>
              <th scope="col" className="px-5 py-3 font-medium">Customer Name</th>
              <th scope="col" className="px-5 py-3 font-medium text-right">Amount</th>
              <th scope="col" className="px-5 py-3 font-medium">Due Date</th>
              <th scope="col" className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => {
              const dueDate = new Date(row.due_date);
              const isOverdue = row.status === 'pending' && isPast(dueDate) && !isToday(dueDate);
              
              return (
                <tr key={row.id} className={`border-b border-khata-border hover:bg-gray-800/50 transition-colors ${isOverdue ? 'bg-khata-red/5' : ''}`}>
                  <td className="px-5 py-3 font-medium text-gray-200">
                    {row.customer_name}
                  </td>
                  <td className="px-5 py-3 text-right font-mono font-bold text-yellow-500">
                    {formatCurrency(row.amount)}
                  </td>
                  <td className={`px-5 py-3 ${isOverdue ? 'text-khata-red font-medium' : ''}`}>
                    {format(dueDate, 'dd MMM yyyy')}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                      row.status === 'settled' 
                        ? 'bg-khata-green/10 text-khata-green border border-khata-green/20' 
                        : isOverdue
                          ? 'bg-khata-red/10 text-khata-red border border-khata-red/20'
                          : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                    }`}>
                      {isOverdue ? 'Overdue' : row.status}
                    </span>
                  </td>
                </tr>
              );
            })}
            
            {data.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-gray-500">
                  No Udhar records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UdharTable;
