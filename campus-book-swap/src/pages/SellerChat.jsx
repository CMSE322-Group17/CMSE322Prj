// src/pages/SellerChat.jsx - Updated version

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useMessages } from '../contexts/MessageContext';
import MessageList from '../components/Message/MessageList';
import MessageInput from '../components/Message/MessageInput';
import ChatHeader from '../components/Message/ChatHeader';
import messageAPI from '../services/messageAPI';

const SellerChat = () => {
  const { sellerId, bookId } = useParams();
  const { user, authAxios, isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { 
    messages, 
    sendMessage, 
    fetchMessages, 
    loading, 
    error, 
    clearError 
  } = useMessages();
  
  const [seller, setSeller] = useState(null);
  const [book, setBook] = useState(null);
  const [userBooks, setUserBooks] = useState([]);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [selectedUserBooks, setSelectedUserBooks] = useState([]);
  const [swapStatus, setSwapStatus] = useState('none'); // none, pending, accepted, declined
  
  const navigate = useNavigate();

  // Create a chat ID
  const chatId = user && user.id ? messageAPI.createChatId(user.id, sellerId, bookId) : null;

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin?redirectTo=' + encodeURIComponent(window.location.pathname));
    }
  }, [isAuthenticated, navigate]);

  // Fetch chat data
  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || !sellerId || !bookId) return;
      
      try {
        // Fetch seller info
        const sellerResponse = await authAxios.get(
          `${import.meta.env.VITE_API_URL}/api/users/${sellerId}`
        );
        setSeller(sellerResponse.data);
        
        // Fetch book info
        const bookResponse = await authAxios.get(
          `${import.meta.env.VITE_API_URL}/api/books/${bookId}?populate=*`
        );
        setBook(bookResponse.data.data);
        
        // Fetch chat messages
        if (chatId) {
          fetchMessages(chatId);
        }
        
        clearError();
      } catch (err) {
        console.error('Error fetching chat data:', err);
      }
    };

    fetchData();
    
    // Setup polling for messages
    const intervalId = setInterval(() => {
      if (isAuthenticated && chatId) {
        fetchMessages(chatId);
      }
    }, 15000); // Poll every 15 seconds
    
    return () => clearInterval(intervalId);
  }, [isAuthenticated, sellerId, bookId, user, chatId, fetchMessages, clearError, authAxios]);

  // Send a new message
  const handleSendMessage = async (text) => {
    if (!chatId || !text || !isAuthenticated) return;
    
    try {
      await sendMessage({
        chatId,
        receiverId: sellerId,
        bookId,
        text,
        messageType: 'general'
      });
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Get book cover URL safely
  const getBookCoverUrl = (book) => {
    if (!book?.attributes?.cover?.data?.attributes?.url) {
      return null;
    }
    return `${import.meta.env.VITE_API_URL}${book.attributes.cover.data.attributes.url}`;
  };

  // Updated BookUserDisplay component to show seller info
  const BookUserDisplay = () => (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex flex-col md:flex-row">
        {/* Book info */}
        {book && (
          <div className="flex mb-4 md:mb-0 md:mr-6">
            <div className="w-24 h-32 bg-gray-200 rounded overflow-hidden flex-shrink-0">
              {getBookCoverUrl(book) ? (
                <img 
                  src={getBookCoverUrl(book)}
                  alt={book.attributes?.title || 'Book'}
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                  <span className="text-gray-500 text-xs">No image</span>
                </div>
              )}
            </div>
            
            <div className="ml-4">
              <h2 className="font-medium text-lg">{book.attributes?.title || 'Unknown Book'}</h2>
              <p className="text-sm text-gray-500">{book.attributes?.author || 'Unknown Author'}</p>
              <div className="mt-2">
                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  For Swap
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* Seller info */}
        {seller && (
          <div className="flex items-center md:ml-auto">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
              {seller.username ? seller.username.charAt(0).toUpperCase() : 'S'}
            </div>
            <div className="ml-3">
              <h3 className="font-medium">{seller.username}</h3>
              <p className="text-sm text-gray-500">Seller</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (loading.messages && !book && !seller) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Message with Seller</h1>
        <Link to="/messages" className="text-blue-600 hover:text-blue-800">
          Back to Messages
        </Link>
      </div>
      
      {/* Book and seller information */}
      <BookUserDisplay />
      
      {/* Chat area */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden h-96 flex flex-col">
        <div className="border-b border-gray-200 py-3 px-4">
          <h2 className="font-medium">Messages</h2>
        </div>
        
        {/* Messages container */}
        <MessageList 
          messages={messages}
          loading={loading.messages}
        />
        
        {/* Message input */}
        <MessageInput 
          chatId={chatId}
          receiverId={sellerId}
          bookId={bookId}
          onMessageSent={handleSendMessage}
        />
      </div>
    </div>
  );
};

export default SellerChat;