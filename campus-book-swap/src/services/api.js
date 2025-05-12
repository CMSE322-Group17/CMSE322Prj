// src/services/api.js

import axios from 'axios';

// Use a consistent API URL across the application
let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:1337';
// Remove trailing slash if present to prevent double slashes in URLs
API_URL = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;

// Create a preconfigured axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

/**
 * Fetch data from Strapi API using axios
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Axios request options
 * @returns {Promise<any>} - Response data
 */
export const fetchFromAPI = async (endpoint, options = {}) => {
  try {
    const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    console.log('Fetching from:', API_URL + url);
    
    // Get auth token if available
    const token = localStorage.getItem('token');
    const headers = options.headers || {};
    
    // Add Authorization header if token exists
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await api.request({
      url,
      headers,
      ...options
    });

    return response.data;
  } catch (error) {
    console.error('API fetch error:', error);
    
    // Enhance error with details
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    }
    
    throw error;
  }
};

/**
 * Authentication API endpoints
 */
export const authAPI = {
  // Register a new user
  register: async (userData) => {
    try {
      return await api.post('/api/auth/local/register', userData);
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  },
  
  // Login a user
  login: async (credentials) => {
    try {
      return await api.post('/api/auth/local', {
        identifier: credentials.email,
        password: credentials.password
      });
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  },
  
  // Verify a user's token
  verifyToken: async (token) => {
    try {
      return await api.get('/api/users/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Error verifying token:', error);
      throw error;
    }
  },
  
  // Get user profile
  getUserProfile: async (userId) => {
    try {
      return await fetchFromAPI(`/api/users/${userId}?populate=*`);
    } catch (error) {
      console.error(`Error fetching user profile for ID ${userId}:`, error);
      throw error;
    }
  },
  
  // Update user profile
  updateUserProfile: async (userId, userData) => {
    try {
      return await api.put(`/api/users/${userId}`, { data: userData });
    } catch (error) {
      console.error(`Error updating user profile for ID ${userId}:`, error);
      throw error;
    }
  },
  
  // Logout (client-side only)
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    // Return empty resolved promise for consistency
    return Promise.resolve();
  },
  
  // Refresh token
  refreshToken: async (refreshToken) => {
    try {
      const response = await api.post('/api/auth/refresh-token', { refreshToken });
      return response;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }
};

/**
 * Book API endpoints
 */
export const bookAPI = {
  // Get featured books
  getFeaturedBooks: async () => {
    try {
      return await fetchFromAPI('/api/books', {
        method: 'GET',
        params: {
          populate: '*',
          'filters[featured]': true
        }
      });
    } catch (error) {
      console.error('Error fetching featured books:', error);
      throw error;
    }
  },

  // Get popular books - just get all books for now and sort client-side if needed
  getPopularBooks: async () => {
    try {
      return await fetchFromAPI('/api/books', {
        method: 'GET',
        params: {
          populate: '*'
        }
      });
    } catch (error) {
      console.error('Error fetching popular books:', error);
      throw error;
    }
  },

  // Get books of the week
  getBooksOfWeek: async () => {
    try {
      return await fetchFromAPI('/api/books', {
        method: 'GET',
        params: {
          populate: '*',
          'filters[bookOfWeek]': true
        }
      });
    } catch (error) {
      console.error('Error fetching books of the week:', error);
      throw error;
    }
  },

  // Get books of the year
  getBooksOfYear: async () => {
    try {
      return await fetchFromAPI('/api/books', {
        method: 'GET',
        params: {
          populate: '*',
          'filters[bookOfYear]': true
        }
      });
    } catch (error) {
      console.error('Error fetching books of the year:', error);
      throw error;
    }
  },

  // Get book categories
  getCategories: async () => {
    try {
      return await fetchFromAPI('/api/categories');
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  // Get books by category - using params object for better readability
  getBooksByCategory: async (categoryId) => {
    try {
      return await fetchFromAPI('/api/books', {
        method: 'GET',
        params: {
          populate: '*',
          'filters[category]': categoryId
        }
      });
    } catch (error) {
      console.error(`Error fetching books by category ${categoryId}:`, error);
      throw error;
    }
  },

  // Get a single book by ID
  getBookById: async (id) => {
    try {
      return await fetchFromAPI(`/api/books/${id}`, {
        method: 'GET',
        params: {
          populate: '*'
        }
      });
    } catch (error) {
      console.error(`Error fetching book ${id}:`, error);
      throw error;
    }
  },
  
  // Get user's books
  getUserBooks: async (userId) => {
    try {
      return await fetchFromAPI('/api/books', {
        method: 'GET',
        params: {
          'populate': '*',
          'filters[users_permissions_user][id][$eq]': userId
        }
      });
    } catch (error) {
      console.error(`Error fetching user books for user ${userId}:`, error);
      throw error;
    }
  },
  
  // Create a new book
  createBook: async (bookData, coverImage) => {
    try {
      // Handle file uploads separately using FormData
      const formData = new FormData();
      
      // The "data" key is expected by Strapi to be a string containing JSON
      const strData = JSON.stringify({ data: bookData });
      
      // Add the JSON data to the form
      formData.append('data', strData);
      
      // Log what we're sending for debugging
      console.log('Creating book with data structure:', strData);
      
      // Add the cover image if it exists
      if (coverImage) {
        formData.append('files.cover', coverImage);
        console.log('Adding cover image to request:', coverImage.name);
      }
      
      const token = localStorage.getItem('token');
      const headers = {
        Authorization: token ? `Bearer ${token}` : undefined,
        // Don't set Content-Type here, it will be set automatically with the correct boundary
      };
      
      // Make the POST request using axios directly to handle FormData
      const response = await api.post('/api/books', formData, { headers });
      
      return response.data;
    } catch (error) {
      console.error('Error creating book:', error);
      // Add more details about the error response if available
      if (error.response) {
        console.log('Error details:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      throw error;
    }
  },
  
  // Update an existing book
  updateBook: async (id, bookData, coverImage) => {
    try {
      // Handle file uploads separately using FormData
      const formData = new FormData();
      
      // The "data" key is expected by Strapi to be a string containing JSON
      const strData = JSON.stringify({ data: bookData });
      
      // Add the JSON data to the form
      formData.append('data', strData);
      
      // Log what we're sending for debugging
      console.log('Updating book with data structure:', strData);
      
      // Add the cover image if it exists
      if (coverImage) {
        formData.append('files.cover', coverImage);
        console.log('Adding cover image to request:', coverImage.name);
      }
      
      const token = localStorage.getItem('token');
      const headers = {
        Authorization: token ? `Bearer ${token}` : undefined,
        // Don't set Content-Type here, it will be set automatically with the correct boundary
      };
      
      // Make the PUT request using axios directly to handle FormData
      const response = await api.put(`/api/books/${id}`, formData, { headers });
      
      return response.data;
    } catch (error) {
      console.error(`Error updating book ${id}:`, error);
      throw error;
    }
  },

  // Delete a book by ID
  deleteBook: async (id) => {
    try {
      return await api.delete(`/api/books/${id}`);
    } catch (error) {
      console.error(`Error deleting book ${id}:`, error);
      throw error;
    }
  }
};

/**
 * Transaction API endpoints
 */
export const transactionAPI = {
  // Get all transactions for a user
  getUserTransactions: async (userId) => {
    try {
      return await fetchFromAPI('/api/transactions', {
        method: 'GET',
        params: {
          populate: '*',
          'filters[$or][0][buyerId][$eq]': userId,
          'filters[$or][1][sellerId][$eq]': userId,
          sort: 'createdAt:desc'
        }
      });
    } catch (error) {
      console.error(`Error fetching transactions for user ${userId}:`, error);
      throw error;
    }
  },
  
  // Create a new transaction
  createTransaction: async (transactionData) => {
    try {
      return await fetchFromAPI('/api/transactions', {
        method: 'POST',
        data: { data: transactionData }
      });
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  },
  
  // Get transaction by ID
  getTransactionById: async (id) => {
    try {
      return await fetchFromAPI(`/api/transactions/${id}`, {
        method: 'GET',
        params: { populate: '*' }
      });
    } catch (error) {
      console.error(`Error fetching transaction ${id}:`, error);
      throw error;
    }
  }
};
