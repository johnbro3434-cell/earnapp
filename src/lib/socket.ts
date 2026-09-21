import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io({
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Socket.IO connected live:', socket?.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket.IO connection notice:', err.message);
    });
  }
  return socket;
}

export function joinUserRoom(userId: string) {
  const s = getSocket();
  if (s && userId) {
    s.emit('join_user_room', userId);
  }
}

export function joinAdminRoom(role: string) {
  const s = getSocket();
  if (s) {
    s.emit('join_admin_room', role);
  }
}
