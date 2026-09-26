import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, X, ShoppingCart, Heart, AlertCircle } from 'lucide-react';

type ToastType = 'success' | 'cart' | 'error' | 'wishlist';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const icons = {
    success: <CheckCircle size={18} className="text-green-400" />,
    cart: <ShoppingCart size={18} className="text-orange-400" />,
    error: <AlertCircle size={18} className="text-red-400" />,
    wishlist: <Heart size={18} className="text-pink-400" />,
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 z-[9999] flex flex-col items-end gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="flex items-center gap-3 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-gray-700 min-w-[240px] animate-slide-up pointer-events-auto"
          >
            {icons[toast.type]}
            <span className="text-sm font-semibold flex-1">{toast.message}</span>
            <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="text-gray-400 hover:text-white ml-1">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
