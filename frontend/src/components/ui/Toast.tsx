import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ToastItem {
  id: string;
  type?: 'success' | 'error' | 'info';
  title?: string;
  message: string;
}

export interface ToastOptions {
  title?: string;
  description?: string;
  message?: string;
  type?: 'success' | 'error' | 'info';
}

interface ToastContextType {
  toast: (options: ToastOptions | string, type?: 'success' | 'error' | 'info') => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info', title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success', title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const toast = useCallback((options: ToastOptions | string, type?: 'success' | 'error' | 'info') => {
    if (typeof options === 'string') {
      showToast(options, type || 'info');
    } else {
      showToast(options.description || options.message || '', options.type || 'info', options.title);
    }
  }, [showToast]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast, showToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          return (
            <div
              key={t.id}
              className={cn(
                'pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-xl bg-white backdrop-blur-md animate-fade-up text-[#29243A]',
                isSuccess && 'border-[#BDEBD9] bg-[#F2FBF7]/95',
                isError && 'border-rose-200 bg-rose-50/95',
                !isSuccess && !isError && 'border-[#DDD3FF] bg-[#FAF8FF]/95'
              )}
            >
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-[#267E5A] flex-shrink-0 mt-0.5" />}
              {isError && <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />}
              {!isSuccess && !isError && <Info className="w-5 h-5 text-[#8B70D6] flex-shrink-0 mt-0.5" />}
              <div className="flex-1 text-xs space-y-0.5">
                {t.title && <div className="font-bold text-sm text-[#29243A]">{t.title}</div>}
                <p className="text-[#77718B] leading-relaxed">{t.message}</p>
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="text-[#77718B] hover:text-[#29243A] p-0.5 rounded-lg"
                aria-label="Dismiss toast"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
