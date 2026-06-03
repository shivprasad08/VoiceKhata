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
    <div className="bg-[#FFFFFF] border border-[#E8EBF0] rounded-2xl flex flex-col h-[350px] shadow-paytm">
      <div className="px-6 py-5 border-b border-[#E8EBF0] flex justify-between items-center bg-[#FFFFFF] rounded-t-2xl sticky top-0 z-20">
        <h2 className="text-xl font-bold text-[#101010]">Udhar Summary</h2>
        <div className="bg-yellow-50 text-yellow-700 px-4 py-1.5 rounded-full text-sm font-bold border border-yellow-200 shadow-sm">
          Total Outstanding: <span className="font-mono ml-1">{formatCurrency(totalOutstanding)}</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
        <table className="w-full text-left text-sm text-[#101010]">
          <thead className="text-xs text-[#707070] uppercase bg-[#F5F8FA] sticky top-0 z-10 font-bold border-b border-[#E8EBF0]">
            <tr>
              <th scope="col" className="px-6 py-4 font-bold tracking-wider">Customer Name</th>
              <th scope="col" className="px-6 py-4 font-bold tracking-wider text-right">Amount</th>
              <th scope="col" className="px-6 py-4 font-bold tracking-wider">Due Date</th>
              <th scope="col" className="px-6 py-4 font-bold tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => {
              const dueDate = new Date(row.due_date);
              const isOverdue = row.status === 'pending' && isPast(dueDate) && !isToday(dueDate);
              
              return (
                <tr key={row.id} className={`border-b border-gray-100 hover:bg-[#F5F8FA] transition-colors cursor-pointer ${isOverdue ? 'bg-red-50 hover:bg-red-100' : ''}`}>
                  <td className="px-6 py-4 font-bold text-[#002970]">
                    {row.customer_name}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-[#101010]">
                    {formatCurrency(row.amount)}
                  </td>
                  <td className={`px-6 py-4 font-medium ${isOverdue ? 'text-khata-red font-bold' : 'text-[#707070]'}`}>
                    {format(dueDate, 'dd MMM yyyy')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider shadow-sm ${
                      row.status === 'settled' 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : isOverdue
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                    }`}>
                      {isOverdue ? 'Overdue' : row.status}
                    </span>
                  </td>
                </tr>
              );
            })}
            
            {data.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-[#707070] font-medium">
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
