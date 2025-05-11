import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { formatTimestamp } from '../../utils/messageFormatters';
import RequestActions from './RequestActions';

const MessageList = ({ messages, loading }) => {
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const [localMessages, setLocalMessages] = useState(messages);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (loading) {
    return (
      <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50">
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-grow overflow-y-auto p-4 bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p>No messages yet</p>
          <p className="text-sm mt-1">Start the conversation by sending a message</p>
        </div>
      </div>
    );
  }

  const renderMessage = (message, index) => {
    const isCurrentUser = message.senderId === user?.id;
    const isSwapOffer = message.messageType === 'swap_offer';
    const isBorrowRequest = message.messageType === 'borrow_request';
    const isSystem = message.messageType === 'system';
    
    let messageContainerClasses = "max-w-3/4 rounded-lg p-3 mb-3";
    let messageBubbleClasses = "";
    
    if (isCurrentUser) {
      messageContainerClasses += " ml-auto";
      messageBubbleClasses = "bg-blue-600 text-white";
    } else if (isSystem) {
      messageContainerClasses += " mx-auto";
      messageBubbleClasses = "bg-gray-200 text-gray-800";
    } else {
      messageContainerClasses += " mr-auto";
      messageBubbleClasses = "bg-gray-100 text-gray-800";
    }
    
    // Special styling for different message types
    if (isSwapOffer) {
      messageBubbleClasses = "bg-blue-100 border border-blue-300 text-blue-800";
    } else if (isBorrowRequest) {
      messageBubbleClasses = "bg-purple-100 border border-purple-300 text-purple-800";
    }
    
    return (
      <div key={message.id || index} className={messageContainerClasses}>
        <div className={`${messageBubbleClasses} p-3 rounded-lg shadow-sm`}>
          {/* Message type header */}
          {isSwapOffer && (
            <div className="mb-2 pb-1 border-b border-blue-200">
              <span className="font-semibold text-blue-700">📚 Swap Offer</span>
            </div>
          )}
          
          {isBorrowRequest && (
            <div className="mb-2 pb-1 border-b border-purple-200">
              <span className="font-semibold text-purple-700">📅 Borrow Request</span>
            </div>
          )}
          
          {/* Message content */}
          <p className="whitespace-pre-wrap break-words">{message.text}</p>
          
          {/* Timestamp */}
          <div className="text-xs mt-1 opacity-70 text-right">
            {formatTimestamp(message.timestamp)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-grow overflow-y-auto p-4 space-y-1 bg-gray-50">
      {messages.map(renderMessage)}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;