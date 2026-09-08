import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

export interface LiveNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  payload?: any;
}

interface WebSocketContextType {
  isConnected: boolean;
  notifications: LiveNotification[];
  dismissNotification: (id: string) => void;
  subscribe: (eventType: string, callback: (payload: any) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  
  // Use ref so ws.onmessage always accesses the live listener sets without closure staleness
  const listenersRef = useRef<Map<string, Set<(payload: any) => void>>>(new Map());

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;
    let isDisposed = false;

    const connect = () => {
      if (isDisposed) return;

      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      
      let wsUrl: string;
      const envWs = import.meta.env.VITE_WS_URL;
      const envApi = import.meta.env.VITE_API_URL;

      if (envWs) {
        wsUrl = envWs;
      } else if (envApi) {
        const base = envApi.replace(/^http/, 'ws').replace(/\/+$/, '');
        wsUrl = `${base}/ws`;
      } else if (isLocalhost) {
        wsUrl = `${protocol}//${window.location.hostname}:3001/ws`;
      } else {
        wsUrl = `${protocol}//${window.location.host}/ws`;
      }

      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (isDisposed) {
            try { ws?.close(); } catch {}
            return;
          }
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          if (isDisposed) return;
          try {
            const data = JSON.parse(event.data);
            const { type, payload } = data;

            // Notify registered component listeners using live ref
            const eventListeners = listenersRef.current.get(type);
            if (eventListeners) {
              eventListeners.forEach(cb => cb(payload));
            }

            // Create notification banner for operational events
            if (type === 'RESERVATION_CREATED') {
              addNotification({
                id: `notif_${Date.now()}`,
                type,
                title: '✨ New Direct Booking Received',
                message: `${payload.guestName || 'Guest'} reserved a suite for $${payload.totalAmount?.toLocaleString() || ''}`,
                timestamp: new Date().toLocaleTimeString(),
                payload,
              });
            } else if (type === 'GUEST_CHECKED_IN') {
              addNotification({
                id: `notif_${Date.now()}`,
                type,
                title: '🔑 Guest Checked In',
                message: `Reservation ${payload.reservationId} checked in & key activated.`,
                timestamp: new Date().toLocaleTimeString(),
                payload,
              });
            } else if (type === 'GUEST_CHECKED_OUT') {
              addNotification({
                id: `notif_${Date.now()}`,
                type,
                title: '🧹 Guest Checked Out',
                message: `Room marked dirty for housekeeping turnover.`,
                timestamp: new Date().toLocaleTimeString(),
                payload,
              });
            } else if (type === 'ROOM_STATUS_CHANGED') {
              addNotification({
                id: `notif_${Date.now()}`,
                type,
                title: '🏷️ Room Status Updated',
                message: `Room ${payload.roomNumber} is now marked ${payload.status?.toUpperCase()}.`,
                timestamp: new Date().toLocaleTimeString(),
                payload,
              });
            }
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          if (!isDisposed) {
            reconnectTimeout = setTimeout(connect, 3000);
          }
        };

        ws.onerror = () => {
          setIsConnected(false);
        };
      } catch (err) {
        if (!isDisposed) {
          console.error('WebSocket connection error:', err);
        }
      }
    };

    connect();

    return () => {
      isDisposed = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) {
        ws.onclose = null;
        ws.onerror = null;
        ws.onmessage = null;
        if (ws.readyState === WebSocket.CONNECTING) {
          // If unmounting while still connecting (React StrictMode dev double-invoke),
          // defer close to onopen so the browser does not log "closed before established"
          ws.onopen = () => {
            try { ws?.close(); } catch {}
          };
        } else if (ws.readyState === WebSocket.OPEN) {
          try { ws.close(); } catch {}
        }
      }
    };
  }, []);

  const addNotification = (notif: LiveNotification) => {
    setNotifications(prev => [notif, ...prev.slice(0, 4)]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notif.id));
    }, 6000);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const subscribe = useCallback((eventType: string, callback: (payload: any) => void) => {
    if (!listenersRef.current.has(eventType)) {
      listenersRef.current.set(eventType, new Set());
    }
    listenersRef.current.get(eventType)!.add(callback);

    return () => {
      const set = listenersRef.current.get(eventType);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          listenersRef.current.delete(eventType);
        }
      }
    };
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        notifications,
        dismissNotification,
        subscribe,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
