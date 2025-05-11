// src/components/MessageItem.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const MessageItem = ({
  message,
  currentUserIsSender,
  bookDetails,
  otherUser,
  onMessageClick,
}) => {
  const { isAuthenticated } = useAuth();

  // Helper to format the timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();

    // If it's today, show only the time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    // If it's yesterday, show "Yesterday" and time
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }

    // If it's within the last week, show day name and time
    const lastWeek = new Date(now);
    lastWeek.setDate(now.getDate() - 7);
    if (date > lastWeek) {
      return `${date.toLocaleDateString([], { weekday: "short" })}, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }

    // Otherwise, show date
    return date.toLocaleDateString();
  };

  // Determine message type styles
  const getMessageTypeStyles = () => {
    if (message.messageType === "swap_offer") {
      return "bg-blue-100 border border-blue-200 text-blue-900";
    } else if (message.messageType === "swap_accepted") {
      return "bg-green-100 border border-green-200 text-green-900";
    } else if (message.messageType === "swap_declined") {
      return "bg-red-100 border border-red-200 text-red-900";
    } else if (message.messageType === "borrow_request") {
      return "bg-purple-100 border border-purple-200 text-purple-900";
    } else if (message.messageType === "borrow_accepted") {
      return "bg-green-100 border border-green-200 text-green-900";
    } else if (message.messageType === "borrow_declined") {
      return "bg-red-100 border border-red-200 text-red-900";
    } else {
      return currentUserIsSender
        ? "bg-blue-100 text-blue-900"
        : "bg-gray-100 text-gray-800";
    }
  };

  // Determine message type label
  const getMessageTypeLabel = () => {
    switch (message.messageType) {
      case "swap_offer":
        return "Swap Offer";
      case "swap_accepted":
        return "Swap Accepted";
      case "swap_declined":
        return "Swap Declined";
      case "borrow_request":
        return "Borrow Request";
      case "borrow_accepted":
        return "Borrow Accepted";
      case "borrow_declined":
        return "Borrow Declined";
      default:
        return null;
    }
  };

  const messageTypeLabel = getMessageTypeLabel();

  return (
    <div
      className={`mb-4 flex ${currentUserIsSender ? "justify-end" : "justify-start"}`}
      onClick={onMessageClick}
    >
      <div className={`max-w-[75%] rounded-lg p-3 ${getMessageTypeStyles()}`}>
        {messageTypeLabel && (
          <div className="mb-2 pb-2 border-b border-blue-200">
            <span className="font-semibold text-blue-700">
              {messageTypeLabel}
            </span>
          </div>
        )}
        <p className="whitespace-pre-line">{message.text}</p>
        <p className="text-xs text-gray-500 mt-1 text-right">
          {formatTimestamp(message.timestamp)}
        </p>
      </div>
    </div>
  );
};

export default MessageItem;
