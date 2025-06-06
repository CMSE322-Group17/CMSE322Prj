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

export default {
  requestNotificationPermission,
  showNotification,
  showPurchaseRequestNotification,
  showRequestStatusNotification,
};
