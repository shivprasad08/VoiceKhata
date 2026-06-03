import React, { useState } from 'react';
import { Sparkles, Loader2, Download, TrendingUp, TrendingDown, IndianRupee } from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
interface AISummaryProps {
  userId: number;
}

const AISummary: React.FC<AISummaryProps> = ({ userId }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'hindi' | 'english'>('hindi');
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    setSummaryData(null);
    
    try {
      const response = await fetch('/api/summary/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          period: period
        })
      });

      if (!response.ok) throw new Error("Failed to generate summary");
      
      const data = await response.json();
      setSummaryData(data);
    } catch (error) {
      toast.error("Failed to generate AI summary. Ensure backend is running.");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    const toastId = toast.loading('Generating CA Report...');
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      
      const response = await fetch(`/api/export/pdf?user_id=${userId}&month=${month}&year=${year}`);
      if (!response.ok) throw new Error("Failed to generate PDF");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `VoiceKhata_Report_${now.toLocaleString('default', { month: 'long' })}_${year}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      toast.success('Report downloaded successfully!', { id: toastId });
    } catch (error) {
      toast.error('Failed to download report', { id: toastId });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="bg-khata-card border border-[#A855F7]/30 rounded-xl p-5 shadow-sm flex flex-col relative overflow-hidden h-full min-h-[220px]">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Sparkles size={18} className="text-purple-400" />
          AI Business Advisor
        </h3>
        <div className="flex gap-2">
          <select 
            value={period}
            onChange={(e) => setPeriod(e.target.value as 'weekly' | 'monthly')}
            disabled={isGenerating}
            className="text-xs bg-gray-800 text-gray-300 border border-gray-700 rounded-md px-2 py-1 outline-none"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <button
            onClick={handleGenerateSummary}
            disabled={isGenerating}
            className="text-xs bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 px-3 py-1.5 rounded-md transition-colors font-medium border border-purple-500/30 flex items-center gap-1"
          >
            {isGenerating ? <Loader2 className="animate-spin" size={12} /> : 'Generate'}
          </button>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 bg-black/20 rounded-lg border border-white/5 flex flex-col overflow-hidden">
        
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center flex-1 p-6 text-purple-400/70 gap-3">
            <Loader2 className="animate-spin" size={28} />
            <span className="text-sm font-medium animate-pulse">AI सोच रहा है... (AI is thinking...)</span>
          </div>
        ) : summaryData ? (
          <div className="flex flex-col h-full">
            {/* Tabs */}
            <div className="flex border-b border-gray-800 bg-gray-900/50">
              <button 
                onClick={() => setActiveTab('hindi')}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider ${activeTab === 'hindi' ? 'text-purple-400 border-b-2 border-purple-500 bg-purple-500/5' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Hindi
              </button>
              <button 
                onClick={() => setActiveTab('english')}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider ${activeTab === 'english' ? 'text-purple-400 border-b-2 border-purple-500 bg-purple-500/5' : 'text-gray-500 hover:text-gray-300'}`}
              >
                English
              </button>
            </div>
            
            {/* Text Content */}
            <div className="p-4 flex-1 overflow-y-auto text-sm text-gray-300 leading-relaxed prose prose-invert max-w-none">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({node, ...props}) => <h1 className="text-xl font-bold text-white mb-3" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-lg font-bold text-white mt-4 mb-2" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-base font-bold text-purple-300 mt-3 mb-1" {...props} />,
                  p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />,
                  li: ({node, ...props}) => <li className="mb-1" {...props} />,
                  strong: ({node, ...props}) => <strong className="text-white font-semibold" {...props} />
                }}
              >
                {activeTab === 'hindi' ? summaryData.hindi : summaryData.english}
              </ReactMarkdown>
            </div>
            
            {/* Metrics Footer */}
            <div className="bg-gray-900/80 p-3 border-t border-gray-800 flex justify-between items-center">
              <div className="flex gap-2">
                <span className="flex items-center gap-1 text-xs bg-khata-green/10 text-khata-green px-2 py-1 rounded font-medium">
                  <TrendingUp size={12} /> {formatCurrency(summaryData.metrics.profit)}
                </span>
                <span className="flex items-center gap-1 text-xs bg-khata-red/10 text-khata-red px-2 py-1 rounded font-medium">
                  <TrendingDown size={12} /> {formatCurrency(summaryData.metrics.expenses)}
                </span>
                <span className="flex items-center gap-1 text-xs bg-[#00BAF2]/10 text-[#00BAF2] px-2 py-1 rounded font-medium hidden sm:flex">
                  <IndianRupee size={12} /> ITC {formatCurrency(summaryData.metrics.itc)}
                </span>
              </div>
              <button 
                title="Download CA Report (PDF)"
                className="text-gray-400 hover:text-white p-1 transition-colors flex items-center gap-1"
                onClick={handleDownloadPDF}
              >
                <Download size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full items-center justify-center p-6 text-gray-500 text-sm text-center">
            <Sparkles size={24} className="mb-2 opacity-50" />
            <p>Click generate to get a deep dive into your {period} ledger.</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default AISummary;
