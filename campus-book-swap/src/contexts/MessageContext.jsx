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
    if (isAuthenticated && user) {
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
    if (!isAuthenticated || !user) return;
    
    setLoading(prev => ({ ...prev, conversations: true }));
    try {
      // Get the token from localStorage
      const token = localStorage.getItem('token');
      
      // Use getUserChats instead of getConversations
      const response = await messageAPI.getUserChats(user.id, token);
      
      // Process conversations
      const processedConversations = response.data?.data || [];
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
    if (!isAuthenticated || !user) return;
    
    try {
      const token = localStorage.getItem('token');
      const count = await messageAPI.getUnreadMessageCount(user.id, token);
      setUnreadCount(count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, [isAuthenticated, user]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (chatId) => {
    if (!isAuthenticated || !chatId) return;
    
    setLoading(prev => ({ ...prev, messages: true }));
    try {
      const token = localStorage.getItem('token');
      const response = await messageAPI.getChatMessages(chatId, token);
      
      // Process messages
      const processedMessages = response.data?.data || [];
      setMessages(processedMessages);
      
      // Update active conversation
      setActiveConversation(chatId);
      
      // Mark messages as read
      if (user && processedMessages.length > 0) {
        await messageAPI.markAllMessagesAsRead(chatId, user.id);
        // Update unread count
        fetchUnreadCount();
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
    if (!isAuthenticated || !user) return null;
    
    setLoading(prev => ({ ...prev, sending: true }));
    try {
      const token = localStorage.getItem('token');
      const response = await messageAPI.sendMessage({
        ...messageData,
        senderId: user.id
      }, token);
      
      // Add the new message to the messages list
      const newMessage = response.data?.data;
      if (newMessage) {
        setMessages(prev => [...prev, newMessage]);
      }
      
      setError(null);
      return response.data;
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
    if (!isAuthenticated || !user) return null;
    
    try {
      // Create chat ID using user IDs and book ID
      const chatId = `${user.id}_${receiverId}_${bookId}`;
      
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
    if (!isAuthenticated) return false;
    
    try {
      const token = localStorage.getItem('token');
      await messageAPI.deleteMessage(messageId, token);
      
      // Update messages list
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      return true;
    } catch (err) {
      console.error('Error deleting message:', err);
      setError('Failed to delete message');
      return false;
    }
  }, [isAuthenticated]);

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