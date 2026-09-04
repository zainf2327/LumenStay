import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  X,
} from 'lucide-react';

export type ConfirmVariant = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: 'Please Confirm',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'warning',
  });

  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions({
      title: opts.title || (opts.variant === 'danger' ? 'Confirm Action' : 'Please Confirm'),
      message: opts.message,
      confirmText: opts.confirmText || (opts.variant === 'danger' ? 'Yes, Proceed' : 'Confirm'),
      cancelText: opts.cancelText || 'Cancel',
      variant: opts.variant || 'warning',
    });
    setIsOpen(true);

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {isOpen && (
        <ConfirmDialogView
          options={options}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = (): ConfirmContextType => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};

interface ConfirmDialogViewProps {
  options: ConfirmOptions;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialogView: React.FC<ConfirmDialogViewProps> = ({
  options,
  onConfirm,
  onCancel,
}) => {
  const variant = options.variant || 'warning';

  const config = {
    danger: {
      icon: AlertCircle,
      iconBg: 'bg-[#FAF0ED] text-[#8C2F22] border-[#EACEC8]',
      confirmBtn: 'bg-[#8C2F22] hover:bg-[#6E2218] text-white',
      accentColor: 'text-[#8C2F22]',
    },
    warning: {
      icon: AlertTriangle,
      iconBg: 'bg-[#FAF6EE] text-[#8C621E] border-[#ECE2CE]',
      confirmBtn: 'bg-[#1C1815] hover:bg-[#2C2622] text-[#F7F4EE]',
      accentColor: 'text-[#8C621E]',
    },
    info: {
      icon: HelpCircle,
      iconBg: 'bg-[#FAF8F5] text-[#1C1815] border-[#DDD7CD]',
      confirmBtn: 'bg-[#1C1815] hover:bg-[#2C2622] text-[#F7F4EE]',
      accentColor: 'text-[#1C1815]',
    },
    success: {
      icon: CheckCircle2,
      iconBg: 'bg-[#EBF4EF] text-[#236446] border-[#C8E3D4]',
      confirmBtn: 'bg-[#236446] hover:bg-[#1C5138] text-white',
      accentColor: 'text-[#236446]',
    },
  }[variant];

  const IconComponent = config.icon;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 font-sans">
      {/* Backdrop */}
      <div
        onClick={onCancel}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-fadeIn"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white border border-[#DDD7CD] rounded-2xl p-6 shadow-2xl overflow-hidden transition-all animate-fadeIn z-10 space-y-4 text-[#1C1815]">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${config.iconBg} border flex items-center justify-center shrink-0`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-normal text-lg text-[#1C1815]">
                {options.title}
              </h3>
              <span className={`text-[10px] uppercase tracking-wider font-medium ${config.accentColor}`}>
                Action Required
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="text-[#736B63] hover:text-[#1C1815] p-1.5 rounded-md hover:bg-[#F4EFE6] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[#4A433D] leading-relaxed pl-1">
          {options.message}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E0D8]">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-md bg-white border border-[#DDD7CD] text-[#736B63] hover:text-[#1C1815] text-xs font-medium transition cursor-pointer"
          >
            {options.cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${config.confirmBtn}`}
          >
            <span>{options.confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
