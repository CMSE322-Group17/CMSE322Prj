import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import messageAPI from '../services/messageAPI';
import { requestNotificationPermission, showPurchaseRequestNotification, showRequestStatusNotification } from '../utils/notificationUtils';
import { MessageContext } from './MessageContextDef';
import { swapOfferAPI } from '../services/api';

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
      
      // Connect WebSocket when user is authenticated
      messageAPI.wsManager.connect(); 
    }

    // Optional: Add a cleanup function if wsManager had a disconnect method
    // return () => {
    //   if (messageAPI.wsManager.connection && messageAPI.wsManager.connection.readyState === WebSocket.OPEN) {
    //     // messageAPI.wsManager.disconnect(); // Assuming a disconnect method exists
    //   }
    // };
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
              : [{ // This is the single attachment case
                  id: msg.attachments.data.id,
                  url: msg.attachments.data.attributes?.url || null, // Corrected: use msg.attachments.data.attributes
                  ...(msg.attachments.data.attributes || {}) // Corrected: use msg.attachments.data.attributes and spread safely
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

  // Helper function to map message/chat IDs to transaction IDs
  const getTransactionID = useCallback((messageType, chatId) => {
    // For a swap offer message, find a corresponding transaction in the system
    let transactionId = null;
    
    if (messageType === 'swap_offer') {
      // Map of chat IDs to transaction IDs for swap offers
      const swapTransactionMap = {
        '2_1_303': 'pending-swap-1',
        '3_1_707': 'pending-swap-2',
        '6_1_606': 'pending-swap-3',
        '7_1_808': 'scheduled-swap-1',
        '8_1_505': 'pending-swap-4',
        '9_1_606': 'pending-swap-5',
        '2_1_101': 'completed-swap-1'  // Adding a mapping for a completed swap
      };
      
      transactionId = swapTransactionMap[chatId];
    } else if (messageType === 'purchase_request') {
      // Map of chat IDs to transaction IDs for purchase requests
      const purchaseTransactionMap = {
        '4_1_404': 'scheduled-purchase-1',
        '5_1_505': 'cancelled-purchase-1',
        '8_1_909': 'pending-purchase-1',
        '9_1_1010': 'pending-purchase-2',
        '3_1_202': 'completed-purchase-1',
        '10_1_606': 'pending-purchase-3',
        '11_1_707': 'pending-purchase-4'
      };
      
      transactionId = purchaseTransactionMap[chatId];
    }
    
    if (!transactionId) {
      console.warn(`MessageContext: No transaction mapping found for ${messageType} with chat ID ${chatId}`);
      
      // In a real application, we would fetch this from the database
      // For now in our demo app, we'll create a predictable ID if it doesn't exist
      if (messageType === 'swap_offer') {
        transactionId = `pending-swap-${chatId.split('_')[2]}`;
      } else if (messageType === 'purchase_request') {
        transactionId = `pending-purchase-${chatId.split('_')[2]}`;
      }
    } else {
      console.log(`MessageContext: Found transaction ${transactionId} for ${messageType} with chat ID ${chatId}`);
    }
    
    return transactionId;
  }, []);

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
             // Identify which transaction this message relates to
        let transactionId = null;
        
        transactionId = getTransactionID(requestMessage.messageType, requestMessage.chatId);
        
        // If we found a related transaction, dispatch an event to update it
          if (transactionId) {
            const action = newStatus === 'accepted' ? 'accept' : 'decline';
            console.log(`MessageContext: Dispatch transaction update event: ${transactionId} - ${action}`);
            
            // Extract all possible message details to include in the event
            const messageDetails = {
              messageId: requestMessage.id,
              chatId: requestMessage.chatId,
              senderId: requestMessage.senderId,
              receiverId: requestMessage.receiverId,
              bookId: requestMessage.bookId,
              price: requestMessage.price,
              text: requestMessage.text,
              swapOfferId: requestMessage.swapOfferId,
              transactionType: requestMessage.messageType === 'swap_offer' ? 'swap' : 'purchase'
            };
            
            // Find book details from the chat ID if available
            const chatParts = requestMessage.chatId.split('_');
            if (chatParts.length >= 3) {
              const bookIdFromChat = chatParts[2];
              if (bookIdFromChat && !isNaN(parseInt(bookIdFromChat))) {
                messageDetails.bookIdFromChat = parseInt(bookIdFromChat);
              }
            }
            
            // Create and dispatch custom event with enhanced details
            const transactionEvent = new CustomEvent('transaction-update', {
              detail: {
                transactionId,
                action,
                ...messageDetails,
                timestamp: new Date().toISOString()
              },
              bubbles: true
            });
            document.dispatchEvent(transactionEvent);
            
            console.log(`MessageContext: Event dispatched with full details for transaction ${transactionId}`);
          } else {
            console.error(`MessageContext: No transaction mapping found for message ${messageId}. Event not dispatched.`);
          }
        }
        
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error updating request status:', err);
      setError(`Failed to update request to ${newStatus}`);
      return false;
    }
  }, [isAuthenticated, activeConversation, fetchConversations, getTransactionID]);

  // Function to start a swap offer
  const startSwapOffer = useCallback(async ({ chatId, offerBookIds, messageToOwner }) => {
    if (!isAuthenticated || !user?.id || !chatId || !offerBookIds?.length) {
      console.error('Swap offer prerequisites not met:', { isAuthenticated, userId: user?.id, chatId, offerBookIds });
      setError('Cannot start swap offer: missing required information.');
      return null;
    }

    setLoading(prev => ({ ...prev, sending: true }));
    try {
      const parts = chatId.split('_');
      if (parts.length < 3) {
        console.error('Invalid chatId format for swap offer:', chatId);
        setError('Cannot start swap offer: invalid chat ID format. Expected senderId_receiverId_bookId.');
        return null;
      }

      const userId1 = parts[0];
      const userId2 = parts[1];
      const bookIdFromChat = parts[2];

      let ownerId;
      // The owner of the requestedBook is the other participant in the chat.
      // The current user (user.id) is the requester of the swap.
      if (user.id.toString() === userId1) {
        ownerId = parseInt(userId2, 10);
      } else if (user.id.toString() === userId2) {
        ownerId = parseInt(userId1, 10);
      } else {
        console.error('Current user is not part of this chat:', { currentUserId: user.id, chatId });
        setError('Cannot start swap offer: user not in chat.');
        return null;
      }

      const requestedBookId = parseInt(bookIdFromChat, 10);

      if (isNaN(ownerId) || isNaN(requestedBookId)) {
          console.error('Failed to parse ownerId or requestedBookId from chatId:', { chatId, ownerId, requestedBookId });
          setError('Cannot start swap offer: invalid participant or book ID in chat.');
          return null;
      }

      // Log individual parts before constructing swapOfferData
      console.log('Swap Offer Data Components:', {
        owner: ownerId, // Corrected key to 'owner'
        requestedBook: requestedBookId, // Corrected key to 'requestedBook'
        offeredBooks: offerBookIds, // Corrected key to 'offeredBooks'
        chatId: chatId, // Corrected key to 'chatId'
        messageToOwner
      });

      const swapOfferData = {
        owner: ownerId, 
        requestedBook: requestedBookId, 
        offeredBooks: offerBookIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id)), 
        chatId: chatId, 
        ...(messageToOwner && { messageToOwner }), 
      };

      // This log helps verify the payload before sending
      console.log('Attempting to create swap offer with payload:', JSON.stringify({ data: swapOfferData }, null, 2));

      const response = await swapOfferAPI.createSwapOffer(swapOfferData);

      if (response.data) {
        // After successful swap offer creation, send a system message
        await sendMessage({
          chatId: swapOfferData.chatId,
          senderId: userRef.current.id, // System message, but sender is the proposer
          receiverId: swapOfferData.owner, // The owner of the requested book is the receiver
          text: `Swap offer proposed for book ID ${swapOfferData.requestedBook}. You offered ${swapOfferData.offeredBooks.length} book(s).`,
          messageType: 'swap_offer', // Changed from 'system_swap_offer'
          swapOfferId: response.data.id,
          isRead: false
        });

        await fetchConversations(); // Refresh conversations to show the new system message
        return response.data;
      }
      
      console.warn('Swap offer API call returned success but no data in response.');
      return null; 

    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'An unknown error occurred';
      console.error('Error starting swap offer:', err.response ? err.response.data : err.message);
      setError(`Failed to start swap offer: ${errorMessage}`);
      return null;
    } finally {
      setLoading(prev => ({ ...prev, sending: false }));
    }
  }, [isAuthenticated, user, fetchConversations, sendMessage, setError, setLoading]);

  // The exported context value
  const contextValue = {
    conversations,
    messages,
    unreadCount,
    loading,
    error,
    setError,
    activeConversation,
    notificationsEnabled,
    setActiveConversation,
    fetchConversations,
    fetchMessages,
    sendMessage, // Ensure sendMessage is correctly passed
    startSwapOffer,
    startConversation,
    createPurchaseRequest,
    updateRequestStatus,
    fetchUnreadCount,
    getTransactionID // Export the transaction ID mapping helper
  };

  return (
    <MessageContext.Provider value={contextValue}>
      {children}
    </MessageContext.Provider>
  );
};

// useMessage hook is now imported from ./useMessage.js