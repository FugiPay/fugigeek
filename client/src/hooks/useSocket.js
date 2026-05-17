import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

let socketInstance = null;

const getSocket = async (token) => {
  // Lazy import so socket.io-client doesn't block initial render
  const { io } = await import('socket.io-client');
  const SERVER_URL = import.meta.env.VITE_API_URL || 'https://fugigeek.onrender.com';

  if (!socketInstance) {
    socketInstance = io(SERVER_URL, {
      auth:            { token },
      transports:      ['websocket', 'polling'], // polling fallback for Safari
      reconnection:    true,
      reconnectionDelay: 1000,
      timeout:         10000,
    });
  }
  return socketInstance;
};

export const useSocket = () => {
  const socketRef = useRef(null);
  const { token, user } = useSelector(s => s.auth);

  useEffect(() => {
    if (!token) return;
    let mounted = true;

    getSocket(token).then(socket => {
      if (!mounted) return;
      socketRef.current = socket;
      if (user?._id) socket.emit('join_room', user._id);
    }).catch(() => {}); // silent fail — real-time is non-critical

    return () => {
      mounted = false;
      // Don't disconnect — socket is shared across components
    };
  }, [token, user?._id]);

  return socketRef.current;
};
