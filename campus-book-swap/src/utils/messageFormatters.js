/**
 * Format a timestamp for display in messages
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} Formatted timestamp for display
 */
export const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  
  const msgDate = new Date(timestamp);
  const now = new Date();
  
  // Invalid date
  if (isNaN(msgDate.getTime())) return '';
  
  // Check if it's today
  if (msgDate.toDateString() === now.toDateString()) {
    return msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // Check if it's yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (msgDate.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // Check if it's this week
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  if (msgDate > weekAgo) {
    return msgDate.toLocaleDateString([], { weekday: 'long' }) + 
           ` at ${msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // Otherwise, show full date
  return msgDate.toLocaleDateString([], { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }) + ` at ${msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

/**
 * Format unread count for display
 * @param {number} count - Number of unread messages
 * @returns {string} Formatted count for display
 */
export const formatUnreadCount = (count) => {
  if (!count || count <= 0) return '';
  if (count > 99) return '99+';
  return count.toString();
};

/**
 * Get relative time from now
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} Relative time (e.g., "2 hours ago")
 */
export const getRelativeTime = (timestamp) => {
  if (!timestamp) return '';
  
  const msgDate = new Date(timestamp);
  const now = new Date();
  
  // Invalid date
  if (isNaN(msgDate.getTime())) return '';
  
  const diffInSeconds = Math.floor((now - msgDate) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
};

/**
 * Truncate text to a maximum length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export default {
  formatTimestamp,
  formatUnreadCount,
  getRelativeTime,
  truncateText
};