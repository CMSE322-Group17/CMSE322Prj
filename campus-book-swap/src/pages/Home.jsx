// filepath: /Users/forlary/Desktop/Projects/CMSE322Project/campus-book-swap/src/pages/Home.jsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { bookAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import BookCard from '../components/BookCard';
import BookDetails from '../components/BookDetails'; // Added import

const Home = () => {
  // Auth hook must be called at the top level of your function component
  const { isAuthenticated } = useAuth();
  
  // State variables for data
  const [selectedBook, setSelectedBook] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0); // Ensured currentSlide is used
  
  // State for the API data
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [popularBooks, setPopularBooks] = useState([]);
  const [booksOfWeek, setBooksOfWeek] = useState([]);
  
  // Loading states
  const [loading, setLoading] = useState({
    featured: true,
    popular: true,
    booksOfWeek: true,
  });
  
  // Error states
  const [error, setError] = useState({
    featured: null,
    popular: null,
    booksOfWeek: null,
  });

  // Add scrollbar hiding and animations
  const scrollbarHideStyle = `
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }
    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .animate-fadeIn {
      animation: fadeIn 0.3s ease-out forwards;
    }
    
    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(20px); }
      to { opacity: 1; transform: translateX(0); }
    }
    
    .animate-slideInRight {
      animation: slideInRight 0.4s ease-out forwards;
    }
  `;
  
  // Helper function to get image URL from Strapi data (aligned with BookPage.jsx for consistency)
  const getStrapiMediaUrl = useCallback((imageData) => {
    if (!imageData) return null;
    // Using VITE_STRAPI_API_URL for consistency with the more robust function from BookPage.jsx
    const baseUrl = (import.meta.env.VITE_STRAPI_API_URL || 'http://localhost:1337').replace(/\/$/, '');
    try {
      // Case 1: String URL
      if (typeof imageData === 'string') {
        if (imageData.startsWith('http')) return imageData;
        const path = imageData.startsWith('/') ? imageData : `/${imageData}`;
        return `${baseUrl}${path}`;
      }
      // Case 2: Plain array
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
        if (imageData.url) { // Fallback to main URL if formats don't have URLs
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
      console.warn('Could not process image data in getStrapiMediaUrl:', imageData);
      return null;
    } catch (err) {
      console.error('Error processing image URL in getStrapiMediaUrl:', err, imageData);
      return null;
    }
  }, []);

  // Book data mapping logic (aligned with BookPage.jsx for consistency)
  const mapBooksData = useCallback((books) => {
    if (!books || !Array.isArray(books)) return [];
    return books.map(book => {
      if (!book) return null;
      const bookData = book.attributes || book;
      let coverUrl = null;
      if (bookData.cover) { // Assuming bookData.cover is the raw image data field
        coverUrl = getStrapiMediaUrl(bookData.cover);
      }
      const bookType = bookData.bookType || (book.id % 2 === 0 ? 'For Sale' : 'For Swap');
      const price = bookType === 'For Sale'
        ? (bookData.price !== undefined ? bookData.price : (Math.floor(Math.random() * 25) + 5 + 0.99))
        : null;
      const isNew = bookData.isNew !== undefined ? bookData.isNew : (Math.random() > 0.5);

      return {
        id: book.id,
        title: bookData.title,
        author: bookData.author,
        description: bookData.description,
        rating: bookData.rating || (Math.random() * 2 + 3).toFixed(1),
        voters: bookData.votersCount || Math.floor(Math.random() * 100) + 5, // Prefer votersCount
        condition: bookData.condition || 'Good',
        exchange: bookData.exchange,
        subject: bookData.subject || 'General',
        course: bookData.course,
        seller: bookData.seller || 'Campus BookShop',
        cover: coverUrl,
        price: price,
        // Aligning category structure with BookPage.jsx (using categoryName)
        categoryName: bookData.category?.data?.attributes?.name || bookData.category?.name || "General",
        isNew: isNew,
        bookType,
      };
    }).filter(Boolean);
  }, [getStrapiMediaUrl]);

  // Fetch all necessary data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch featured books
        setLoading(prev => ({ ...prev, featured: true }));
        const featuredData = await bookAPI.getFeaturedBooks();
        setFeaturedBooks(mapBooksData(featuredData.data));
        setLoading(prev => ({ ...prev, featured: false }));
      } catch (err) {
        console.error('Error fetching featured books:', err);
        setError(prev => ({ ...prev, featured: err.message }));
        setLoading(prev => ({ ...prev, featured: false }));
      }

      try {
        // Fetch popular books
        setLoading(prev => ({ ...prev, popular: true }));
        const popularData = await bookAPI.getPopularBooks();
        setPopularBooks(mapBooksData(popularData.data));
        setLoading(prev => ({ ...prev, popular: false }));
      } catch (err) {
        console.error('Error fetching popular books:', err);
        setError(prev => ({ ...prev, popular: err.message }));
        setLoading(prev => ({ ...prev, popular: false }));
      }

      try {
        // Fetch books of the week
        setLoading(prev => ({ ...prev, booksOfWeek: true }));
        const weekBooksData = await bookAPI.getBooksOfWeek();
        setBooksOfWeek(mapBooksData(weekBooksData.data));
        setLoading(prev => ({ ...prev, booksOfWeek: false }));
      } catch (err) {
        console.error('Error fetching books of the week:', err);
        setError(prev => ({ ...prev, booksOfWeek: err.message }));
        setLoading(prev => ({ ...prev, booksOfWeek: false }));
      }
    };

    fetchData();
  }, [mapBooksData]); // Only include mapBooksData in dependency array

  // Auto slide effect for featured books
  useEffect(() => {
    if (featuredBooks.length === 0 || selectedBook) return;
    
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev === featuredBooks.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredBooks.length, selectedBook]);

  // Handle setting selected book
  const handleSelectBook = useCallback((book) => {
    setSelectedBook(book);
  }, []);

  // Handle closing book details
  const handleCloseBookDetails = useCallback(() => {
    setSelectedBook(null);
  }, []);

  // COMPONENT: Hero Section with Centered Information
  const HeroSection = useCallback(() => {
    // Skip if no featured books or loading
    if (loading.featured) {
      return (
        <div className="relative py-20 px-4 bg-gradient-to-br from-blue-600 to-indigo-800 text-white rounded-lg mx-4 mb-6">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse text-center">
              <div className="h-8 bg-white/30 rounded w-1/4 mb-6 mx-auto"></div>
              <div className="h-4 bg-white/20 rounded w-3/4 mb-8 mx-auto"></div>
              <div className="h-12 bg-white/20 rounded-full max-w-md mx-auto"></div>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="relative py-20 bg-gradient-to-br from-gray-900 to-blue-900 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="bookshelf" patternUnits="userSpaceOnUse" width="100" height="100" patternTransform="scale(2) rotate(0)">
                <rect x="0" y="0" width="100%" height="100%" fill="none" />
                <path d="M0 0h10v100h-10zM25 0h10v100h-10zM50 0h10v100h-10zM75 0h10v100h-10z" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#bookshelf)" />
          </svg>
        </div>
  
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center">
            {/* Left Column - Text */}
            <div className="w-full md:w-1/2 text-center md:text-left mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                Discover Your Next <span className="text-blue-300">Great Read</span>
              </h1>
              <p className="text-xl text-blue-100 mb-8 max-w-lg">
                Your campus destination for textbooks, bestsellers, and book exchanges. Save money and connect with fellow readers.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link to="/books" className="px-8 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors shadow-lg text-center">
                  Browse Books
                </Link>
              </div>
              
              {/* Key Stats */}
              <div className="mt-12 grid grid-cols-3 gap-6">
                <div>
                  <div className="text-3xl font-bold text-white">15,000+</div>
                  <div className="text-sm text-blue-200">Books Available</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">3,500+</div>
                  <div className="text-sm text-blue-200">Textbooks</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">25%</div>
                  <div className="text-sm text-blue-200">Average Savings</div>
                </div>
              </div>
            </div>
            
            {/* Right Column - Book Stack Image */}
            <div className="w-full md:w-1/2 relative">
              <div className="relative h-80 sm:h-96 md:h-[500px] mx-auto max-w-sm">
                {/* Books stacked on top of each other with 3D effect */}
                <div className="absolute bottom-0 right-12 w-40 h-56 bg-indigo-700 rounded-lg shadow-xl transform rotate-6 z-10"></div>
                <div className="absolute bottom-0 right-8 w-40 h-56 bg-blue-600 rounded-lg shadow-xl transform rotate-3 z-20"></div>
                <div className="absolute bottom-0 right-4 w-40 h-56 bg-indigo-500 rounded-lg shadow-xl transform -rotate-3 z-30"></div>
                <div className="absolute bottom-0 right-0 w-40 h-56 bg-blue-400 rounded-lg shadow-2xl z-40 overflow-hidden">
                  {featuredBooks && featuredBooks.length > 0 && featuredBooks[currentSlide] && featuredBooks[currentSlide].cover ? (
                    <img 
                      src={featuredBooks[currentSlide].cover} 
                      alt={featuredBooks[currentSlide].title || "Featured Book"} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = null; // Prevent infinite loop if fallback also fails
                        e.target.parentElement.classList.add('bg-gradient-to-br', 'from-blue-400', 'to-blue-600', 'flex', 'items-center', 'justify-center');
                        e.target.parentElement.innerHTML = `
                          <div class="font-serif text-white text-center p-4">
                            <div class="text-lg font-bold">Featured</div>
                            <div class="text-sm mt-2">Book Image Unavailable</div>
                          </div>
                        `;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                      <div className="font-serif text-white text-center p-4">
                        <div className="text-lg font-bold">Featured</div>
                        <div className="text-sm mt-2">{ (featuredBooks && featuredBooks.length > 0) ? "Book" : "Loading..."}</div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Decorative books floating */}
                <div className="absolute top-20 left-0 w-24 h-36 bg-yellow-500 rounded-lg shadow-xl transform -rotate-12 z-10"></div>
                <div className="absolute top-40 left-20 w-20 h-32 bg-red-500 rounded-lg shadow-xl transform rotate-12 z-20"></div>
                <div className="absolute top-10 left-40 w-16 h-24 bg-green-500 rounded-lg shadow-xl transform -rotate-6 z-30"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }, [loading.featured, featuredBooks, currentSlide]); // Added currentSlide to dependency array

  // Action Header Component
  const ActionHeader = useCallback(() => {
    return (
      <div className="bg-white shadow-md rounded-xl mx-4 -mt-6 relative z-20 mb-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between py-4">
            <div className="flex flex-wrap justify-center gap-4 w-full">
              <div className="action-card p-4 bg-blue-50 rounded-lg flex items-center w-full sm:w-40 transition-all hover:bg-blue-100">
                <div className="rounded-full bg-blue-100 p-3 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Swap</h3>
                  <p className="text-xs text-gray-500">Exchange books</p>
                </div>
              </div>
              
              <div className="action-card p-4 bg-green-50 rounded-lg flex items-center w-full sm:w-40 transition-all hover:bg-green-100">
                <div className="rounded-full bg-green-100 p-3 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1m0 0c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Sell</h3>
                  <p className="text-xs text-gray-500">Sell your books</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }, []);
  
  // Popular Categories Section
  const PopularCategoriesSection = useCallback(() => {
    const popularCategories = [
      { name: 'Computer Science', bookCount: 284, color: 'bg-blue-100 text-blue-600' },
      { name: 'Business', bookCount: 205, color: 'bg-yellow-100 text-yellow-600' },
      { name: 'Mathematics', bookCount: 176, color: 'bg-purple-100 text-purple-600' },
      { name: 'Engineering', bookCount: 153, color: 'bg-red-100 text-red-600' },
      { name: 'Biology', bookCount: 142, color: 'bg-green-100 text-green-600' },
      { name: 'Psychology', bookCount: 124, color: 'bg-indigo-100 text-indigo-600' },
      { name: 'Literature', bookCount: 115, color: 'bg-pink-100 text-pink-600' },
      { name: 'Chemistry', bookCount: 98, color: 'bg-teal-100 text-teal-600' }
    ];
    
    // Helper function to render FA-like icons (simplified, you'd use real icons in production)
    const renderIcon = () => {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    };
    
    return (
      <div className="py-10 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Popular Course Categories</h2>
            <a href="#" className="text-blue-600 text-sm font-medium hover:text-blue-800">
              View All Categories →
            </a>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {popularCategories.map(category => (
              <div key={category.name} className="category-card bg-white rounded-xl p-4 shadow-sm transition-all hover:shadow-md cursor-pointer">
                <div className="flex items-center mb-3">
                  <div className={`rounded-full p-2 ${category.color}`}>
                    {renderIcon()}
                  </div>
                  <h3 className="font-medium ml-3 text-gray-800">{category.name}</h3>
                </div>
                <p className="text-sm text-gray-500">{category.bookCount} books available</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }, []);
  
  // Campus Stats Component
  const CampusStatsSection = useCallback(() => {
    return (
      <div className="py-10 px-4 bg-blue-600 text-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">CampusBookSwap Stats</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="stat-card">
              <div className="text-3xl md:text-4xl font-bold mb-2">1,200+</div>
              <div className="text-blue-100">Active Books</div>
            </div>
            <div className="stat-card">
              <div className="text-3xl md:text-4xl font-bold mb-2">$14,500</div>
              <div className="text-blue-100">Student Savings</div>
            </div>
            <div className="stat-card">
              <div className="text-3xl md:text-4xl font-bold mb-2">520</div>
              <div className="text-blue-100">Completed Swaps</div>
            </div>
            <div className="stat-card">
              <div className="text-3xl md:text-4xl font-bold mb-2">345</div>
              <div className="text-blue-100">Active Borrowers</div>
            </div>
          </div>
          
          <div className="mt-10 text-center">
            <p className="text-lg mb-6 max-w-xl mx-auto text-blue-100">
              Join thousands of students saving money by swapping, borrowing, and buying books directly from other students or library.
            </p>
            <button className="px-6 py-3 bg-white text-blue-700 rounded-full font-medium hover:bg-blue-50 transition-colors shadow-md">
              Join CampusBookSwap Today
            </button>
          </div>
        </div>
      </div>
    );
  }, []);
  
  // Testimonials Component
  const TestimonialsSection = useCallback(() => {
    const testimonials = [
      {
        id: 1,
        name: "Sarah Johnson",
        major: "Computer Science",
        year: "Junior",
        text: "I saved over $300 last semester by swapping and borrowing textbooks on BookSwap. The platform is super easy to use and I've met some great people from my major!",
        avatar: null
      },
      {
        id: 2,
        name: "Michael Chen",
        major: "Business Administration",
        year: "Senior",
        text: "As a senior, I had a lot of books collecting dust. I've sold 12 books so far and made enough to cover my coffee budget for the entire semester!",
        avatar: null
      },
      {
        id: 3,
        name: "Leila Patel",
        major: "Biology",
        year: "Sophomore",
        text: "The borrowing feature is perfect for those one-time courses. I borrowed three lab manuals last term and saved a ton of money on books I would have only used once.",
        avatar: null
      }
    ];
    
    return (
      <div className="py-12 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-2 text-center text-gray-800">What Students Are Saying</h2>
          <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
            Join thousands of satisfied students who are saving money and helping each other succeed.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map(testimonial => (
              <div key={testimonial.id} className="bg-gray-50 rounded-xl p-6 shadow-sm relative">
                {/* Quote mark decorative element */}
                <div className="absolute top-4 right-4 text-5xl text-gray-200 font-serif">"</div>
                
                <p className="text-gray-700 mb-6 relative z-10">
                  "{testimonial.text}"
                </p>
                
                <div className="flex items-center">
                  {testimonial.avatar ? (
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full mr-4 object-cover border-2 border-white shadow-sm"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = null;
                        e.target.parentElement.innerHTML = `
                          <div class="w-12 h-12 rounded-full mr-4 bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg border-2 border-white shadow-sm">
                            ${testimonial.name.charAt(0)}
                          </div>
                        `;
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full mr-4 bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg border-2 border-white shadow-sm">
                      {testimonial.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium text-gray-800">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.major}, {testimonial.year}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-10 text-center">
            <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Share Your Experience
            </button>
          </div>
        </div>
      </div>
    );
  }, []);

  // COMPONENT: Featured Books Row - memoized to prevent re-renders
  const FeaturedBooksRow = useCallback(({ books = [], title, icon, loading: isLoading, error: rowError }) => {
    if (isLoading) {
      return (
        <div className="py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center mb-6 animate-pulse">
              <div className="w-6 h-6 bg-gray-200 rounded-full mr-2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 h-40 rounded-lg mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    
    if (rowError) {
      return (
        <div className="py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="bg-red-50 text-red-700 p-4 rounded-lg">
              <h3 className="font-medium mb-2">{title}</h3>
              <p className="text-sm">{rowError}</p>
            </div>
          </div>
        </div>
      );
    }
    
    if (!books || books.length === 0) {
      return (
        <div className="py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl font-bold mb-6 flex items-center text-gray-700">
              {icon}
              {title}
            </h2>
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No books available in this category</p>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="py-8 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl font-bold mb-6 flex items-center text-gray-800">
            {icon}
            {title}
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {books.map(book => (
              <BookCard key={book.id} book={book} onClick={() => handleSelectBook(book)} />
            ))}
          </div>
        </div>
      </div>
    );
  }, [handleSelectBook]);

  // Popular Books Section
  const PopularBooksSection = useCallback(() => {
    if (loading.popular) {
      return (
        <div className="py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center mb-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                  <div className="p-5 border-b border-gray-100 flex">
                    <div className="w-24 h-36 bg-gray-200 rounded"></div>
                    <div className="ml-5 flex-grow">
                      <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded mb-4 w-1/2"></div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (error.popular) {
      return (
        <div className="py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="bg-red-50 text-red-700 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Popular Books</h3>
              <p className="text-sm">{error.popular}</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="py-8 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Popular Books</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {popularBooks.slice(0, 6).map(book => (
              <BookCard key={book.id} book={book} onClick={() => handleSelectBook(book)} />
            ))}
          </div>
          
          <div className="mt-8 text-center">
            <Link
              to="/books"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View All Books
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    );
  };

  // MAIN RENDER
  return (
    <div className="book-store bg-gray-100 min-h-screen">
      {/* Add custom style for scrollbar hiding and animations */}
      <style dangerouslySetInnerHTML={{ __html: scrollbarHideStyle }} />
  
      {/* Hero Section with Featured Book */}
      <HeroSection />
      
      {/* Action Cards Header */}
      <ActionHeader />
      
      {/* Favorite Books - Only shown when user is authenticated */}
      {isAuthenticated && (
        <FeaturedBooksRow 
          books={booksOfWeek}
          title="Favorite Books"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          }
          loading={loading.booksOfWeek}
          error={error.booksOfWeek}
        />
      )}
      
      {/* Popular Books Section */}
      <PopularBooksSection />
      
      {/* Popular Categories Section */}
      <PopularCategoriesSection />
      
      {/* Books of the Week Row */}
      <FeaturedBooksRow 
        books={booksOfWeek}
        title="Books of the Week"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        }
        loading={loading.booksOfWeek}
        error={error.booksOfWeek}
      />
      
      {/* Campus Stats Section */}
      <CampusStatsSection />
      
      {/* Student Testimonials */}
      <TestimonialsSection />
      
      {/* Book Details Modal */}
      {selectedBook && (
        <BookDetails book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </div>
  );
};

export default Home;