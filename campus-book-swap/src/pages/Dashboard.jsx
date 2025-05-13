import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import BookForm from '../components/BookForm';
import { swapOfferAPI } from '../services/api';

const Dashboard = () => {
  const { user, authAxios, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Dashboard state
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBookForm, setShowBookForm] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  
  // User data state
  const [myBooks, setMyBooks] = useState([]);
  const [pendingSwaps, setPendingSwaps] = useState([]);
  const [pendingPurchaseRequests, setPendingPurchaseRequests] = useState([]);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    completedTransactions: 0,
    pendingTransactions: 0,
    totalEarnings: 0,
    savedBySwapping: 0
  });

  // Check authentication on load
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin?redirectTo=/dashboard');
    } else if (user && user.id) {
      fetchDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, navigate]);

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchMyBooks(),
        fetchPendingSwaps(),
        fetchTransactionHistory(),
        fetchPendingPurchaseRequests(),
        calculateStats()
      ]);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user's books
  const fetchMyBooks = async () => {
    try {
      const response = await authAxios.get(
        `${import.meta.env.VITE_API_URL}/api/books?filters[users_permissions_user][id][$eq]=${user.id}&populate=*`
      );
      
      const books = response.data.data.map(book => {
        let coverUrl = null;
        try {
          if (book.attributes?.cover?.data?.attributes?.url) {
            coverUrl = `${import.meta.env.VITE_API_URL}${book.attributes.cover.data.attributes.url}`;
          } else if (book.attributes?.cover?.url) {
            coverUrl = `${import.meta.env.VITE_API_URL}${book.attributes.cover.url}`;
          }
        } catch (err) {
          console.log(`Cover processing error for book ${book.id}:`, err);
        }
        
        return {
          id: book.id,
          ...book.attributes,
          cover: coverUrl,
          category: book.attributes?.category?.data ? {
            id: book.attributes.category.data.id,
            name: book.attributes.category.data.attributes?.name || 
                  book.attributes.category.data.attributes?.Type || 
                  'Unknown Category'
          } : null
        };
      });
      
      setMyBooks(books);
    } catch (err) {
      console.error('Error fetching books:', err);
      throw err;
    }
  };

  // Fetch pending swap requests using the new API service
  const fetchPendingSwaps = async () => {
    if (!user || !user.id) return;
    try {
      const response = await swapOfferAPI.getUserSwapOffers();
      const swapsData = response.data || []; 
      
      // Log swap data for debugging
      console.log('Raw swap data from API:', swapsData);
      
      const processedSwaps = swapsData
        .filter(swap => swap.status === 'pending')
        .map(swap => {
        const isUserRequester = swap.requester && swap.requester.id === user.id;
        const otherUser = isUserRequester ? swap.owner : swap.requester;
        
        // Process requested book with proper error handling
        let requestedBookDetails = { id: null, title: 'Unknown Book', author: 'Unknown Author', cover: null };
        if (swap.requestedBook) {
          let coverUrl = null;
          // Handle cover image
          if (swap.requestedBook.cover?.data?.attributes?.url) {
            coverUrl = `${import.meta.env.VITE_API_URL}${swap.requestedBook.cover.data.attributes.url}`;
          } else if (swap.requestedBook.cover?.url) {
            coverUrl = `${import.meta.env.VITE_API_URL}${swap.requestedBook.cover.url}`;
          }
          
          requestedBookDetails = {
            id: swap.requestedBook.id,
            title: swap.requestedBook.title || 'Unknown Book',
            author: swap.requestedBook.author || 'Unknown Author',
            cover: coverUrl
          };
        }
        
        // Process offered books with proper error handling
        let offeredBooksSummary = 'Book(s) offered by requester';
        let offeredBooks = [];
        if (Array.isArray(swap.offeredBooks) && swap.offeredBooks.length > 0) {
          // Process each offered book
          offeredBooks = swap.offeredBooks.map(book => {
            let coverUrl = null;
            if (book.cover?.data?.attributes?.url) {
              coverUrl = `${import.meta.env.VITE_API_URL}${book.cover.data.attributes.url}`;
            } else if (book.cover?.url) {
              coverUrl = `${import.meta.env.VITE_API_URL}${book.cover.url}`;
            }
            
            return {
              id: book.id,
              title: book.title || 'Unknown Book',
              author: book.author || 'Unknown Author',
              cover: coverUrl
            };
          });
          
          offeredBooksSummary = `${swap.offeredBooks[0].title || 'Unnamed Book'}${swap.offeredBooks.length > 1 ? ` (+${swap.offeredBooks.length - 1} more)` : ''}`;
        }
        
        // Ensure we have a chatId
        const chatId = swap.chatId || 
          (swap.requester?.id && swap.owner?.id && swap.requestedBook?.id ? 
            `${swap.requester.id}_${swap.owner.id}_${swap.requestedBook.id}` : 
            null);

        return {
          id: swap.id,
          ...swap,
          isUserRequester,
          otherUser: otherUser ? { id: otherUser.id, username: otherUser.username || 'Unknown User' } : { id: null, username: 'Unknown User' },
          requestedBookDetails,
          offeredBooksSummary,
          offeredBooks,
          type: 'swap',
          timestamp: swap.timestamp || new Date().toISOString(),
          chatId
        };
      });
      
      console.log('Processed swap offers:', processedSwaps);
      setPendingSwaps(processedSwaps);
    } catch (err) {
      console.error('Error fetching pending swaps:', err.response ? err.response.data : err.message);
      setError(prev => prev + ' Failed to fetch pending swaps.');
    }
  };

  // Fetch pending purchase requests
  const fetchPendingPurchaseRequests = async () => {
    try {
      const response = await authAxios.get(
        `${import.meta.env.VITE_API_URL}/api/messages?filters[receiver][id][$eq]=${user.id}&filters[messageType][$eq]=purchase_request&filters[requestStatus][$eq]=pending&populate=*`
      );
      
      const purchaseRequests = response.data.data || [];
      
      const processedRequests = await Promise.all(purchaseRequests.map(async (request) => {
        try {
          const bookId = request.attributes.book?.data?.id || request.attributes.bookId;
          const bookResponse = await authAxios.get(
            `${import.meta.env.VITE_API_URL}/api/books/${bookId}?populate=*`
          );
          
          const senderId = request.attributes.sender?.data?.id || request.attributes.senderId;
          const userResponse = await authAxios.get(
            `${import.meta.env.VITE_API_URL}/api/users/${senderId}`
          );
          
          return {
            id: request.id,
            ...request.attributes,
            book: bookResponse.data.data,
            buyer: userResponse.data,
            chatId: request.attributes.ChatId,
            type: 'purchase'
          };
        } catch (err) {
          console.error('Error processing purchase request data:', err);
          return {
            id: request.id,
            ...request.attributes,
            book: { attributes: { title: 'Unknown Book' } },
            buyer: { username: 'Unknown User' },
            type: 'purchase'
          };
        }
      }));
      
      setPendingPurchaseRequests(processedRequests);
    } catch (err) {
      console.error('Error fetching pending purchase requests:', err);
      throw err;
    }
  };

  // Fetch transaction history
  const fetchTransactionHistory = async () => {
    try {
      const salesResponse = await authAxios.get(
        `${import.meta.env.VITE_API_URL}/api/orders?filters[userId][$eq]=${user.id}&sort[0]=timestamp:desc&populate=*`
      );
      
      const swapsResponse = await authAxios.get(
        `${import.meta.env.VITE_API_URL}/api/swap-offers?filters[$or][0][buyerId][$eq]=${user.id}&filters[$or][1][sellerId][$eq]=${user.id}&filters[status][$eq]=completed&sort[0]=timestamp:desc&populate=*`
      );
      
      const sales = salesResponse.data.data?.map(order => ({
        id: `sale-${order.id}`,
        type: 'purchase',
        date: order.attributes.timestamp,
        amount: order.attributes.totalAmount,
        status: order.attributes.status,
        items: order.attributes.items,
        role: 'buyer'
      })) || [];
      
      const swaps = swapsResponse.data.data?.map(swap => ({
        id: `swap-${swap.id}`,
        type: 'swap',
        date: swap.attributes.timestamp,
        bookId: swap.attributes.bookId,
        offerBookIds: swap.attributes.offerBookIds,
        role: swap.attributes.buyerId === user.id ? 'requester' : 'provider'
      })) || [];
      
      const allTransactions = [...sales, ...swaps].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );
      
      const enrichedTransactions = await Promise.all(allTransactions.map(async (transaction) => {
        try {
          if (transaction.type === 'purchase') {
            return transaction;
          } 
          else if (transaction.type === 'swap') {
            const bookResponse = await authAxios.get(
              `${import.meta.env.VITE_API_URL}/api/books/${transaction.bookId}?populate=*`
            );
            
            const otherUserId = transaction.role === 'requester' ? 
              transaction.sellerId : transaction.buyerId;
            
            const userResponse = await authAxios.get(
              `${import.meta.env.VITE_API_URL}/api/users/${otherUserId}`
            );
            
            return {
              ...transaction,
              book: bookResponse.data.data,
              otherUser: userResponse.data
            };
          }
          
          return transaction;
        } catch (err) {
          console.error('Error enriching transaction data:', err);
          return transaction;
        }
      }));
      
      setTransactionHistory(enrichedTransactions);
    } catch (err) {
      console.error('Error fetching transaction history:', err);
      throw err;
    }
  };

  // Calculate dashboard stats
  const calculateStats = async () => {
    try {
      const mockStats = {
        totalListings: 0,
        activeListings: 0,
        completedTransactions: 0,
        pendingTransactions: 0,
        totalEarnings: 0,
        savedBySwapping: 0
      };
      
      const booksResponse = await authAxios.get(
        `${import.meta.env.VITE_API_URL}/api/books?filters[users_permissions_user][id][$eq]=${user.id}&pagination[pageSize]=1&pagination[page]=1`
      );
      mockStats.totalListings = booksResponse.data.meta.pagination.total;
      mockStats.activeListings = booksResponse.data.meta.pagination.total;
      
      const completedSalesResponse = await authAxios.get(
        `${import.meta.env.VITE_API_URL}/api/orders?filters[userId][$eq]=${user.id}&filters[status][$eq]=completed&pagination[pageSize]=1&pagination[page]=1`
      );
      
      const completedSwapsResponse = await authAxios.get(
        `${import.meta.env.VITE_API_URL}/api/swap-offers?filters[$or][0][buyerId][$eq]=${user.id}&filters[$or][1][sellerId][$eq]=${user.id}&filters[status][$eq]=completed&pagination[pageSize]=1&pagination[page]=1`
      );
      
      mockStats.completedTransactions = 
        completedSalesResponse.data.meta.pagination.total + 
        completedSwapsResponse.data.meta.pagination.total;
      
      const pendingSwapsResponse = await authAxios.get(
        `${import.meta.env.VITE_API_URL}/api/swap-offers?filters[$or][0][buyerId][$eq]=${user.id}&filters[$or][1][sellerId][$eq]=${user.id}&filters[status][$eq]=pending&pagination[pageSize]=1&pagination[page]=1`
      );
      
      const pendingPurchasesResponse = await authAxios.get(
        `${import.meta.env.VITE_API_URL}/api/messages?filters[receiver][id][$eq]=${user.id}&filters[messageType][$eq]=purchase_request&filters[requestStatus][$eq]=pending&pagination[pageSize]=1&pagination[page]=1`
      );
      
      mockStats.pendingTransactions = 
        pendingSwapsResponse.data.meta.pagination.total + 
        pendingPurchasesResponse.data.meta.pagination.total;
      
      mockStats.totalEarnings = 142.50;
      mockStats.savedBySwapping = 87.25;
      
      setStats(mockStats);
    } catch (err) {
      console.error('Error calculating stats:', err);
      throw err;
    }
  };

  // Handle deleting a book
  const handleDeleteBook = async (bookId) => {
    if (!confirm('Are you sure you want to delete this book?')) return;
    
    try {
      await authAxios.delete(`${import.meta.env.VITE_API_URL}/api/books/${bookId}`);
      setMyBooks(myBooks.filter(book => book.id !== bookId));
      calculateStats();
    } catch (err) {
      console.error('Error deleting book:', err);
      setError('Failed to delete book');
    }
  };

  // Handle editing a book
  const handleEditBook = (book) => {
    setSelectedBook(book);
    setShowBookForm(true);
  };

  // Handle book form success
  const handleBookFormSuccess = () => {
    setShowBookForm(false);
    setSelectedBook(null);
    fetchMyBooks();
    calculateStats();
  };

  // Handle responding to a swap request (accept, decline, or cancel)
  const handleSwapResponse = async (swapId, action) => {
    const swap = pendingSwaps.find(s => s.id === swapId);
    if (!swap) {
      console.error('Swap offer not found in local state');
      setError('Could not process swap response: offer not found.');
      return;
    }

    let payload = { status: action };
    let notificationMessage = '';
    let targetUserId = null;

    if (action === 'accepted') {
      if (swap.isUserRequester) return;
      payload.messageToRequester = "I've accepted your swap offer! Let's coordinate the exchange.";
      notificationMessage = payload.messageToRequester;
      targetUserId = swap.requester?.id;
    } else if (action === 'declined') {
      if (swap.isUserRequester) return;
      payload.messageToRequester = "I'm sorry, but I have to decline your swap offer at this time.";
      notificationMessage = payload.messageToRequester;
      targetUserId = swap.requester?.id;
    } else if (action === 'cancelled') {
      if (!swap.isUserRequester) return;
      payload.messageToOwner = "I've cancelled my swap offer.";
      notificationMessage = payload.messageToOwner;
      targetUserId = swap.owner?.id;
    }

    try {
      console.log(`Updating swap offer ${swapId} with status: ${action}`);
      console.log('Payload:', payload);
      
      // Update the swap offer status via API
      const response = await swapOfferAPI.updateSwapOfferStatus(swapId, payload);
      console.log('Update response:', response);
      
      // Refresh the UI
      await fetchPendingSwaps();
      await calculateStats();
      
      // Send notification message if there's a chat
      if (notificationMessage && targetUserId && swap.chatId && swap.requestedBookDetails?.id) {
        console.log('Sending notification message to chat:', {
          chatId: swap.chatId,
          senderId: user.id,
          receiverId: targetUserId,
          bookId: swap.requestedBookDetails.id,
          text: notificationMessage,
          messageType: `swap_${action}`
        });
        
        // Create a notification message in the chat
        await authAxios.post(`${import.meta.env.VITE_API_URL}/api/messages`, {
          data: {
            ChatId: swap.chatId, // Make sure the field name matches the schema
            sender: { id: user.id },
            receiver: { id: targetUserId },
            book: { id: swap.requestedBookDetails.id },
            text: notificationMessage,
            timestamp: new Date().toISOString(),
            messageType: `swap_${action}`,
            read: false
          }
        });
        
        // Show success message to the user
        alert(`Swap offer ${action}. A notification has been sent to the other user.`);
      } else {
        // Show basic success message
        alert(`Swap offer ${action} successfully.`);
      }
    } catch (err) {
      console.error(`Error ${action} swap request:`, err.response ? err.response.data : err.message);
      setError(`Failed to ${action} swap request. ` + (err.response?.data?.error?.message || ''));
      alert(`Failed to ${action} swap request. Please try again.`);
    }
  };

  // Handle responding to a purchase request
  const handlePurchaseResponse = async (messageId, accept) => {
    try {
      // Update the message request status
      await authAxios.put(`${import.meta.env.VITE_API_URL}/api/messages/${messageId}`, {
        data: {
          requestStatus: accept ? 'accepted' : 'declined'
        }
      });
      
      // Refresh pending purchase requests
      fetchPendingPurchaseRequests();
      
      // Update the stats
      calculateStats();
      
      // Send a message notification
      const request = pendingPurchaseRequests.find(req => req.id === messageId);
      if (request) {
        const message = accept
          ? "Great news! I've accepted your purchase request. Let's arrange payment and delivery."
          : "I'm sorry, but I've declined your purchase request.";
        
        await authAxios.post(`${import.meta.env.VITE_API_URL}/api/messages`, {
          data: {
            chatId: request.chatId, 
            sender: { id: user.id },
            receiver: { id: request.buyer.id },
            book: { id: request.book.id },
            text: message,
            messageType: accept ? 'purchase_accepted' : 'purchase_declined',
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (err) {
      console.error('Error responding to purchase request:', err.response ? err.response.data : err.message);
      setError('Failed to respond to purchase request. ' + (err.response?.data?.error?.message || ''));
    }
  };

  // Format timestamp
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Calculate total pending actions
  const pendingActionsCount = pendingSwaps.length + pendingPurchaseRequests.length;

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link to="/" className="text-blue-600 hover:text-blue-800">
          Back to Home
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
          <p>{error}</p>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('overview')}
              className={`mr-8 py-4 px-1 ${
                activeTab === 'overview'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('myBooks')}
              className={`mr-8 py-4 px-1 ${
                activeTab === 'myBooks'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Books
            </button>
            <button
              onClick={() => setActiveTab('actions')}
              className={`mr-8 py-4 px-1 relative ${
                activeTab === 'actions'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending Actions
              {pendingActionsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {pendingActionsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`mr-8 py-4 px-1 ${
                activeTab === 'history'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Transaction History
            </button>
          </nav>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        {activeTab === 'overview' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Welcome, {user.username}!</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-blue-800 text-sm font-medium uppercase">My Books</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.totalListings}</p>
                  <p className="text-gray-500 text-sm">{stats.activeListings} active</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-green-800 text-sm font-medium uppercase">Earnings</p>
                  <p className="text-2xl font-bold text-gray-800">${stats.totalEarnings.toFixed(2)}</p>
                  <p className="text-gray-500 text-sm">From sales</p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-purple-800 text-sm font-medium uppercase">Saved</p>
                  <p className="text-2xl font-bold text-gray-800">${stats.savedBySwapping.toFixed(2)}</p>
                  <p className="text-gray-500 text-sm">By swapping</p>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-yellow-800 text-sm font-medium uppercase">Transactions</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.completedTransactions}</p>
                  <p className="text-gray-500 text-sm">{stats.pendingTransactions} pending</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-800 mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Recent Activity
                  </h3>
                  
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    {transactionHistory.slice(0, 5).length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No recent activity to display
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {transactionHistory.slice(0, 5).map(transaction => (
                          <div key={transaction.id} className="p-3 hover:bg-gray-50">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-800">
                                  {transaction.type === 'purchase' ? 'Purchased books' : 
                                   transaction.type === 'swap' ? (transaction.role === 'requester' ? 'Requested swap' : 'Provided swap') :
                                   transaction.role === 'borrower' ? 'Borrowed book' : 'Lent book'}
                                </p>
                                <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
                              </div>
                              
                              {transaction.type === 'purchase' && (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                                  ${transaction.amount.toFixed(2)}
                                </span>
                              )}
                              
                              {transaction.type === 'swap' && (
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                  Swap
                                </span>
                              )}
                              
                              {transaction.type === 'borrow' && (
                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
                                  Borrow
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 text-right">
                    <button 
                      onClick={() => setActiveTab('history')}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View All Activity
                    </button>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-800 mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Pending Actions
                    {pendingActionsCount > 0 && (
                      <span className="ml-2 bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs">
                        {pendingActionsCount}
                      </span>
                    )}
                  </h3>
                  
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    {pendingActionsCount === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No pending actions to complete
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {pendingSwaps.filter(swap => !swap.isUserBuyer).map(swap => (
                          <div key={`swap-${swap.id}`} className="p-3 hover:bg-gray-50">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-800">
                                  <span className="text-blue-600">{swap.otherUser?.username}</span> requested to swap for your book
                                </p>
                                <p className="text-sm text-gray-600 font-medium mt-1">
                                  Book: {swap.book?.attributes?.title}
                                </p>
                                <div className="mt-2 flex space-x-2">
                                  <button 
                                    onClick={() => handleSwapResponse(swap.id, true)}
                                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                  >
                                    Accept
                                  </button>
                                  <button 
                                    onClick={() => handleSwapResponse(swap.id, false)}
                                    className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200"
                                  >
                                    Decline
                                  </button>
                                </div>
                              </div>
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                Swap Request
                              </span>
                            </div>
                          </div>
                        ))}

                        {/* Show Purchase Requests that require user's action */}
                        {pendingPurchaseRequests.map(request => (
                          <div key={`purchase-${request.id}`} className="p-3 hover:bg-gray-50">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-800">
                                  <span className="text-green-600">{request.buyer?.username}</span> requested to purchase your book
                                </p>
                                <p className="text-sm text-gray-600 font-medium mt-1">
                                  Book: {request.book?.attributes?.title}
                                </p>
                                <div className="mt-2 flex space-x-2">
                                  <button 
                                    onClick={() => handlePurchaseResponse(request.id, true)}
                                    className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                  >
                                    Accept
                                  </button>
                                  <button 
                                    onClick={() => handlePurchaseResponse(request.id, false)}
                                    className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200"
                                  >
                                    Decline
                                  </button>
                                </div>
                              </div>
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                                Purchase Request
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 text-right">
                    <button 
                      onClick={() => setActiveTab('actions')}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View All Actions
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* My Books Tab */}
        {activeTab === 'myBooks' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">My Listed Books</h2>
              <button 
                onClick={() => {
                  setSelectedBook(null);
                  setShowBookForm(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                List a New Book
              </button>
            </div>
            
            {myBooks.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <p className="text-gray-500 mb-4">You don't have any listed books yet.</p>
                <button 
                  onClick={() => {
                    setSelectedBook(null);
                    setShowBookForm(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  List a Book
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myBooks.map(book => (
                  <div key={book.id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                    <div className="p-4 flex">
                      <div className="w-24 h-32 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                        {book.cover ? (
                          <img 
                            src={book.cover} 
                            alt={book.title} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                            <span className="text-gray-500 text-xs">No image</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-4 flex-grow">
                        <div className="flex justify-between">
                          <h3 className="font-medium text-lg text-gray-800">{book.title}</h3>
                          <span className={`
                            px-2 py-0.5 rounded-full text-xs font-medium
                            ${book.bookType === 'For Sale' ? 'bg-green-100 text-green-800' : 
                              book.bookType === 'For Swap' ? 'bg-blue-100 text-blue-800' : 
                              'bg-purple-100 text-purple-800'}
                          `}>
                            {book.bookType}
                          </span>
                        </div>
                        <p className="text-gray-500 text-sm">by {book.author}</p>
                        <div className="mt-2 text-sm">
                          <p><span className="font-medium">Condition:</span> {book.condition}</p>
                          {book.subject && <p><span className="font-medium">Subject:</span> {book.subject}</p>}
                          {book.category && <p><span className="font-medium">Category:</span> {book.category.name}</p>}
                          
                          {book.bookType === 'For Sale' && book.price && (
                            <p><span className="font-medium">Price:</span> ${book.price.toFixed(2)}</p>
                          )}
                          
                          {book.bookType === 'For Swap' && book.exchange && (
                            <p><span className="font-medium">Swap For:</span> {book.exchange}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-100 p-3 bg-gray-50 flex justify-end space-x-2">
                      <button 
                        onClick={() => handleEditBook(book)}
                        className="px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteBook(book.id)}
                        className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Pending Actions Tab */}
        {activeTab === 'actions' && (
          <div>
            <h2 className="text-lg font-medium mb-4">Pending Actions</h2>
            
            {pendingActionsCount === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500">You have no pending actions to complete</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Pending Swap Requests Section */}
                {pendingSwaps.length > 0 && (
                  <div>
                    <h3 className="text-md font-medium mb-3 text-blue-800 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      Swap Requests
                    </h3>
                    
                    <div className="space-y-4">
                      {pendingSwaps.map(swap => (
                        <div key={swap.id} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                {swap.otherUser?.username ? swap.otherUser.username.charAt(0).toUpperCase() : 'U'}
                              </div>
                            </div>
                            
                            <div className="ml-4 flex-grow">
                              <div className="flex justify-between">
                                <h4 className="font-medium text-gray-800">
                                  {swap.isUserBuyer ? 
                                    `You requested to swap with ${swap.otherUser?.username}` : 
                                    `${swap.otherUser?.username} wants to swap with you`}
                                </h4>
                                <span className="text-xs text-gray-500">
                                  {formatDate(swap.timestamp)}
                                </span>
                              </div>
                              
                              <div className="mt-2 bg-white p-3 rounded-lg border border-gray-200">
                                <div className="flex items-center">
                                  <div className="w-12 h-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                                    {swap.book?.attributes?.cover?.data ? (
                                      <img 
                                        src={`${import.meta.env.VITE_API_URL}${swap.book.attributes.cover.data.attributes.url}`} 
                                        alt={swap.book.attributes.title}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                                        <span className="text-gray-500 text-xs">No image</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="ml-3">
                                    <h5 className="font-medium text-gray-800">{swap.book?.attributes?.title}</h5>
                                    <p className="text-sm text-gray-500">{swap.book?.attributes?.author}</p>
                                  </div>
                                </div>
                              </div>
                              
                              {swap.isUserBuyer ? (
                                <div className="mt-2 flex space-x-2">
                                  <Link
                                    to={`/chat/${swap.sellerId}/${swap.bookId}`}
                                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                  >
                                    View in Messages
                                  </Link>
                                </div>
                              ) : (
                                <div className="mt-2 flex space-x-2">
                                  <button 
                                    onClick={() => handleSwapResponse(swap.id, true)}
                                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                  >
                                    Accept Swap
                                  </button>
                                  <button 
                                    onClick={() => handleSwapResponse(swap.id, false)}
                                    className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
                                  >
                                    Decline
                                  </button>
                                  <Link 
                                    to={`/chat/${swap.buyerId}/${swap.bookId}`}
                                    className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 ml-auto"
                                  >
                                    View Chat
                                  </Link>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending Purchase Requests Section */}
                {pendingPurchaseRequests.length > 0 && (
                  <div>
                    <h3 className="text-md font-medium mb-3 text-green-800 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h18M9 9h6m-6 4h6m-6 4h6m-6 4h6" />
                      </svg>
                      Purchase Requests
                    </h3>
                    
                    <div className="space-y-4">
                      {pendingPurchaseRequests.map(request => (
                        <div key={request.id} className="bg-green-50 rounded-lg p-4 border border-green-200">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
                                {request.buyer?.username ? request.buyer.username.charAt(0).toUpperCase() : 'U'}
                              </div>
                            </div>
                            
                            <div className="ml-4 flex-grow">
                              <div className="flex justify-between">
                                <h4 className="font-medium text-gray-800">
                                  {request.buyer?.username} wants to purchase your book
                                </h4>
                                <span className="text-xs text-gray-500">
                                  {formatDate(request.timestamp)}
                                </span>
                              </div>
                              
                              <div className="mt-2 bg-white p-3 rounded-lg border border-gray-200">
                                <div className="flex items-center">
                                  <div className="w-12 h-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                                    {request.book?.attributes?.cover?.data ? (
                                      <img 
                                        src={`${import.meta.env.VITE_API_URL}${request.book.attributes.cover.data.attributes.url}`} 
                                        alt={request.book.attributes.title}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                                        <span className="text-gray-500 text-xs">No image</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="ml-3">
                                    <h5 className="font-medium text-gray-800">{request.book?.attributes?.title}</h5>
                                    <p className="text-sm text-gray-500">{request.book?.attributes?.author}</p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="mt-2 flex space-x-2">
                                <button 
                                  onClick={() => handlePurchaseResponse(request.id, true)}
                                  className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                >
                                  Accept Request
                                </button>
                                <button 
                                  onClick={() => handlePurchaseResponse(request.id, false)}
                                  className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
                                >
                                  Decline
                                </button>
                                <Link 
                                  to={`/chat/${request.buyer.id}/${request.book.id}`}
                                  className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 ml-auto"
                                >
                                  View Chat
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Transaction History Tab */}
        {activeTab === 'history' && (
          <div>
            <h2 className="text-lg font-medium mb-4">Transaction History</h2>
            
            {transactionHistory.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-500">No transaction history yet</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Book
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactionHistory.map(transaction => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(transaction.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${transaction.type === 'purchase' ? 'bg-green-100 text-green-800' : 
                                transaction.type === 'swap' ? 'bg-blue-100 text-blue-800' : 
                                'bg-purple-100 text-purple-800'}`}>
                              {transaction.type === 'purchase' ? 'Purchase' : 
                               transaction.type === 'swap' ? 'Swap' : 'Borrow'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.type === 'purchase' ? 
                              (transaction.items && transaction.items.length > 0 ? 
                                `${transaction.items[0].title}${transaction.items.length > 1 ? ` +${transaction.items.length - 1} more` : ''}` : 
                                'Multiple items') : 
                              transaction.book?.attributes?.title || 'Unknown Book'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.role === 'buyer' ? 'Buyer' : 
                             transaction.role === 'requester' ? 'Requester' : 
                             transaction.role === 'provider' ? 'Provider' : 
                             transaction.role === 'borrower' ? 'Borrower' : 'Lender'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.type === 'purchase' ? 
                              `$${transaction.amount.toFixed(2)}` : 
                              transaction.type === 'borrow' ? 
                                `$${transaction.depositAmount?.toFixed(2) || '0.00'} (deposit)` : 
                                '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {transaction.type === 'purchase' ? 
                                transaction.status || 'Completed' : 
                                'Completed'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Book Form Modal */}
      {showBookForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full m-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">
                {selectedBook ? 'Edit Book' : 'List a New Book'}
              </h3>
              <button 
                onClick={() => {
                  setShowBookForm(false);
                  setSelectedBook(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <BookForm 
                bookToEdit={selectedBook} 
                onSuccess={handleBookFormSuccess} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
