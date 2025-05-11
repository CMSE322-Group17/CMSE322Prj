import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { formatTimestamp } from '../../utils/messageFormatters';

const ConversationItem = ({ 
  conversation, 
  active = false, 
  onClick,
  bookData = null,
  otherUserData = null
}) => {
  const { user } = useAuth();
  const [book, setBook] = useState(bookData);
  const [otherUser, setOtherUser] = useState(otherUserData);
  const [loading, setLoading] = useState(!bookData || !otherUserData);

  // Extract data from conversation
  const chatId = conversation.chatId || conversation.id;
  const [userId1, userId2, bookId] = chatId ? chatId.split('_') : [null, null, null];
  const otherUserId = user?.id === userId1 ? userId2 : userId1;
  const lastMessage = conversation.lastMessage || conversation;
  const hasUnread = conversation.unreadCount > 0;
  
  // Determine transaction type if available
  const transactionType = conversation.transactionType || 
    lastMessage.messageType === 'swap_offer' ? 'swap' :
    lastMessage.messageType === 'borrow_request' ? 'borrow' : 'general';

  // Get color scheme based on transaction type
  const getTypeStyle = () => {
    switch (transactionType) {
      case 'swap':
        return 'bg-blue-100 text-blue-800';
      case 'borrow':
        return 'bg-purple-100 text-purple-800';
      case 'buy':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Fetch book and user data if not provided
  useEffect(() => {
    const fetchData = async () => {
      if (!loading) return;
      
      try {
        setLoading(true);
        
        // These fetch calls would normally use your API services
        // For now, we're just setting placeholders
        if (!book && bookId) {
          // Placeholder until you implement the actual API call
          setBook({
            title: "Book Title",
            author: "Author Name",
            cover: null
          });
        }
        
        if (!otherUser && otherUserId) {
          // Placeholder until you implement the actual API call
          setOtherUser({
            username: "User",
            avatar: null
          });
        }
      } catch (err) {
        console.error('Error fetching conversation data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [book, otherUser, bookId, otherUserId, loading]);

  const handleClick = () => {
    if (onClick) {
      onClick(conversation);
    }
  };

  return (
    <div 
      className={`border-b border-gray-200 cursor-pointer transition-colors ${
        active ? 'bg-blue-50' : hasUnread ? 'bg-blue-50/30' : 'hover:bg-gray-50'
      }`}
      onClick={handleClick}
    >
      <div className="p-3">
        <div className="flex items-center space-x-3">
          {/* User avatar */}
          <div className="flex-shrink-0">
            {otherUser?.avatar ? (
              <img 
                src={otherUser.avatar} 
                alt={otherUser.username}
                className="w-10 h-10 rounded-full object-cover" 
              />
            ) : (
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                {otherUser?.username ? otherUser.username.charAt(0).toUpperCase() : '?'}
              </div>
            )}
          </div>
          
          {/* Conversation details */}
          <div className="flex-grow min-w-0">
            <div className="flex justify-between items-baseline">
              <h3 className="font-medium truncate">{otherUser?.username || 'Loading...'}</h3>
              <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                {lastMessage?.timestamp ? formatTimestamp(lastMessage.timestamp) : ''}
              </span>
            </div>
            
            <div className="flex items-center mt-1">
              {/* Transaction type badge */}
              <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full ${getTypeStyle()}`}>
                {transactionType === 'swap' ? 'Swap' : 
                 transactionType === 'borrow' ? 'Borrow' : 
                 transactionType === 'buy' ? 'Purchase' : 'Chat'}
              </span>
              
              {/* Book name */}
              <span className="ml-2 text-xs text-gray-600 truncate">
                {book?.title ? `Re: ${book.title}` : 'Loading...'}
              </span>
            </div>
            
            {/* Last message preview */}
            <p className="text-sm text-gray-600 mt-1 truncate">
              {lastMessage?.senderId === user?.id ? 'You: ' : ''}
              {lastMessage?.text || 'No messages yet'}
            </p>
          </div>
          
          {/* Unread indicator */}
          {hasUnread && (
            <div className="flex-shrink-0">
              <span className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;