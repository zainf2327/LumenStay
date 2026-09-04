import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  X,
  Copy,
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
  icon?: 'copy' | 'link';
}

export interface ToastProps {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  action?: ToastAction;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  type,
  title,
  message,
  duration,
  action,
  onDismiss,
}) => {
  const config = {
    success: {
      icon: CheckCircle2,
      border: 'border-[#C8E3D4]',
      cardBg: 'bg-[#FAF8F5]',
      iconBg: 'bg-[#EBF4EF] text-[#236446] border-[#C8E3D4]',
      titleColor: 'text-[#236446]',
      progressBg: 'bg-[#236446]',
      accentBadge: 'bg-[#EBF4EF] text-[#236446] border-[#C8E3D4]',
    },
    error: {
      icon: AlertCircle,
      border: 'border-[#EACEC8]',
      cardBg: 'bg-[#FAF8F5]',
      iconBg: 'bg-[#FAF0ED] text-[#8C2F22] border-[#EACEC8]',
      titleColor: 'text-[#8C2F22]',
      progressBg: 'bg-[#8C2F22]',
      accentBadge: 'bg-[#FAF0ED] text-[#8C2F22] border-[#EACEC8]',
    },
    warning: {
      icon: AlertTriangle,
      border: 'border-[#ECE2CE]',
      cardBg: 'bg-[#FAF8F5]',
      iconBg: 'bg-[#FAF6EE] text-[#8C621E] border-[#ECE2CE]',
      titleColor: 'text-[#8C621E]',
      progressBg: 'bg-[#8C621E]',
      accentBadge: 'bg-[#FAF6EE] text-[#8C621E] border-[#ECE2CE]',
    },
    info: {
      icon: Sparkles,
      border: 'border-[#DDD7CD]',
      cardBg: 'bg-[#FAF8F5]',
      iconBg: 'bg-[#F4EFE6] text-[#B08D57] border-[#DDD7CD]',
      titleColor: 'text-[#8C621E]',
      progressBg: 'bg-[#B08D57]',
      accentBadge: 'bg-[#F4EFE6] text-[#8C621E] border-[#DDD7CD]',
    },
  }[type];

  const IconComponent = config.icon;

  return (
    <div
      role="alert"
      className={`pointer-events-auto relative overflow-hidden ${config.cardBg} border ${config.border} rounded-2xl p-4 shadow-[0_12px_32px_rgba(28,24,21,0.08),0_2px_8px_rgba(28,24,21,0.04)] transition-all duration-300 animate-slideIn text-[#1C1815] font-sans`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`w-8 h-8 rounded-xl ${config.iconBg} border flex items-center justify-center shrink-0 mt-0.5 shadow-xs`}
          >
            <IconComponent className="w-4 h-4" />
          </div>

          <div className="space-y-1 min-w-0 pr-1">
            {title && (
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className={`text-xs font-semibold tracking-wide ${config.titleColor}`}>
                  {title}
                </h4>
              </div>
            )}
            <p className="text-xs text-[#524B43] leading-relaxed break-words font-normal">
              {message}
            </p>

            {action && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#1C1815] hover:bg-[#2C2621] text-[#F7F4EE] text-[11px] font-medium transition cursor-pointer shadow-xs active:scale-98"
                >
                  {action.icon === 'copy' && <Copy className="w-3 h-3 text-[#B08D57]" />}
                  <span>{action.label}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="text-[#8F887F] hover:text-[#1C1815] p-1 rounded-lg hover:bg-[#E5E0D8]/60 transition shrink-0 cursor-pointer"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Subtle Progress Countdown */}
      {duration && duration > 0 && (
        <div
          className={`absolute bottom-0 left-0 h-[2px] ${config.progressBg} opacity-60`}
          style={{
            animation: `toast-progress ${duration}ms linear forwards`,
            width: '100%',
          }}
        />
      )}
    </div>
  );
};

export default Toast;
