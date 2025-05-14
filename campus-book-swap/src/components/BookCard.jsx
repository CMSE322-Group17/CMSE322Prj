import React, { useState, useEffect } from 'react'; // Removed useContext if not used elsewhere
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext'; // Correct: import useCart
import { wishlistAPI } from '../services/api';

// Unified BookCard component for displaying book items
const BookCard = ({ book, onClick }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart(); // Correct: use useCart() hook
  const [isInWishlist, setIsInWishlist] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const checkWishlist = async () => {
      if (!isAuthenticated || !book || typeof book.id === 'undefined') return;
      try {
        const wishlist = await wishlistAPI.getUserWishlist();
        if (isMounted) {
          setIsInWishlist(wishlist.some(item => item.book?.id === book.id));
        }
      } catch (error) {
        console.error('Error checking wishlist for book:', book?.id, error);
      }
    };

    if (typeof isAuthenticated === 'boolean') {
      checkWishlist();
    }

    return () => {
      isMounted = false;
    };
  }, [book, isAuthenticated]);

  if (!book) {
    return <div className="book-card-placeholder">Book data is not available.</div>;
  }

  const isSold = book.status === 'sold';

  const typeStyles = {
    'For Sale': 'bg-green-100 text-green-800 border-green-200',
    'For Swap': 'bg-blue-100 text-blue-800 border-blue-200'
  };
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
    )
  };

  const handlePrimaryAction = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate(`/signin?redirectTo=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!book || typeof book.id === 'undefined') {
      console.error('Book data is invalid for primary action.');
      alert('Cannot perform action: Book data is missing.');
      return;
    }

    if (book.bookType === 'For Sale') {
      try {
        const result = await addToCart(book); // Use addToCart from context
        if (result && result.success) {
          alert(`Book "${book.title}" added to cart!`);
        } else {
          alert(result && result.error ? result.error : 'Failed to add book to cart.');
        }
      } catch (error) {
        console.error('Error adding book to cart:', error);
        alert('An unexpected error occurred while adding to cart.');
      }
    } else if (book.bookType === 'For Swap') {
      console.log('Attempting to propose swap for:', book);
      alert(`Propose swap for "${book.title}". (Placeholder)`);
    } else {
      console.warn('Unknown book type for primary action:', book.bookType);
      alert('Action not defined for this book type.');
    }
  };

  const handleAddToWishlist = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate(`/signin?redirectTo=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    // Ensure book and book.id are valid
    if (!book || typeof book.id === 'undefined') {
      console.error('Book data is invalid for adding to wishlist.');
      alert('Cannot add to wishlist: Book data is missing.');
      return;
    }

    try {
      await wishlistAPI.addToWishlist(book.id);
      setIsInWishlist(true);
      alert('Book added to wishlist!');
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      alert('Failed to add book to wishlist. Please try again.');
    }
  };

  return (
    <div onClick={onClick} className="group cursor-pointer">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md h-full flex flex-col relative">
        {/* Book Type Badge */}
        <div className={`absolute top-3 left-3 z-10 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${typeStyles[book.bookType]} border`}>
          {typeIcons[book.bookType]}
          {book.bookType}
        </div>

        {/* Cover Image */}
        <div className="relative aspect-w-2 aspect-h-3 bg-gray-100">
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

        {/* Book Details */}
        <div className="p-4 flex-grow flex flex-col">
          <h3 className="font-medium text-gray-800 mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">{book.title}</h3>
          <p className="text-sm text-gray-500 mb-2">{book.author}</p>

          <div className="flex items-center mb-2">
            <div className="flex text-yellow-400 mr-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className={star <= Math.floor(book.rating) ? "text-yellow-400" : "text-gray-300"}>★</span>
              ))}
            </div>
            <span className="text-xs text-gray-500">({book.voters})</span>
          </div>

          <div className="mt-auto">
            {book.bookType === 'For Sale' && book.price !== null && (
              <p className="text-blue-600 font-medium">${book.price.toFixed(2)}</p>
            )}
            {book.bookType === 'For Swap' && (
              <p className="text-blue-600 font-medium">Swap</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {book.condition} • {book.inStock > 0 ? `${book.inStock} in stock` : 'Out of stock'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <button onClick={handlePrimaryAction} className="w-full py-2 px-4 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors text-sm flex items-center justify-center gap-1">
            {book.bookType === 'For Sale' && (
              <><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>Add to Cart</>)
            }
            {book.bookType === 'For Swap' && (
              <><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>Propose Swap</>)
            }
          </button>
          <button
            onClick={handleAddToWishlist}
            className={`w-full py-2 px-4 ${isInWishlist ? 'bg-gray-400' : 'bg-green-600'} text-white rounded font-medium hover:${isInWishlist ? 'bg-gray-500' : 'bg-green-700'} transition-colors text-sm flex items-center justify-center gap-1 mt-2`}
            disabled={isInWishlist}
          >
            {isInWishlist ? 'Added to Wishlist' : 'Add to Wishlist'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookCard;
