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
            lastMessage.receiverId === userRef.current.id && 
            (!prevConv || 
             !prevConv.lastMessage || 
             prevConv.lastMessage.id !== lastMessage.id)) {
          
          // Get book and sender info for notification
          const chatParts = conv.chatId.split('_');
          // Handle chat ID format safely
          if (chatParts.length >= 3) {
            const senderId = userRef.current.id.toString() === chatParts[0] ? chatParts[1] : chatParts[0];
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
  }, [isAuthenticated]);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated || !userRef.current?.id) return;
    
    try {
      const count = await messageAPI.getUnreadMessageCount(userRef.current.id);
      setUnreadCount(count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, [isAuthenticated]);
  
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

  // Function to fetch messages for a specific conversation
  const fetchMessages = useCallback(async (chatId) => {
    if (!isAuthenticated || !userRef.current?.id || !chatId) return;
    
    setLoading(prev => ({ ...prev, messages: true }));
    try {
      const response = await messageAPI.getChatMessages(chatId);
      
      // Process messages to ensure all attachments have valid URLs
      const processedMessages = (response.data || []).map(msg => {
        // Handle possibly undefined attachments
        let attachments = [];
        
        if (msg.attachments) {
          // If attachments is an array, use it directly
          if (Array.isArray(msg.attachments)) {
            attachments = msg.attachments;
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
      
      // Sort messages by date
      const sortedMessages = processedMessages.sort((a, b) => {
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
      
      setMessages(sortedMessages);
      setError(null);
      
      // Mark messages as read
      if (sortedMessages.length > 0) {
        const unreadMessages = sortedMessages.filter(
          msg => msg.receiverId === userRef.current.id && !msg.isRead
        );
        
        if (unreadMessages.length > 0) {
          // Mark messages as read in parallel
          await Promise.all(
            unreadMessages.map(msg => messageAPI.markMessageAsRead(msg.id, userRef.current.id))
          );
          
          // Update unread count after marking messages as read
          fetchUnreadCount();
        }
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(prev => ({ ...prev, messages: false }));
    }
  }, [isAuthenticated, fetchUnreadCount]);

  // Function to send a message
  const sendMessage = useCallback(async (messageData) => {
    if (!isAuthenticated || !userRef.current) return;
    
    setLoading(prev => ({ ...prev, sending: true }));
    try {
      // Add sender ID if not provided
      if (!messageData.senderId) {
        messageData.senderId = userRef.current.id;
      }
      
      const response = await messageAPI.sendMessage(messageData);
      
      // Update messages and conversations
      if (response.data) {
        // Update messages if we're in the active conversation
        if (activeConversation === messageData.chatId) {
          // Add the new message to the messages state
          setMessages(prevMessages => [...prevMessages, response.data]);
        }
        
        // Always update conversations list to reflect the latest message
        setTimeout(() => {
          fetchConversations();
        }, 100);
      }
      
      return response.data;
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      throw err;
    } finally {
      setLoading(prev => ({ ...prev, sending: false }));
    }
  }, [isAuthenticated, activeConversation, fetchConversations]);

  // Function to start a new conversation
  const startConversation = useCallback(async (receiverId, bookId, initialMessage) => {
    if (!isAuthenticated || !userRef.current?.id || !receiverId || !bookId) {
      return null;
    }
    
    try {
      // Create a chat ID using the message API utility
      const chatId = messageAPI.createChatId(userRef.current.id, receiverId, bookId);
      
      // Check if conversation already exists
      const existingConversation = conversationsRef.current.find(
        conv => conv.chatId === chatId
      );
      
      if (existingConversation) {
        // If it exists, just set it as active and return the chat ID
        setActiveConversation(chatId);
        return chatId;
      }
      
      // Otherwise, send the first message to start the conversation
      if (initialMessage) {
        await sendMessage({
          chatId,
          senderId: userRef.current.id,
          receiverId,
          bookId,
          text: initialMessage,
          messageType: 'text'
        });
      }
      
      // Refresh conversations to include the new one
      await fetchConversations();
      
      // Set the new conversation as active
      setActiveConversation(chatId);
      
      return chatId;
    } catch (err) {
      console.error('Error starting conversation:', err);
      setError('Failed to start conversation');
      return null;
    }
  }, [isAuthenticated, fetchConversations, sendMessage]);

  // Function to create a purchase request
  const createPurchaseRequest = useCallback(async (receiverId, bookId, price, note) => {
    if (!isAuthenticated || !userRef.current?.id || !receiverId || !bookId) {
      return null;
    }
    
    try {
      // Create a chat ID
      const chatId = messageAPI.createChatId(userRef.current.id, receiverId, bookId);
      
      // Create request message
      const requestData = {
        chatId,
        senderId: userRef.current.id,
        receiverId,
        bookId,
        price,
        text: note || `I'd like to purchase this book for $${price}.`,
        messageType: 'purchase_request',
        requestStatus: 'pending',
        isRead: false
      };
      
      // Send the purchase request
      const response = await sendMessage(requestData);
      
      // Refresh conversations
      await fetchConversations();
      
      return response;
    } catch (err) {
      console.error('Error creating purchase request:', err);
      setError('Failed to create purchase request');
      return null;
    }
  }, [isAuthenticated, sendMessage, fetchConversations]);

  // Function to update a request status
  const updateRequestStatus = useCallback(async (messageId, newStatus) => {
    if (!isAuthenticated || !userRef.current) {
      return false;
    }
    
    try {
      const response = await messageAPI.updateRequestStatus(messageId, newStatus);
      
      if (response.data) {
        // If the update was successful, refresh message list and conversations
        // Update messages if we're viewing the conversation containing this message
        if (activeConversation) {
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg.id === messageId 
                ? { ...msg, requestStatus: newStatus } 
                : msg
            )
          );
        }
        
        // Use setTimeout to prevent any possible render loops
        setTimeout(() => {
          fetchConversations();
        }, 100);
        
        // Show notification about status change
        const requestMessage = messagesRef.current.find(msg => msg.id === messageId);
        if (requestMessage) {
          showRequestStatusNotification(requestMessage, newStatus);
        }
        
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error updating request status:', err);
      setError(`Failed to update request to ${newStatus}`);
      return false;
    }
  }, [isAuthenticated, activeConversation, fetchConversations]);

  // The exported context value
  const contextValue = {
    conversations,
    messages,
    unreadCount,
    loading,
    error,
    activeConversation,
    notificationsEnabled,
    setActiveConversation,
    fetchConversations,
    fetchMessages,
    sendMessage,
    startConversation,
    createPurchaseRequest,
    updateRequestStatus,
    fetchUnreadCount
  };

  return (
    <MessageContext.Provider value={contextValue}>
      {children}
    </MessageContext.Provider>
  );
};

// useMessage hook is now imported from ./useMessage.js