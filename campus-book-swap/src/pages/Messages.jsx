import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMessages } from '../contexts/MessageContext';
import ConversationItem from '../components/Message/ConversationItem';
import MessageList from '../components/Message/MessageList';
import MessageInput from '../components/messaging/MessageInput';
import ChatHeader from '../components/messaging/ChatHeader';

const Messages = () => {
  const { user, authAxios, isAuthenticated } = useAuth();
  const { 
    conversations, 
    messages, 
    activeConversation,
    unreadCount,
    loading, 
    error,
    fetchConversations,
    fetchMessages,
    sendMessage
  } = useMessages();
  
  const [selectedChat, setSelectedChat] = useState(null);
  const [activeChatDetails, setActiveChatDetails] = useState({
    book: null,
    otherUser: null
  });
  const navigate = useNavigate();

  // Active tab state for filtering conversations
  const [activeTab, setActiveTab] = useState('all');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin?redirectTo=' + encodeURIComponent(window.location.pathname));
    }
  }, [isAuthenticated, navigate]);

  // Fetch conversations on component mount
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchConversations();
    }
  }, [isAuthenticated, user, fetchConversations]);

  // Fetch chat details when a conversation is selected
  useEffect(() => {
    const fetchChatDetails = async () => {
      if (!selectedChat) return;
      
      try {
        // Extract IDs from chat ID
        const [userId1, userId2, bookId] = selectedChat.chatId.split('_');
        const otherUserId = userId1 === user.id.toString() ? userId2 : userId1;
        
        // Fetch book details
        const bookResponse = await authAxios.get(
          `${import.meta.env.VITE_API_URL}/api/books/${bookId}?populate=*`
        );
        
        // Fetch other user details
        const userResponse = await authAxios.get(
          `${import.meta.env.VITE_API_URL}/api/users/${otherUserId}`
        );
        
        // Update state with fetched details
        setActiveChatDetails({
          book: {
            id: bookId,
            title: bookResponse.data.data.attributes.title,
            author: bookResponse.data.data.attributes.author,
            cover: bookResponse.data.data.attributes.cover?.data ? 
              `${import.meta.env.VITE_API_URL}${bookResponse.data.data.attributes.cover.data.attributes.url}` : 
              null
          },
          otherUser: {
            id: otherUserId,
            username: userResponse.data.username,
            avatar: userResponse.data.avatar || null
          }
        });
      } catch (err) {
        console.error('Error fetching chat details:', err);
      }
    };
    
    fetchChatDetails();
  }, [selectedChat, user, authAxios]);

  // Handle selecting a conversation
  const handleSelectConversation = (conversation) => {
    setSelectedChat(conversation);
    if (conversation.chatId) {
      fetchMessages(conversation.chatId);
    }
  };

  // Handle sending a message
  const handleSendMessage = async (text) => {
    if (!selectedChat || !text.trim()) return;
    
    try {
      const [userId1, userId2, bookId] = selectedChat.chatId.split('_');
      const otherUserId = userId1 === user.id.toString() ? userId2 : userId1;
      
      await sendMessage({
        chatId: selectedChat.chatId,
        receiverId: otherUserId,
        bookId,
        text: text.trim()
      });
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Filter conversations based on active tab
  const getFilteredConversations = () => {
    if (activeTab === 'all') {
      return conversations;
    }
    return conversations.filter(convo => {
      // Check message type for special messages
      const messageType = convo.lastMessage?.messageType;
      if (activeTab === 'swap' && messageType === 'swap_offer') return true;
      if (activeTab === 'borrow' && messageType === 'borrow_request') return true;
      
      // Check transaction type field if it exists
      return convo.transactionType === activeTab;
    });
  };

  // Get counts for tab badges
  const getCounts = () => {
    const counts = {
      all: conversations.length,
      swap: conversations.filter(c => c.lastMessage?.messageType === 'swap_offer' || c.transactionType === 'swap').length,
      borrow: conversations.filter(c => c.lastMessage?.messageType === 'borrow_request' || c.transactionType === 'borrow').length,
      buy: conversations.filter(c => c.transactionType === 'buy').length
    };
    
    return counts;
  };

  const counts = getCounts();

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Messages</h1>
        <Link to="/books" className="text-blue-600 hover:text-blue-800">
          Browse Books
        </Link>
      </div>
      
      {/* Navigation Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex flex-wrap -mb-px">
          <button
            onClick={() => setActiveTab('all')}
            className={`mr-4 py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Messages
            {counts.all > 0 && (
              <span className="ml-2 bg-gray-100 text-gray-700 py-0.5 px-2 rounded-full text-xs">
                {counts.all}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('swap')}
            className={`mr-4 py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'swap'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Swaps
            {counts.swap > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-700 py-0.5 px-2 rounded-full text-xs">
                {counts.swap}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('borrow')}
            className={`mr-4 py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'borrow'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Borrowing
            {counts.borrow > 0 && (
              <span className="ml-2 bg-purple-100 text-purple-700 py-0.5 px-2 rounded-full text-xs">
                {counts.borrow}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('buy')}
            className={`mr-4 py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'buy'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Purchases
            {counts.buy > 0 && (
              <span className="ml-2 bg-green-100 text-green-700 py-0.5 px-2 rounded-full text-xs">
                {counts.buy}
              </span>
            )}
          </button>
        </nav>
      </div>
      
      {loading.conversations ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          <h2 className="font-bold mb-2">Error</h2>
          <p>{error}</p>
          <button 
            onClick={fetchConversations}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      ) : getFilteredConversations().length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-800 mb-2">No messages yet</h3>
          <p className="text-gray-600 mb-4">
            Browse books and start conversations with sellers to see messages here.
          </p>
          <Link to="/books" className="inline-block px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors">
            Browse Books
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-3 border-b border-gray-200">
                <h2 className="font-medium">Conversations</h2>
              </div>
              
              <div className="overflow-y-auto max-h-[calc(100vh-250px)]">
                {getFilteredConversations().map(conversation => (
                  <ConversationItem
                    key={conversation.id || conversation.chatId}
                    conversation={conversation}
                    active={selectedChat && selectedChat.chatId === conversation.chatId}
                    onClick={handleSelectConversation}
                  />
                ))}
              </div>
            </div>
          </div>
          
          {/* Messages Panel */}
          <div className="md:col-span-2">
            {selectedChat ? (
              <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-[calc(100vh-250px)]">
                {/* Chat Header */}
                <ChatHeader
                  bookData={activeChatDetails.book}
                  otherUserData={activeChatDetails.otherUser}
                  onBack={() => setSelectedChat(null)}
                  loading={!activeChatDetails.book || !activeChatDetails.otherUser}
                />
                
                {/* Messages */}
                <MessageList 
                  messages={messages} 
                  loading={loading.messages} 
                />
                
                {/* Message Input */}
                <MessageInput 
                  chatId={selectedChat.chatId}
                  receiverId={activeChatDetails.otherUser?.id}
                  bookId={activeChatDetails.book?.id}
                />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 text-center flex items-center justify-center h-[calc(100vh-250px)]">
                <div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Select a conversation</h3>
                  <p className="text-gray-600">Choose a conversation from the list to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;