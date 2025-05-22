import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { bookAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { getBookTypeStyles } from '../utils/bookFormatters';
import BookCard from '../components/BookCard';

const BooksPage = () => {
  const { categoryName } = useParams();
  const [books, setBooks] = useState([]);
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

  const BookDetails = ({ book, onClose }) => {
    const [activeTab, setActiveTab] = useState('details');
    const { isAuthenticated, authAxios, user } = useAuth(); // Added user
    const { addToCart } = useCart();
    const navigate = useNavigate();
    const [sellerDetails, setSellerDetails] = useState(null);

    useEffect(() => {
      if (book && book.actualSellerId) {
        setSellerDetails({ name: book.sellerName || "Seller" });
      }
    }, [book]);

    // Placeholder for addToWishlist - replace with actual implementation
    const addToWishlist = async (book) => {
      if (!isAuthenticated || !authAxios || !user?.id) { // Check for user.id
        alert("Please sign in to add to wishlist.");
        return { success: false, error: "User not authenticated" };
      }
      try {
        // Example: POST to a wishlist endpoint
        // This endpoint needs to be created in your Strapi backend
        const response = await authAxios.post(`${import.meta.env.VITE_API_URL}/api/wishlists`, {
          data: {
            book: book.id,
            users_permissions_user: user.id // Get user ID from useAuth hook
          }
        });
        if (response.data) {
          // Navigate to wishlist page on success
          navigate('/wishlist');
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
          // Hardcode navigation to messages with nima for swap requests
          navigate('/messages?user=nima'); // Example query param to identify chat
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
                      // Hardcode navigation to messages with nima for Message Seller button
                      navigate('/messages?user=nima'); // Example query param to identify chat
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

  const getStrapiMediaUrl = (imageData) => {
    if (!imageData) return null;
    
    const baseUrl = (import.meta.env.VITE_STRAPI_API_URL || 'http://localhost:1337').replace(/\/$/, '');
    
    try {
      if (typeof imageData === 'string') {
        if (imageData.startsWith('http')) return imageData;
        const path = imageData.startsWith('/') ? imageData : `/${imageData}`;
        return `${baseUrl}${path}`;
      }
      
      if (Array.isArray(imageData) && imageData.length > 0) {
        const firstImage = imageData[0];
        if (firstImage.formats) {
          const format = firstImage.formats.medium || firstImage.formats.small || firstImage.formats.thumbnail;
          if (format && format.url) {
            const path = format.url.startsWith('/') ? format.url : `/${format.url}`;
            return `${baseUrl}${path}`;
          }
        }
        
        if (firstImage.url) {
          const path = firstImage.url.startsWith('/') ? firstImage.url : `/${firstImage.url}`;
          return `${baseUrl}${path}`;
        }
      }
      
      if (imageData.data && imageData.data.attributes) {
        const { url } = imageData.data.attributes;
        if (url) {
          const path = url.startsWith('/') ? url : `/${url}`;
          return `${baseUrl}${path}`;
        }
      }
      
      if (imageData.formats) {
        const format = 
          imageData.formats.medium || 
          imageData.formats.small || 
          imageData.formats.thumbnail;
        if (format && format.url) {
          const path = format.url.startsWith('/') ? format.url : `/${format.url}`;
          return `${baseUrl}${path}`;
        }
        
        if (imageData.url) {
          const path = imageData.url.startsWith('/') ? imageData.url : `/${imageData.url}`;
          return `${baseUrl}${path}`;
        }
      }
      
      if (imageData.url) {
        const path = imageData.url.startsWith('/') ? imageData.url : `/${imageData.url}`;
        return `${baseUrl}${path}`;
      }
      
      if (imageData.data) {
        const data = Array.isArray(imageData.data) ? imageData.data[0] : imageData.data;
        if (data) {
          if (data.attributes && data.attributes.url) {
            const path = data.attributes.url.startsWith('/') ? data.attributes.url : `/${data.attributes.url}`;
            return `${baseUrl}${path}`;
          }
          if (data.url) {
            const path = data.url.startsWith('/') ? data.url : `/${data.url}`;
            return `${baseUrl}${path}`;
          }
        }
      }
      
      console.warn('Could not process image data:', imageData);
      return null;
    } catch (err) {
      console.error('Error processing image URL:', err, imageData);
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
  };

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
      <div className="bg-gray-900 text-white py-10">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold">{getCurrentCategoryName()}</h1>
          
          <div className="flex text-sm text-gray-400 mt-2">
            <Link to="/" className="hover:text-blue-300">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/books" className="hover:text-blue-300">Books</Link>
            {categoryName && categoryName !== 'all' && (
              <>
                <span className="mx-2">/</span>
                <span className="text-gray-300">{getCurrentCategoryName()}</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 py-8">
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
          
          <div className="w-full md:w-3/4">
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex flex-wrap items-center justify-between">
                <div className="mb-2 md:mb-0">
                  <span className="text-gray-600 text-sm mr-2">Sort by:</span>
                  <select 
                    value={filters.sort}
                    onChange={(e) => handleFilterChange('sort', e.target.value)}
                    className="border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="newest">Newest</option>
                    <option value="priceLow">Price: Low to High</option>
                    <option value="priceHigh">Price: High to Low</option>
                    <option value="rating">Rating</option>
                    <option value="popular">Popularity</option>
                  </select>
                </div>
                
                <div className="text-sm text-gray-500">
                  Showing {filteredBooks.length} of {books.length} books
                </div>
              </div>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
                    <div className="h-64 bg-gray-200"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4 mb-3"></div>
                      <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                <h2 className="font-bold mb-2">Error</h2>
                <p>{error}</p>
              </div>
            ) : filteredBooks.length === 0 ? (
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
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBooks.map(book => (
                  <BookCard key={book.id} book={book} onClick={() => setSelectedBook(book)} />
                ))}
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