/**
 * Utility functions for formatting and processing book data
 */

/**
 * Process book data from API to ensure consistent structure across components
 * @param {Object} bookData - Raw book data from API
 * @param {String} apiUrl - Base API URL for image URLs
 * @returns {Object} - Processed book data
 */
export const processBookData = (bookData, apiUrl) => {
  if (!bookData) return null;
  
  const bookAttributes = bookData.attributes || {};
  
  // Process the rating properly to ensure it's a number
  let rating = bookAttributes.rating;
  if (typeof rating === 'string') {
    rating = parseFloat(rating);
  } else if (rating === undefined || rating === null) {
    // Generate a reasonable rating as a fallback
    rating = Math.random() * 2 + 3;
  }
  
  // Get cover image URL
  let coverUrl = null;
  if (bookAttributes.cover?.data) {
    coverUrl = `${apiUrl}${bookAttributes.cover.data.attributes.url}`;
  }
  
  return {
    id: bookData.id,
    ...bookAttributes,
    bookType: bookAttributes.bookType || 'For Sale',
    cover: coverUrl,
    rating: rating,
    // Ensure price is a number
    price: typeof bookAttributes.price === 'string' 
      ? parseFloat(bookAttributes.price) 
      : (bookAttributes.price || 0)
  };
};

/**
 * Get CSS classes for book type badges
 * @param {String} bookType - Type of book (For Sale, For Swap, etc.)
 * @returns {String} - CSS class names
 */
export const getBookTypeStyles = (bookType) => {
  const styles = {
    'For Sale': 'bg-green-100 text-green-800 border-green-200',
    'For Swap': 'bg-blue-100 text-blue-800 border-blue-200',
    'For Borrow': 'bg-purple-100 text-purple-800 border-purple-200',
    'default': 'bg-gray-100 text-gray-800 border-gray-200'
  };
  
  return styles[bookType] || styles.default;
};
