import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

export const useSocket = () => {
  const socketRef = useRef(null);
  const { token, user } = useSelector(s => s.auth);

  useEffect(() => {
    if (!token) return;
    socketRef.current = io({ auth: { token } });

    // Join personal room for notifications
    if (user?._id) socketRef.current.emit('join_room', user._id);

    return () => { socketRef.current?.disconnect(); };
  }, [token, user?._id]);

  return socketRef.current;
};
