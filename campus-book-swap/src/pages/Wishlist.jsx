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
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

  const handlePageClick = (event) => {
    setCurrentPage(event.selected);
  };

  const handleShareWishlist = () => {
    const shareUrl = `${window.location.origin}/wishlist`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        toast.success('Wishlist link copied to clipboard!');
      })
      .catch((error) => {
        console.error('Error copying wishlist link:', error);
        toast.error('Failed to copy wishlist link. Please try again.');
      });
  };

  const books = wishlistEntries.map((entry) => entry.book);
  const filteredAndSortedWishlist = books
    .filter((book) =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOption === 'title') {
        return a.title.localeCompare(b.title);
      } else if (sortOption === 'author') {
        return a.author.localeCompare(b.author);
      }
      return 0;
    });

  const paginatedWishlist = filteredAndSortedWishlist.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  if (loading) {
    return <div>Loading your wishlist...</div>;
  }

  if (wishlistEntries.length === 0) {
    return <div>Your wishlist is empty.</div>;
  }

  return (
    <div className="wishlist-page">
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-4">Your Wishlist</h1>

      {/* Search, Sort, and Share Controls */}
      <div className="mb-4 flex justify-between items-center">
        <button
          onClick={handleShareWishlist}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Share Wishlist
        </button>
        <input
          type="text"
          placeholder="Search by title or author"
          value={searchQuery}
          onChange={handleSearch}
          className="border px-4 py-2 rounded w-1/2"
        />
        <select
          value={sortOption}
          onChange={handleSortChange}
          className="border px-4 py-2 rounded"
        >
          <option value="title">Sort by Title</option>
          <option value="author">Sort by Author</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {wishlistEntries.map((entry) => (
          <div key={entry.id} className="relative">
            <BookCard book={entry.book} />
            <button
              onClick={() => handleRemoveFromWishlist(entry.id)}
              className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
              disabled={loading}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      <ReactPaginate
        previousLabel={"Previous"}
        nextLabel={"Next"}
        breakLabel={"..."}
        pageCount={Math.ceil(filteredAndSortedWishlist.length / itemsPerPage)}
        marginPagesDisplayed={2}
        pageRangeDisplayed={3}
        onPageChange={handlePageClick}
        containerClassName={"pagination"}
        activeClassName={"active"}
        className="flex justify-center mt-4"
      />
    </div>
  );
};

export default Wishlist;
