import { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Hardcoded fallback data for conversations and messages
const HARDCODED_CONVERSATIONS = [
  {
    id: 'chat1',
    chatId: '1_2_101', // emad (1) and nima (2) about book 101
    bookTitle: 'Intro to Algorithms',
    lastMessage: {
      text: 'See you at the library!',
      createdAt: '2024-05-01T10:00:00Z',
      senderId: 2,
      receiverId: 1
    },
    otherUser: { id: 2, username: 'nima' }
  },
  {
    id: 'chat2',
    chatId: '1_3_202', // emad (1) and ali (3) about book 202
    bookTitle: 'Discrete Math',
    lastMessage: {
      text: 'Is the price negotiable?',
      createdAt: '2024-05-20T15:30:00Z',
      senderId: 3,
      receiverId: 1
    },
    otherUser: { id: 3, username: 'ali' }
  },
  {
    id: 'chat3',
    chatId: '2_1_303', // nima (2) and emad (1) about book 303 (swap initiated by nima)
    bookTitle: 'Linear Algebra',
    lastMessage: {
      text: 'I can swap for Calculus I.',
      createdAt: '2024-05-21T11:00:00Z',
      senderId: 2,
      receiverId: 1
    },
    otherUser: { id: 2, username: 'nima' }
  },
  {
    id: 'chat4',
    chatId: '1_4_404', // emad (1) and sara (4) about book 404
    bookTitle: 'Machine Learning Basics',
    lastMessage: {
      text: 'When can I pick it up?',
      createdAt: '2024-05-18T09:20:00Z',
      senderId: 4,
      receiverId: 1
    },
    otherUser: { id: 4, username: 'sara' }
  },
  {
    id: 'chat5',
    chatId: '5_1_505', // john (5) and emad (1) about book 505
    bookTitle: 'Artificial Intelligence',
    lastMessage: {
      text: 'Thanks for the information!',
      createdAt: '2024-05-15T14:45:00Z',
      senderId: 5,
      receiverId: 1
    },
    otherUser: { id: 5, username: 'john' }
  },
  {
    id: 'chat6',
    chatId: '1_6_606', // emad (1) and mia (6) about book 606
    bookTitle: 'Database Systems',
    lastMessage: {
      text: 'Perfect, see you tomorrow!',
      createdAt: '2024-05-10T16:30:00Z',
      senderId: 1,
      receiverId: 6
    },
    otherUser: { id: 6, username: 'mia' }
  },
  {
    id: 'chat7',
    chatId: '3_1_707', // ali (3) and emad (1) about book 707
    bookTitle: 'Data Structures and Algorithms',
    lastMessage: {
      text: 'Would you accept a swap for my programming book?',
      createdAt: '2024-05-05T11:15:00Z',
      senderId: 3,
      receiverId: 1
    },
    otherUser: { id: 3, username: 'ali' }
  },
  {
    id: 'chat8',
    chatId: '1_7_808', // emad (1) and alex (7) about book 808
    bookTitle: 'Operating Systems',
    lastMessage: {
      text: 'I\'ll think about your offer.',
      createdAt: '2024-05-02T08:50:00Z',
      senderId: 1,
      receiverId: 7
    },
    otherUser: { id: 7, username: 'alex' }
  }
];

const HARDCODED_MESSAGES = [
  // Chat 1: emad (1) and nima (2) about Intro to Algorithms (101)
  {
    id: 1,
    chatId: '1_2_101',
    senderId: 1,
    receiverId: 2,
    text: 'Hi nima, is the Intro to Algorithms book still available?',
    createdAt: '2024-05-01T09:55:00Z',
    isRead: true
  },
  {
    id: 2,
    chatId: '1_2_101',
    senderId: 2,
    receiverId: 1,
    text: 'Yes, emad, it is!',
    createdAt: '2024-05-01T09:56:00Z',
    isRead: true
  },
  {
    id: 3,
    chatId: '1_2_101',
    senderId: 1,
    receiverId: 2,
    text: 'Great, can we meet at the library to exchange?',
    createdAt: '2024-05-01T09:58:00Z',
    isRead: true
  },
  {
    id: 4,
    chatId: '1_2_101',
    senderId: 2,
    receiverId: 1,
    text: 'See you at the library!',
    createdAt: '2024-05-01T10:00:00Z',
    isRead: false
  },

  // Chat 2: emad (1) and ali (3) about Discrete Math (202)
  {
    id: 5,
    chatId: '1_3_202',
    senderId: 3,
    receiverId: 1,
    text: 'Hi emad, is the Discrete Math book still available? Is the price negotiable?',
    createdAt: '2024-05-20T15:30:00Z',
    isRead: true
  },
  {
    id: 6,
    chatId: '1_3_202',
    senderId: 1,
    receiverId: 3,
    text: 'Hi ali, yes it is. The price is firm though.',
    createdAt: '2024-05-20T15:35:00Z',
    isRead: true
  },
  {
    id: 7,
    chatId: '1_3_202',
    senderId: 3,
    receiverId: 1,
    text: 'Understood. I\'ll take it at the asking price. When can we meet?',
    createdAt: '2024-05-20T15:40:00Z',
    isRead: true
  },
  {
    id: 8,
    chatId: '1_3_202',
    senderId: 1,
    receiverId: 3,
    text: 'Great! How about tomorrow at the campus cafe?',
    createdAt: '2024-05-20T15:45:00Z',
    isRead: false
  },

  // Chat 3: nima (2) and emad (1) about Linear Algebra (303) - Swap Request
  {
    id: 9,
    chatId: '2_1_303',
    senderId: 2,
    receiverId: 1,
    text: 'Hi emad, I\'m interested in your Linear Algebra book. I can offer Calculus I for a swap.',
    createdAt: '2024-05-21T11:00:00Z',
    isRead: true
  },
  {
    id: 10,
    chatId: '2_1_303',
    senderId: 1,
    receiverId: 2,
    text: 'Thanks for the offer, nima! Let me think about it.',
    createdAt: '2024-05-21T11:05:00Z',
    isRead: true
  },
  // Hardcoded Swap Request Message (from nima to emad)
  {
    id: 11,
    chatId: '2_1_303',
    senderId: 2,
    receiverId: 1,
    text: 'SWAP_REQUEST: Linear Algebra for Calculus I',
    createdAt: '2024-05-22T10:00:00Z',
    isRead: true,
    isSwapRequest: true,
    swapDetails: {
      requestedBookTitle: 'Linear Algebra',
      offeredBookTitles: ['Calculus I'],
      swapOfferId: 'swapOffer123'
    },
    status: 'pending' // 'pending', 'accepted', or 'declined'
  },

  // Chat 5: john (5) and emad (1) about Artificial Intelligence (505) - Cancelled Purchase
  {
    id: 18, // New ID
    chatId: '5_1_505',
    senderId: 1, // Emad
    receiverId: 5, // John
    text: 'TRANSACTION_CANCELLED: The purchase of "Artificial Intelligence" has been cancelled.',
    createdAt: '2024-05-15T14:50:00Z', // After last message in conversation
    isRead: true,
    isSystemMessage: true, // To style it as a system message
    transactionType: 'purchase',
    transactionStatus: 'cancelled',
    transactionId: 'cancelled-purchase-1' // Link to TransactionsPage
  },

  // Chat 6: emad (1) and mia (6) about Database Systems (606) - Swap Declined Message
  {
    id: 19, // New ID
    chatId: '1_6_606',
    senderId: null, // System message
    receiverId: 1, // Emad
    text: 'TRANSACTION_DECLINED: Your swap offer for "Database Systems" with Mia was declined.',
    createdAt: '2024-05-10T16:35:00Z', // After last message in conversation
    isRead: true,
    isSystemMessage: true,
    transactionType: 'swap',
    transactionStatus: 'declined',
    transactionId: 'declined-swap-1' // Link to TransactionsPage
  },

  // Chat 7: ali (3) and emad (1) about Data Structures and Algorithms (707) - Another Swap Request
  {
    id: 12,
    chatId: '3_1_707',
    senderId: 3,
    receiverId: 1,
    text: 'Hi emad, I have a Data Structures and Algorithms book that I\'d like to swap. Are you interested?',
    createdAt: '2024-05-05T11:00:00Z',
    isRead: true
  },
  {
    id: 13,
    chatId: '3_1_707',
    senderId: 1,
    receiverId: 3,
    text: 'Hi ali, what book are you looking to get in return?',
    createdAt: '2024-05-05T11:05:00Z',
    isRead: true
  },
  {
    id: 14,
    chatId: '3_1_707',
    senderId: 3,
    receiverId: 1,
    text: 'I\'m looking for any good programming book, preferably on Python or JavaScript.',
    createdAt: '2024-05-05T11:10:00Z',
    isRead: true
  },
  {
    id: 15,
    chatId: '3_1_707',
    senderId: 1,
    receiverId: 3,
    text: 'I have "Python for Data Science" if you\'re interested.',
    createdAt: '2024-05-05T11:12:00Z',
    isRead: true
  },
  {
    id: 16,
    chatId: '3_1_707',
    senderId: 3,
    receiverId: 1,
    text: 'That would be perfect! Let me send you a formal swap proposal.',
    createdAt: '2024-05-05T11:15:00Z',
    isRead: true
  },
  // Hardcoded Swap Request from Ali to Emad
  {
    id: 17,
    chatId: '3_1_707',
    senderId: 3,
    receiverId: 1,
    text: 'SWAP_REQUEST: Data Structures and Algorithms for Python for Data Science',
    createdAt: '2024-05-05T11:20:00Z',
    isRead: true,
    isSwapRequest: true,
    swapDetails: {
      requestedBookTitle: 'Python for Data Science',
      offeredBookTitles: ['Data Structures and Algorithms'],
      swapOfferId: 'swapOffer456'
    },
    status: 'pending' // 'pending', 'accepted', or 'declined'
  }
];

// Dummy components for fallback UI
const ConversationItem = ({ conversation, active, onClick }) => (
  <div
    className={`p-3 cursor-pointer ${active ? 'bg-blue-100' : ''}`}
    onClick={() => onClick(conversation)}
  >
    <div className="font-medium">{conversation.bookTitle}</div>
    <div className="text-xs text-gray-500">{conversation.lastMessage.text}</div>
  </div>
);
const MessageList = ({ messages, currentUser, onSwapAction }) => (
  <div className="flex-1 overflow-y-auto p-4">
    {messages.map(msg => (
      <div key={msg.id} className={`mb-2 ${msg.isSystemMessage ? 'text-center' : msg.senderId === currentUser.id ? 'text-right' : 'text-left'}`}>
        {msg.isSwapRequest ? (
          // Render stylish swap request message with status-dependent styling
          <div className={`inline-block p-4 rounded-lg text-left max-w-md ${
            msg.status === 'accepted' ? 'bg-green-100 text-green-800' : 
            msg.status === 'declined' ? 'bg-red-100 text-red-800' : 
            'bg-blue-100 text-blue-800'
          }`}>
            <p className="font-semibold mb-2">Swap Request:</p>
            <p className="text-sm">
              <span className="font-medium">Requested:</span> {msg.swapDetails.requestedBookTitle}
            </p>
            <p className="text-sm mb-3">
              <span className="font-medium">Offering:</span> {msg.swapDetails.offeredBookTitles.join(', ')}
            </p>
            
            {msg.status === 'accepted' && (
              <div className="bg-green-200 text-green-800 px-3 py-1 rounded text-xs inline-block">
                Accepted
              </div>
            )}
            
            {msg.status === 'declined' && (
              <div className="bg-red-200 text-red-800 px-3 py-1 rounded text-xs inline-block">
                Declined
              </div>
            )}
            
            {msg.status === 'pending' && msg.senderId !== currentUser.id && (
              <div className="flex space-x-2">
                <button 
                  className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                  onClick={() => onSwapAction(msg.swapDetails.swapOfferId, 'accepted', msg.id)}
                >
                  Accept
                </button>
                <button 
                  className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                  onClick={() => onSwapAction(msg.swapDetails.swapOfferId, 'declined', msg.id)}
                >
                  Decline
                </button>
              </div>
            )}
          </div>
        ) : msg.isSystemMessage ? (
          // Render system message (like transaction notifications)
          <div className="inline-block max-w-md mx-auto my-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-yellow-800">{msg.text}</span>
            </div>
            <div className="mt-1 text-right">
              <Link
                to={msg.transactionId ? `/transactions#${msg.transactionId}` : "/transactions"} 
                className="text-xs text-blue-600 hover:underline"
              >
                View {msg.transactionId ? 'this transaction' : 'transactions'}
              </Link>
            </div>
          </div>
        ) : (
          // Render normal message
          <span className="inline-block px-3 py-2 rounded-lg bg-gray-100">{msg.text}</span>
        )}
        <div className="text-xs text-gray-400">{new Date(msg.createdAt).toLocaleString()}</div>
      </div>
    ))}
  </div>
);
const MessageInput = ({ onSend }) => {
  const [text, setText] = useState('');
  return (
    <form className="flex p-2 border-t" onSubmit={e => { e.preventDefault(); onSend(text); setText(''); }}>
      <input className="flex-1 border rounded p-2" value={text} onChange={e => setText(e.target.value)} placeholder="Type a message..." />
      <button className="ml-2 px-4 py-2 bg-blue-600 text-white rounded" type="submit">Send</button>
    </form>
  );
};
const ChatHeader = ({ book, otherUser }) => {
  // Define a mapping of usernames to profile routes
  const userProfileRoutes = {
    'nima': '/nima-profile',
    'ali': '/ali-profile',
    // Add other users as needed
  };

  // Get the profile route for the current user or use a default
  const profileRoute = otherUser?.username ? userProfileRoutes[otherUser.username.toLowerCase()] : null;

  return (
    <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
      <div>
        <div className="font-semibold">{book?.title || 'Book'}</div>
        <div className="text-xs text-gray-500">
          by {book?.author || 'Unknown Author'}
          {book?.price > 0 && <span className="text-green-600 ml-2">${book.price.toFixed(2)}</span>}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          with {profileRoute ? (
            <Link to={profileRoute} className="text-blue-600 hover:underline">{otherUser?.username || 'User'}</Link>
          ) : (
            <span>{otherUser?.username || 'User'}</span>
          )}
        </div>
      </div>
    </div>
  );
};

// Comment out the real context import for fallback
// import { useMessage } from '../contexts/useMessage';

const Messages = () => {
  // Use the actual authenticated user from the AuthContext
  // eslint-disable-next-line no-unused-vars
  const { user, isAuthenticated } = useAuth();
  
  // Fallback: use hardcoded user and data
  const [selectedChat, setSelectedChat] = useState(null); // Initialize as null
  const [activeChatDetails, setActiveChatDetails] = useState(null); // Initialize as null
  const [messages, setMessages] = useState([]); // Initialize as empty array
  const [searchTerm, setSearchTerm] = useState(''); // State for search term
  const [showLocationPrompt, setShowLocationPrompt] = useState(false); // State for location prompt
  // eslint-disable-next-line no-unused-vars
  const [pendingSwapId, setPendingSwapId] = useState(null); // State for pending swap ID
  
  // Filter conversations based on search term
  const filteredConversations = HARDCODED_CONVERSATIONS.filter(conversation => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return (
      conversation.bookTitle.toLowerCase().includes(lowerCaseSearchTerm) ||
      conversation.otherUser.username.toLowerCase().includes(lowerCaseSearchTerm) ||
      conversation.lastMessage.text.toLowerCase().includes(lowerCaseSearchTerm)
    );
  });

  const conversations = filteredConversations; // Use filtered conversations
  // eslint-disable-next-line no-unused-vars
  const loading = { conversations: false, messages: false };
  // eslint-disable-next-line no-unused-vars
  const error = null;
  // eslint-disable-next-line no-unused-vars
  const navigate = useNavigate();

  // Handle selecting a conversation
  const handleSelectConversation = (conversation) => {
    setSelectedChat(conversation);
    // Filter messages for the selected chat
    const chatMessages = HARDCODED_MESSAGES.filter(m => m.chatId === conversation.chatId);
    setMessages(chatMessages);

    // Find the other user and book details for the selected chat
    const otherUser = conversation.otherUser;
    
    // Get the book title from the chat data directly to ensure consistency
    const bookTitle = conversation.bookTitle;
    
    // For book details, use the appropriate title based on the chat
    let bookAuthor = 'Unknown Author';
    let bookPrice = 0.00;
    
    // Set proper authors for specific books based on chatId
    if (conversation.chatId === '1_2_101') {
      bookAuthor = 'Thomas H. Cormen';
      bookPrice = 25.00; // For consistency with transactions
    } else if (conversation.chatId === '1_3_202') {
      bookAuthor = 'Kenneth Rosen';
      bookPrice = 40.00; // For consistency with transactions
    } else if (conversation.chatId === '2_1_303') {
      bookAuthor = 'Gilbert Strang';
    } else if (conversation.chatId === '1_4_404') {
      bookAuthor = 'Kevin P. Murphy';
      bookPrice = 25.00; // For consistency with transactions
    } else if (conversation.chatId === '5_1_505') {
      bookAuthor = 'Stuart Russell';
      bookPrice = 35.00; // For consistency with transactions
    } else if (conversation.chatId === '1_6_606') {
      bookAuthor = 'Hector Garcia-Molina';
    } else if (conversation.chatId === '3_1_707') {
      bookAuthor = 'Robert Lafore';
    } else if (conversation.chatId === '1_7_808') {
      bookAuthor = 'Andrew S. Tanenbaum';
    }
    
    const book = { 
      id: conversation.bookId, 
      title: bookTitle, 
      author: bookAuthor, 
      price: bookPrice,
      cover: null 
    };

    setActiveChatDetails({
      book,
      otherUser
    });
  };

  // Handle swap action (hardcoded simulation)
  const handleSwapAction = (swapOfferId, action, messageId) => {
    console.log(`Simulating swap offer ${swapOfferId} ${action}.`);
    
    // Update the swap request message status
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, status: action } : msg
    ));
    
    // Add a hardcoded message to the chat simulating the action result
    const actionMessage = {
      id: Date.now(), // Use timestamp for unique ID
      chatId: selectedChat.chatId,
      senderId: user.id, // Message is from the current user (emad)
      receiverId: selectedChat.otherUser.id,
      text: `Swap offer ${action}!`,
      createdAt: new Date().toISOString(),
      isRead: false
    };
    setMessages(prev => [...prev, actionMessage]);
    
    // If accepted, show location prompt
    if (action === 'accepted') {
      setPendingSwapId(swapOfferId);
      setTimeout(() => {
        setShowLocationPrompt(true);
      }, 500);
      
      // Add a transaction notification message after a short delay
      setTimeout(() => {
        // Generate a transaction ID that will match the transaction in the transactions page
        const generatedTransactionId = selectedChat.chatId === '2_1_303' ? 
          'scheduled-swap-1' : selectedChat.chatId === '3_1_707' ? 
          'scheduled-swap-2' : `scheduled-swap-${Date.now()}`;
          
        const transactionMessage = {
          id: Date.now() + 2, // Use timestamp + 2 for unique ID
          chatId: selectedChat.chatId,
          senderId: user.id, // System message
          receiverId: selectedChat.otherUser.id,
          text: 'A new transaction has been created. You can view and manage it in the Transactions page.',
          createdAt: new Date().toISOString(),
          isRead: false,
          isSystemMessage: true,
          transactionId: generatedTransactionId // Reference to the transaction ID
        };
        setMessages(prev => [...prev, transactionMessage]);
      }, 2000); // Show after location selection
      
    } else {
      // If declined, simulate a reply from the other user after a short delay
      setTimeout(() => {
        const replyMessage = {
          id: Date.now() + 1, // Use timestamp + 1 for unique ID
          chatId: selectedChat.chatId,
          senderId: selectedChat.otherUser.id,
          receiverId: user.id,
          text: 'Okay, maybe next time.',
          createdAt: new Date().toISOString(),
          isRead: false
        };
        setMessages(prev => [...prev, replyMessage]);
        
        // Add a transaction cancellation notification
        setTimeout(() => {
          // Generate a transaction ID that will match the transaction in the transactions page
          const generatedTransactionId = selectedChat.chatId === '2_1_303' ? 
            'declined-swap-1' : selectedChat.chatId === '3_1_707' ? 
            'declined-swap-2' : `declined-swap-${Date.now()}`;
            
          const transactionMessage = {
            id: Date.now() + 2, // Use timestamp + 2 for unique ID
            chatId: selectedChat.chatId,
            senderId: -1, // System message
            receiverId: -1,
            text: 'The swap request has been declined. This transaction has been cancelled.',
            createdAt: new Date().toISOString(),
            isRead: false,
            isSystemMessage: true,
            transactionId: generatedTransactionId // Reference to the transaction ID
          };
          setMessages(prev => [...prev, transactionMessage]);
        }, 1000);
      }, 1000); // Simulate delay
    }
  };
  
  // Handle location selection for swap
  const handleLocationSelection = (location) => {
    // Close location prompt
    setShowLocationPrompt(false);
    
    // Add a message about the selected location
    const locationMessage = {
      id: Date.now(), // Use timestamp for unique ID
      chatId: selectedChat.chatId,
      senderId: user.id,
      receiverId: selectedChat.otherUser.id,
      text: `Let's meet at ${location} for the swap.`,
      createdAt: new Date().toISOString(),
      isRead: false
    };
    setMessages(prev => [...prev, locationMessage]);
    
    // Simulate reply from other user
    setTimeout(() => {
      const replyMessage = {
        id: Date.now() + 1, // Use timestamp + 1 for unique ID
        chatId: selectedChat.chatId,
        senderId: selectedChat.otherUser.id,
        receiverId: user.id,
        text: `Perfect! See you at ${location}. I'll bring the book.`,
        createdAt: new Date().toISOString(),
        isRead: false
      };
      setMessages(prev => [...prev, replyMessage]);
      
      // Add transaction confirmation after other user replies
      setTimeout(() => {
        const transactionConfirmation = {
          id: Date.now() + 2, // Use timestamp + 2 for unique ID
          chatId: selectedChat.chatId,
          senderId: -1, // System message indicator
          receiverId: -1,
          text: `A transaction has been scheduled at ${location}. You can view all details in the Transactions page.`,
          createdAt: new Date().toISOString(),
          isRead: false,
          isSystemMessage: true,
          transactionId: `scheduled-swap-${Date.now()}` // Add a unique transaction ID for reference
        };
        setMessages(prev => [...prev, transactionConfirmation]);
      }, 1500);
      
    }, 1000);
  };

  // Handle sending a message (just append locally and simulate reply)
  const handleSendMessage = (text) => {
    if (!selectedChat || !text.trim() || !user?.id) return;

    const newMessage = {
      id: messages.length + 1,
      chatId: selectedChat.chatId,
      senderId: user.id,
      receiverId: selectedChat.otherUser.id,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      isRead: false
    };

    setMessages(prev => [...prev, newMessage]);

    // Simulate instant reply or swap status message
    setTimeout(() => {
      let replyText = 'Okay!';
      let replySenderId = selectedChat.otherUser.id;

      // Check if the sent message is a swap action command
      if (text.toLowerCase().includes('accept swap')) {
         // This case is now handled by handleSwapAction, so no reply here
         return;
      } else if (text.toLowerCase().includes('decline swap')) {
         // This case is now handled by handleSwapAction, so no reply here
         return;
      } else if (text.toLowerCase().includes('hello') || text.toLowerCase().includes('hi')) {
        replyText = 'Hi there!';
      } else if (text.toLowerCase().includes('price negotiable')) {
        replyText = 'The price is firm.';
      } else {
        // Default random reply
        const randomReplies = ['Got it.', 'Thanks!', 'Sounds good.', 'Okay.'];
        replyText = randomReplies[Math.floor(Math.random() * randomReplies.length)];
      }

      const replyMessage = {
        id: messages.length + 2, // Ensure unique ID
        chatId: selectedChat.chatId,
        senderId: replySenderId,
        receiverId: user.id,
        text: replyText,
        createdAt: new Date().toISOString(),
        isRead: false
      };

      setMessages(prev => [...prev, replyMessage]);
    }, 500); // Simulate typing delay
  };

  // Effect to select chat based on URL parameter on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const targetUsername = params.get('user');

    if (targetUsername && user?.id) { // Ensure user is loaded before processing param
      const targetConversation = HARDCODED_CONVERSATIONS.find(conv => 
        // Find conversation where current user is one participant and targetUsername is the other
        (conv.otherUser.username.toLowerCase() === targetUsername.toLowerCase() && 
         (conv.chatId.startsWith(`${user.id}_`) || conv.chatId.endsWith(`_${user.id}`)))
      );

      if (targetConversation) {
        handleSelectConversation(targetConversation);
      } else {
        // Handle case where user is specified but no matching chat is found for the current logged-in user
        console.warn(`No hardcoded chat found for user ${user.username} with user: ${targetUsername}`);
        // Optionally select a default chat or show a message
        if (HARDCODED_CONVERSATIONS.length > 0) {
             // Find a conversation involving the current user to select by default
             const userConversation = HARDCODED_CONVERSATIONS.find(conv => 
                (conv.chatId.startsWith(`${user.id}_`) || conv.chatId.endsWith(`_${user.id}`)));
             if (userConversation) {
                 handleSelectConversation(userConversation);
             } else {
                 // If no conversations for the current user, select the very first one as a fallback
                 handleSelectConversation(HARDCODED_CONVERSATIONS[0]);
             }
        }
      }
    } else if (user?.id && HARDCODED_CONVERSATIONS.length > 0) {
        // Select the first chat involving the current user by default if no user is specified in URL
        const userConversation = HARDCODED_CONVERSATIONS.find(conv => 
            (conv.chatId.startsWith(`${user.id}_`) || conv.chatId.endsWith(`_${user.id}`)));
        if (userConversation) {
            handleSelectConversation(userConversation);
        } else {
            // If no conversations for the current user, select the very first one as a fallback
            handleSelectConversation(HARDCODED_CONVERSATIONS[0]);
        }
    }
  }, [user]); // Depend on user to ensure it's loaded


  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Messages</h1>
        <div className="flex space-x-4">
          <Link to="/transactions" className="text-blue-600 hover:text-blue-800">
            View Transactions
          </Link>
          <Link to="/books" className="text-blue-600 hover:text-blue-800">
            Browse Books
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-3 border-b border-gray-200">
              <h2 className="font-medium">Conversations</h2>
              {/* Search Input */}
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full p-2 border border-gray-300 rounded mt-2"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="overflow-y-auto max-h-[calc(100vh-300px)]"> {/* Adjusted max-height */}
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No conversations found.</div>
              ) : (
                conversations.map(conversation => (
                  <ConversationItem
                    key={conversation.id || conversation.chatId}
                    conversation={conversation}
                    active={selectedChat && selectedChat.chatId === conversation.chatId}
                    onClick={handleSelectConversation}
                  />
                ))
              )}
            </div>
          </div>
        </div>
        {/* Messages Panel */}
        <div className="md:col-span-2">
          {selectedChat ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-[calc(100vh-250px)]">
              <ChatHeader 
                book={activeChatDetails.book} 
                otherUser={activeChatDetails.otherUser}
              />
              <MessageList 
                messages={messages} 
                currentUser={user}
                onSwapAction={handleSwapAction}
              />
              <MessageInput onSend={handleSendMessage} />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center h-[calc(100vh-250px)] flex flex-col items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-gray-500">Select a conversation to view messages</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Location Selection Modal */}
      {showLocationPrompt && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Where would you like to meet?</h3>
            <p className="text-gray-600 mb-4">Please select a location for the book swap:</p>
            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={() => handleLocationSelection('Campus Library')}
                className="px-4 py-3 bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-lg text-left font-medium"
              >
                Campus Library
              </button>
              <button 
                onClick={() => handleLocationSelection('Student Center')}
                className="px-4 py-3 bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-lg text-left font-medium"
              >
                Student Center
              </button>
              <button 
                onClick={() => handleLocationSelection('Campus Cafe')}
                className="px-4 py-3 bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-lg text-left font-medium"
              >
                Campus Cafe
              </button>
              <button 
                onClick={() => handleLocationSelection('Engineering Building')}
                className="px-4 py-3 bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-lg text-left font-medium"
              >
                Engineering Building
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;