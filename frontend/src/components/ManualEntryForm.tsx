import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { IndianRupee, Save } from 'lucide-react';

export type TransactionType = 'sale' | 'expense' | 'udhar';

export interface TransactionPayload {
  type: TransactionType;
  amount: number;
  description: string;
  vendor: string;
  category: string;
  date: string;
  gst_rate: number | null;
  gst_amount: number | null;
}

interface ManualEntryFormProps {
  onSubmit: (transaction: TransactionPayload) => void;
}

const CATEGORIES = {
  sale: ['General', 'Grocery', 'Dairy', 'Snacks', 'Beverages', 'Other'],
  expense: ['Purchase/Stock', 'Rent', 'Electricity', 'Transport', 'Salary', 'Other'],
  udhar: ['Customer Credit']
};

const GST_RATES = [5, 12, 18, 28];

const ManualEntryForm: React.FC<ManualEntryFormProps> = ({ onSubmit }) => {
  const [type, setType] = useState<TransactionType>('sale');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [vendor, setVendor] = useState<string>('');
  const [category, setCategory] = useState<string>(CATEGORIES['sale'][0]);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [gstApplicable, setGstApplicable] = useState<boolean>(false);
  const [gstRate, setGstRate] = useState<number>(18);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategory(CATEGORIES[newType][0]);
    // Optionally reset GST for udhar since it might not apply
    if (newType === 'udhar') {
      setGstApplicable(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedAmount = parseFloat(amount);
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    let gst_amount: number | null = null;
    let final_gst_rate: number | null = null;
    
    if (gstApplicable && type !== 'udhar') {
      final_gst_rate = gstRate;
      // Simple inclusive or exclusive? Let's assume the amount entered is the base amount and we calculate GST on top, or it's total amount. 
      // Based on usual Indian context, if GST is applicable, gst_amount = amount * (gstRate / 100).
      gst_amount = parseFloat((parsedAmount * (gstRate / 100)).toFixed(2));
    }

    const payload: TransactionPayload = {
      type,
      amount: parsedAmount,
      description,
      vendor,
      category,
      date,
      gst_rate: final_gst_rate,
      gst_amount
    };

    onSubmit(payload);
    
    // Show success toast
    const typeLabel = type === 'udhar' ? 'udhar' : type;
    toast.success(`₹${parsedAmount} ${typeLabel} recorded`);
    
    // Reset form
    setAmount('');
    setDescription('');
    setVendor('');
    setCategory(CATEGORIES[type][0]);
    setDate(new Date().toISOString().split('T')[0]);
    setGstApplicable(false);
    setGstRate(18);
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
      <div className="bg-[#00B9F1] px-6 py-4">
        <h2 className="text-xl font-bold text-white">Log Transaction</h2>
        <p className="text-[#00B9F1] text-sm text-blue-100">Manual Entry</p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        
        {/* Transaction Type Toggle */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {(['sale', 'expense', 'udhar'] as TransactionType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleTypeChange(t)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                type === t 
                  ? 'bg-white shadow-sm text-[#00B9F1]' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount <span className="text-red-500">*</span></label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <IndianRupee className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-10 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#00B9F1] focus:outline-none focus:ring-1 focus:ring-[#00B9F1] text-lg font-semibold"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#00B9F1] focus:outline-none focus:ring-1 focus:ring-[#00B9F1]"
            placeholder="e.g. Manoj Traders se maal, biscuit sale"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Vendor / Customer Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {type === 'sale' || type === 'udhar' ? 'Customer Name' : 'Vendor Name'}
            </label>
            <input
              type="text"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#00B9F1] focus:outline-none focus:ring-1 focus:ring-[#00B9F1]"
              placeholder="Optional"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#00B9F1] focus:outline-none focus:ring-1 focus:ring-[#00B9F1]"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#00B9F1] focus:outline-none focus:ring-1 focus:ring-[#00B9F1] bg-white"
          >
            {CATEGORIES[type].map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* GST Toggle (Hidden for Udhar) */}
        {type !== 'udhar' && (
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">GST Applicable?</label>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">No</span>
                <button
                  type="button"
                  onClick={() => setGstApplicable(!gstApplicable)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    gstApplicable ? 'bg-[#00B9F1]' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      gstApplicable ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className="text-sm text-gray-500">Yes</span>
              </div>
            </div>

            {/* GST Rate Dropdown */}
            {gstApplicable && (
              <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="block text-sm font-medium text-gray-700 mb-1">GST Rate</label>
                <div className="flex gap-2">
                  {GST_RATES.map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setGstRate(rate)}
                      className={`flex-1 py-2 text-sm border rounded-md transition-colors ${
                        gstRate === rate
                          ? 'border-[#00B9F1] bg-[#00B9F1] text-white font-medium'
                          : 'border-gray-300 text-gray-700 hover:border-[#00B9F1] hover:text-[#00B9F1]'
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full flex justify-center items-center gap-2 rounded-md bg-[#00B9F1] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#0096c4] focus:outline-none focus:ring-2 focus:ring-[#00B9F1] focus:ring-offset-2 transition-colors mt-6"
        >
          <Save className="h-5 w-5" />
          Save Transaction
        </button>

      </form>
    </div>
  );
};

export default ManualEntryForm;
