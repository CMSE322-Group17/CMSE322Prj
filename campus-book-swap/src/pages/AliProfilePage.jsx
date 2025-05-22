import React from 'react';
import { Link } from 'react-router-dom';

// Hardcoded data for Ali's profile
const ALI_PROFILE = {
  id: 3,
  username: 'ali',
  bio: 'Computer science student and tech book enthusiast.',
  joinedDate: 'October 2023',
  // Add other profile details as needed
};

// Hardcoded books listed by Ali
const ALI_BOOKS = [
  {
    id: 501,
    title: 'Data Structures and Algorithms',
    author: 'Robert Lafore',
    condition: 'Good',
    bookType: 'For Swap',
    exchange: 'Any programming book',
    cover: '/seed-images/9780593316535.jpg', // Example path, replace with actual if available
  },
  {
    id: 502,
    title: 'Introduction to Machine Learning',
    author: 'Ethem Alpaydin',
    condition: 'Like New',
    bookType: 'For Sale',
    price: 25.00,
    cover: '/seed-images/9780593320709.jpg', // Example path, replace with actual if available
  },
  {
    id: 503,
    title: 'Discrete Mathematics',
    author: 'Kenneth Rosen',
    condition: 'Acceptable',
    bookType: 'For Sale',
    price: 15.50,
    cover: '/seed-images/9780593299067.jpg', // Example path, replace with actual if available
  },
  // Add more hardcoded books for Ali here
];

const AliProfilePage = () => {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{ALI_PROFILE.username}'s Profile</h1>
        <Link to="/messages" className="text-blue-600 hover:text-blue-800">
          Back to Messages
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">About {ALI_PROFILE.username}</h2>
        <p className="text-gray-700 mb-4">{ALI_PROFILE.bio}</p>
        <p className="text-sm text-gray-500">Joined: {ALI_PROFILE.joinedDate}</p>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h3 className="text-md font-semibold mb-2">Recent Transactions</h3>
          <div className="flex items-center p-2 bg-blue-50 rounded-lg mb-2">
            <div className="h-8 w-8 bg-blue-200 text-blue-700 rounded-full flex items-center justify-center mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Book purchase: Discrete Math</p>
              <p className="text-xs text-gray-500">Completed on May 20, 2024</p>
            </div>
          </div>
          <div className="flex items-center p-2 bg-yellow-50 rounded-lg mb-2">
            <div className="h-8 w-8 bg-yellow-200 text-yellow-700 rounded-full flex items-center justify-center mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Swap request: Data Structures and Algorithms</p>
              <p className="text-xs text-gray-500">Pending since May 5, 2024</p>
            </div>
          </div>
          <div className="text-right">
            <Link to="/transactions" className="text-sm text-blue-600 hover:underline">View all transactions</Link>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">{ALI_PROFILE.username}'s Listed Books</h2>
        {
          ALI_BOOKS.length === 0 ? (
            <p className="text-gray-500">{ALI_PROFILE.username} has no books listed currently.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ALI_BOOKS.map(book => (
                <div key={book.id} className="bg-gray-50 rounded-lg shadow-sm overflow-hidden flex">
                  <div className="w-24 h-32 bg-gray-200 flex-shrink-0">
                    {book.cover ? (
                      <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">No Image</div>
                    )}
                  </div>
                  <div className="p-3 flex-grow">
                    <h3 className="font-medium text-lg mb-1">{book.title}</h3>
                    <p className="text-sm text-gray-600">by {book.author}</p>
                    <p className="text-sm text-gray-600">Condition: {book.condition}</p>
                    {book.bookType === 'For Sale' && <p className="text-sm text-green-600 font-semibold">${book.price.toFixed(2)}</p>}
                    {book.bookType === 'For Swap' && <p className="text-sm text-blue-600 font-semibold">Swap For: {book.exchange}</p>}
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  );
};

export default AliProfilePage;
