import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { bookAPI } from '../services/api';

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
    bookType: 'all' // New filter for book type (Sale, Swap, Borrow)
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch categories first
        const categoriesData = await bookAPI.getCategories();
        // Add "All" option
        const processedCategories = [
          { id: 'all', name: 'All Categories' },
          ...categoriesData.data.map(cat => ({
            id: cat.id,
            name: cat.attributes?.name || cat.attributes?.Type || cat.name || cat.Type || `Category ${cat.id}`
          }))
        ];
        setCategories(processedCategories);
        
        // Check if we're on the textbooks route
        const isTextbooksRoute = window.location.pathname.includes('/textbooks');
        
        // Fetch books based on category or all books
        let booksData;
        
        if (isTextbooksRoute) {
          // Find the textbooks category if it exists
          const textbooksCategory = processedCategories.find(cat => 
            cat.name.toLowerCase() === 'textbooks'
          );
          
          if (textbooksCategory && textbooksCategory.id !== 'all') {
            booksData = await bookAPI.getBooksByCategory(textbooksCategory.id);
          } else {
            // Fallback to all books if no textbooks category found
            booksData = await bookAPI.getPopularBooks();
          }
        } else if (categoryName && categoryName !== 'all') {
          // Find category ID if we're browsing by URL slug
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
        
        // Process book data
        const processedBooks = booksData.data.map(book => {
          const bookData = book.attributes || book;
          
          // Process cover image
          let coverUrl = null;
          if (bookData.cover) {
            coverUrl = getStrapiMediaUrl(bookData.cover);
          }
          
          // Determine book transaction type (For Sale, For Swap, For Borrowing)
          // For demonstration, using a deterministic approach based on ID
          const bookTypes = ['For Sale', 'For Swap', 'For Borrowing'];
          const bookType = bookTypes[book.id % bookTypes.length];
          
          // Map the book data
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
            seller: bookData.seller || "Campus BookShop",
            cover: coverUrl,
            // Only set price for "For Sale" books
            price: bookType === 'For Sale' ? Math.floor(Math.random() * 25) + 5 + 0.99 : null,
            categoryId: bookData.category?.data?.id || null,
            inStock: Math.floor(Math.random() * 10) + 1,
            isNew: Math.random() > 0.5,
            bookType: bookType // Add the book type
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
  }, [categoryName, window.location.pathname]);

  // Helper function to get image URL from Strapi data
  const getStrapiMediaUrl = (imageData) => {
    if (!imageData) return null;
    
    // Base URL (ensure it doesn't end with a slash)
    const baseUrl = (import.meta.env.VITE_STRAPI_API_URL || 'http://localhost:1337').replace(/\/$/, '');
    
    try {
      // Case 1: String URL
      if (typeof imageData === 'string') {
        // Check if it's already an absolute URL
        if (imageData.startsWith('http')) return imageData;
        // Make sure the path starts with a slash
        const path = imageData.startsWith('/') ? imageData : `/${imageData}`;
        return `${baseUrl}${path}`;
      }
      
      // Case 2: Plain array 
      if (Array.isArray(imageData) && imageData.length > 0) {
        const firstImage = imageData[0];
        // If the array item has a formats property
        if (firstImage.formats) {
          const format = firstImage.formats.medium || firstImage.formats.small || firstImage.formats.thumbnail;
          if (format && format.url) {
            const path = format.url.startsWith('/') ? format.url : `/${format.url}`;
            return `${baseUrl}${path}`;
          }
        }
        
        // If the array item has a url property
        if (firstImage.url) {
          const path = firstImage.url.startsWith('/') ? firstImage.url : `/${firstImage.url}`;
          return `${baseUrl}${path}`;
        }
      }
      
      // Case 3: Strapi v4 format with data.attributes
      if (imageData.data && imageData.data.attributes) {
        const { url } = imageData.data.attributes;
        if (url) {
          const path = url.startsWith('/') ? url : `/${url}`;
          return `${baseUrl}${path}`;
        }
      }
      
      // Case 4: Direct object with formats
      if (imageData.formats) {
        const format = 
          imageData.formats.medium || 
          imageData.formats.small || 
          imageData.formats.thumbnail;
        if (format && format.url) {
          const path = format.url.startsWith('/') ? format.url : `/${format.url}`;
          return `${baseUrl}${path}`;
        }
        
        // Fallback to main URL if formats don't have URLs
        if (imageData.url) {
          const path = imageData.url.startsWith('/') ? imageData.url : `/${imageData.url}`;
          return `${baseUrl}${path}`;
        }
      }
      
      // Case 5: Direct URL property
      if (imageData.url) {
        const path = imageData.url.startsWith('/') ? imageData.url : `/${imageData.url}`;
        return `${baseUrl}${path}`;
      }
      
      // Case 6: Array in data
      if (imageData.data) {
        const data = Array.isArray(imageData.data) ? imageData.data[0] : imageData.data;
        if (data) {
          // With attributes (Strapi v4)
          if (data.attributes && data.attributes.url) {
            const path = data.attributes.url.startsWith('/') ? data.attributes.url : `/${data.attributes.url}`;
            return `${baseUrl}${path}`;
          }
          // Direct URL
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

  // Filter and sort books based on user selections
  const getFilteredBooks = () => {
    if (!books || books.length === 0) return [];
    
    return books
      .filter(book => {
        // Filter by condition
        if (filters.condition !== 'all' && book.condition !== filters.condition) {
          return false;
        }
        
        // Filter by price range - only apply to "For Sale" books
        if (filters.priceRange !== 'all' && book.bookType === 'For Sale') {
          const price = book.price;
          if (!price) return false;
          if (filters.priceRange === 'under10' && price >= 10) return false;
          if (filters.priceRange === '10to20' && (price < 10 || price > 20)) return false;
          if (filters.priceRange === '20to30' && (price < 20 || price > 30)) return false;
          if (filters.priceRange === 'over30' && price <= 30) return false;
        }
        
        // Filter by book type
        if (filters.bookType !== 'all' && book.bookType !== filters.bookType) {
          return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        // Sort books based on selected option
        switch (filters.sort) {
          case 'priceLow':
            // Handle null prices (books that are not for sale)
            if (a.price === null && b.price === null) return 0;
            if (a.price === null) return 1;
            if (b.price === null) return -1;
            return a.price - b.price;
          case 'priceHigh':
            // Handle null prices (books that are not for sale)
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
            // For demo purposes, use ID as a proxy for "newest"
            return b.id - a.id;
        }
      });
  };

  const filteredBooks = getFilteredBooks();
  
  // Get current category name for display
  const getCurrentCategoryName = () => {
    // Handle the special case of textbooks route
    if (window.location.pathname.includes('/textbooks')) {
      return 'Textbooks';
    }
    
    if (!categoryName || categoryName === 'all') {
      return 'All Books';
    }
    
    // Convert URL slug back to display name
    return categoryName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Style map for book type badges
  const typeStyles = {
    'For Sale': 'bg-green-100 text-green-800 border-green-200',
    'For Swap': 'bg-blue-100 text-blue-800 border-blue-200',
    'For Borrowing': 'bg-purple-100 text-purple-800 border-purple-200'
  };
  
  // Icons for book types
  const typeIcons = {
    'For Sale': (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    'For Swap': (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    'For Borrowing': (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
      </svg>
    )
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="bg-gray-900 text-white py-10">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold">{getCurrentCategoryName()}</h1>
          
          {/* Breadcrumb Navigation */}
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
      
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="w-full md:w-1/4">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-lg font-bold mb-4 text-gray-800">Filters</h2>
              
              {/* Categories */}
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
              
              {/* Book Type Filter - NEW */}
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
                  <label className="flex items-center text-sm">
                    <input 
                      type="radio" 
                      name="bookType" 
                      checked={filters.bookType === 'For Borrowing'}
                      onChange={() => handleFilterChange('bookType', 'For Borrowing')}
                      className="mr-2"
                    />
                    <span className="text-gray-600">For Borrowing</span>
                  </label>
                </div>
              </div>
              
              {/* Condition Filter */}
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
              
              {/* Price Range Filter - Only show if "For Sale" books are not filtered out */}
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
              
              {/* Reset Filters Button */}
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
          
          {/* Books Grid */}
          <div className="w-full md:w-3/4">
            {/* Sort Options */}
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
            
            {/* Books List */}
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
                  <Link to={`/book/${book.id}`} key={book.id} className="group">
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md h-full flex flex-col relative">
                      {/* Book Type Badge */}
                      <div className={`absolute top-3 left-3 z-10 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${typeStyles[book.bookType]} border`}>
                        {typeIcons[book.bookType]}
                        {book.bookType}
                      </div>
                      
                      <div className="relative aspect-w-2 aspect-h-3 bg-gray-100">
                        {book.isNew && (
                          <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-2 py-1 m-2 rounded-sm z-10">
                            NEW
                          </div>
                        )}
                        
                        {book.cover ? (
                          <img 
                            src={book.cover} 
                            alt={book.title} 
                            className="w-full h-64 object-cover object-center transition-transform duration-300 group-hover:scale-105" 
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/300x450?text=No+Cover';
                            }}
                          />
                        ) : (
                          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-full h-64 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                            <div className="text-white text-center font-serif px-4">
                              <div className="text-lg font-medium">{book.title}</div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4 flex-grow flex flex-col">
                        <h3 className="font-medium text-gray-800 mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {book.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">{book.author}</p>
                        
                        <div className="flex items-center mb-2">
                          <div className="flex text-yellow-400 mr-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <span key={star} className={star <= Math.floor(book.rating) ? "text-yellow-400" : "text-gray-300"}>★</span>
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">({book.voters})</span>
                        </div>
                        
                        <div className="mt-auto">
                          {/* Only show price for "For Sale" books */}
                          {book.bookType === 'For Sale' && book.price !== null && (
                            <p className="text-blue-600 font-medium">${book.price.toFixed(2)}</p>
                          )}
                          
                          {/* For Swap books */}
                          {book.bookType === 'For Swap' && (
                            <p className="text-blue-600 font-medium">Swap</p>
                          )}
                          
                          {/* For Borrowing books */}
                          {book.bookType === 'For Borrowing' && (
                            <p className="text-blue-600 font-medium">Borrow</p>
                          )}
                          
                          <p className="text-xs text-gray-500 mt-1">
                            {book.condition} • {book.inStock > 0 ? `${book.inStock} in stock` : 'Out of stock'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-gray-50 border-t border-gray-100">
                        <button className="w-full py-2 px-4 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors text-sm flex items-center justify-center gap-1">
                          {book.bookType === 'For Sale' && (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              Add to Cart
                            </>
                          )}
                          
                          {book.bookType === 'For Swap' && (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                              </svg>
                              Propose Swap
                            </>
                          )}
                          
                          {book.bookType === 'For Borrowing' && (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Borrow Now
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            
            {/* Pagination */}
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
    </div>
  );
};

export default BooksPage;