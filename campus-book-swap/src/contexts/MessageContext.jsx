import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useAuth } from './AuthContext';
import messageAPI from '../services/messageAPI';

// Create context
const MessageContext = createContext();

export const MessageProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState({
    conversations: false,
    messages: false,
    sending: false
  });
  const [error, setError] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);

  // Reset state when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setConversations([]);
      setActiveConversation(null);
      setMessages([]);
      setUnreadCount(0);
      
      // Clear any polling intervals
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    }
  }, [isAuthenticated, pollingInterval]);

  // Fetch conversations when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchConversations();
      fetchUnreadCount();
      
      // Set up polling for unread messages
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 30000); // Poll every 30 seconds
      
      setPollingInterval(interval);
      
      return () => {
        clearInterval(interval);
      };
    }
  }, [isAuthenticated, user]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;
    
    setLoading(prev => ({ ...prev, conversations: true }));
    try {
      const response = await messageAPI.getUserChats(user.id);
      
      // Process conversations and ensure all images have valid sources
      const processedConversations = (response.data || []).map(conv => ({
        ...conv,
        lastMessage: {
          ...conv.lastMessage,
          // Ensure image sources are valid
          attachments: conv.lastMessage?.attachments?.map(attachment => ({
            ...attachment,
            url: attachment.url || null // Use null instead of empty string
          }))
        }
      }));
      
      setConversations(processedConversations);
      setError(null);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(prev => ({ ...prev, conversations: false }));
    }
  }, [isAuthenticated, user]);

  // Fetch unread message count
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;
    
    try {
      const count = await messageAPI.getUnreadMessageCount(user.id);
      setUnreadCount(count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
      // Don't update the count if there's an error
      // This prevents displaying incorrect information
    }
  }, [isAuthenticated, user]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (chatId) => {
    if (!isAuthenticated || !chatId || !user?.id) return;
    
    setLoading(prev => ({ ...prev, messages: true }));
    try {
      const response = await messageAPI.getChatMessages(chatId);
      
      // Process messages and ensure all images have valid sources
      const processedMessages = (response.data || []).map(msg => {
        // Handle attachments properly
        let attachments = [];
        if (msg.attachments) {
          // If attachments is an array, use it directly
          if (Array.isArray(msg.attachments)) {
            attachments = msg.attachments.map(attachment => ({
              ...attachment,
              url: attachment.url || null
            }));
          } 
          // If attachments is an object with data property (Strapi format)
          else if (msg.attachments.data) {
            attachments = Array.isArray(msg.attachments.data) 
              ? msg.attachments.data.map(attachment => ({
                  id: attachment.id,
                  url: attachment.attributes?.url || null,
                  ...attachment.attributes
                }))
              : [{
                  id: msg.attachments.data.id,
                  url: msg.attachments.data.attributes?.url || null,
                  ...msg.attachments.data.attributes
                }];
          }
        }

        return {
          ...msg,
          attachments
        };
      });
      
      setMessages(processedMessages);
      
      // Update active conversation
      setActiveConversation(chatId);
      
      // Mark messages as read
      if (processedMessages.length > 0) {
        try {
          await messageAPI.markAllMessagesAsRead(chatId, user.id);
          // Update unread count
          fetchUnreadCount();
        } catch (markReadError) {
          console.warn('Error marking messages as read:', markReadError);
          // Continue execution even if marking as read fails
          // Still attempt to update unread count
          fetchUnreadCount();
        }
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(prev => ({ ...prev, messages: false }));
    }
  }, [isAuthenticated, user, fetchUnreadCount]);

  // Send a message
  const sendMessage = useCallback(async (messageData) => {
    if (!isAuthenticated || !user?.id) return null;
    
    setLoading(prev => ({ ...prev, sending: true }));
    try {
      const response = await messageAPI.sendMessage({
        ...messageData,
        senderId: user.id
      });
      
      // Add the new message to the messages list
      const newMessage = response.data;
      if (newMessage) {
        // Handle attachments properly
        let attachments = [];
        if (newMessage.attachments) {
          // If attachments is an array, use it directly
          if (Array.isArray(newMessage.attachments)) {
            attachments = newMessage.attachments.map(attachment => ({
              ...attachment,
              url: attachment.url || null
            }));
          } 
          // If attachments is an object with data property (Strapi format)
          else if (newMessage.attachments.data) {
            attachments = Array.isArray(newMessage.attachments.data) 
              ? newMessage.attachments.data.map(attachment => ({
                  id: attachment.id,
                  url: attachment.attributes?.url || null,
                  ...attachment.attributes
                }))
              : [{
                  id: newMessage.attachments.data.id,
                  url: newMessage.attachments.data.attributes?.url || null,
                  ...newMessage.attachments.data.attributes
                }];
          }
        }

        setMessages(prev => [...prev, {
          ...newMessage,
          attachments
        }]);
      }
      
      setError(null);
      return response;
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      return null;
    } finally {
      setLoading(prev => ({ ...prev, sending: false }));
    }
  }, [isAuthenticated, user]);

  // Start a new conversation
  const startConversation = useCallback(async (receiverId, bookId, initialMessage) => {
    if (!isAuthenticated || !user?.id) return null;
    
    try {
      // Create chat ID using user IDs and book ID
      const chatId = messageAPI.createChatId(user.id, receiverId, bookId);
      
      // Send initial message
      const messageData = {
        chatId,
        receiverId,
        bookId,
        text: initialMessage || "Hi, I'm interested in this book.",
        messageType: 'text'
      };
      
      const response = await sendMessage(messageData);
      
      // Set as active conversation
      setActiveConversation(chatId);
      
      // Refresh conversations
      await fetchConversations();
      
      return response;
    } catch (err) {
      console.error('Error starting conversation:', err);
      setError('Failed to start conversation');
      return null;
    }
  }, [isAuthenticated, user, sendMessage, fetchConversations]);

  // Delete a message
  const deleteMessageById = useCallback(async (messageId) => {
    if (!isAuthenticated || !user?.id) return false;
    
    try {
      await messageAPI.deleteMessage(messageId);
      
      // Update messages list
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      return true;
    } catch (err) {
      console.error('Error deleting message:', err);
      setError('Failed to delete message');
      return false;
    }
  }, [isAuthenticated, user]);

  // Clear context errors
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Context value
  const value = {
    conversations,
    messages,
    activeConversation,
    unreadCount,
    loading,
    error,
    fetchConversations,
    fetchMessages,
    sendMessage,
    startConversation,
    deleteMessage: deleteMessageById,
    clearError
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};

// Custom hook to use the message context
export const useMessages = () => {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};

export default MessageContext;