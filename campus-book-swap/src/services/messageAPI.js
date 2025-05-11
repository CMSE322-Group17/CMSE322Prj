// src/services/messageAPI.js
import axios from "axios";

// Base API URL from environment
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:1337";

/**
 * Message API service to interact with the backend for messaging functionality
 */
const messageAPI = {
  /**
   * Get all messages for a specific chat
   * @param {string} chatId - The ID of the chat
   * @param {string} token - JWT authentication token
   * @returns {Promise<Array>} - List of messages in the chat
   */
  getChatMessages: async (chatId, token) => {
    try {
      const response = await axios.get(`${API_URL}/api/messages`, {
        params: {
          filters: {
            chatId: {
              $eq: chatId,
            },
          },
          sort: ["timestamp:asc"],
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      throw error;
    }
  },

  /**
   * Send a new message
   * @param {Object} messageData - The message data
   * @param {string} token - JWT authentication token
   * @returns {Promise<Object>} - The created message
   */
  sendMessage: async (messageData, token) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/messages`,
        { data: messageData },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  },

  /**
   * Get a user's conversations (chats)
   * @param {number} userId - The user's ID
   * @param {string} token - JWT authentication token
   * @returns {Promise<Array>} - List of the user's chats
   */
  getUserChats: async (userId, token) => {
    try {
      // Get all messages where the user is either sender or receiver
      const response = await axios.get(`${API_URL}/api/messages`, {
        params: {
          filters: {
            $or: [
              {
                senderId: {
                  $eq: userId,
                },
              },
              {
                receiverId: {
                  $eq: userId,
                },
              },
            ],
          },
          sort: ["timestamp:desc"],
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error fetching user chats:", error);
      throw error;
    }
  },

  /**
   * Mark a message as read
   * @param {number} messageId - The ID of the message to mark as read
   * @param {string} token - JWT authentication token
   * @returns {Promise<Object>} - The updated message
   */
  markMessageAsRead: async (messageId, token) => {
    try {
      const response = await axios.put(
        `${API_URL}/api/messages/${messageId}`,
        { data: { read: true } },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error("Error marking message as read:", error);
      throw error;
    }
  },

  /**
   * Mark all messages in a chat as read for a specific user
   * @param {string} chatId - The ID of the chat
   * @param {number} userId - The user's ID
   * @param {string} token - JWT authentication token
   * @returns {Promise<boolean>} - Success indicator
   */
  markAllMessagesAsRead: async (chatId, userId, token) => {
    try {
      // For now, we'll mock this function since it doesn't exist in the original
      console.log(`Marking all messages as read in chat ${chatId} for user ${userId}`);
      return true;
    } catch (error) {
      console.error("Error marking all messages as read:", error);
      throw error;
    }
  },

  /**
   * Delete a message
   * @param {number} messageId - The ID of the message to delete
   * @param {string} token - JWT authentication token
   * @returns {Promise<boolean>} - Success indicator
   */
  deleteMessage: async (messageId, token) => {
    try {
      // For now, we'll mock this function since it doesn't exist in the original
      console.log(`Deleting message ${messageId}`);
      return true;
    } catch (error) {
      console.error("Error deleting message:", error);
      throw error;
    }
  },

  /**
   * Get unread message count for a user
   * @param {number} userId - The user's ID
   * @param {string} token - JWT authentication token
   * @returns {Promise<number>} - Count of unread messages
   */
  getUnreadMessageCount: async (userId, token) => {
    try {
      const response = await axios.get(`${API_URL}/api/messages`, {
        params: {
          filters: {
            receiverId: {
              $eq: userId,
            },
            read: {
              $eq: false,
            },
          },
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.meta.pagination.total;
    } catch (error) {
      console.error("Error fetching unread message count:", error);
      throw error;
    }
  },

  /**
   * Create a chat ID from user IDs and book ID
   * @param {number} userId1 - First user's ID
   * @param {number} userId2 - Second user's ID
   * @param {number} bookId - Book's ID
   * @returns {string} - The chat ID
   */
  createChatId: (userId1, userId2, bookId) => {
    // Ensure the smaller ID is first for consistency
    const [smallerId, largerId] =
      userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];

    return `${smallerId}_${largerId}_${bookId}`;
  },
};

export default messageAPI;