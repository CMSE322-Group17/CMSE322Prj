// src/pages/SellerChat.jsx - Updated version

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
// import { useCart } from '../contexts/CartContext';  // We'll use this in future features
import { useMessage } from '../contexts/useMessage';
import MessageList from '../components/Message/MessageList';
import MessageInput from '../components/Message/MessageInput';
import ChatHeader from '../components/Message/ChatHeader';
import messageAPI from '../services/messageAPI';
import { bookAPI } from '../services/api';

const SellerChat = () => {  
  const { sellerId, bookId } = useParams();
  const { user, authAxios, isAuthenticated } = useAuth();
  // We might need cart functionality later but we're not using it now
  // const { addToCart } = useCart();
  const { messages, sendMessage, fetchMessages, loading, startSwapOffer } = useMessage();
  
  const [seller, setSeller] = useState(null);
  const [book, setBook] = useState(null);
  const [userBooks, setUserBooks] = useState([]);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [selectedOfferBookIds, setSelectedOfferBookIds] = useState([]);
  const [offerSent, setOfferSent] = useState(false);
  
  const navigate = useNavigate();

  // Determine if the current user is the owner of the book in context
  const isCurrentUserBookOwner = user?.id && book?.attributes?.user?.data?.id && user.id === book.attributes.user.data.id;

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
        
        // Fetch buyer's own books for swap offers
        if (user?.id) {
          const res = await bookAPI.getUserBooks(user.id);
          // res is Strapi wrapper: { data: [ ... ] }
          setUserBooks(res.data || []);
        }
        
        // Fetch chat messages
        if (chatId) {
          fetchMessages(chatId);
        }
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
  }, [isAuthenticated, sellerId, bookId, user, chatId, fetchMessages, authAxios]);

  // Send a new message
  const handleSendMessage = async (text) => {
    if (!chatId || !text || !isAuthenticated) {
      if (!isAuthenticated) {
        alert("Please log in to send messages");
        return;
      }
      if (!chatId) {
        console.error("Missing chat ID");
        return;
      }
      return;
    }
    
    try {
      // Set a timeout to avoid infinite pending state
      const timeout = setTimeout(() => {
        console.log("Message sending timeout - refreshing messages anyway");
        if (chatId) {
          fetchMessages(chatId);
        }
      }, 10000);
      
      // Add these logs:
      console.log("Current logged-in user ID (sender):", user?.id);
      console.log("Seller ID from URL (receiver):", sellerId);
      console.log("Book ID from URL:", bookId);
      console.log("Chat ID being used:", chatId);

      // Send the message
      await sendMessage({
        chatId,
        receiverId: sellerId,
        bookId,
        text,
        messageType: 'general'
      });
      
      clearTimeout(timeout);
      
      // Make sure we refresh messages to show the new one
      if (chatId) {
        fetchMessages(chatId);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      
      // Show user-friendly error message
      let errorMessage = "Failed to send message. Please try again.";
      
      if (err.response) {
        if (err.response.status === 400) {
          errorMessage = "Message couldn't be sent. Please check your input.";
        } else if (err.response.status === 401) {
          errorMessage = "Your session has expired. Please log in again.";
        } else if (err.response.status === 429) {
          errorMessage = "You're sending messages too quickly. Please wait a moment.";
        } else if (err.response.status >= 500) {
          errorMessage = "Server error. Please try again later.";
        }
      } else if (err.request) {
        errorMessage = "Network error. Please check your connection.";
      }
      
      // Show error as alert for now - could be improved with a toast notification
      alert(errorMessage);
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
        
        {offerSent && (
          <div className="p-2 bg-green-100 text-green-800 text-center mb-4 rounded">
            Swap offer sent successfully!
          </div>
        )}

        {/* Chat messages and input */}
        <div className="chat-actions mb-4 flex justify-between">
          <button
            onClick={() => setShowSwapModal(true)}
            className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >Propose Swap</button>
        </div>
        <MessageList 
          messages={messages}
          loading={loading.messages}
        />
        <MessageInput 
          chatId={chatId}
          receiverId={sellerId}
          bookId={bookId}
          onMessageSent={handleSendMessage}
        />
      </div>

      {/* Swap Offer Modal */}
      {showSwapModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            {/* Show target book info */}
            <div className="flex mb-4 items-center">
              {book && book.attributes?.cover?.data && (
                <img
                  src={`${import.meta.env.VITE_API_URL}${book.attributes.cover.data.attributes.url}`}
                  alt={book.attributes.title}
                  className="w-12 h-16 object-cover rounded mr-3"
                />
              )}
              <h3 className="text-lg font-bold">Offer your books for "{book?.attributes?.title}"</h3>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
              {userBooks.map(bookItem => (
                <label key={bookItem.id} className="flex items-center">
                  <input
                    type="checkbox"
                    value={bookItem.id}
                    onChange={e => {
                      const id = bookItem.id;
                      setSelectedOfferBookIds(prev =>
                        e.target.checked ? [...prev, id] : prev.filter(x => x !== id)
                      );
                    }}
                  />
                  <span className="ml-2">{bookItem.attributes?.title || bookItem.title}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowSwapModal(false)} className="px-3 py-1">Cancel</button>
              <button
                disabled={loading.sending || selectedOfferBookIds.length === 0}
                onClick={async () => {
                  await startSwapOffer({ chatId, offerBookIds: selectedOfferBookIds });
                  setShowSwapModal(false);
                  setOfferSent(true);
                  setTimeout(() => setOfferSent(false), 3000);
                }}
                className={`px-3 py-1 rounded ${loading.sending || selectedOfferBookIds.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
              >{loading.sending ? 'Sending...' : 'Send Offer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerChat;