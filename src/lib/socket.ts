import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './tokenStorage';

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:5001';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    autoConnect: false,
    auth: (cb) => {
      cb({ token: getAccessToken() ?? '' });
    },
    transports: ['websocket', 'polling'],
  });

  return socket;
}

export function connectSocket(): Socket {
  const instance = getSocket();
  if (!instance.connected) {
    instance.auth = { token: getAccessToken() ?? '' };
    instance.connect();
  }
  return instance;
}

export function disconnectSocket(): void {
  if (!socket) return;
  socket.disconnect();
}
