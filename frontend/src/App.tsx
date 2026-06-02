import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { X } from 'lucide-react';
import Dashboard from './components/dashboard/Dashboard';
import ManualEntryForm from './components/ManualEntryForm';
import type { TransactionPayload } from './components/ManualEntryForm';

function App() {
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const DEMO_USER_ID = 1;

  const handleTransactionSubmit = async (transaction: TransactionPayload) => {
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...transaction,
          user_id: DEMO_USER_ID,
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      // Close modal on success
      setTimeout(() => setIsManualEntryOpen(false), 1000);

    } catch (error) {
      console.error('Failed to submit transaction:', error);
      console.warn("Is the backend running? Run 'docker-compose up -d --build'");
    }
  };

  return (
    <>
      <Dashboard onOpenManualEntry={() => setIsManualEntryOpen(true)} />
      
      {/* Modal for Manual Entry Form */}
      {isManualEntryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg">
            <button 
              onClick={() => setIsManualEntryOpen(false)}
              className="absolute -top-10 right-0 text-white hover:text-paytm-blue transition-colors p-2"
            >
              <X size={24} />
            </button>
            <div className="animate-in slide-in-from-bottom-8 duration-300">
              <ManualEntryForm onSubmit={handleTransactionSubmit} />
            </div>
          </div>
        </div>
      )}

      {/* Global Toast Container */}
      <Toaster 
        position="bottom-center" 
        toastOptions={{
          style: {
            background: '#1E1E1E',
            color: '#fff',
            border: '1px solid #333',
          }
        }}
      />
    </>
  );
}

export default App;
