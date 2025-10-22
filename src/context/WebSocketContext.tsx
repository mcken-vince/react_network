import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  initSocket, 
  disconnectSocket, 
  getSocket,
  type ServerToClientEvents,
  type ClientToServerEvents
} from '../lib/socket';
import type { Socket } from 'socket.io-client';
import type { Notification, Message, Connection } from '../types';
import { notificationKeys } from '../hooks/useNotifications';

interface WebSocketContextValue {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  isConnected: boolean;
  
  // Notification methods
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  
  // Message methods
  sendMessage: (conversationId: string, content: string) => void;
  editMessage: (messageId: string, content: string) => void;
  deleteMessage: (messageId: string) => void;
  markMessagesAsRead: (conversationId: string, messageIds: string[]) => void;
  sendTypingIndicator: (conversationId: string, isTyping: boolean) => void;
  
  // Conversation methods
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  createConversation: (userIds: string[], type: 'direct' | 'group', name?: string) => void;
  
  // Presence methods
  updatePresence: (status: 'online' | 'away' | 'offline') => void;
  
  // Online users
  onlineUsers: Set<string>;
}

const WebSocketContext = createContext<WebSocketContextValue | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
  token?: string | null;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children, token }) => {
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();
  
  // Initialize socket connection
  useEffect(() => {
    if (token) {
      const socketInstance = initSocket(token);
      setSocket(socketInstance);
      
      // Connection status handlers
      socketInstance.on('connect', () => {
        setIsConnected(true);
      });
      
      socketInstance.on('disconnect', () => {
        setIsConnected(false);
      });
      
      // Notification handlers
      socketInstance.on('notification:new', (notification: Notification) => {
        console.log('New notification received:', notification);
        
        // Update React Query cache
        queryClient.setQueryData<Notification[]>(
          notificationKeys.lists(),
          (old = []) => [notification, ...old]
        );
        
        // Update unread count
        queryClient.setQueryData<number>(
          notificationKeys.unreadCount(),
          (old = 0) => old + 1
        );
      });
      
      socketInstance.on('notification:updated', (notification: Notification) => {
        // Update React Query cache
        queryClient.setQueryData<Notification[]>(
          notificationKeys.lists(),
          (old = []) => old.map(n => n.id === notification.id ? notification : n)
        );
        
        // Update unread count if notification was marked as read
        if (notification.isRead) {
          queryClient.setQueryData<number>(
            notificationKeys.unreadCount(),
            (old = 0) => Math.max(0, old - 1)
          );
        }
      });
      
      socketInstance.on('notification:deleted', (notificationId: string) => {
        // Update React Query cache
        queryClient.setQueryData<Notification[]>(
          notificationKeys.lists(),
          (old = []) => old.filter(n => n.id !== notificationId)
        );
      });
      
      // User presence handlers
      socketInstance.on('user:online', (userId: string) => {
        setOnlineUsers(prev => new Set([...prev, userId]));
      });
      
      socketInstance.on('user:offline', (userId: string) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      });
      
      socketInstance.on('user:status', ({ userId, status }) => {
        if (status === 'online') {
          setOnlineUsers(prev => new Set([...prev, userId]));
        } else if (status === 'offline') {
          setOnlineUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
          });
        }
      });
      
      return () => {
        disconnectSocket();
        setSocket(null);
        setIsConnected(false);
      };
    }
  }, [token, queryClient]);
  
  // Notification methods
  const markNotificationAsRead = useCallback((notificationId: string) => {
    socket?.emit('notification:markRead', notificationId);
  }, [socket]);
  
  const markAllNotificationsAsRead = useCallback(() => {
    socket?.emit('notification:markAllRead');
  }, [socket]);
  
  // Message methods
  const sendMessage = useCallback((conversationId: string, content: string) => {
    socket?.emit('message:send', { conversationId, content });
  }, [socket]);
  
  const editMessage = useCallback((messageId: string, content: string) => {
    socket?.emit('message:edit', { messageId, content });
  }, [socket]);
  
  const deleteMessage = useCallback((messageId: string) => {
    socket?.emit('message:delete', messageId);
  }, [socket]);
  
  const markMessagesAsRead = useCallback((conversationId: string, messageIds: string[]) => {
    socket?.emit('message:markRead', { conversationId, messageIds });
  }, [socket]);
  
  const sendTypingIndicator = useCallback((conversationId: string, isTyping: boolean) => {
    socket?.emit('message:typing', { conversationId, isTyping });
  }, [socket]);
  
  // Conversation methods
  const joinConversation = useCallback((conversationId: string) => {
    socket?.emit('conversation:join', conversationId);
  }, [socket]);
  
  const leaveConversation = useCallback((conversationId: string) => {
    socket?.emit('conversation:leave', conversationId);
  }, [socket]);
  
  const createConversation = useCallback((
    userIds: string[], 
    type: 'direct' | 'group', 
    name?: string
  ) => {
    socket?.emit('conversation:create', { userIds, type, name });
  }, [socket]);
  
  // Presence methods
  const updatePresence = useCallback((status: 'online' | 'away' | 'offline') => {
    socket?.emit('presence:update', status);
  }, [socket]);
  
  const value: WebSocketContextValue = {
    socket,
    isConnected,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    sendMessage,
    editMessage,
    deleteMessage,
    markMessagesAsRead,
    sendTypingIndicator,
    joinConversation,
    leaveConversation,
    createConversation,
    updatePresence,
    onlineUsers,
  };
  
  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextValue => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
