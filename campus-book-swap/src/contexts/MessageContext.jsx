// src/contexts/MessageContext.jsx
import { createContext, useState, useContext, useEffect } from "react";
import { useAuth } from "./AuthContext";
import messageAPI from "../services/messageAPI";

// Create context
const MessageContext = createContext();

export const MessageProvider = ({ children }) => {
  const { user, authAxios, isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch unread message count on auth state change or periodically
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Function to update unread count
    const updateUnreadCount = async () => {
      try {
        const count = await messageAPI.getUnreadMessageCount(
          user.id,
          user.token,
        );
        setUnreadCount(count);
      } catch (err) {
        console.error("Error fetching unread count:", err);
      }
    };

    // Initial fetch
    updateUnreadCount();

    // Set up polling interval (every 30 seconds)
    const intervalId = setInterval(updateUnreadCount, 30000);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [isAuthenticated, user]);

  /**
   * Send a message
   * @param {Object} messageData - Message data
   * @returns {Promise<Object>} - The sent message
   */
  const sendMessage = async (messageData) => {
    if (!isAuthenticated) {
      return { success: false, error: "User not authenticated" };
    }

    setLoading(true);
    try {
      // Format the message data for the API
      const formattedMessage = {
        ...messageData,
        senderId: messageData.senderId || user.id,
        timestamp: messageData.timestamp || new Date().toISOString(),
      };

      // Send the message
      const response = await messageAPI.sendMessage(
        formattedMessage,
        user.token,
      );
      setError(null);
      return { success: true, data: response.data };
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message. Please try again.");
      return { success: false, error: "Failed to send message" };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get messages for a specific chat
   * @param {string} chatId - The chat ID
   * @returns {Promise<Array>} - List of messages
   */
  const getChatMessages = async (chatId) => {
    if (!isAuthenticated) {
      return { success: false, error: "User not authenticated" };
    }

    setLoading(true);
    try {
      const response = await messageAPI.getChatMessages(chatId, user.token);
      setError(null);
      return { success: true, data: response.data };
    } catch (err) {
      console.error("Error fetching chat messages:", err);
      setError("Failed to load messages. Please try again.");
      return { success: false, error: "Failed to load messages" };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Mark a message as read
   * @param {number} messageId - The message ID
   * @returns {Promise<Object>} - Updated message
   */
  const markMessageAsRead = async (messageId) => {
    if (!isAuthenticated) {
      return { success: false, error: "User not authenticated" };
    }

    try {
      const response = await messageAPI.markMessageAsRead(
        messageId,
        user.token,
      );

      // Update unread count
      setUnreadCount((prev) => Math.max(0, prev - 1));

      return { success: true, data: response.data };
    } catch (err) {
      console.error("Error marking message as read:", err);
      return { success: false, error: "Failed to mark message as read" };
    }
  };

  /**
   * Get all chats for the current user
   * @returns {Promise<Array>} - List of chats
   */
  const getUserChats = async () => {
    if (!isAuthenticated) {
      return { success: false, error: "User not authenticated" };
    }

    setLoading(true);
    try {
      const response = await messageAPI.getUserChats(user.id, user.token);
      setError(null);
      return { success: true, data: response.data };
    } catch (err) {
      console.error("Error fetching user chats:", err);
      setError("Failed to load chats. Please try again.");
      return { success: false, error: "Failed to load chats" };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create a chat ID from user IDs and book ID
   * @param {number} userId1 - First user's ID
   * @param {number} userId2 - Second user's ID
   * @param {number} bookId - Book's ID
   * @returns {string} - The chat ID
   */
  const createChatId = (userId1, userId2, bookId) => {
    return messageAPI.createChatId(userId1, userId2, bookId);
  };

  return (
    <MessageContext.Provider
      value={{
        unreadCount,
        loading,
        error,
        sendMessage,
        getChatMessages,
        markMessageAsRead,
        getUserChats,
        createChatId,
      }}
    >
      {children}
    </MessageContext.Provider>
  );
};

// Custom hook to use the message context
export const useMessage = () => {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error("useMessage must be used within a MessageProvider");
  }
  return context;
};

export default MessageContext;
