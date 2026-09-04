import React from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { X, Sparkles } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { notifications, dismissNotification } = useWebSocket();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className="pointer-events-auto bg-[#141b24] border border-amber-500/40 rounded-xl p-4 shadow-2xl backdrop-blur-lg transform transition-all duration-300 animate-slideIn flex items-start justify-between gap-3 text-slate-100"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-semibold text-amber-300">{notif.title}</h4>
                <span className="text-[10px] text-slate-400">{notif.timestamp}</span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{notif.message}</p>
            </div>
          </div>
          <button
            onClick={() => dismissNotification(notif.id)}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
