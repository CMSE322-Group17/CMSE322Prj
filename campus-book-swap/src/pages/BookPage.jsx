import { useState, useEffect, useCallback, useRef } from 'react'; // Add useCallback
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { bookAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { getBookTypeStyles } from '../utils/bookFormatters';
import BookCard from '../components/BookCard';

const BooksPage = () => {
  const { categoryName } = useParams();
  const [books, setBooks] = useState([]);
  const [searchResults, setSearchResults] = useState([]); // To store search results
  const [isSearching, setIsSearching] = useState(false); // To distinguish between browsing and searching
  const [searchQuery, setSearchQuery] = useState(''); // For the search input
  const [isLoadingSearch, setIsLoadingSearch] = useState(false); // Separate loading state for search
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    sort: 'newest',
    condition: 'all',
    priceRange: 'all',
    bookType: 'all' 
  });
  const [selectedBook, setSelectedBook] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Debounce timer ref
  const debounceTimeoutRef = useRef(null);

  const BookDetails = ({ book, onClose }) => {
    const [activeTab, setActiveTab] = useState('details');
    const { isAuthenticated, authAxios } = useAuth(); // Added authAxios
    const { addToCart } = useCart();
    const [sellerDetails, setSellerDetails] = useState(null);

    useEffect(() => {
      if (book && book.actualSellerId) {
        setSellerDetails({ name: book.sellerName || "Seller" });
      }
    }, [book]);

    // Placeholder for addToWishlist - replace with actual implementation
    const addToWishlist = async (book) => {
      if (!isAuthenticated || !authAxios) {
        alert("Please sign in to add to wishlist.");
        return { success: false, error: "User not authenticated" };
      }
      try {
        // Example: POST to a wishlist endpoint
        // This endpoint needs to be created in your Strapi backend
        const response = await authAxios.post(`${import.meta.env.VITE_API_URL}/api/wishlists`, {
          data: {
            book: book.id,
            users_permissions_user: book.userId // Assuming you have userId on the book object or can get it
          }
        });
        if (response.data) {
          return { success: true };
        }
        return { success: false, error: "Failed to add to wishlist" };
      } catch (error) {
        console.error("Error adding to wishlist:", error);
        return { success: false, error: error.response?.data?.error?.message || "Server error while adding to wishlist" };
      }
    };

    const handleActionClick = async (actionType) => {
      if (!isAuthenticated) {
        alert("Please sign in to continue.");
        navigate('/signin?redirectTo=' + encodeURIComponent(window.location.pathname));
        return;
      }

      if (actionType === 'primary') { // Primary actions: Add to Cart or Propose Swap
        if (book.bookType === 'For Sale') {
          const result = await addToCart(book);
          if (result.success) {
            alert("Book added to cart!");
            onClose();
          } else {
            alert(result.error || "Failed to add book to cart.");
          }
        } else if (book.bookType === 'For Swap') {
          if (book.actualSellerId) {
            navigate(`/chat/${book.actualSellerId}/${book.id}`);
          } else {
            console.error("Actual Seller ID is missing for this book.");
            alert("Cannot start swap: Seller information is missing.");
          }
        }
      } else if (actionType === 'secondary') { // Secondary action: Add to Wishlist
        const result = await addToWishlist(book);
        if (result.success) {
          alert("Book added to wishlist!");
          // Optionally close modal or give other feedback
        } else {
          alert(result.error || "Failed to add book to wishlist.");
        }
      } else {
        alert("Feature coming soon!");
      }
    };

    return (
      <div 
        className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300"
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-2xl max-w-4xl w-full p-0 max-h-[90vh] overflow-hidden shadow-2xl animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <h2 className="text-xl font-bold text-gray-800">{book.title}</h2>
                <div className={`ml-3 px-3 py-1 rounded-full text-xs font-medium ${getBookTypeStyles(book.bookType)}`}>
                  {book.bookType}
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none rounded-full p-1 hover:bg-gray-100"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                className={`py-3 px-6 focus:outline-none ${
                  activeTab === 'details'
                    ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('details')}
              >
                Book Details
              </button>
              <button
                className={`py-3 px-6 focus:outline-none ${
                  activeTab === 'seller'
                    ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('seller')}
              >
                Seller Information
              </button>
            </nav>
          </div>
          
          <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-1/3 border-r border-gray-200 p-6">
              <div className="flex justify-center">
                <div className="relative">
                  {book.cover ? (
                    <img 
                      src={book.cover} 
                      alt={book.title} 
                      className="w-40 h-56 object-cover rounded-xl shadow-md"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/160x224?text=Book+Cover';
                      }}
                    />
                  ) : (
                    <div className="bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl shadow-md w-40 h-56 flex items-center justify-center">
                      <span className="text-white font-bold text-xl">{book.title?.substring(0, 1)}</span>
                    </div>
                  )}
                  
                  {book.rating && (
                    <div className="absolute -bottom-3 -right-3 bg-yellow-400 rounded-full h-10 w-10 flex items-center justify-center text-gray-800 font-bold text-sm shadow-md">
                      {typeof book.rating === 'number' ? book.rating.toFixed(1) : book.rating}
                    </div>
                  )}
                </div>
              </div>
              
              <h3 className="text-lg font-medium text-gray-800 mt-6 mb-1 text-center">{book.title}</h3>
              <p className="text-gray-500 text-sm mb-4 text-center">by {book.author}</p>
              
              <div className="flex justify-center items-center mb-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span key={star} className={star <= Math.floor(book.rating || 0) ? "text-yellow-400" : "text-gray-300"}>★</span>
                  ))}
                </div>
                <span className="text-gray-500 text-xs ml-2">{book.voters || 0} voters</span>
              </div>
              
              <div className="border-t border-gray-200 pt-4 mt-4">
                {book.bookType === 'For Sale' && book.price !== null && (
                  <div className="text-center mb-4">
                    <span className="text-2xl font-bold text-green-600">${book.price.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="space-y-2">
                  <button 
                    onClick={() => handleActionClick('primary')}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {book.bookType === 'For Sale' ? 'Add to Cart' : 'Propose Swap'}
                  </button>
                  <button 
                    onClick={() => handleActionClick('secondary')}
                    className="w-full py-2 px-4 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Add to Wishlist
                  </button>
                  <button 
                    onClick={() => {
                      if (book.actualSellerId) {
                        navigate(`/chat/${book.actualSellerId}/${book.id}`);
                      } else {
                        console.error("Actual Seller ID is missing for this book.");
                        alert("Cannot message seller: Seller information is missing.");
                      }
                    }}
                    className="w-full py-2 px-4 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Message Seller
                  </button>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-2/3 p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              {activeTab === 'details' && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-800 mb-3">Book Information</h4>
                      <div className="space-y-2 text-sm">
                        <p className="flex justify-between">
                          <span className="font-medium text-gray-700">Course:</span> 
                          <span className="text-gray-600">{book.course || "N/A"}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="font-medium text-gray-700">Subject:</span> 
                          <span className="text-gray-600">{book.subject || "General"}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="font-medium text-gray-700">Condition:</span> 
                          <span className="text-gray-600">{book.condition || "Good"}</span>
                        </p>
                        {book.bookType === 'For Swap' && (
                          <p className="flex justify-between">
                            <span className="font-medium text-gray-700">Exchange For:</span> 
                            <span className="text-gray-600">{book.exchange || "Literature or History books"}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-800 mb-3">Transaction Details</h4>
                      <div className="space-y-2 text-sm">
                        <p className="flex justify-between">
                          <span className="font-medium text-gray-700">Pick-up Location:</span> 
                          <span className="text-gray-600">{sellerDetails?.location || book.location || 'N/A'}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="font-medium text-gray-700">Payment Methods:</span> 
                          <span className="text-gray-600">Cash, Venmo, PayPal</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="font-medium text-gray-700">Listed On:</span> 
                          <span className="text-gray-600">April 2, 2023</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-800 mb-3">Description</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {book.description || "No description provided. This book is in good condition and perfect for students taking the related course. Please message the seller for more details."}
                    </p>
                  </div>
                  
                  <div className="mt-6 text-sm text-gray-500">
                    <p>ISBN: 978-1234567890</p>
                    <p>Publisher: Academic Press</p>
                    <p>Edition: 4th Edition (2022)</p>
                    <p>Pages: 452</p>
                  </div>
                </div>
              )}
              
              {activeTab === 'seller' && (
                <div>
                  <div className="flex items-center mb-6">
                    <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center text-blue-600 text-xl font-bold">
                      {(sellerDetails?.name || book.sellerName || "S").substring(0, 1)}
                    </div>
                    <div className="ml-4">
                      <h3 className="font-medium text-lg">{sellerDetails?.name || book.sellerName || "Seller"}</h3>
                      <div className="flex items-center">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map(star => (
                            <span key={star} className={star <= Math.floor(sellerDetails?.rating || book.sellerRating || 0) ? "text-yellow-400" : "text-gray-300"}>★</span>
                          ))}
                        </div>
                        <span className="text-gray-500 text-xs ml-2">{(sellerDetails?.rating || book.sellerRating || 0).toFixed(1)} ({(sellerDetails?.transactions || book.sellerTransactions || 0)} transactions)</span>
                      </div>
                      <p className="text-sm text-gray-500">Member since {sellerDetails?.joinedDate || book.sellerJoinedDate || "N/A"}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-gray-700">Response Time</h4>
                        <span className="text-green-600 font-medium">{sellerDetails?.responseTime || book.sellerResponseTime || "N/A"}</span>
                      </div>
                      <p className="text-sm text-gray-500">Typically responds very quickly</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-gray-700">Completed Transactions</h4>
                        <span className="text-blue-600 font-medium">{sellerDetails?.transactions || book.sellerTransactions || 0}</span>
                      </div>
                      <p className="text-sm text-gray-500">Experienced campus seller</p>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-800 mb-3">Seller's Other Books</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="bg-gray-50 p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                          <div className="flex items-center">
                            <div className="w-12 h-16 bg-gray-200 rounded"></div>
                            <div className="ml-3">
                              <h5 className="text-sm font-medium line-clamp-1">Another Book Title</h5>
                              <p className="text-xs text-gray-500">{book.bookType}</p>
                              {book.bookType === 'For Sale' && (
                                <p className="text-xs font-medium text-green-600">${(book.price + i).toFixed(2)}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getFilteredBooks = () => {
    if (!books || books.length === 0) return [];
    
    return books
      .filter(book => {
        if (filters.condition !== 'all' && book.condition !== filters.condition) {
          return false;
        }
        
        if (filters.priceRange !== 'all' && book.bookType === 'For Sale') {
          const price = book.price;
          if (!price) return false;
          if (filters.priceRange === 'under10' && price >= 10) return false;
          if (filters.priceRange === '10to20' && (price < 10 || price > 20)) return false;
          if (filters.priceRange === '20to30' && (price < 20 || price > 30)) return false;
          if (filters.priceRange === 'over30' && price <= 30) return false;
        }
        
        if (filters.bookType !== 'all' && book.bookType !== filters.bookType) {
          return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        switch (filters.sort) {
          case 'priceLow':
            if (a.price === null && b.price === null) return 0;
            if (a.price === null) return 1;
            if (b.price === null) return -1;
            return a.price - b.price;
          case 'priceHigh':
            if (a.price === null && b.price === null) return 0;
            if (a.price === null) return 1;
            if (b.price === null) return -1;
            return b.price - a.price;
          case 'rating':
            return b.rating - a.rating;
          case 'popular':
            return b.voters - a.voters;
          case 'newest':
          default:
            return b.id - a.id;
        }
      });
  };

  const filteredBooks = getFilteredBooks();
  const displayBooks = isSearching ? searchResults : filteredBooks;

  const getStrapiMediaUrl = (imageData) => {
    console.log('[getStrapiMediaUrl] Received imageData:', JSON.parse(JSON.stringify(imageData || null))); // Log input, ensure imageData is not undefined for stringify
    const rawBaseUrl = import.meta.env.VITE_STRAPI_API_URL;
    const defaultBaseUrl = 'http://localhost:1337';
    console.log('[getStrapiMediaUrl] VITE_STRAPI_API_URL:', rawBaseUrl);

    const baseUrl = (rawBaseUrl || defaultBaseUrl).replace(/\/$/, ''); // Corrected regex
    console.log('[getStrapiMediaUrl] Using baseUrl:', baseUrl);

    if (!imageData) {
      console.log('[getStrapiMediaUrl] imageData is null or undefined, returning null.');
      return null;
    }
    
    let finalUrl = null;

    try {
      if (typeof imageData === 'string') {
        console.log('[getStrapiMediaUrl] imageData is a string:', imageData);
        if (imageData.startsWith('http')) {
          try {
            const imageUrl = new URL(imageData);
            const apiUrl = new URL(baseUrl); // baseUrl should always be a valid URL structure here
            if (imageUrl.hostname === apiUrl.hostname && imageUrl.port === apiUrl.port) { // Check port too for localhost scenarios
              finalUrl = imageData;
              console.log('[getStrapiMediaUrl] imageData is an absolute URL with matching hostname and port:', finalUrl);
            } else {
              console.warn(`[getStrapiMediaUrl] imageData is an absolute URL with MISMATCHED host/port: "${imageData}" (Image Host: ${imageUrl.hostname}:${imageUrl.port}, API Host: ${apiUrl.hostname}:${apiUrl.port})`);
              if (imageUrl.pathname.startsWith('/uploads/')) {
                 finalUrl = `${baseUrl}${imageUrl.pathname}${imageUrl.search}${imageUrl.hash}`;
                 console.warn('[getStrapiMediaUrl] Attempting to fix mismatched host/port by prepending local API URL:', finalUrl);
              } else {
                finalUrl = imageData; 
                console.warn('[getStrapiMediaUrl] Using mismatched absolute URL as is (path does not start with /uploads/):', finalUrl);
              }
            }
          } catch (urlParseError) {
            console.error('[getStrapiMediaUrl] Error parsing imageData string as URL. Treating as relative path:', imageData, urlParseError);
            const path = imageData.startsWith('/') ? imageData : `/${imageData}`;
            finalUrl = `${baseUrl}${path}`;
            console.log('[getStrapiMediaUrl] Constructed URL from string treated as relative path:', finalUrl);
          }
        } else { // Relative path string
          const path = imageData.startsWith('/') ? imageData : `/${imageData}`;
          finalUrl = `${baseUrl}${path}`;
          console.log('[getStrapiMediaUrl] imageData is a relative path string, constructed URL:', finalUrl);
        }
      } else if (imageData.data && imageData.data.attributes && typeof imageData.data.attributes.url === 'string') { // Strapi v4 single media
        const path = imageData.data.attributes.url;
        console.log('[getStrapiMediaUrl] imageData is Strapi v4 single media, path:', path);
        finalUrl = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
      } else if (typeof imageData.url === 'string') { // Common case: object with a 'url' property
        const path = imageData.url;
        console.log('[getStrapiMediaUrl] imageData is object with .url, path:', path);
        finalUrl = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
      } else if (Array.isArray(imageData.data) && imageData.data.length > 0 && imageData.data[0].attributes && typeof imageData.data[0].attributes.url === 'string') { // Strapi v4 multiple media (taking first)
        const path = imageData.data[0].attributes.url;
        console.log('[getStrapiMediaUrl] imageData is Strapi v4 multiple media, path from first item:', path);
        finalUrl = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
      } else if (Array.isArray(imageData) && imageData.length > 0 && typeof imageData[0].url === 'string') { // Array of objects with .url (taking first)
        const path = imageData[0].url;
        console.log('[getStrapiMediaUrl] imageData is array of objects with .url, path from first item:', path);
        finalUrl = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
      } else if (imageData.formats) { // Fallback to formats if direct URLs aren't found
        console.log('[getStrapiMediaUrl] imageData has .formats, checking medium, small, thumbnail');
        const format = imageData.formats.medium || imageData.formats.small || imageData.formats.thumbnail;
        if (format && typeof format.url === 'string') {
          const path = format.url;
          finalUrl = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
          console.log('[getStrapiMediaUrl] Path from formats:', path);
        } else {
          console.log('[getStrapiMediaUrl] No suitable URL found in .formats');
        }
      }

      if (finalUrl) {
        console.log('[getStrapiMediaUrl] Successfully constructed URL:', finalUrl);
      } else {
        console.warn('[getStrapiMediaUrl] Could not determine URL from imageData structure:', JSON.parse(JSON.stringify(imageData)));
      }
      return finalUrl;

    } catch (err) {
      console.error('[getStrapiMediaUrl] Error during URL construction:', err, JSON.parse(JSON.stringify(imageData)));
      return null;
    }
  };

  const getCurrentCategoryName = () => {
    if (!categoryName || categoryName === 'all') {
      return 'All Books';
    }
    
    return categoryName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setIsSearching(false); // Reset search when filters change
  };

  // Search function
  const handleSearch = useCallback(async (query) => {
    if (!query || query.trim() === '') {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsLoadingSearch(true);
    setIsSearching(true);
    try {
      const apiResult = await bookAPI.searchBooks(query); // Renamed 'response' to 'apiResult' for clarity
      const booksArray = apiResult?.data; // Correctly access the array of books

      if (Array.isArray(booksArray)) {
        setSearchResults(booksArray);
        if (booksArray.length === 0) {
          console.info('No books found matching your search criteria.');
          alert('No books found matching your search criteria.');
        }
      } else {
        // This case would be hit if apiResult.data is not an array
        console.warn('Search result apiResult.data was not an array:', apiResult);
        setSearchResults([]);
        alert('No books found or unexpected search response format.');
      }
    } catch (err) {
      console.error('Error searching books:', err);
      alert('Failed to fetch search results.');
      setSearchResults([]);
    } finally {
      setIsLoadingSearch(false);
    }
  }, [setSearchResults, setIsSearching, setIsLoadingSearch]);

  const onSearchInputChange = (e) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    // Clear previous debounce timer
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    // Set new debounce timer
    debounceTimeoutRef.current = setTimeout(() => {
      if (newQuery.trim() === '' && location.pathname === '/books' && location.search === '') {
        // If query is empty and we are already on /books with no query, do nothing to avoid unnecessary navigation
        // but ensure search results are cleared if user deletes query
        setIsSearching(false);
        setSearchResults([]);
      } else {
        navigate(`/books?query=${encodeURIComponent(newQuery)}`);
      }
    }, 500); // 500ms debounce
  };

  const onSearchFormSubmit = (e) => {
    e.preventDefault();
    // Clear any existing debounce timer as we are submitting immediately
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    navigate(`/books?query=${encodeURIComponent(searchQuery)}`);
    // handleSearch will be called by the useEffect watching location.search
  };

  // Effect to handle search query from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryFromUrl = params.get('query');
    if (queryFromUrl) {
      setSearchQuery(queryFromUrl);
      handleSearch(queryFromUrl); // Call handleSearch directly
    } else {
      setIsSearching(false); // Not searching if no query in URL
      setSearchResults([]); // Clear search results if no query
    }
  }, [location.search, handleSearch, setSearchQuery, setIsSearching, setSearchResults]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const categoriesData = await bookAPI.getCategories();
        const processedCategories = [
          { id: 'all', name: 'All Categories' },
          ...categoriesData.data.map(cat => ({
            id: cat.id,
            name: cat.attributes?.name || cat.attributes?.Type || cat.name || cat.Type || `Category ${cat.id}`
          }))
        ];
        setCategories(processedCategories);
        
        let booksData;
        
        if (categoryName && categoryName !== 'all') {
          const category = processedCategories.find(cat => 
            cat.name.toLowerCase().replace(/\s+/g, '-') === categoryName
          );
          
          if (category && category.id !== 'all') {
            booksData = await bookAPI.getBooksByCategory(category.id);
          } else {
            booksData = await bookAPI.getPopularBooks();
          }
        } else {
          booksData = await bookAPI.getPopularBooks();
        }
        
        const processedBooks = booksData.data.map(book => {
          const bookData = book.attributes || book;
          
          let coverUrl = null;
          if (bookData.cover) {
            coverUrl = getStrapiMediaUrl(bookData.cover);
          }
          
          const bookType = bookData.bookType || (book.id % 2 === 0 ? 'For Sale' : 'For Swap');
          
          const actualSellerId = bookData.users_permissions_user?.data?.id;
          const sellerName = bookData.users_permissions_user?.data?.attributes?.username || "Campus BookShop";

          return {
            id: book.id,
            title: bookData.title,
            author: bookData.author,
            description: bookData.description,
            rating: bookData.rating || (Math.random() * 2 + 3).toFixed(1),
            voters: bookData.votersCount || Math.floor(Math.random() * 100) + 5,
            condition: bookData.condition || "Good",
            exchange: bookData.exchange,
            subject: bookData.subject || "General",
            course: bookData.course,
            actualSellerId: actualSellerId,
            sellerName: sellerName,
            cover: coverUrl,
            price: bookType === 'For Sale' ? (bookData.price !== undefined ? parseFloat(bookData.price) : (Math.floor(Math.random() * 25) + 5 + 0.99)) : null,
            categoryId: bookData.category?.data?.id || null,
            inStock: bookData.inStock !== undefined ? bookData.inStock : (Math.floor(Math.random() * 10) + 1),
            isNew: bookData.isNew !== undefined ? bookData.isNew : (Math.random() > 0.5),
            bookType: bookType 
          };
        });
        
        setBooks(processedBooks);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load books. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [categoryName]);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Page Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8 shadow-lg">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            {isSearching ? `Search Results for "${searchQuery}"` : getCurrentCategoryName()}
          </h1>
          <p className="mt-2 text-lg opacity-90">
            {isSearching ? `Found ${searchResults.length} books.` : `Browse our collection of ${filteredBooks.length} books.`}
          </p>
        </div>
      </header>

      {/* Search Bar - Integrated into BookPage */}
      <div className="container mx-auto p-4 sticky top-16 z-40 bg-gray-50 py-4 mb-2">
        <form onSubmit={onSearchFormSubmit} className="max-w-2xl mx-auto">
          <div className="flex items-center border border-gray-300 rounded-full shadow-md overflow-hidden bg-white">
            <input
              type="text"
              value={searchQuery}
              onChange={onSearchInputChange}
              placeholder="Search by title, author, ISBN, or subject..."
              className="w-full px-6 py-3 text-gray-700 focus:outline-none"
            />
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 transition duration-150 ease-in-out"
              disabled={isLoadingSearch}
            >
              {isLoadingSearch ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/4">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-lg font-bold mb-4 text-gray-800">Filters</h2>
              
              <div className="mb-6">
                <h3 className="font-medium text-gray-700 mb-2">Categories</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {categories.map(category => (
                    <div key={category.id} className="flex items-center">
                      <Link 
                        to={category.id === 'all' 
                          ? '/books' 
                          : `/category/${category.name.toLowerCase().replace(/\s+/g, '-')}`
                        }
                        className={`text-sm hover:text-blue-600 ${
                          (categoryName === category.name.toLowerCase().replace(/\s+/g, '-') ||
                          (!categoryName && category.id === 'all'))
                            ? 'font-medium text-blue-600' 
                            : 'text-gray-600'
                        }`}
                      >
                        {category.name}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-medium text-gray-700 mb-2">Book Type</h3>
                <div className="space-y-2">
                  <label className="flex items-center text-sm">
                    <input 
                      type="radio" 
                      name="bookType" 
                      checked={filters.bookType === 'all'}
                      onChange={() => handleFilterChange('bookType', 'all')}
                      className="mr-2"
                    />
                    <span className="text-gray-600">All Types</span>
                  </label>
                  <label className="flex items-center text-sm">
                    <input 
                      type="radio" 
                      name="bookType" 
                      checked={filters.bookType === 'For Sale'}
                      onChange={() => handleFilterChange('bookType', 'For Sale')}
                      className="mr-2"
                    />
                    <span className="text-gray-600">For Sale</span>
                  </label>
                  <label className="flex items-center text-sm">
                    <input 
                      type="radio" 
                      name="bookType" 
                      checked={filters.bookType === 'For Swap'}
                      onChange={() => handleFilterChange('bookType', 'For Swap')}
                      className="mr-2"
                    />
                    <span className="text-gray-600">For Swap</span>
                  </label>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-medium text-gray-700 mb-2">Condition</h3>
                <div className="space-y-2">
                  <label className="flex items-center text-sm">
                    <input 
                      type="radio" 
                      name="condition" 
                      checked={filters.condition === 'all'}
                      onChange={() => handleFilterChange('condition', 'all')}
                      className="mr-2"
                    />
                    <span className="text-gray-600">All</span>
                  </label>
                  <label className="flex items-center text-sm">
                    <input 
                      type="radio" 
                      name="condition" 
                      checked={filters.condition === 'New'}
                      onChange={() => handleFilterChange('condition', 'New')}
                      className="mr-2"
                    />
                    <span className="text-gray-600">New</span>
                  </label>
                  <label className="flex items-center text-sm">
                    <input 
                      type="radio" 
                      name="condition" 
                      checked={filters.condition === 'Like New'}
                      onChange={() => handleFilterChange('condition', 'Like New')}
                      className="mr-2"
                    />
                    <span className="text-gray-600">Like New</span>
                  </label>
                  <label className="flex items-center text-sm">
                    <input 
                      type="radio" 
                      name="condition" 
                      checked={filters.condition === 'Good'}
                      onChange={() => handleFilterChange('condition', 'Good')}
                      className="mr-2"
                    />
                    <span className="text-gray-600">Good</span>
                  </label>
                  <label className="flex items-center text-sm">
                    <input 
                      type="radio" 
                      name="condition" 
                      checked={filters.condition === 'Acceptable'}
                      onChange={() => handleFilterChange('condition', 'Acceptable')}
                      className="mr-2"
                    />
                    <span className="text-gray-600">Acceptable</span>
                  </label>
                </div>
              </div>
              
              {(filters.bookType === 'all' || filters.bookType === 'For Sale') && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-700 mb-2">Price Range</h3>
                  <div className="space-y-2">
                    <label className="flex items-center text-sm">
                      <input 
                        type="radio" 
                        name="priceRange" 
                        checked={filters.priceRange === 'all'}
                        onChange={() => handleFilterChange('priceRange', 'all')}
                        className="mr-2"
                      />
                      <span className="text-gray-600">All Prices</span>
                    </label>
                    <label className="flex items-center text-sm">
                      <input 
                        type="radio" 
                        name="priceRange" 
                        checked={filters.priceRange === 'under10'}
                        onChange={() => handleFilterChange('priceRange', 'under10')}
                        className="mr-2"
                      />
                      <span className="text-gray-600">Under $10</span>
                    </label>
                    <label className="flex items-center text-sm">
                      <input 
                        type="radio" 
                        name="priceRange" 
                        checked={filters.priceRange === '10to20'}
                        onChange={() => handleFilterChange('priceRange', '10to20')}
                        className="mr-2"
                      />
                      <span className="text-gray-600">$10 to $20</span>
                    </label>
                    <label className="flex items-center text-sm">
                      <input 
                        type="radio" 
                        name="priceRange" 
                        checked={filters.priceRange === '20to30'}
                        onChange={() => handleFilterChange('priceRange', '20to30')}
                        className="mr-2"
                      />
                      <span className="text-gray-600">$20 to $30</span>
                    </label>
                    <label className="flex items-center text-sm">
                      <input 
                        type="radio" 
                        name="priceRange" 
                        checked={filters.priceRange === 'over30'}
                        onChange={() => handleFilterChange('priceRange', 'over30')}
                        className="mr-2"
                      />
                      <span className="text-gray-600">Over $30</span>
                    </label>
                  </div>
                </div>
              )}
              
              <button 
                onClick={() => setFilters({
                  sort: 'newest',
                  condition: 'all',
                  priceRange: 'all',
                  bookType: 'all'
                })}
                className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded font-medium hover:bg-gray-300 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
          
          <div className="w-full lg:w-3/4">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg shadow animate-pulse">
                    <div className="w-full h-48 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-10">
                <p className="text-red-500 text-lg">Error: {error.message || "Could not fetch books."}</p>
                <p className="text-gray-600">Please try refreshing the page or check your network connection.</p>
              </div>
            ) : displayBooks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-8">
                {displayBooks.map(book => (
                  <BookCard 
                    key={book.id} 
                    book={book} 
                    onClick={() => setSelectedBook(book)} 
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <h3 className="text-lg font-medium text-gray-800 mb-2">No books found</h3>
                <p className="text-gray-600 mb-4">
                  We couldn't find any books matching your filters.
                </p>
                <button 
                  onClick={() => setFilters({
                    sort: 'newest',
                    condition: 'all',
                    priceRange: 'all',
                    bookType: 'all'
                  })}
                  className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}
            
            {filteredBooks.length > 0 && (
              <div className="flex justify-center mt-8">
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <a
                    href="#"
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <span className="sr-only">Previous</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </a>
                  <a
                    href="#"
                    aria-current="page"
                    className="z-10 bg-blue-50 border-blue-500 text-blue-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                  >
                    1
                  </a>
                  <a
                    href="#"
                    className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                  >
                    2
                  </a>
                  <a
                    href="#"
                    className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                  >
                    3
                  </a>
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    ...
                  </span>
                  <a
                    href="#"
                    className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                  >
                    10
                  </a>
                  <a
                    href="#"
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <span className="sr-only">Next</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {selectedBook && (
        <BookDetails book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </div>
  );
};

export default BooksPage;