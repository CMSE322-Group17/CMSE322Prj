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
      // 1. Purchases made by the current user
      const purchasesResponse = await authAxios.get(
        `${import.meta.env.VITE_API_URL}/api/orders?filters[userId][$eq]=${user.id}&filters[status][$eq]=completed&sort[0]=timestamp:desc&populate=items,userId`
      );
      const purchases = purchasesResponse.data.data?.map(order => ({
        id: `purchase-${order.id}`,
        type: 'purchase',
        date: order.attributes.timestamp,
        amount: order.attributes.totalAmount,
        status: order.attributes.status,
        items: order.attributes.items.map(item => ({
          bookId: item.bookId,
          title: item.title || 'Unknown Book',
          quantity: item.quantity,
          price: item.price
        })),
        role: 'buyer'
      })) || [];

      // 2. Sales made by the current user
      const userBooksResponse = await authAxios.get(
        `${import.meta.env.VITE_API_URL}/api/books?filters[users_permissions_user][id][$eq]=${user.id}&fields[0]=id`
      );
      const userBookIds = userBooksResponse.data.data.map(b => b.id);

      let salesByUserData = [];
      if (userBookIds.length > 0) {
        const allCompletedOrdersResponse = await authAxios.get(
          `${import.meta.env.VITE_API_URL}/api/orders?filters[status][$eq]=completed&populate=items,userId`
        );
        
        const allCompletedOrders = allCompletedOrdersResponse.data.data || [];
        
        salesByUserData = allCompletedOrders
          .filter(order => {
            // skip orders where current user was buyer
            if (order.attributes.userId === user.id) {
              return false;
            }
            // include orders that contain user's books
            return order.attributes.items.some(item => userBookIds.includes(item.bookId));
          })
          .map(order => {
            const itemsSoldByCurrentUser = order.attributes.items.filter(item => userBookIds.includes(item.bookId));
            const amountForCurrentUser = itemsSoldByCurrentUser.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            return {
              id: `sale-${order.id}`,
              type: 'sale',
              date: order.attributes.timestamp,
              amount: amountForCurrentUser,
              status: order.attributes.status,
              items: itemsSoldByCurrentUser.map(item => ({
                bookId: item.bookId,
                title: item.title || 'Unknown Book',
                quantity: item.quantity,
                price: item.price
              })),
              role: 'seller',
              // order.attributes.userId is a string username or id; adjust as needed
              buyerInfo: order.attributes.userId || 'Unknown Buyer'
            };
          });
      }

      // 3. Swaps involving the current user
      // Assuming swap-offers have 'requester' and 'owner' relations to users,
      // and 'requestedBook' and 'offeredBooks' relations to books.
      const swapsResponse = await authAxios.get(
        `${import.meta.env.VITE_API_URL}/api/swap-offers?filters[$or][0][requester][id][$eq]=${user.id}&filters[$or][1][owner][id][$eq]=${user.id}&filters[status][$eq]=completed&sort[0]=updatedAt:desc&populate=requestedBook,offeredBooks,requester,owner`
      );
      
      const swapsData = swapsResponse.data.data?.map(swapFull => {
        const swap = swapFull.attributes;
        const id = swapFull.id;
        const isRequesterRole = swap.requester?.data?.id === user.id;
        
        const requestedTitle = swap.requestedBook?.data?.attributes?.title || 'Unknown Book';
        const offeredTitles = swap.offeredBooks?.data?.map(b => b.attributes.title).join(', ') || 'N/A';
        
        let summary = `Requested: ${requestedTitle}`;
        if (swap.offeredBooks?.data?.length > 0 && offeredTitles !== 'N/A') {
          summary += ` | Offered: ${offeredTitles}`;
        }

        return {
          id: `swap-${id}`,
          type: 'swap',
          date: swap.timestamp || swap.updatedAt,
          items: [{ title: summary, quantity: 1, price: 0 }],
          amount: 0,
          status: 'completed',
          role: isRequesterRole ? 'requester' : 'provider',
        };
      }) || [];
      
      const allTransactions = [...purchases, ...salesByUserData, ...swapsData].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );
      
      setTransactionHistory(allTransactions);
    } catch (err) {
      console.error('Error fetching transaction history:', err.response ? err.response.data : err.message);
      setError(prev => (prev ? prev + '; ' : '') + 'Failed to fetch transaction history. Showing sample data.');
      // Fallback: Hardcoded sample transaction history
      setTransactionHistory([
        {
          id: 'purchase-1',
          type: 'purchase',
          date: '2024-04-01T10:00:00Z',
          amount: 25.00,
          status: 'completed',
          items: [
            { bookId: 101, title: 'Intro to Algorithms', quantity: 1, price: 25.00 }
          ],
          role: 'buyer'
        },
        {
          id: 'sale-2',
          type: 'sale',
          date: '2024-03-15T14:30:00Z',
          amount: 40.00,
          status: 'completed',
          items: [
            { bookId: 202, title: 'Discrete Math', quantity: 1, price: 40.00 }
          ],
          role: 'seller',
          buyerInfo: 'alice123'
        },
        {
          id: 'swap-3',
          type: 'swap',
          date: '2024-02-20T09:15:00Z',
          amount: 0,
          status: 'completed',
          items: [
            { title: 'Requested: Linear Algebra | Offered: Calculus I', quantity: 1, price: 0 }
          ],
          role: 'requester'
        }
      ]);
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

  // Format timestamp
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

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
            {/* <button
              onClick={() => setActiveTab('actions')}
              className={`mr-8 py-4 px-1 relative ${
                activeTab === 'actions'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending Actions
            </button> */}
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
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Welcome, {user?.username || 'User'}!</h2>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* My Books Stat */}
              <div className="bg-blue-100 p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-semibold text-blue-700">MY BOOKS</h3>
                <p className="text-3xl font-bold text-blue-900">{stats.activeListings}</p>
                <p className="text-sm text-gray-600">{stats.activeListings === 1 ? 'active listing' : 'active listings'}</p>
              </div>

              {/* Earnings Stat */}
              <div className="bg-green-100 p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-semibold text-green-700">EARNINGS</h3>
                <p className="text-3xl font-bold text-green-900">${stats.totalEarnings.toFixed(2)}</p>
                <p className="text-sm text-gray-600">From sales</p>
              </div>

              {/* Saved Stat */}
              <div className="bg-purple-100 p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-semibold text-purple-700">SAVED</h3>
                <p className="text-3xl font-bold text-purple-900">${stats.savedBySwapping.toFixed(2)}</p>
                <p className="text-sm text-gray-600">By swapping</p>
              </div>

              {/* Transactions Stat */}
              <div className="bg-yellow-100 p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-semibold text-yellow-700">TRANSACTIONS</h3>
                <p className="text-3xl font-bold text-yellow-900">{stats.completedTransactions}</p>
                <p className="text-sm text-gray-600">{stats.pendingTransactions > 0 ? `${stats.pendingTransactions} pending` : 'completed'}</p>
              </div>
            </div>
          </div>
        )}
        
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
                {myBooks.map(book => {
                  const isSold = book.status === 'sold';
                  return (
                    <div key={book.id} className={`bg-white rounded-lg shadow border border-gray-200 overflow-hidden ${isSold ? 'filter grayscale opacity-50' : ''}`}>
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
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium text-lg text-gray-800">{book.title}</h3>
                            {isSold && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 ml-2">
                                Sold
                              </span>
                            )}
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
                          onClick={() => !isSold && handleEditBook(book)}
                          disabled={isSold}
                          className={`px-3 py-1 rounded ${isSold ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => !isSold && handleDeleteBook(book.id)}
                          disabled={isSold}
                          className={`px-3 py-1 rounded ${isSold ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'actions' && (
          <div>
            <h2 className="text-lg font-medium mb-4">Pending Actions</h2>
            
            {pendingSwaps.length === 0 && pendingPurchaseRequests.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500">You have no pending actions to complete</p>
              </div>
            ) : (
              <div className="space-y-6">
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'history' && (
          <div>
            <h2 className="text-lg font-medium mb-4">Transaction History</h2>
            
            {transactionHistory.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012 2h2a2 2 0 012-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
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
                                transaction.type === 'sale' ? 'bg-yellow-100 text-yellow-800' :
                                transaction.type === 'swap' ? 'bg-blue-100 text-blue-800' : 
                                'bg-purple-100 text-purple-800'}`}>
                              {transaction.type === 'purchase' ? 'Purchase' : 
                               transaction.type === 'sale' ? 'Sale' :
                               transaction.type === 'swap' ? 'Swap' : 'Borrow'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.items && transaction.items.length > 0 ? 
                              `${transaction.items[0].title}${transaction.items.length > 1 ? ` +${transaction.items.length - 1} more` : ''}` : 
                              'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.role === 'buyer' ? 'Buyer' : 
                             transaction.role === 'seller' ? 'Seller' :
                             transaction.role === 'requester' ? 'Requester' : 
                             transaction.role === 'provider' ? 'Provider' : 
                             transaction.role === 'borrower' ? 'Borrower' : 'Lender'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.type === 'purchase' || transaction.type === 'sale' ? 
                              `$${transaction.amount.toFixed(2)}` : 
                              transaction.type === 'borrow' ? 
                                `$${transaction.depositAmount?.toFixed(2) || '0.00'} (deposit)` : 
                                '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {transaction.status || 'Completed'}
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
