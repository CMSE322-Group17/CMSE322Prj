import { Link } from 'react-router-dom';

const ChatHeader = ({ 
  bookData, 
  otherUserData, 
  loading = false 
}) => {
  if (loading) {
    return (
      <div className="bg-white border-b border-gray-200 p-3 flex items-center">
        <div className="flex-grow">
          <div className="animate-pulse flex space-x-4 items-center">
            <div className="rounded-full bg-gray-200 h-10 w-10"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-b border-gray-200 p-3 flex items-center">
      <button 
        onClick={onBack}
        className="mr-2 text-gray-500 hover:text-gray-700 focus:outline-none"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>
      
      <div className="flex items-center flex-grow">
        {/* User info */}
        <div className="flex items-center mr-4">
          {otherUserData?.avatar ? (
            <img 
              src={otherUserData.avatar} 
              alt={otherUserData.username}
              className="w-10 h-10 rounded-full mr-3 object-cover" 
            />
          ) : (
            <div className="w-10 h-10 bg-blue-100 rounded-full mr-3 flex items-center justify-center text-blue-600 font-semibold">
              {otherUserData?.username ? otherUserData.username.charAt(0).toUpperCase() : '?'}
            </div>
          )}
          
          <div>
            <h3 className="font-medium text-gray-800">{otherUserData?.username || 'User'}</h3>
            <p className="text-xs text-gray-500">
              {otherUserData?.isOnline ? 'Online' : 'Last seen recently'}
            </p>
          </div>
        </div>
        
        {/* Book info (if available) */}
        {bookData && (
          <div className="ml-auto flex items-center">
            <div className="mr-3">
              <p className="text-sm text-gray-600">Discussing:</p>
              <p className="text-sm font-medium">
                <Link 
                  to={`/book/${bookData.id}`} 
                  className="text-blue-600 hover:text-blue-800 truncate max-w-[150px] inline-block align-middle"
                >
                  {bookData.title}
                </Link>
              </p>
            </div>
            
            <div className="w-12 h-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
              {bookData.cover ? (
                <img 
                  src={bookData.cover} 
                  alt={bookData.title}
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/100x140?text=No+Cover';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                  <span className="text-gray-500 text-xs">No cover</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;