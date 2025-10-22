import type { Server, Socket } from 'socket.io';
import type { 
  ServerToClientEvents, 
  ClientToServerEvents, 
  InterServerEvents, 
  SocketData 
} from '../types';
import { handleNotificationEvents } from './handlers/notificationHandler';
import { handleMessageEvents } from './handlers/messageHandler';
import { handlePresenceEvents } from './handlers/presenceHandler';
import { handleConversationEvents } from './handlers/conversationHandler';

export function setupWebSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) {
  // Set up notification handlers
  handleNotificationEvents(io, socket);
  
  // Set up message handlers
  handleMessageEvents(io, socket);
  
  // Set up conversation handlers
  handleConversationEvents(io, socket);
  
  // Set up presence handlers
  handlePresenceEvents(io, socket);
  
  // Handle authentication
  socket.on('auth:login', async (token, callback) => {
    try {
      // Token is already verified in middleware
      // Just confirm authentication
      callback({ 
        success: true, 
        user: {
          id: socket.data.userId,
          username: socket.data.username,
          email: ''
        } as any
      });
    } catch (error) {
      callback({ success: false });
    }
  });
  
  // Handle errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
    socket.emit('error', { 
      message: 'An error occurred',
      code: 'SOCKET_ERROR' 
    });
  });
}
