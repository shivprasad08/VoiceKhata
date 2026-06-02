import { useEffect, useRef, useState } from 'react';

export function useWebSocket(url: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const ws = useRef<WebSocket | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    const connect = () => {
      console.log("Connecting to WS:", url);
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        console.log("WS Connected");
        setIsConnected(true);
      };

      ws.current.onclose = () => {
        console.log("WS Disconnected, retrying in 3s...");
        setIsConnected(false);
        // Auto-reconnect
        timeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);
      } catch (e) {
        console.error("WS parse error", e);
      }
    };

    };

    connect();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (ws.current) {
        // Prevent auto-reconnect on unmount
        ws.current.onclose = null;
        ws.current.close();
      }
    };
  }, [url]);

  return { isConnected, lastMessage };
}
