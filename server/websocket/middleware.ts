import jwt from 'jsonwebtoken';
import type { Socket } from 'socket.io';
import type { ExtendedError } from 'socket.io/dist/namespace';
import type { 
  ClientToServerEvents, 
  ServerToClientEvents, 
  InterServerEvents, 
  SocketData,
  JWTPayload 
} from '../types';

export async function authenticateSocket(
  socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  next: (err?: ExtendedError) => void
) {
  try {
    // Get token from handshake auth or query
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }
    
    // Verify JWT token
    const decoded = jwt.verify(
      token as string, 
      process.env.JWT_SECRET || 'your-secret-key'
    ) as JWTPayload;
    
    // Store user info in socket data
    socket.data.userId = decoded.id;
    socket.data.username = decoded.username;
    socket.data.rooms = new Set();
    
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication error: Invalid token'));
  }
}
