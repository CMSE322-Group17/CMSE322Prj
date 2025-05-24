/**
 * Utility functions for notifications
 */

/**
 * Request notification permission from user
 * @returns {Promise<boolean>} True if permission was granted
 */
export const requestNotificationPermission = async () => {
  try {
    // Check if the browser supports notifications
    if (!("Notification" in window)) {
      console.warn("This browser does not support desktop notifications");
      return false;
    }

    // Check if permission is already granted
    if (Notification.permission === "granted") {
      return true;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    return permission === "granted";
  } catch (err) {
    console.error("Error requesting notification permission:", err);
    return false;
  }
};

/**
 * Show a desktop notification
 * @param {Object} options - Notification options
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body
 * @param {string} options.icon - Optional notification icon URL
 * @param {Function} options.onClick - Optional click handler for the notification
 * @returns {Notification|null} The notification object or null if failed
 */
export const showNotification = ({ title, body, icon, onClick }) => {
  try {
    // Check if notifications are supported and permission is granted
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return null;
    }

    // Create and show the notification
    const notification = new Notification(title, {
      body,
      icon,
      silent: false,
    });

    // Add click handler if provided
    if (onClick && typeof onClick === "function") {
      notification.onclick = onClick;
    }

    return notification;
  } catch (err) {
    console.error("Error showing notification:", err);
    return null;
  }
};

/**
 * Show a notification for a new purchase request
 * @param {Object} message - Message data
 * @param {Object} book - Book data
 * @param {Object} sender - Sender user data
 * @returns {Notification|null} The notification object or null if failed
 */
export const showPurchaseRequestNotification = (message, book, sender) => {
  return showNotification({
    title: "🛒 New Purchase Request",
    body: `${sender.username || "Someone"} wants to buy "${book?.title || "your book"}". Click to respond.`,
    icon: book?.cover || "/book-icon.png",
    onClick: () => {
      // Navigate to messages page with the correct conversation selected
      if (message?.chatId) {
        window.focus();
        window.location.href = `/messages?chat=${message.chatId}`;
      }
    },
  });
};

/**
 * Show a notification for request status updates
 * @param {Object} message - Message data
 * @param {string} status - New status (accepted, declined, etc.)
 * @param {Object} book - Book data
 * @returns {Notification|null} The notification object or null if failed
 */
export const showRequestStatusNotification = (message, status, book) => {
  const statusText = {
    accepted: "accepted",
    declined: "declined",
    completed: "completed",
    cancelled: "cancelled",
  }[status] || status;

  const emoji = {
    accepted: "✅",
    declined: "❌",
    completed: "🎉",
    cancelled: "🚫",
  }[status] || "📝";

  return showNotification({
    title: `${emoji} Request ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`,
    body: `Your request for "${book?.title || "a book"}" has been ${statusText}.`,
    icon: book?.cover || "/book-icon.png",
    onClick: () => {
      if (message?.chatId) {
        window.focus();
        window.location.href = `/messages?chat=${message.chatId}`;
      }
    },
  });
};

/**
 * Show notification for transaction status changes
 * @param {Object} transaction The transaction object that changed status
 * @param {string} action The action taken (accept or decline)
 */
export const showTransactionStatusNotification = (transaction, action) => {
  if (Notification.permission !== "granted") return;

  let title, body, icon;
  
  // Set default icon for the notification
  icon = "/favicon.ico";
  
  // Check if we have message details for additional context
  const details = transaction.messageDetails || {};
  
  // Determine book information from the transaction or message details
  let bookTitle, price;
  
  if (transaction.type === "swap-request" || transaction.type === "swap") {
    bookTitle = transaction.requestedBook?.title || "a book";
    // Try to get book info from message details if not found in transaction
    if (bookTitle === "a book" && details.bookIdFromChat) {
      bookTitle = `book #${details.bookIdFromChat}`;
    }
    
    if (action === "accept") {
      title = "🔄 Swap Request Accepted";
      body = `Your swap request for "${bookTitle}" has been accepted and scheduled for ${new Date(transaction.scheduledFor).toLocaleDateString()}.`;
    } else {
      title = "❌ Swap Request Declined";
      body = `Your swap request for "${bookTitle}" has been declined.`;
    }
  } else if (transaction.type === "purchase") {
    bookTitle = transaction.book?.title || "a book";
    price = transaction.amount || details.price || "an agreed amount";
    
    // Try to get book info from message details if not found in transaction
    if (bookTitle === "a book" && details.bookIdFromChat) {
      bookTitle = `book #${details.bookIdFromChat}`;
    }
    
    if (action === "accept") {
      title = "✅ Purchase Request Accepted";
      body = `Your purchase request for "${bookTitle}" ($${price}) has been accepted and scheduled for ${new Date(transaction.scheduledFor).toLocaleDateString()}.`;
    } else {
      title = "❌ Purchase Request Declined";
      body = `Your purchase request for "${bookTitle}" ($${price}) has been declined.`;
    }
  }

  if (title && body) {
    const notification = new Notification(title, {
      body,
      icon,
    });

    // Close notification after 10 seconds
    setTimeout(() => notification.close(), 10000);

    // Handle notification clicks
    notification.onclick = () => {
      window.focus();
      notification.close();
      
      // If we have a chat ID, navigate to the message
      if (details.chatId) {
        window.location.href = `/messages?chat=${details.chatId}`;
      } else {
        // Otherwise navigate to the transactions page
        window.location.href = "/transactions";
      }
    };
  }
};

export default {
  requestNotificationPermission,
  showNotification,
  showPurchaseRequestNotification,
  showRequestStatusNotification,
  showTransactionStatusNotification,
};
