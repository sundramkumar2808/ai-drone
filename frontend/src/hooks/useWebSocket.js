import { useState, useEffect, useRef, useCallback } from 'react';

export const useWebSocket = (url) => {
  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    try {
      const socket = new WebSocket(url || 'ws://localhost:8001/ws/telemetry');
      wsRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        setError(null);
      };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          setData(parsed);
        } catch (e) {
          setData(event.data);
        }
      };

      socket.onerror = (err) => {
        setError(err);
      };

      socket.onclose = () => {
        setIsConnected(false);
        // Attempt automatic reconnection after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };
    } catch (err) {
      setError(err);
      setIsConnected(false);
    }
  }, [url]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((msg) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  }, []);

  return { data, isConnected, error, sendMessage };
};
