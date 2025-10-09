import { useContext } from 'react';
import { MessagingContext } from '../context/messagingContext';

export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
};