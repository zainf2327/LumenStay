import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';

let wss: WebSocketServer | null = null;
const clients = new Set<WebSocket>();

export function setupWebSocket(server: Server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    clients.add(ws);

    ws.on('close', () => {
      clients.delete(ws);
    });

    // Send initial handshake
    ws.send(JSON.stringify({
      type: 'INIT_CONNECTED',
      message: 'Connected to LumenStay Real-Time Event Bus',
      timestamp: new Date().toISOString(),
    }));
  });

  return wss;
}

export function broadcastEvent(eventType: string, payload: any) {
  const message = JSON.stringify({
    type: eventType,
    payload,
    timestamp: new Date().toISOString(),
  });

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}
