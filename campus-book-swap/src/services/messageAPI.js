// src/services/messageAPI.js

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;
const WS_URL = import.meta.env.VITE_WS_URL || API_URL.replace('http', 'ws');

// WebSocket connection management
const wsManager = {
  connection: null,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  reconnectDelay: 1000,
  messageHandlers: new Map(),
  isConnecting: false,

  connect() {
    if (this.connection?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    this.connection = new WebSocket(WS_URL);

    this.connection.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.isConnecting = false;
      this.authenticate();
    };

    this.connection.onclose = () => {
      console.log('WebSocket disconnected');
      this.isConnecting = false;
      this.handleReconnect();
    };

    this.connection.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.isConnecting = false;
    };

    this.connection.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  },

  authenticate() {
    const token = localStorage.getItem('token');
    if (token) {
      this.send({
        type: 'authenticate',
        token
      });
    }
  },

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      setTimeout(() => this.connect(), delay);
    }
  },

  send(message) {
    if (this.connection?.readyState === WebSocket.OPEN) {
      this.connection.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent:', message);
    }
  },

  subscribe(event, handler) {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, new Set());
    }
    this.messageHandlers.get(event).add(handler);
  },

  unsubscribe(event, handler) {
    const handlers = this.messageHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  },

  handleMessage(message) {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => handler(message.data));
    }
  }
};

// Message search
const messageSearch = {
  async searchMessages(query, userId) {
    if (!query || !userId) {
      throw new Error('Search query and user ID are required');
    }

    const cancelToken = createCancelToken();

    try {
      const response = await api.get(
        `/api/messages?filters[$or][0][senderId][$eq]=${userId}&filters[$or][1][receiverId][$eq]=${userId}&filters[text][$contains]=${encodeURIComponent(query)}&sort=timestamp:desc`,
        {
          cancelToken: cancelToken.token,
          retry: true
        }
      );

      if (!response.data?.data) {
        return { data: [] };
      }

      return {
        data: response.data.data.map(msg => ({
          id: msg.id,
          ...msg.attributes
        }))
      };
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request cancelled:', error.message);
        return { data: [] };
      }
      console.error('Error searching messages:', error);
      throw error;
    } finally {
      cancelToken.cancel('Operation cancelled due to new request');
    }
  }
};

// Error recovery
const errorRecovery = {
  async recoverFromError(error, operation, retryData) {
    console.error(`Error in ${operation}:`, error);

    // Handle specific error cases
    if (error.response?.status === 401) {
      // Try to refresh token
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          const { token } = response.data;
          localStorage.setItem('token', token);
          return true; // Retry the operation
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        return false;
      }
    }
    
    // Handle 400 errors (Bad Request) - may be due to malformed query parameters
    if (error.response?.status === 400) {
      console.error('Bad request error details:', error.response?.data);
      // Don't retry automatically for bad request errors
      return false;
    }

    // Handle network errors
    if (!navigator.onLine) {
      if (operation === 'sendMessage' && retryData) {
        messageQueue.add(retryData);
        return true;
      }
      return false;
    }

    // Handle server errors
    if (error.response?.status >= 500) {
      // Wait and retry
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    }

    return false;
  }
};

// Message encryption
const messageEncryption = {
  async encrypt(text) {
    try {
      // In a real app, you would use a proper encryption library
      // This is just a placeholder for demonstration
      return btoa(text);
    } catch (error) {
      console.error('Encryption error:', error);
      return text;
    }
  },

  async decrypt(text) {
    try {
      // In a real app, you would use a proper decryption library
      // This is just a placeholder for demonstration
      return atob(text);
    } catch (error) {
      console.error('Decryption error:', error);
      return text;
    }
  }
};

// Cache configuration
const cache = {
  data: new Map(),
  maxAge: 5 * 60 * 1000, // 5 minutes

  set(key, value) {
    this.data.set(key, {
      value,
      timestamp: Date.now()
    });
  },

  get(key) {
    const item = this.data.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.maxAge) {
      this.data.delete(key);
      return null;
    }

    return item.value;
  },

  delete(key) {
    this.data.delete(key);
  },

  clear() {
    this.data.clear();
  }
};

// Performance monitoring
const performanceMonitor = {
  metrics: new Map(),

  startOperation(operation) {
    this.metrics.set(operation, {
      startTime: performance.now(),
      count: 0,
      totalTime: 0
    });
  },

  endOperation(operation) {
    const metric = this.metrics.get(operation);
    if (metric) {
      const duration = performance.now() - metric.startTime;
      metric.count++;
      metric.totalTime += duration;
      metric.avgTime = metric.totalTime / metric.count;
    }
  },

  getMetrics() {
    return Object.fromEntries(this.metrics);
  }
};

// Rate limiting configuration
const rateLimiter = {
  requests: new Map(),
  maxRequests: 30, // Increased from 10 to 30
  timeWindow: 60000, // 1 minute
  retryAfter: 2000, // 2 seconds

  canMakeRequest(endpoint) {
    const now = Date.now();
    const endpointRequests = this.requests.get(endpoint) || [];
    
    // Remove old requests outside the time window
    const recentRequests = endpointRequests.filter(time => now - time < this.timeWindow);
    
    if (recentRequests.length >= this.maxRequests) {
      // Calculate when the next request can be made
      const oldestRequest = recentRequests[0];
      const waitTime = this.timeWindow - (now - oldestRequest);
      throw new Error(`Rate limit exceeded. Please try again in ${Math.ceil(waitTime / 1000)} seconds.`);
    }
    
    // Add current request
    recentRequests.push(now);
    this.requests.set(endpoint, recentRequests);
    return true;
  },

  reset(endpoint) {
    this.requests.delete(endpoint);
  }
};

// Message validation
const messageValidator = {
  validateMessage(message) {
    const errors = [];

    if (!message.text?.trim()) {
      errors.push('Message text is required');
    }

    if (message.text?.length > 1000) {
      errors.push('Message text must be less than 1000 characters');
    }

    if (!message.senderId) {
      errors.push('Sender ID is required');
    }

    if (!message.receiverId) {
      errors.push('Receiver ID is required');
    }

    if (!message.bookId) {
      errors.push('Book ID is required');
    }

    if (message.senderId === message.receiverId) {
      errors.push('Cannot send message to yourself');
    }

    if (message.messageType && !['general', 'purchase_request', 'swap_offer', 'request_accepted', 'request_declined'].includes(message.messageType)) {
      errors.push('Invalid message type');
    }

    if (message.requestStatus && !['pending', 'accepted', 'declined', 'completed', 'cancelled'].includes(message.requestStatus)) {
      errors.push('Invalid request status');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

// Message queue for offline support
const messageQueue = {
  queue: [],
  processing: false,

  add(message) {
    // Validate message before adding to queue
    const validation = messageValidator.validateMessage(message);
    if (!validation.isValid) {
      throw new Error(`Invalid message: ${validation.errors.join(', ')}`);
    }

    this.queue.push({
      ...message,
      timestamp: new Date().toISOString(),
      retryCount: 0
    });
    this.saveQueue();
    this.processQueue();
  },

  remove(messageId) {
    this.queue = this.queue.filter(msg => msg.id !== messageId);
    this.saveQueue();
  },

  saveQueue() {
    try {
      localStorage.setItem('messageQueue', JSON.stringify(this.queue));
    } catch (error) {
      console.error('Error saving message queue:', error);
    }
  },

  loadQueue() {
    try {
      const savedQueue = localStorage.getItem('messageQueue');
      if (savedQueue) {
        this.queue = JSON.parse(savedQueue);
      }
    } catch (error) {
      console.error('Error loading message queue:', error);
      this.queue = [];
    }
  },

  async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    const message = this.queue[0];

    try {
      await messageAPI.sendMessage(message);
      this.remove(message.id);
    } catch (error) {
      message.retryCount++;
      if (message.retryCount >= 3) {
        this.remove(message.id);
        console.error('Message failed after 3 retries:', message);
      }
    } finally {
      this.processing = false;
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), 1000);
      }
    }
  }
};

// Load saved queue on startup
messageQueue.loadQueue();

// Import the shared API instance from api.js (unused for now but available if needed)
import { api as sharedApi } from './api.js';

// Create a specialized message API instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for rate limiting and auth
api.interceptors.request.use(
  async (config) => {
    // Add auth token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Check rate limit
    const endpoint = config.url;
    try {
      rateLimiter.canMakeRequest(endpoint);
    } catch (error) {
      if (error.message.includes('Rate limit exceeded')) {
        // Wait for the specified time before retrying
        await new Promise(resolve => setTimeout(resolve, rateLimiter.retryAfter));
        // Reset the rate limit for this endpoint
        rateLimiter.reset(endpoint);
      }
      throw error;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle token refresh here if needed
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Create a cancel token source
const createCancelToken = () => axios.CancelToken.source();

// Retry configuration
const retryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504]
};

// Retry interceptor
api.interceptors.response.use(null, async error => {
  const { config } = error;
  if (!config || !config.retry) {
    return Promise.reject(error);
  }

  config.retryCount = config.retryCount || 0;

  if (config.retryCount >= retryConfig.maxRetries) {
    return Promise.reject(error);
  }

  if (!retryConfig.retryableStatusCodes.includes(error.response?.status)) {
    return Promise.reject(error);
  }

  config.retryCount += 1;
  const delay = retryConfig.retryDelay * Math.pow(2, config.retryCount - 1);
  
  await new Promise(resolve => setTimeout(resolve, delay));
  return api(config);
});

// Typing indicator management
const typingManager = {
  typingUsers: new Map(),
  typingTimeout: 5000, // 5 seconds

  startTyping(chatId, userId) {
    const key = `${chatId}_${userId}`;
    this.typingUsers.set(key, Date.now());
    this.notifyTypingStatus(chatId, userId, true);
  },

  stopTyping(chatId, userId) {
    const key = `${chatId}_${userId}`;
    this.typingUsers.delete(key);
    this.notifyTypingStatus(chatId, userId, false);
  },

  isTyping(chatId, userId) {
    const key = `${chatId}_${userId}`;
    const timestamp = this.typingUsers.get(key);
    if (!timestamp) return false;
    
    // Check if typing status has expired
    if (Date.now() - timestamp > this.typingTimeout) {
      this.typingUsers.delete(key);
      return false;
    }
    return true;
  },

  notifyTypingStatus(chatId, userId, isTyping) {
    wsManager.send({
      type: 'typing_status',
      data: {
        chatId,
        userId,
        isTyping
      }
    });
  },

  cleanup() {
    const now = Date.now();
    for (const [key, timestamp] of this.typingUsers.entries()) {
      if (now - timestamp > this.typingTimeout) {
        const [chatId, userId] = key.split('_');
        this.stopTyping(chatId, userId);
      }
    }
  }
};

// Message reactions
const reactionManager = {
  async addReaction(messageId, userId, reaction) {
    if (!messageId || !userId || !reaction) {
      throw new Error('Message ID, User ID, and reaction are required');
    }

    const cancelToken = createCancelToken();

    try {
      const response = await api.put(
        `/api/messages/${messageId}`,
        {
          data: {
            reactions: {
              [userId]: reaction
            }
          }
        },
        {
          cancelToken: cancelToken.token,
          retry: true
        }
      );

      // Notify via WebSocket
      wsManager.send({
        type: 'reaction_added',
        data: {
          messageId,
          userId,
          reaction
        }
      });

      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request cancelled:', error.message);
        throw new Error('Operation was cancelled');
      }

      // Try to recover from error
      const shouldRetry = await errorRecovery.recoverFromError(error, 'addReaction');
      if (shouldRetry) {
        return reactionManager.addReaction(messageId, userId, reaction);
      }

      console.error('Error adding reaction:', error);
      throw error;
    } finally {
      cancelToken.cancel('Operation cancelled due to new request');
    }
  },

  async removeReaction(messageId, userId) {
    if (!messageId || !userId) {
      throw new Error('Message ID and User ID are required');
    }

    const cancelToken = createCancelToken();

    try {
      const response = await api.put(
        `/api/messages/${messageId}`,
        {
          data: {
            reactions: {
              [userId]: null
            }
          }
        },
        {
          cancelToken: cancelToken.token,
          retry: true
        }
      );

      // Notify via WebSocket
      wsManager.send({
        type: 'reaction_removed',
        data: {
          messageId,
          userId
        }
      });

      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request cancelled:', error.message);
        throw new Error('Operation was cancelled');
      }

      // Try to recover from error
      const shouldRetry = await errorRecovery.recoverFromError(error, 'removeReaction');
      if (shouldRetry) {
        return reactionManager.removeReaction(messageId, userId);
      }

      console.error('Error removing reaction:', error);
      throw error;
    } finally {
      cancelToken.cancel('Operation cancelled due to new request');
    }
  }
};

// Read receipts
const readReceiptManager = {
  async markMessageAsRead(messageId, userId) {
    if (!messageId || !userId) {
      throw new Error('Message ID and User ID are required');
    }

    const cancelToken = createCancelToken();

    try {
      const response = await api.put(
        `/api/messages/${messageId}`,
        {
          data: {
            readBy: {
              [userId]: new Date().toISOString()
            }
          }
        },
        {
          cancelToken: cancelToken.token,
          retry: true
        }
      );

      // Notify via WebSocket
      wsManager.send({
        type: 'message_read',
        data: {
          messageId,
          userId,
          timestamp: new Date().toISOString()
        }
      });

      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request cancelled:', error.message);
        throw new Error('Operation was cancelled');
      }

      // Try to recover from error
      const shouldRetry = await errorRecovery.recoverFromError(error, 'markMessageAsRead');
      if (shouldRetry) {
        return readReceiptManager.markMessageAsRead(messageId, userId);
      }

      console.error('Error marking message as read:', error);
      throw error;
    } finally {
      cancelToken.cancel('Operation cancelled due to new request');
    }
  },

  async getReadReceipts(messageId) {
    if (!messageId) {
      throw new Error('Message ID is required');
    }

    const cancelToken = createCancelToken();

    try {
      const response = await api.get(
        `/api/messages/${messageId}`,
        {
          cancelToken: cancelToken.token,
          retry: true
        }
      );

      return response.data?.data?.attributes?.readBy || {};
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request cancelled:', error.message);
        return {};
      }

      // Try to recover from error
      const shouldRetry = await errorRecovery.recoverFromError(error, 'getReadReceipts');
      if (shouldRetry) {
        return readReceiptManager.getReadReceipts(messageId);
      }

      console.error('Error getting read receipts:', error);
      return {};
    } finally {
      cancelToken.cancel('Operation cancelled due to new request');
    }
  }
};

/**
 * Message API service with real Strapi implementation
 */
const messageAPI = {
  /**
   * Initialize WebSocket connection
   */
  initializeWebSocket() {
    wsManager.connect();
  },

  /**
   * Subscribe to WebSocket events
   */
  subscribeToEvents(event, handler) {
    wsManager.subscribe(event, handler);
  },

  /**
   * Unsubscribe from WebSocket events
   */
  unsubscribeFromEvents(event, handler) {
    wsManager.unsubscribe(event, handler);
  },

  /**
   * Get all messages for a specific chat
   */
  getChatMessages: async (chatId) => {
    if (!chatId) {
      throw new Error('Chat ID is required');
    }

    // Check cache first
    const cacheKey = `chat_${chatId}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const cancelToken = createCancelToken();

    try {
      // Properly encode the chatId and format the query parameters
      const encodedChatId = encodeURIComponent(chatId);
      const response = await api.get(
        `/api/messages?filters[ChatId][$eq]=${encodedChatId}&sort[0]=timestamp:desc&populate=*`,
        { 
          cancelToken: cancelToken.token,
          retry: true
        }
      );
      
      if (!response.data?.data) {
        return { data: [] };
      }

      const result = {
        data: response.data.data.map(msg => ({
          id: msg.id,
          ...msg.attributes,
          senderId: msg.attributes.sender?.data?.id,
          receiverId: msg.attributes.receiver?.data?.id,
          bookId: msg.attributes.book?.data?.id
        }))
      };

      // Cache the result
      cache.set(cacheKey, result);

      return result;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request cancelled:', error.message);
        return { data: [] };
      }

      // Try to recover from error
      const shouldRetry = await errorRecovery.recoverFromError(error, 'getChatMessages');
      if (shouldRetry) {
        return messageAPI.getChatMessages(chatId);
      }

      console.error('Error fetching chat messages:', error);
      throw error;
    } finally {
      cancelToken.cancel('Operation cancelled due to new request');
    }
  },

  /**
   * Send a new message
   */
  sendMessage: async (messageData) => {
    // Validate message data
    const validation = messageValidator.validateMessage(messageData);
    if (!validation.isValid) {
      throw new Error(`Invalid message: ${validation.errors.join(', ')}`);
    }

    const cancelToken = createCancelToken();

    try {
      // Create chat ID if not provided
      const chatId = messageData.chatId || messageAPI.createChatId(
        messageData.senderId,
        messageData.receiverId,
        messageData.bookId
      );

      // Encrypt message text
      const encryptedText = await messageEncryption.encrypt(messageData.text);

      const response = await api.post('/api/messages', {
        data: {
          ChatId: chatId,
          sender: { id: messageData.senderId.toString() },
          receiver: { id: messageData.receiverId.toString() },
          book: { id: messageData.bookId.toString() },
          text: encryptedText,
          messageType: messageData.messageType || 'general',
          timestamp: new Date().toISOString(),
          read: false,
          deleted: false,
          requestStatus: messageData.requestStatus || (messageData.messageType === 'purchase_request' || messageData.messageType === 'swap_offer' ? 'pending' : undefined)
        }
      }, { 
        cancelToken: cancelToken.token,
        retry: true
      });

      if (!response.data?.data) {
        throw new Error('Invalid response from server');
      }

      // Clear cache for this chat
      cache.delete(`chat_${chatId}`);

      // Notify via WebSocket
      wsManager.send({
        type: 'new_message',
        data: {
          id: response.data.data.id,
          ...response.data.data.attributes,
          text: messageData.text // Send decrypted text
        }
      });

      return {
        data: {
          id: response.data.data.id,
          ...response.data.data.attributes,
          text: messageData.text // Return decrypted text
        }
      };
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request cancelled:', error.message);
        throw new Error('Message sending was cancelled');
      }
      
      // If offline, add to queue
      if (!navigator.onLine) {
        const queuedMessage = {
          ...messageData,
          id: Date.now().toString(),
          chatId: messageData.chatId || messageAPI.createChatId(
            messageData.senderId,
            messageData.receiverId,
            messageData.bookId
          )
        };
        messageQueue.add(queuedMessage);
        return {
          data: {
            id: queuedMessage.id,
            ...queuedMessage,
            status: 'queued'
          }
        };
      }

      // Try to recover from error
      const shouldRetry = await errorRecovery.recoverFromError(error, 'sendMessage', messageData);
      if (shouldRetry) {
        return messageAPI.sendMessage(messageData);
      }

      console.error('Error sending message:', error);
      throw error;
    } finally {
      cancelToken.cancel('Operation cancelled due to new request');
    }
  },

  /**
   * Get a user's conversations (chats)
   */
  getUserChats: async (userId) => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Convert userId to string and validate
    const userIdStr = userId.toString();
    if (!userIdStr.match(/^\d+$/)) {
      throw new Error('Invalid user ID format');
    }

    // Check cache first
    const cacheKey = `user_chats_${userIdStr}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const cancelToken = createCancelToken();

    try {
      // Properly encode the userId and format the query parameters
      const encodedUserId = encodeURIComponent(userIdStr);
      const response = await api.get(
        `/api/messages?filters[$or][0][sender][id][$eq]=${encodedUserId}&filters[$or][1][receiver][id][$eq]=${encodedUserId}&sort[0]=timestamp:desc&populate=*`,
        { 
          cancelToken: cancelToken.token,
          retry: true
        }
      );
      
      if (!response.data?.data) {
        return { data: [] };
      }

      // Group messages by chat ID
      const chatMap = new Map();
      response.data.data.forEach(msg => {
        const chatId = msg.attributes.ChatId;
        if (!chatMap.has(chatId)) {
          chatMap.set(chatId, {
            id: chatId,
            chatId: chatId,
            lastMessage: {
              id: msg.id,
              ...msg.attributes,
              senderId: msg.attributes.sender?.data?.id,
              receiverId: msg.attributes.receiver?.data?.id,
              bookId: msg.attributes.book?.data?.id
            },
            unreadCount: 0
          });
        }
      });

      const result = {
        data: Array.from(chatMap.values())
      };

      // Cache the result
      cache.set(cacheKey, result);

      return result;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request cancelled:', error.message);
        return { data: [] };
      }

      // Try to recover from error
      const shouldRetry = await errorRecovery.recoverFromError(error, 'getUserChats');
      if (shouldRetry) {
        return messageAPI.getUserChats(userId);
      }

      console.error('Error fetching user chats:', error);
      return { data: [] }; // Return empty array instead of throwing error for better UX
    } finally {
      cancelToken.cancel('Operation cancelled due to new request');
    }
  },

  /**
   * Mark messages as read
   */
  markAllMessagesAsRead: async (chatId, userId) => {
    if (!chatId || !userId) {
      throw new Error('Chat ID and User ID are required');
    }

    const cancelToken = createCancelToken();

    try {
      // First get all unread messages for this chat and user
      // Use the correct field name and format for filters
      const response = await api.get(
        `/api/messages?filters[ChatId][$eq]=${encodeURIComponent(chatId)}&filters[receiver][id][$eq]=${encodeURIComponent(userId)}&filters[read][$eq]=false&populate=*`,
        { 
          cancelToken: cancelToken.token,
          retry: true
        }
      );

      if (!response.data?.data) {
        return { data: [] };
      }

      // Update each message individually
      const updatePromises = response.data.data.map(message => 
        api.put(`/api/messages/${message.id}`, {
          data: {
            read: true
          }
        }, { 
          cancelToken: cancelToken.token,
          retry: true
        })
      );

      await Promise.all(updatePromises);

      // Clear relevant caches
      cache.delete(`chat_${chatId}`);
      cache.delete(`user_chats_${userId}`);
      cache.delete(`unread_count_${userId}`);

      // Notify via WebSocket
      wsManager.send({
        type: 'messages_read',
        data: {
          chatId,
          userId
        }
      });

      return { success: true };
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request cancelled:', error.message);
        throw new Error('Operation was cancelled');
      }

      // Try to recover from error
      const shouldRetry = await errorRecovery.recoverFromError(error, 'markAllMessagesAsRead');
      if (shouldRetry) {
        return messageAPI.markAllMessagesAsRead(chatId, userId);
      }

      console.error('Error marking messages as read:', error);
      throw error;
    } finally {
      cancelToken.cancel('Operation cancelled due to new request');
    }
  },

  /**
   * Update request status
   */
  updateRequestStatus: async (messageId, newStatus) => {
    if (!messageId || !newStatus) {
      throw new Error('Message ID and new status are required');
    }

    if (!['pending', 'accepted', 'declined', 'completed', 'cancelled'].includes(newStatus)) {
      throw new Error('Invalid request status');
    }

    const cancelToken = createCancelToken();

    try {
      const response = await api.put(
        `/api/messages/${messageId}`,
        {
          data: {
            requestStatus: newStatus,
            // Add a system message when status changes
            systemMessage: `Request status updated to ${newStatus}`
          }
        },
        { 
          cancelToken: cancelToken.token,
          retry: true
        }
      );

      // Clear all caches as this might affect multiple views
      cache.clear();

      // Notify via WebSocket
      wsManager.send({
        type: 'request_status_updated',
        data: {
          messageId,
          newStatus
        }
      });

      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request cancelled:', error.message);
        throw new Error('Operation was cancelled');
      }

      // Try to recover from error
      const shouldRetry = await errorRecovery.recoverFromError(error, 'updateRequestStatus');
      if (shouldRetry) {
        return messageAPI.updateRequestStatus(messageId, newStatus);
      }

      console.error('Error updating request status:', error);
      throw error;
    } finally {
      cancelToken.cancel('Operation cancelled due to new request');
    }
  },

  /**
   * Create a chat ID from user IDs and book ID
   */
  createChatId: (senderId, receiverId, bookId) => {
    if (!senderId || !receiverId || !bookId) {
      throw new Error('Sender ID, Receiver ID, and Book ID are required');
    }
    // Sort IDs to ensure consistent chat ID regardless of who initiates
    const [id1, id2] = [senderId.toString(), receiverId.toString()].sort();
    return `${id1}_${id2}_${bookId}`;
  },

  /**
   * Delete a message
   */
  deleteMessage: async (messageId) => {
    if (!messageId) {
      throw new Error('Message ID is required');
    }

    const cancelToken = createCancelToken();

    try {
      const response = await api.put(
        `/api/messages/${messageId}`,
        {
          data: {
            deleted: true
          }
        },
        { 
          cancelToken: cancelToken.token,
          retry: true
        }
      );

      // Clear all caches as this might affect multiple views
      cache.clear();

      // Notify via WebSocket
      wsManager.send({
        type: 'message_deleted',
        data: {
          messageId
        }
      });

      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request cancelled:', error.message);
        throw new Error('Operation was cancelled');
      }

      // Try to recover from error
      const shouldRetry = await errorRecovery.recoverFromError(error, 'deleteMessage');
      if (shouldRetry) {
        return messageAPI.deleteMessage(messageId);
      }

      console.error('Error deleting message:', error);
      throw error;
    } finally {
      cancelToken.cancel('Operation cancelled due to new request');
    }
  },

  /**
   * Search messages
   */
  searchMessages: async (query, userId) => {
    return messageSearch.searchMessages(query, userId);
  },

  /**
   * Get queued messages
   */
  getQueuedMessages: () => {
    return messageQueue.queue;
  },

  /**
   * Clear message queue
   */
  clearMessageQueue: () => {
    messageQueue.queue = [];
    messageQueue.saveQueue();
  },

  /**
   * Get performance metrics
   */
  getPerformanceMetrics: () => {
    return performanceMonitor.getMetrics();
  },

  /**
   * Clear all caches
   */
  clearCache: () => {
    cache.clear();
  },

  /**
   * Start typing indicator
   */
  startTyping: (chatId, userId) => {
    typingManager.startTyping(chatId, userId);
  },

  /**
   * Stop typing indicator
   */
  stopTyping: (chatId, userId) => {
    typingManager.stopTyping(chatId, userId);
  },

  /**
   * Check if user is typing
   */
  isTyping: (chatId, userId) => {
    return typingManager.isTyping(chatId, userId);
  },

  /**
   * Add reaction to message
   */
  addReaction: async (messageId, userId, reaction) => {
    return reactionManager.addReaction(messageId, userId, reaction);
  },

  /**
   * Remove reaction from message
   */
  removeReaction: async (messageId, userId) => {
    return reactionManager.removeReaction(messageId, userId);
  },

  /**
   * Mark message as read
   */
  markMessageAsRead: async (messageId, userId) => {
    return readReceiptManager.markMessageAsRead(messageId, userId);
  },

  /**
   * Get message read receipts
   */
  getReadReceipts: async (messageId) => {
    return readReceiptManager.getReadReceipts(messageId);
  },

  /**
   * Get unread message count for a user
   */
  getUnreadMessageCount: async (userId) => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Convert userId to string and validate
    const userIdStr = userId.toString();
    if (!userIdStr.match(/^\d+$/)) {
      throw new Error('Invalid user ID format');
    }

    // Check cache first
    const cacheKey = `unread_count_${userIdStr}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const cancelToken = createCancelToken();

    try {
      // Properly encode the userId and format the query parameters
      const encodedUserId = encodeURIComponent(userIdStr);
      const response = await api.get(
        `/api/messages?filters[receiver][id][$eq]=${encodedUserId}&filters[read][$eq]=false&populate=*`,
        { 
          cancelToken: cancelToken.token,
          retry: true
        }
      );
      
      const count = response.data?.data?.length || 0;

      // Cache the result
      cache.set(cacheKey, count);

      return count;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request cancelled:', error.message);
        return 0;
      }

      // Try to recover from error
      const shouldRetry = await errorRecovery.recoverFromError(error, 'getUnreadMessageCount');
      if (shouldRetry) {
        return messageAPI.getUnreadMessageCount(userId);
      }

      console.error('Error getting unread count:', error);
      return 0; // Return 0 instead of throwing error for better UX
    } finally {
      cancelToken.cancel('Operation cancelled due to new request');
    }
  }
};

// Cleanup typing indicators periodically
setInterval(() => {
  typingManager.cleanup();
}, 1000);

// Add online/offline event listeners
window.addEventListener('online', () => {
  messageQueue.processQueue();
  wsManager.connect();
});

window.addEventListener('offline', () => {
  console.log('App is offline. Messages will be queued.');
});

export default messageAPI;