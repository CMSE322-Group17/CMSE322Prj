import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import messageAPI from '../services/messageAPI';
import { requestNotificationPermission, showPurchaseRequestNotification, showRequestStatusNotification } from '../utils/notificationUtils';
import { MessageContext } from './MessageContextDef';

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
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  // Use refs to avoid dependency cycles
  const conversationsRef = useRef(conversations);
  const messagesRef = useRef(messages);
  const userRef = useRef(user);
  
  // Keep refs updated with current state
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);
  
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Request notification permission when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      const checkNotificationPermission = async () => {
        const permissionGranted = await requestNotificationPermission();
        setNotificationsEnabled(permissionGranted);
      };
      checkNotificationPermission();
    }
  }, [isAuthenticated]);

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

  // Define the fetch functions
  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated || !userRef.current?.id) return;
    
    setLoading(prev => ({ ...prev, conversations: true }));
    try {
      const response = await messageAPI.getUserChats(userRef.current.id);
      
      // Process conversations and ensure all images have valid sources
      const processedConversations = (response.data || []).map(conv => {
        // Handle possibly undefined attachments
        let attachments = [];
        
        if (conv.lastMessage?.attachments) {
          // If attachments is an array, use it directly
          if (Array.isArray(conv.lastMessage.attachments)) {
            attachments = conv.lastMessage.attachments.map(attachment => ({
              ...attachment,
              url: attachment.url || null
            }));
          } 
          // If attachments is an object with data property (Strapi format)
          else if (conv.lastMessage.attachments.data) {
            attachments = Array.isArray(conv.lastMessage.attachments.data) 
              ? conv.lastMessage.attachments.data.map(attachment => ({
                  id: attachment.id,
                  url: attachment.attributes?.url || null,
                  ...attachment.attributes
                }))
              : [{
                  id: conv.lastMessage.attachments.data.id,
                  url: conv.lastMessage.attachments.data.attributes?.url || null,
                  ...conv.lastMessage.attachments.data.attributes
                }];
          }
        }
        
        return {
          ...conv,
          lastMessage: {
            ...conv.lastMessage,
            attachments
          }
        };
      });
      
      // Get previous conversations from state for comparison
      const previousConvs = new Map(conversationsRef.current.map(conv => [conv.chatId, conv]));
      
      // Check for new purchase requests where the current user is the receiver
      processedConversations.forEach(conv => {
        const prevConv = previousConvs.get(conv.chatId);
        const lastMessage = conv.lastMessage;
        
        if (lastMessage && 
            lastMessage.messageType === 'purchase_request' && 
            lastMessage.requestStatus === 'pending' && 
            lastMessage.receiverId === user.id && 
            (!prevConv || 
             !prevConv.lastMessage || 
             prevConv.lastMessage.id !== lastMessage.id)) {
          
          // Get book and sender info for notification
          const chatParts = conv.chatId.split('_');
          // Handle chat ID format safely
          if (chatParts.length >= 3) {
            const senderId = user.id.toString() === chatParts[0] ? chatParts[1] : chatParts[0];
            const bookId = chatParts[2];
            
            // Show notification for new purchase request
            showPurchaseRequestNotification(
              lastMessage,
              { id: bookId, title: conv.bookTitle || "Book" },
              { id: senderId, username: conv.senderName || "Buyer" }
            );
          }
        }
      });
      
      setConversations(processedConversations);
      setError(null);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(prev => ({ ...prev, conversations: false }));
    }
  }, [isAuthenticated, user, conversations]);

  // Fetch unread message count function
  const fetchUnreadCountRef = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;
    
    try {
      const count = await messageAPI.getUnreadMessageCount(user.id);
      setUnreadCount(count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, [isAuthenticated, user]);
  
  // Save these functions to refs to avoid dependency cycles
  const fetchConversations = useCallback(() => {
    fetchConversationsRef();
  }, [fetchConversationsRef]);
  
  const fetchUnreadCount = useCallback(() => {
    fetchUnreadCountRef();
  }, [fetchUnreadCountRef]);
  
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
  }, [isAuthenticated, user, fetchConversations, fetchUnreadCount]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;
    
    setLoading(prev => ({ ...prev, conversations: true }));
    try {
      const response = await messageAPI.getUserChats(user.id);
      
      // Process conversations and ensure all images have valid sources
      const processedConversations = (response.data || []).map(conv => {
        // Handle possibly undefined attachments
        let attachments = [];
        
        if (conv.lastMessage?.attachments) {
          // If attachments is an array, use it directly
          if (Array.isArray(conv.lastMessage.attachments)) {
            attachments = conv.lastMessage.attachments.map(attachment => ({
              ...attachment,
              url: attachment.url || null
            }));
          } 
          // If attachments is an object with data property (Strapi format)
          else if (conv.lastMessage.attachments.data) {
            attachments = Array.isArray(conv.lastMessage.attachments.data) 
              ? conv.lastMessage.attachments.data.map(attachment => ({
                  id: attachment.id,
                  url: attachment.attributes?.url || null,
                  ...attachment.attributes
                }))
              : [{
                  id: conv.lastMessage.attachments.data.id,
                  url: conv.lastMessage.attachments.data.attributes?.url || null,
                  ...conv.lastMessage.attachments.data.attributes
                }];
          }
        }
        
        return {
          ...conv,
          lastMessage: {
            ...conv.lastMessage,
            attachments
          }
        };
      });
      
      // Use ref for previous conversations to avoid dependency cycle
      // Check for new purchase requests where the current user is the receiver
      const previousConvs = new Map(conversationsRef.current.map(conv => [conv.chatId, conv]));
      
      processedConversations.forEach(conv => {
        const prevConv = previousConvs.get(conv.chatId);
        const lastMessage = conv.lastMessage;
        
        // If this is a new conversation or a updated conversation with a purchase request
        if (lastMessage && 
            lastMessage.messageType === 'purchase_request' && 
            lastMessage.requestStatus === 'pending' && 
            lastMessage.receiverId === user.id &&
            (!prevConv || 
             !prevConv.lastMessage || 
             prevConv.lastMessage.id !== lastMessage.id)) {
          
          // Get book and sender info for notification
          const chatParts = conv.chatId.split('_');
          if (chatParts.length >= 3) {
            const senderId = chatParts[0] === user.id.toString() ? chatParts[1] : chatParts[0];
            const bookId = chatParts[2];
            
            // Show notification for new purchase request
            showPurchaseRequestNotification(
              lastMessage,
              { id: bookId, title: conv.bookTitle || "Book" },
              { id: senderId, username: conv.senderName || "Buyer" }
            );
          }
        }
      });
      
      setConversations(processedConversations);
      setError(null);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(prev => ({ ...prev, conversations: false }));
    }
  }, [isAuthenticated, user]); // Removed conversation dependency, using ref instead

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
      
      // Send initial message as a purchase request
      const messageData = {
        chatId,
        receiverId,
        bookId,
        text: initialMessage || "Hi, I'm interested in this book.",
        messageType: 'purchase_request',
        requestStatus: 'pending'
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

  // Update request status
  const updateRequestStatus = useCallback(async (messageId, newStatus) => {
    if (!isAuthenticated || !user?.id) return false;
    
    try {
      await messageAPI.updateRequestStatus(messageId, newStatus);
      
      // Find the message and update it in the messages array
      setMessages(prevMessages => {
        // Get the updated message first for notification purposes
        const updatedMessage = prevMessages.find(msg => msg.id === messageId);
        
        // If message found, queue a notification outside the state update
        if (updatedMessage && updatedMessage.senderId !== user.id) {
          // Run notification in next tick to avoid render issues
          setTimeout(() => {
            showRequestStatusNotification(
              updatedMessage,
              newStatus,
              { title: updatedMessage.bookTitle || "Book" }
            );
          }, 0);
        }
        
        // Return updated messages array
        return prevMessages.map(msg => 
          msg.id === messageId 
            ? { ...msg, requestStatus: newStatus } 
            : msg
        );
      });
      
      // Update the affected conversation as well, but with a small delay
      // to prevent the infinite loop
      setTimeout(() => {
        fetchConversations();
      }, 100);
      
      return true;
    } catch (err) {
      console.error('Error updating request status:', err);
      setError('Failed to update request status');
      return false;
    }
  }, [isAuthenticated, user, fetchConversations]);

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
    updateRequestStatus,
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