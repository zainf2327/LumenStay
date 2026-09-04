import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Toast, ToastType, ToastAction } from '../components/Toast';

export type { ToastType, ToastAction };

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  action?: ToastAction;
  createdAt: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id' | 'createdAt'>) => string;
  dismissToast: (id: string) => void;
  success: (message: string, title?: string, duration?: number, action?: ToastAction) => string;
  error: (message: string, title?: string, duration?: number, action?: ToastAction) => string;
  warning: (message: string, title?: string, duration?: number, action?: ToastAction) => string;
  info: (message: string, title?: string, duration?: number, action?: ToastAction) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, duration = 4500, action }: Omit<ToastItem, 'id' | 'createdAt'>) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newToast: ToastItem = {
        id,
        type,
        title,
        message,
        duration,
        action,
        createdAt: Date.now(),
      };

      setToasts((prev) => [newToast, ...prev.slice(0, 4)]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }

      return id;
    },
    [dismissToast]
  );

  const success = useCallback(
    (message: string, title?: string, duration?: number, action?: ToastAction) =>
      showToast({ type: 'success', title: title || 'Success', message, duration, action }),
    [showToast]
  );

  const error = useCallback(
    (message: string, title?: string, duration?: number, action?: ToastAction) =>
      showToast({ type: 'error', title: title || 'Error', message, duration: duration || 6000, action }),
    [showToast]
  );

  const warning = useCallback(
    (message: string, title?: string, duration?: number, action?: ToastAction) =>
      showToast({ type: 'warning', title: title || 'Attention', message, duration, action }),
    [showToast]
  );

  const info = useCallback(
    (message: string, title?: string, duration?: number, action?: ToastAction) =>
      showToast({ type: 'info', title: title || 'Notice', message, duration, action }),
    [showToast]
  );

  const value = useMemo(
    () => ({
      toasts,
      showToast,
      dismissToast,
      success,
      error,
      warning,
      info,
    }),
    [toasts, showToast, dismissToast, success, error, warning, info]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="assertive"
      className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          duration={toast.duration}
          action={toast.action}
          onDismiss={() => dismissToast(toast.id)}
        />
      ))}
    </div>
  );
};

