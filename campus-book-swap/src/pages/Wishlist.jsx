import React, { useEffect, useState } from 'react';
import { wishlistAPI } from '../services/api';
import BookCard from '../components/BookCard';
import ReactPaginate from 'react-paginate';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Wishlist = () => {
  const [wishlistEntries, setWishlistEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('title');
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchWishlist = async () => {
      setLoading(true); // Start loading
      try {
        const entries = await wishlistAPI.getUserWishlist();
        // Filter out entries where book is null immediately after fetching
        const validEntries = entries.filter(entry => entry && entry.book);
        setWishlistEntries(validEntries);
      } catch (error) {
        console.error('Error fetching wishlist:', error);
        toast.error('An error occurred while fetching your wishlist. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, []);

  const handleRemoveFromWishlist = async (wishlistEntryId) => {
    if (!wishlistEntryId) {
      toast.error('Cannot remove item: ID is missing.');
      return;
    }
    setLoading(true);
    try {
      await wishlistAPI.removeWishlistEntry(wishlistEntryId);
      setWishlistEntries((prevEntries) => prevEntries.filter((e) => e.id !== wishlistEntryId));
      toast.success('Book removed from wishlist.');
    } catch (error) {
      console.error('Error removing book from wishlist:', error);
      toast.error('Failed to remove book from wishlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(0); // Reset to first page on new search
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
    setCurrentPage(0); // Reset to first page on sort change
  };

  const handlePageClick = (event) => {
    setCurrentPage(event.selected);
  };

  const handleShareWishlist = () => {
    const shareUrl = window.location.href; // Shares the current page URL
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        toast.success('Wishlist link copied to clipboard!');
      })
      .catch((error) => {
        console.error('Error copying wishlist link:', error);
        toast.error('Failed to copy wishlist link. Please try again.');
      });
  };

  // Processing for display:
  // wishlistEntries should already contain only entries with valid .book objects
  const filteredAndSortedWishlist = wishlistEntries
    .filter((entry) => {
      // entry.book is guaranteed to be non-null here due to initial filter
      const book = entry.book;
      const query = searchQuery.toLowerCase();
      const titleMatch = book.title?.toLowerCase().includes(query) || false;
      const authorMatch = book.author?.toLowerCase().includes(query) || false;
      return titleMatch || authorMatch;
    })
    .sort((entryA, entryB) => {
      const bookA = entryA.book;
      const bookB = entryB.book;
      if (sortOption === 'title') {
        return bookA.title?.localeCompare(bookB.title || '') || 0;
      } else if (sortOption === 'author') {
        return bookA.author?.localeCompare(bookB.author || '') || 0;
      }
      return 0;
    });

  const pageCount = Math.ceil(filteredAndSortedWishlist.length / itemsPerPage);
  const paginatedWishlistEntries = filteredAndSortedWishlist.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  if (loading && wishlistEntries.length === 0) { // Show loading only if initially fetching
    return <div className="text-center p-10">Loading your wishlist...</div>;
  }

  if (!loading && wishlistEntries.length === 0) {
    return <div className="text-center p-10">Your wishlist is empty. Add some books!</div>;
  }

  return (
    <div className="wishlist-page container mx-auto p-4">
      <ToastContainer position="top-right" autoClose={3000} />
      <h1 className="text-3xl font-bold mb-6 text-center">Your Wishlist</h1>

      <div className="mb-6 p-4 bg-white shadow rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4">
        <input
          type="text"
          placeholder="Search by title or author..."
          value={searchQuery}
          onChange={handleSearch}
          className="border px-4 py-2 rounded-md w-full sm:w-1/2 lg:w-1/3 focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-4 items-center">
          <select
            value={sortOption}
            onChange={handleSortChange}
            className="border px-4 py-2 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="title">Sort by Title</option>
            <option value="author">Sort by Author</option>
          </select>
          <button
            onClick={handleShareWishlist}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-150"
          >
            Share Wishlist
          </button>
        </div>
      </div>

      {paginatedWishlistEntries.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {paginatedWishlistEntries.map((entry) => (
              <div key={entry.id} className="relative group">
                {/* Pass the book object from the entry to BookCard */}
                <BookCard book={entry.book} />
                <button
                  onClick={() => handleRemoveFromWishlist(entry.id)}
                  className="absolute top-4 right-4 z-20 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition duration-150 opacity-0 group-hover:opacity-100"
                  aria-label="Remove from wishlist"
                  disabled={loading} 
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          {pageCount > 1 && (
            <ReactPaginate
              previousLabel={'Previous'}
              nextLabel={'Next'}
              breakLabel={'...'}
              pageCount={pageCount}
              marginPagesDisplayed={2}
              pageRangeDisplayed={3}
              onPageChange={handlePageClick}
              containerClassName={'flex justify-center items-center space-x-2 mt-8'}
              pageClassName={'px-2'}
              pageLinkClassName={'px-3 py-2 rounded-md block hover:bg-gray-200'}
              previousClassName={'px-2'}
              previousLinkClassName={'px-3 py-2 rounded-md block bg-gray-100 hover:bg-gray-200'}
              nextClassName={'px-2'}
              nextLinkClassName={'px-3 py-2 rounded-md block bg-gray-100 hover:bg-gray-200'}
              breakClassName={'px-2'}
              breakLinkClassName={'px-3 py-2 rounded-md block'}
              activeClassName={'bg-blue-500 text-white rounded-md'}
              activeLinkClassName={'px-3 py-2 rounded-md block bg-blue-500 text-white'}
              disabledClassName={'opacity-50 cursor-not-allowed'}
            />
          )}
        </>
      ) : (
        !loading && <div className="text-center p-10">No books match your current filters.</div>
      )}
    </div>
  );
};

export default Wishlist;
