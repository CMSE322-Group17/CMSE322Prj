import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { bookAPI } from '../services/api';

const BookForm = ({ onSuccess, bookToEdit = null }) => {
  const initialState = {
    title: '',
    author: '',
    description: '',
    price: '',
    condition: 'New',
    exchange: '',
    subject: '',
    course: '',
    seller: '', // Will be automatically populated with the user's username
    featured: false,
    bookOfWeek: false,
    bookOfYear: false,
    displayTitle: '',
    category: '',
    bookType: 'For Sale'
    // users_permissions_user is handled in handleSubmit, not part of form state
  };

  const [book, setBook] = useState(initialState);
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { user } = useAuth();

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Use our bookAPI service to get categories
        const response = await bookAPI.getCategories();
        
        if (response && response.data) {
          const processedCategories = response.data.map(cat => {
            return {
              id: cat.id,
              // Try different possible property names for the category name
              name: cat.attributes?.Type || cat.attributes?.name || cat.Type || cat.type || cat.name || `Category ${cat.id}`
            };
          });
          
          setCategories(processedCategories);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories');
      }
    };

    fetchCategories();
    
    // Auto-populate the seller field with the user's username
    if (user?.username) {
      setBook(prev => ({ ...prev, seller: user.username }));
    }
    
    // If we have a book to edit, populate the form
    if (bookToEdit) {
      setBook({
        title: bookToEdit.title || '',
        author: bookToEdit.author || '',
        description: bookToEdit.description || '',
        price: bookToEdit.price || '',
        condition: bookToEdit.condition || 'New',
        exchange: bookToEdit.exchange || '',
        subject: bookToEdit.subject || '',
        course: bookToEdit.course || '',
        seller: bookToEdit.seller || user?.username || '',
        featured: bookToEdit.featured || false,
        bookOfWeek: bookToEdit.bookOfWeek || false,
        bookOfYear: bookToEdit.bookOfYear || false,
        displayTitle: bookToEdit.displayTitle || '',
        category: bookToEdit.category?.id || '',
        bookType: bookToEdit.bookType || 'For Sale'
      });
      
      if (bookToEdit.cover) {
        setCoverPreview(bookToEdit.cover);
      }
    } else {
      // For new books, set seller to current user
      setBook(prev => ({
        ...prev,
        seller: user?.username || ''
      }));
    }
  }, [bookToEdit, user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBook(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Clear any previous errors
      setError('');
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image too large. Please select an image smaller than 5MB.');
        e.target.value = ''; // Reset the input
        return;
      }
      
      // Validate file type (only accept common image formats)
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Unsupported file type. Please use JPG, PNG, GIF or WEBP images.');
        e.target.value = ''; // Reset the input
        return;
      }
      
      setCoverImage(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Make sure we have a user ID before proceeding
      if (!user?.id) {
        throw new Error('User must be logged in to create a book');
      }
      
      // Format book data for submission
      const bookData = {
        title: book.title,
        author: book.author,
        description: book.description,
        condition: book.condition,
        exchange: book.exchange,
        subject: book.subject,
        course: book.course,
        seller: book.seller || user.username, // Set seller name to username if not provided
        featured: book.featured,
        bookOfWeek: book.bookOfWeek,
        bookOfYear: book.bookOfYear,
        displayTitle: book.displayTitle,
        category: book.category || null,
        bookType: book.bookType,
        users_permissions_user: user.id // Explicitly use the logged-in user's ID
      };
      
      // Log the actual data before submission for debugging
      console.log('Submitting book data:', bookData);
      
      let bookResponse;
      
      // Use bookAPI service for creating/updating books
      if (bookToEdit) {
        bookResponse = await bookAPI.updateBook(bookToEdit.id, bookData, coverImage);
      } else {
        bookResponse = await bookAPI.createBook(bookData, coverImage);
      }
      
      // Log the response for debugging
      console.log('Book API response:', bookResponse);
      
      setSuccess(bookToEdit ? 'Book updated successfully!' : 'Book listed successfully!');
      setBook(initialState);
      setCoverImage(null);
      setCoverPreview(null);
      
      if (onSuccess) {
        onSuccess(bookResponse.data.data);
      }
    } catch (err) {
      console.error('Error submitting book:', err);
      
      // Handle authentication/user ID errors
      if (err.message === 'User must be logged in to create a book') {
        setError('You must be logged in to create a book. Please sign in and try again.');
        return;
      }
      
      if (err.response) {
        console.log('Error data:', err.response.data);
        // More detailed error logging to help diagnose issues
        console.log('Error status:', err.response.status);
        console.log('Error headers:', err.response.headers);
        
        if (err.response.data?.error?.message === 'Missing "data" payload in the request body') {
          setError('There was an issue with the data format. Please try again.');
        } else if (err.response.status === 401 || err.response.status === 403) {
          setError('Authentication error: Please sign in again to create a book.');
        } else if (coverImage && err.response.status === 400) {
          // Handle image upload errors more specifically
          if (coverImage.size > 5 * 1024 * 1024) { // 5MB limit check
            setError('The cover image is too large. Please use an image smaller than 5MB.');
          } else {
            setError('There was an issue with the cover image. Please try a different image or format (JPG, PNG recommended).');
          }
        } else {
          setError(`Server error: ${err.response.data?.error?.message || 'Failed to submit book'}`);
        }
      } else if (err.request) {
        setError('No response from server. Check your connection.');
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset price when book type changes
  useEffect(() => {
    if (book.bookType !== 'For Sale') {
      setBook(prev => ({ ...prev, price: '0' }));
    }
  }, [book.bookType]);

  // Show/hide fields based on book type
  const showPriceField = book.bookType === 'For Sale';
  const showExchangeField = book.bookType === 'For Swap';

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">{bookToEdit ? 'Edit Book' : 'List a Book'}</h2>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="title" className="block mb-1 font-medium">Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="title"
              name="title"
              value={book.title}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded"
              required
            />
          </div>
          
          <div>
            <label htmlFor="author" className="block mb-1 font-medium">Author <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="author"
              name="author"
              value={book.author}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded"
              required
            />
          </div>
          
          <div className="md:col-span-2">
            <label htmlFor="description" className="block mb-1 font-medium">Description</label>
            <textarea
              id="description"
              name="description"
              value={book.description}
              onChange={handleChange}
              rows="3"
              className="w-full p-2 border border-gray-300 rounded"
            ></textarea>
          </div>
          
          <div>
            <label htmlFor="bookType" className="block mb-1 font-medium">Listing Type <span className="text-red-500">*</span></label>
            <select
              id="bookType"
              name="bookType"
              value={book.bookType}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded"
              required
            >
              <option value="For Sale">For Sale</option>
              <option value="For Swap">For Swap</option>
              {/*<option value="For Borrowing">For Borrowing</option>*/}
            </select>
          </div>
          
          <div>
            <label htmlFor="category" className="block mb-1 font-medium">Category</label>
            <select
              id="category"
              name="category"
              value={book.category}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">Select a category</option>
              {categories.length > 0 ? (
                categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))
              ) : (
                <option value="" disabled>Loading categories...</option>
              )}
            </select>
          </div>
          
          {showPriceField && (
            <div>
              <label htmlFor="price" className="block mb-1 font-medium">Price ($) <span className="text-red-500">*</span></label>
              <input
                type="number"
                id="price"
                name="price"
                value={book.price}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required={showPriceField}
                placeholder="Enter price"
              />
              <p className="text-sm text-gray-500 mt-1">Only required for books listed for sale</p>
            </div>
          )}
          
{/*          {showDepositField && (
            <div>
              <label htmlFor="depositAmount" className="block mb-1 font-medium">Deposit Amount ($) <span className="text-red-500">*</span></label>
              <input
                type="number"
                id="depositAmount"
                name="depositAmount"
                value={book.depositAmount}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full p-2 border border-gray-300 rounded"
                required={showDepositField}
                placeholder="Refundable deposit amount"
              />
            </div>
          )}*/}
          
          <div>
            <label htmlFor="condition" className="block mb-1 font-medium">Condition <span className="text-red-500">*</span></label>
            <select
              id="condition"
              name="condition"
              value={book.condition}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded"
              required
            >
              <option value="New">New</option>
              <option value="Like New">Like New</option>
              <option value="Very Good">Very Good</option>
              <option value="Good">Good</option>
              <option value="Acceptable">Acceptable</option>
              <option value="Poor">Poor</option>
            </select>
          </div>
          
          {showExchangeField && (
            <div>
              <label htmlFor="exchange" className="block mb-1 font-medium">Exchange For <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="exchange"
                name="exchange"
                value={book.exchange}
                onChange={handleChange}
                placeholder="e.g. Science books, Fiction novels"
                className="w-full p-2 border border-gray-300 rounded"
                required={showExchangeField}
              />
            </div>
          )}
          
          <div>
            <label htmlFor="subject" className="block mb-1 font-medium">Subject</label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={book.subject}
              onChange={handleChange}
              placeholder="e.g. Mathematics, Computer Science"
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          
          <div>
            <label htmlFor="course" className="block mb-1 font-medium">Course (if applicable)</label>
            <input
              type="text"
              id="course"
              name="course"
              value={book.course}
              onChange={handleChange}
              placeholder="e.g. CS101, MATH202"
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          
          <div>
            <label htmlFor="seller" className="block mb-1 font-medium">Seller Name <span className="text-gray-500">(auto-filled)</span></label>
            <input
              type="text"
              id="seller"
              name="seller"
              value={book.seller || user?.username || ''}
              className="w-full p-2 border border-gray-300 rounded bg-gray-100"
              required
              readOnly
              disabled
            />
          </div>
          
          <div>
            <label htmlFor="displayTitle" className="block mb-1 font-medium">Display Title (optional)</label>
            <input
              type="text"
              id="displayTitle"
              name="displayTitle"
              value={book.displayTitle}
              onChange={handleChange}
              placeholder="Alternative title for display purposes"
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          
          <div className="md:col-span-2">
            <label htmlFor="cover" className="block mb-1 font-medium">Cover Image</label>
            <input
              type="file"
              id="cover"
              name="cover"
              onChange={handleImageChange}
              accept="image/*"
              className="w-full p-2 border border-gray-300 rounded"
              required={false}
            />
            {coverPreview && (
              <div className="mt-2">
                <img src={coverPreview} alt="Cover preview" className="h-32 object-contain" />
              </div>
            )}
            <p className="text-sm text-gray-500 mt-1">Optional: You can upload a cover image for your book</p>
          </div>
          
{/*          <div className="md:col-span-2">
            <div className="flex space-x-4 flex-wrap">
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="featured"
                  name="featured"
                  checked={book.featured}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600"
                />
                <label htmlFor="featured" className="ml-2 text-sm">Feature on homepage</label>
              </div>
              
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="bookOfWeek"
                  name="bookOfWeek"
                  checked={book.bookOfWeek}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600"
                />
                <label htmlFor="bookOfWeek" className="ml-2 text-sm">Book of the Week</label>
              </div>
              
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="bookOfYear"
                  name="bookOfYear"
                  checked={book.bookOfYear}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600"
                />
                <label htmlFor="bookOfYear" className="ml-2 text-sm">Book of the Year</label>
              </div>
            </div>
          </div>*/}
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className={`py-2 px-4 ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} text-white font-medium rounded`}
          >
            {loading ? 'Submitting...' : bookToEdit ? 'Update Book' : 'List Book'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookForm;