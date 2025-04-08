import { Namespace, Socket } from 'socket.io';
import * as console from 'node:console';
import { joinRoomSchema, messageSchema } from './chat.schema.js';
import { TypeOf } from 'zod';

export default function chatNamespace(namespace: Namespace) {
  namespace.on('connection', (socket: Socket) => {
    console.log(`🟢 [/chat] Connected: ${socket.id}`);

    socket.on('join', (payload: TypeOf<typeof joinRoomSchema>) => {
      console.log(`🔗 ${socket.id} joined room ${payload.roomId}`);
      socket.join(payload.roomId);
      socket.to(payload.roomId).emit('join', `${socket.id} joined room ${payload.roomId}`);
    });

    socket.on('message', (payload: TypeOf<typeof messageSchema>) => {
      console.log(`💬 ${socket.id} sent message to room ${payload.roomId}: ${payload.message}`);
      socket.to(payload.roomId).emit('message', payload.message);
    });

    socket.on('disconnect', () => {
      console.log(`🔴 [/chat] Disconnected: ${socket.id}`);
    });
  });
}
