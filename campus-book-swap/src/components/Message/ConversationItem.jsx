import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { formatTimestamp, truncateText } from '../../utils/messageFormatters';

const ConversationItem = ({ 
  conversation, 
  active = false, 
  onClick,
  bookData = null,
  otherUserData = null
}) => {
  const { user, authAxios } = useAuth();
  const [book, setBook] = useState(bookData);
  const [otherUser, setOtherUser] = useState(otherUserData);
  const [loading, setLoading] = useState(!bookData || !otherUserData);

  // Extract data from conversation with proper null checks
  const chatId = conversation?.chatId || conversation?.id;
  const [userId1, userId2, bookId] = chatId && typeof chatId === 'string' ? chatId.split('_') : [null, null, null];
  const otherUserId = user?.id && userId1 && userId2 ? 
    (user.id === parseInt(userId1) ? userId2 : userId1) : null;
  const lastMessage = conversation?.lastMessage || conversation;
  const hasUnread = conversation?.unreadCount > 0;
  
  // Determine transaction type if available
  const transactionType = conversation?.transactionType || 
    (lastMessage?.messageType === 'swap_offer' ? 'swap' :
     lastMessage?.messageType === 'borrow_request' ? 'borrow' : 'general');

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
      if (!loading || !chatId) return;
      
      try {
        setLoading(true);
        
        // Fetch book data if not provided
        if (!book && bookId) {
          try {
            const bookResponse = await authAxios.get(`${import.meta.env.VITE_API_URL}/api/books/${bookId}?populate=*`);
            
            setBook({
              id: bookId,
              title: bookResponse.data.data.attributes.title,
              author: bookResponse.data.data.attributes.author,
              cover: bookResponse.data.data.attributes.cover?.data ? 
                `${import.meta.env.VITE_API_URL}${bookResponse.data.data.attributes.cover.data.attributes.url}` : 
                null
            });
          } catch (err) {
            console.error('Error fetching book:', err);
            setBook({
              title: "Unknown Book",
              author: "Unknown Author",
              cover: null
            });
          }
        }
        
        // Fetch other user data if not provided
        if (!otherUser && otherUserId) {
          try {
            const userResponse = await authAxios.get(`${import.meta.env.VITE_API_URL}/api/users/${otherUserId}`);
            
            setOtherUser({
              id: otherUserId,
              username: userResponse.data.username,
              avatar: userResponse.data.avatar || null
            });
          } catch (err) {
            console.error('Error fetching user:', err);
            setOtherUser({
              username: "Unknown User",
              avatar: null
            });
          }
        }
      } catch (err) {
        console.error('Error fetching conversation data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [book, otherUser, bookId, otherUserId, loading, chatId, authAxios]);

  const handleClick = () => {
    if (onClick) {
      onClick(conversation);
    }
  };

  // Render loading placeholder
  if (loading) {
    return (
      <div className="border-b border-gray-200 p-3">
        <div className="animate-pulse flex space-x-3">
          <div className="rounded-full bg-gray-200 h-10 w-10"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

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
              <h3 className="font-medium truncate">{otherUser?.username || 'Unknown User'}</h3>
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
              {book && (
                <span className="ml-2 text-xs text-gray-600 truncate">
                  {book.title ? `Re: ${truncateText(book.title, 20)}` : 'Unknown Book'}
                </span>
              )}
            </div>
            
            {/* Last message preview */}
            <p className="text-sm text-gray-600 mt-1 truncate">
              {lastMessage?.senderId === user?.id ? 'You: ' : ''}
              {truncateText(lastMessage?.text || 'No messages yet', 40)}
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