// src/pages/SearchBooksPage.jsx
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { bookAPI } from '../services/api';
import BookCard from '../components/BookCard';
import { useMessage } from '../contexts/useMessage';

const SearchBooksPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { showMessage } = useMessage();

  // Function to parse query params from URL
  const getQueryParam = (param) => {
    const params = new URLSearchParams(location.search);
    return params.get(param);
  };

  // Effect to set search query from URL on initial load and when URL changes
  useEffect(() => {
    const queryFromUrl = getQueryParam('query');
    if (queryFromUrl) {
      setSearchQuery(queryFromUrl);
      handleSearch(queryFromUrl);
    } else {
      setSearchResults([]); // Clear results if no query
    }
  }, [location.search]); // Re-run when location.search changes

  const handleSearch = async (query) => {
    if (!query || query.trim() === '') {
      setSearchResults([]);
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await bookAPI.searchBooks(query);
      setSearchResults(response.data.data || []); // Assuming API returns { data: { data: [...] } }
      if (response.data.data.length === 0) {
        showMessage('info', 'No books found matching your search criteria.');
      }
    } catch (err) {
      console.error('Error searching books:', err);
      setError('Failed to fetch search results. Please try again.');
      showMessage('error', 'Failed to fetch search results.');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const onFormSubmit = (e) => {
    e.preventDefault();
    // Update URL to reflect the new search query
    navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
    // The useEffect listening to location.search will trigger the actual search
  };

  return (
    <div className="container mx-auto p-4 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Search Books</h1>
      <form onSubmit={onFormSubmit} className="mb-8 max-w-xl mx-auto">
        <div className="flex items-center border border-gray-300 rounded-full shadow-sm overflow-hidden">
          <input
            type="text"
            value={searchQuery}
            onChange={onSearchInputChange}
            placeholder="Search by title, author, ISBN, or subject..."
            className="w-full px-6 py-3 text-gray-700 focus:outline-none"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 transition duration-150 ease-in-out"
            disabled={isLoading}
          >
            {isLoading ? (
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

      {isLoading && (
        <div className="text-center py-4">
          <p className="text-lg text-gray-600">Loading search results...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-4">
          <p className="text-lg text-red-600 bg-red-100 p-3 rounded-md">{error}</p>
        </div>
      )}

      {!isLoading && !error && searchResults.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {searchResults.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}

      {!isLoading && !error && searchResults.length === 0 && getQueryParam('query') && (
         // This message is now handled by the showMessage in handleSearch
        <div className="text-center py-4">
          {/* <p className="text-lg text-gray-600">No books found matching "{getQueryParam('query')}". Try a different search term.</p> */}
        </div>
      )}
       {!isLoading && !error && searchResults.length === 0 && !getQueryParam('query') && (
        <div className="text-center py-4">
          <p className="text-lg text-gray-600">Enter a search term above to find books.</p>
        </div>
      )}
    </div>
  );
};

export default SearchBooksPage;
