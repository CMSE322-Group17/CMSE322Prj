// src/services/api.js

import axios from 'axios';

// Use a consistent API URL across the application
let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:1337';
// Remove trailing slash if present to prevent double slashes in URLs
API_URL = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;

// Create a preconfigured axios instance
export const api = axios.create({
  baseURL: API_URL,
  // Removed global Content-Type header to allow FormData to set its own boundary
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
    // Fallback for missing wishlist endpoint
    if (error.response && error.response.status === 404 && endpoint.includes('wishlists')) {
      console.warn('Wishlist service returned 404, returning fallback data');
      return { data: [] };
    }

    console.error('API fetch error:', error);
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', error.response.data);
    } else if (error.request) {
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
          populate: '*',
          'filters[status][$ne]': 'sold' // Exclude sold books
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
          'filters[bookOfWeek]': true,
          'filters[status][$ne]': 'sold' // Exclude sold books
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
          'filters[bookOfYear]': true,
          'filters[status][$ne]': 'sold' // Exclude sold books
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
      
      // For Strapi REST API, we need to format data correctly
      // The data field must be a JSON string containing the actual content attributes
      const bookDataJson = JSON.stringify({
        title: bookData.title,
        author: bookData.author,
        description: bookData.description,
        price: bookData.price,
        condition: bookData.condition,
        exchange: bookData.exchange,
        subject: bookData.subject,
        course: bookData.course,
        seller: bookData.seller,
        featured: bookData.featured,
        bookOfWeek: bookData.bookOfWeek,
        bookOfYear: bookData.bookOfYear,
        displayTitle: bookData.displayTitle,
        category: bookData.category,
        bookType: bookData.bookType,
        // Ensure user ID is properly included - critical for book ownership
        users_permissions_user: bookData.users_permissions_user
      });
      
      formData.append('data', bookDataJson);
      
      // Log what we're sending for debugging
      console.log('Creating book with data structure:', bookDataJson);
      
      // Add the cover image if it exists
      if (coverImage) {
        // Use 'files.cover' for Strapi v4 media field syntax
        formData.append('files.cover', coverImage, coverImage.name);
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
        
        // Check specifically for user-related errors
        if (error.response.status === 400 && 
            error.response.data?.error?.message?.includes('users_permissions_user')) {
          console.error('User ID error detected. Make sure user is logged in and ID is valid.');
        }
        
        // Better logging for file upload issues
        if (coverImage && error.response.status === 400) {
          console.error('Possible file upload issue. Check file size and type:', coverImage.name, coverImage.type, coverImage.size);
          // If this is a file issue, try to provide more details
          if (error.response.data?.error?.details?.errors) {
            console.error('File validation errors:', error.response.data.error.details.errors);
          }
        }
      }
      throw error;
    }
  },
  
  // Update an existing book
  updateBook: async (id, bookData, coverImage) => {
    try {
      // Handle file uploads separately using FormData
      const formData = new FormData();
      
      // For Strapi REST API, we need to format data correctly
      // The data field must be a JSON string containing the actual content attributes
      const bookDataJson = JSON.stringify({
        title: bookData.title,
        author: bookData.author,
        description: bookData.description,
        price: bookData.price,
        condition: bookData.condition,
        exchange: bookData.exchange,
        subject: bookData.subject,
        course: bookData.course,
        seller: bookData.seller,
        featured: bookData.featured,
        bookOfWeek: bookData.bookOfWeek,
        bookOfYear: bookData.bookOfYear,
        displayTitle: bookData.displayTitle,
        category: bookData.category,
        bookType: bookData.bookType,
        users_permissions_user: bookData.users_permissions_user
      });
      
      formData.append('data', bookDataJson);
      
      // Log what we're sending for debugging
      console.log('Updating book with data structure:', bookDataJson);
      
      // Add the cover image if it exists
      if (coverImage) {
        // Use 'files.cover' for Strapi v4 media field syntax
        formData.append('files.cover', coverImage, coverImage.name);
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
  },

  // Search books by query
  searchBooks: async (query) => {
    try {
      return await fetchFromAPI('/api/books', {
        method: 'GET',
        params: {
          populate: '*',
          'filters[title][$containsi]': query
        }
      });
    } catch (error) {
      console.error('Error searching books:', error);
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

/**
 * Swap Offer API endpoints
 */
export const swapOfferAPI = {
  // Create a new swap offer record
  createSwapOffer: async (swapOfferData) => {
    // The backend controller expects data under a 'data' key in the body.
    // It also automatically sets requester, status, and timestamp.
    // Fields expected: owner (ID), requestedBook (ID), offeredBooks (array of IDs), chatId.
    // Optional: messageToOwner.
    try {
      return await fetchFromAPI('/api/swap-offers', {
        method: 'POST',
        data: { data: swapOfferData } // Ensure payload is wrapped in { data: ... }
      });
    } catch (error) {
      console.error('Error creating swap offer:', error.response ? error.response.data : error.message);
      throw error;
    }
  },

  // Get swap offers for the current authenticated user (both initiated and received)
  getUserSwapOffers: async () => {
    try {
      // The backend controller's find method is customized to filter by current user
      // and populate necessary relations.
      return await fetchFromAPI('/api/swap-offers', {
        method: 'GET',
        // Params for populate are handled by the backend controller's find method by default
        // if specific population is needed beyond default, it can be added here.
      });
    } catch (error) {
      console.error('Error fetching user swap offers:', error.response ? error.response.data : error.message);
      throw error;
    }
  },

  // Update the status of a swap offer
  updateSwapOfferStatus: async (offerId, statusUpdateData) => {
    // statusUpdateData should be an object like { status: 'accepted', messageToRequester: '...' } or { status: 'cancelled', messageToOwner: '...' }
    try {
      return await fetchFromAPI(`/api/swap-offers/${offerId}/status`, {
        method: 'PUT',
        data: { data: statusUpdateData } // Ensure payload is wrapped in { data: ... }
      });
    } catch (error) {
      console.error(`Error updating swap offer ${offerId} status:`, error.response ? error.response.data : error.message);
      throw error;
    }
  }
};

/**
 * Wishlist API endpoints
 */
export const wishlistAPI = {
  // Add a book to the user's wishlist
  addToWishlist: async (bookId) => {
    try {
      // Ensure the payload is correctly formatted for Strapi v4
      const response = await fetchFromAPI('/api/wishlists', {
        method: 'POST',
        data: { data: { book: bookId } }, // Corrected payload
      });
      // For Strapi v4, the created entity is usually in response.data
      return response.data; 
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      throw error;
    }
  },

  // Get the user's wishlist
  getUserWishlist: async () => {
    try {
      const response = await fetchFromAPI('/api/wishlists', {
        method: 'GET',
        params: { populate: 'book' }, 
      });

      if (!response || !Array.isArray(response.data)) {
        console.error('Invalid response from getUserWishlist API (expected array):', response);
        return []; 
      }

      return response.data.map((entry, index) => {
        // Log the raw entry for debugging
        console.log(`Processing wishlist entry ${index}:`, JSON.stringify(entry, null, 2));

        if (!entry || !entry.attributes) {
          console.warn(`Invalid wishlist entry found (missing entry or attributes) at index ${index}:`, entry);
          return { id: entry?.id || `invalid-entry-${index}`, book: null };
        }

        // Log the book relation part specifically before trying to access .data
        console.log(`Wishlist entry ${index} (ID: ${entry.id}), attributes.book:`, JSON.stringify(entry.attributes.book, null, 2));

        const bookData = entry.attributes.book?.data;

        if (bookData && typeof bookData.attributes === 'object' && bookData.attributes !== null && bookData.id !== undefined) {
          return {
            id: entry.id, // This is the wishlist entry ID
            book: { 
              id: bookData.id, 
              ...bookData.attributes 
            }
          };
        } else {
          // This block will be hit if bookData is null/undefined, or if its attributes are not as expected.
          console.warn(`Book data is not valid or missing for wishlist entry ${index} (ID: ${entry.id}). Book relation content:`, JSON.stringify(entry.attributes.book, null, 2));
          return {
            id: entry.id,
            book: null 
          };
        }
      });
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.warn('User wishlist not found (404), returning empty array.');
        return []; 
      }
      // Log the detailed error for other cases
      console.error('Error fetching user wishlist:', error.response ? error.response.data : error.message, error);
      throw error;
    }
  },

  // Remove a wishlist entry by ID
  removeWishlistEntry: async (entryId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('User is not authenticated');
    }
    await fetchFromAPI(`/api/wishlists/${entryId}`, {
      method: 'DELETE',
    });
  },
};
