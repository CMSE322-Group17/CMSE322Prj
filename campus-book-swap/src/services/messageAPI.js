// src/services/messageAPI.js

// Use localStorage to store messages and user info for demo purposes
const getStoredMessages = () => {
  try {
    const stored = localStorage.getItem('mockMessages');
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Error reading from localStorage:', e);
    return [];
  }
};

const saveMessages = (messages) => {
  try {
    localStorage.setItem('mockMessages', JSON.stringify(messages));
  } catch (e) {
    console.error('Error saving to localStorage:', e);
  }
};

// Store and retrieve mock users
const getStoredUsers = () => {
  try {
    const stored = localStorage.getItem('mockUsers');
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    console.error('Error reading users from localStorage:', e);
    return {};
  }
};

const saveUsers = (users) => {
  try {
    localStorage.setItem('mockUsers', JSON.stringify(users));
  } catch (e) {
    console.error('Error saving users to localStorage:', e);
  }
};

// Track books involved in chats
const getStoredBooks = () => {
  try {
    const stored = localStorage.getItem('mockBooks');
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    console.error('Error reading books from localStorage:', e);
    return {};
  }
};

const saveBooks = (books) => {
  try {
    localStorage.setItem('mockBooks', JSON.stringify(books));
  } catch (e) {
    console.error('Error saving books to localStorage:', e);
  }
};

// Initialize with some mock data if empty
if (!localStorage.getItem('mockMessages')) {
  saveMessages([]);
}

if (!localStorage.getItem('mockUsers')) {
  // Create some default users for the mock system
  const defaultUsers = {
    '1': { id: '1', username: 'JohnSeller', email: 'john@example.com', avatar: null },
    '2': { id: '2', username: 'AliceBuyer', email: 'alice@example.com', avatar: null },
    '3': { id: '3', username: 'BobSwapper', email: 'bob@example.com', avatar: null }
  };
  saveUsers(defaultUsers);
}

if (!localStorage.getItem('mockBooks')) {
  // Create some default books
  const defaultBooks = {
    '101': { id: '101', title: 'Introduction to Computer Science', author: 'Jane Smith', cover: null },
    '102': { id: '102', title: 'Advanced Mathematics', author: 'John Doe', cover: null },
    '103': { id: '103', title: 'Physics Fundamentals', author: 'Albert Einstein', cover: null }
  };
  saveBooks(defaultBooks);
}

/**
 * Message API service with mock implementation
 */
const messageAPI = {
  /**
   * Get all messages for a specific chat
   */
  getChatMessages: async (chatId) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const messages = getStoredMessages();
    const chatMessages = messages.filter(msg => msg.chatId === chatId);
    
    return {
      data: chatMessages,
      meta: {
        pagination: {
          total: chatMessages.length
        }
      }
    };
  },

  /**
   * Send a new message
   */
  sendMessage: async (messageData) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newMessage = {
      id: Date.now().toString(),
      chatId: messageData.chatId,
      senderId: messageData.senderId,
      receiverId: messageData.receiverId,
      bookId: messageData.bookId,
      text: messageData.text,
      messageType: messageData.messageType || 'text',
      timestamp: new Date().toISOString(),
      read: false
    };
    
    const messages = getStoredMessages();
    messages.push(newMessage);
    saveMessages(messages);
    
    return {
      data: newMessage
    };
  },

  /**
   * Get a user's conversations (chats)
   */
  getUserChats: async (userId) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const messages = getStoredMessages();
    const users = getStoredUsers();
    const books = getStoredBooks();
    
    // Get all unique chatIds where the user is involved
    const chatIds = new Set();
    messages.forEach(msg => {
      if (msg.senderId == userId || msg.receiverId == userId) {
        chatIds.add(msg.chatId);
      }
    });
    
    // Create conversation objects
    const conversations = Array.from(chatIds).map(chatId => {
      const chatMessages = messages.filter(msg => msg.chatId === chatId);
      const lastMessage = chatMessages.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      )[0];
      
      // Extract user IDs and book ID from chatId
      const [userId1, userId2, bookId] = chatId.split('_');
      
      // Determine the other user ID
      const otherUserId = userId1 == userId ? userId2 : userId1;
      
      // Get other user and book details
      const otherUser = users[otherUserId] || { username: 'Unknown User' };
      const book = books[bookId] || { title: 'Unknown Book' };
      
      return {
        chatId,
        lastMessage,
        unreadCount: chatMessages.filter(msg => 
          msg.receiverId == userId && !msg.read
        ).length,
        otherUser,
        book
      };
    });
    
    return {
      data: conversations
    };
  },

  /**
   * Get a user by ID
   */
  getUser: async (userId) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const users = getStoredUsers();
    const user = users[userId] || null;
    
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    return {
      data: user
    };
  },

  /**
   * Get a book by ID
   */
  getBook: async (bookId) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const books = getStoredBooks();
    const book = books[bookId] || null;
    
    if (!book) {
      throw new Error(`Book with ID ${bookId} not found`);
    }
    
    return {
      data: {
        id: bookId,
        attributes: book
      }
    };
  },

  /**
   * Mark a message as read
   */
  markMessageAsRead: async (messageId) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const messages = getStoredMessages();
    const updatedMessages = messages.map(msg => 
      msg.id === messageId ? { ...msg, read: true } : msg
    );
    
    saveMessages(updatedMessages);
    
    return { success: true };
  },

  /**
   * Mark all messages in a chat as read for a specific user
   */
  markAllMessagesAsRead: async (chatId, userId) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const messages = getStoredMessages();
    const updatedMessages = messages.map(msg => 
      msg.chatId === chatId && msg.receiverId == userId 
        ? { ...msg, read: true } 
        : msg
    );
    
    saveMessages(updatedMessages);
    
    return true;
  },

  /**
   * Delete a message
   */
  deleteMessage: async (messageId) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const messages = getStoredMessages();
    const updatedMessages = messages.filter(msg => msg.id !== messageId);
    
    saveMessages(updatedMessages);
    
    return true;
  },

  /**
   * Get unread message count for a user
   */
  getUnreadMessageCount: async (userId) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const messages = getStoredMessages();
    const unreadCount = messages.filter(msg => 
      msg.receiverId == userId && !msg.read
    ).length;
    
    return unreadCount;
  },

  /**
   * Create a chat ID from user IDs and book ID
   */
  createChatId: (userId1, userId2, bookId) => {
    // Ensure the smaller ID is first for consistency
    const [smallerId, largerId] =
      parseInt(userId1) < parseInt(userId2) ? [userId1, userId2] : [userId2, userId1];

    return `${smallerId}_${largerId}_${bookId}`;
  },

  /**
   * Save or update a user (helper function for the mock system)
   */
  saveUser: (userData) => {
    const users = getStoredUsers();
    users[userData.id] = userData;
    saveUsers(users);
    return userData;
  },

  /**
   * Save or update a book (helper function for the mock system)
   */
  saveBook: (bookData) => {
    const books = getStoredBooks();
    books[bookData.id] = bookData;
    saveBooks(books);
    return bookData;
  }
};

export default messageAPI;