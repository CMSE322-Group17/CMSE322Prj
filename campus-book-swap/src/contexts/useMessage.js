import { useContext } from 'react';
import { MessageContext } from './MessageContextDef';

// Custom hook to use the message context
export const useMessage = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessage must be used within a MessageProvider');
  }
  return context;
};
