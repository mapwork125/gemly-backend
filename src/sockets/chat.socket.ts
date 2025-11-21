import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

export const initChatSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, { cors: { origin: '*' } });
  io.on('connection', (socket: Socket) => {
    console.log('socket connected', socket.id);
    socket.on('join', (room) => socket.join(room));
    socket.on('message', (payload) => {
      io.to(payload.room).emit('message', payload);
    });
    socket.on('disconnect', () => console.log('socket disconnected', socket.id));
  });
};
