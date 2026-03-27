import http from 'http';
import { Server as SocketServer } from 'socket.io';
import app from './app';

const PORT = process.env.PORT || 8000;
const server = http.createServer(app);

export const io = new SocketServer(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:3000', methods: ['GET', 'POST'] },
});

io.on('connection', (socket) => {
  // Join personal room for targeted notifications
  socket.on('join', (userId: string) => {
    socket.join(`user:${userId}`);
    socket.join('broadcast');
  });

  // Join ward/department room for clinical alerts
  socket.on('join-ward', (wardId: string) => socket.join(`ward:${wardId}`));

  // Queue updates (reception desk)
  socket.on('queue-update', (data: unknown) => io.to('broadcast').emit('queue-update', data));

  socket.on('disconnect', () => {});
});

// Helper: emit notification to specific user
export function notifyUser(userId: string, event: string, data: unknown) {
  io.to(`user:${userId}`).emit(event, data);
}

// Helper: broadcast to all connected clients
export function broadcast(event: string, data: unknown) {
  io.to('broadcast').emit(event, data);
}

// Helper: emit to ward
export function notifyWard(wardId: string, event: string, data: unknown) {
  io.to(`ward:${wardId}`).emit(event, data);
}

server.listen(PORT, () => console.log(`🏥 HMS Backend running on port ${PORT}`));
