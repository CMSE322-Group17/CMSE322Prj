import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const TransactionsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pending');

  // Hardcoded transaction data aligned with the message conversations
  const hardcodedTransactions = {
    // Pending transactions that require user action (aligned with message swap requests)
    pending: [
      {
        id: 'pending-swap-1',
        type: 'swap-request',
        requestId: 'swapOffer123',
        messageId: 11,
        chatId: '2_1_303',
        date: '2024-05-22T10:00:00Z',
        status: 'pending',
        fromUser: {
          id: 2,
          username: 'nima',
          profileLink: '/nima-profile'
        },
        requestedBook: {
          id: 303,
          title: 'Linear Algebra',
          author: 'Gilbert Strang'
        },
        offeredBooks: [
          {
            id: 304,
            title: 'Calculus I',
            author: 'James Stewart'
          }
        ],
        notes: 'Nima has requested to swap Linear Algebra for Calculus I.',
        actions: ['accept', 'decline']
      },
      {
        id: 'pending-swap-2',
        type: 'swap-request',
        requestId: 'swapOffer456',
        messageId: 17,
        chatId: '3_1_707',
        date: '2024-05-05T11:20:00Z',
        status: 'pending',
        fromUser: {
          id: 3,
          username: 'ali',
          profileLink: '/ali-profile'
        },
        requestedBook: {
          id: 707,
          title: 'Python for Data Science',
          author: 'Jake VanderPlas'
        },
        offeredBooks: [
          {
            id: 708,
            title: 'Data Structures and Algorithms',
            author: 'Robert Lafore'
          }
        ],
        notes: 'Ali has requested to swap your Python for Data Science book.',
        actions: ['accept', 'decline']
      }
    ],

    // Completed transactions (both purchases and swaps)
    completed: [
      {
        id: 'completed-purchase-1',
        type: 'purchase',
        orderId: 'ORD-2024-101',
        chatId: '1_3_202',
        date: '2024-05-20T16:30:00Z',
        status: 'completed',
        amount: 40.00,
        buyer: {
          id: 3,
          username: 'ali',
          profileLink: '/ali-profile'
        },
        seller: {
          id: 1,
          username: 'emad'
        },
        book: {
          id: 202,
          title: 'Discrete Math',
          author: 'Kenneth Rosen',
          price: 40.00
        },
        meetupLocation: 'Campus Cafe',
        meetupDate: '2024-05-21T15:00:00Z',
        notes: 'Transaction successfully completed with Ali'
      },
      {
        id: 'completed-swap-1',
        type: 'swap',
        swapId: 'SWAP-2024-101',
        chatId: '1_2_101',
        date: '2024-05-01T14:00:00Z',
        status: 'completed',
        participants: [
          {
            id: 1,
            username: 'emad',
            providedBook: {
              id: 101,
              title: 'Intro to Algorithms',
              author: 'Thomas H. Cormen'
            }
          },
          {
            id: 2,
            username: 'nima',
            profileLink: '/nima-profile',
            providedBook: {
              id: 102,
              title: 'Operating Systems',
              author: 'Andrew S. Tanenbaum'
            }
          }
        ],
        meetupLocation: 'Campus Library',
        meetupDate: '2024-05-01T14:00:00Z',
        notes: 'Books successfully swapped with Nima'
      }
    ],

    // Scheduled transactions (accepted but not yet completed)
    scheduled: [
      {
        id: 'scheduled-purchase-1',
        type: 'purchase',
        orderId: 'ORD-2024-102',
        chatId: '1_4_404',
        date: '2024-05-18T09:20:00Z',
        status: 'scheduled',
        scheduledFor: '2024-05-25T13:00:00Z',
        amount: 25.00,
        buyer: {
          id: 4,
          username: 'sara'
        },
        seller: {
          id: 1,
          username: 'emad'
        },
        book: {
          id: 404,
          title: 'Machine Learning Basics',
          author: 'Kevin P. Murphy',
          price: 25.00
        },
        meetupLocation: 'Student Center',
        meetupDate: '2024-05-25T13:00:00Z',
        notes: 'Sara will pick up the book on Saturday'
      },
      {
        id: 'scheduled-swap-1',
        type: 'swap',
        swapId: 'SWAP-2024-102',
        chatId: '1_7_808',
        date: '2024-05-03T10:00:00Z',
        status: 'scheduled',
        scheduledFor: '2024-05-27T11:30:00Z',
        participants: [
          {
            id: 1,
            username: 'emad',
            providedBook: {
              id: 808,
              title: 'Operating Systems',
              author: 'Andrew S. Tanenbaum'
            }
          },
          {
            id: 7,
            username: 'alex',
            providedBook: {
              id: 809,
              title: 'Computer Networks',
              author: 'James F. Kurose'
            }
          }
        ],
        meetupLocation: 'Engineering Building',
        meetupDate: '2024-05-27T11:30:00Z',
        notes: 'Meeting Alex on Monday for the book swap'
      }
    ],
    
    // Cancelled transactions (declined or cancelled after accepting)
    cancelled: [
      {
        id: 'cancelled-purchase-1',
        type: 'purchase',
        orderId: 'ORD-2024-103',
        chatId: '1_5_505',
        date: '2024-05-15T11:30:00Z',
        status: 'cancelled',
        cancelledOn: '2024-05-15T14:45:00Z',
        amount: 35.00,
        buyer: {
          id: 5,
          username: 'john'
        },
        seller: {
          id: 1,
          username: 'emad'
        },
        book: {
          id: 505,
          title: 'Artificial Intelligence',
          author: 'Stuart Russell',
          price: 35.00
        },
        cancellationReason: 'Buyer found another copy',
        notes: 'John cancelled the order after finding a cheaper copy'
      },
      {
        id: 'declined-swap-1',
        type: 'swap',
        swapId: 'SWAP-2024-103',
        chatId: '1_6_606',
        date: '2024-05-10T14:20:00Z',
        status: 'declined',
        declinedOn: '2024-05-10T16:30:00Z',
        participants: [
          {
            id: 6,
            username: 'mia',
            requestedBook: {
              id: 606,
              title: 'Database Systems',
              author: 'Hector Garcia-Molina'
            }
          },
          {
            id: 1,
            username: 'emad',
            offeredBook: {
              id: 607,
              title: 'Web Development',
              author: 'Jon Duckett'
            }
          }
        ],
        declineReason: 'Not interested in the offered book',
        notes: 'Mia wasn\'t interested in the Web Development book'
      }
    ]
  };

  // Handle accept transaction
  const handleAcceptTransaction = (transactionId) => {
    // In a real app, this would update the backend
    console.log(`Accepting transaction: ${transactionId}`);
    alert('Transaction accepted! In a real app, this would update the status and notify the other user.');
  };

  // Handle decline transaction
  const handleDeclineTransaction = (transactionId) => {
    // In a real app, this would update the backend
    console.log(`Declining transaction: ${transactionId}`);
    alert('Transaction declined! In a real app, this would update the status and notify the other user.');
  };

  // Function to format dates consistently
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <div className="flex space-x-4">
          <Link to="/messages" className="text-blue-600 hover:text-blue-800">
            Messages
          </Link>
          <Link to="/dashboard" className="text-blue-600 hover:text-blue-800">
            Dashboard
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('pending')}
              className={`mr-8 py-4 px-1 ${
                activeTab === 'pending'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending ({hardcodedTransactions.pending.length})
            </button>
            <button
              onClick={() => setActiveTab('scheduled')}
              className={`mr-8 py-4 px-1 ${
                activeTab === 'scheduled'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Scheduled ({hardcodedTransactions.scheduled.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`mr-8 py-4 px-1 ${
                activeTab === 'completed'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Completed ({hardcodedTransactions.completed.length})
            </button>
            <button
              onClick={() => setActiveTab('cancelled')}
              className={`mr-8 py-4 px-1 ${
                activeTab === 'cancelled'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Cancelled ({hardcodedTransactions.cancelled.length})
            </button>
          </nav>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Pending Transactions */}
        {activeTab === 'pending' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Pending Actions</h2>
            {hardcodedTransactions.pending.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500">No pending actions</p>
              </div>
            ) : (
              <div className="space-y-4">
                {hardcodedTransactions.pending.map(transaction => (
                  <div key={transaction.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <div>
                        <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 mr-2">
                          {transaction.type === 'swap-request' ? 'Swap Request' : 'Purchase Request'}
                        </span>
                        <span className="text-gray-600 text-sm">
                          {formatDate(transaction.date)}
                        </span>
                      </div>
                      <div>
                        <Link 
                          to={`/messages?user=${transaction.fromUser.username}&message=${transaction.messageId}`}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          View Conversation
                        </Link>
                      </div>
                    </div>
                    
                    <div className="flex items-start mb-3">
                      <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                        {transaction.fromUser.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">
                          {transaction.fromUser.profileLink ? (
                            <Link to={transaction.fromUser.profileLink} className="text-blue-600 hover:underline">
                              {transaction.fromUser.username}
                            </Link>
                          ) : (
                            transaction.fromUser.username
                          )}
                        </div>
                        <p className="text-gray-600 text-sm">{transaction.notes}</p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded mb-3">
                      {transaction.type === 'swap-request' && (
                        <>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Requesting:</span>
                            <span className="text-sm font-medium text-gray-700">Offering:</span>
                          </div>
                          <div className="flex">
                            <div className="w-1/2 pr-2">
                              <div className="bg-white p-2 rounded border border-gray-200">
                                <p className="font-medium">{transaction.requestedBook.title}</p>
                                <p className="text-sm text-gray-600">{transaction.requestedBook.author}</p>
                              </div>
                            </div>
                            <div className="w-1/2 pl-2">
                              {transaction.offeredBooks.map(book => (
                                <div key={book.id} className="bg-white p-2 rounded border border-gray-200">
                                  <p className="font-medium">{book.title}</p>
                                  <p className="text-sm text-gray-600">{book.author}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <button 
                        onClick={() => handleDeclineTransaction(transaction.id)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        Decline
                      </button>
                      <button 
                        onClick={() => handleAcceptTransaction(transaction.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Scheduled Transactions */}
        {activeTab === 'scheduled' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Upcoming Transactions</h2>
            {hardcodedTransactions.scheduled.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500">No upcoming transactions</p>
              </div>
            ) : (
              <div className="space-y-4">
                {hardcodedTransactions.scheduled.map(transaction => (
                  <div key={transaction.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <div>
                        <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 mr-2">
                          {transaction.type === 'swap' ? 'Book Swap' : 'Book Purchase'}
                        </span>
                        <span className="text-gray-600 text-sm">
                          Scheduled for: {formatDate(transaction.scheduledFor)}
                        </span>
                      </div>
                      <div>
                        {transaction.chatId && (
                          <Link 
                            to={`/messages?user=${transaction.type === 'swap' ? 
                              transaction.participants.find(p => p.username !== 'emad')?.username : 
                              transaction.type === 'purchase' ? 
                                transaction.seller.id === user.id ? transaction.buyer.username : transaction.seller.username : 
                                ''}`}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            View Conversation
                          </Link>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-3">
                      <div className="flex">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-700 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        <span className="text-yellow-700 font-medium">
                          Meeting at {transaction.meetupLocation} on {new Date(transaction.meetupDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    {transaction.type === 'purchase' && (
                      <div className="mb-3">
                        <p className="font-medium">{transaction.book.title}</p>
                        <p className="text-sm text-gray-600">by {transaction.book.author}</p>
                        <p className="text-sm font-medium text-green-600">Price: ${transaction.book.price.toFixed(2)}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {transaction.seller.id === user.id ? 
                            `Buyer: ${transaction.buyer.username}` : 
                            `Seller: ${transaction.seller.username}`}
                        </p>
                      </div>
                    )}
                    
                    {transaction.type === 'swap' && (
                      <div className="mb-3">
                        {transaction.participants.map((participant, index) => (
                          <div key={participant.id} className={index === 0 ? 'mb-2' : ''}>
                            <p className="text-sm font-medium">
                              {participant.username === user.username ? 'You' : participant.username} 
                              {' '}provides:
                            </p>
                            <div className="bg-white p-2 rounded border border-gray-200 mt-1">
                              <p className="font-medium">{participant.providedBook.title}</p>
                              <p className="text-sm text-gray-600">by {participant.providedBook.author}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {transaction.notes && (
                      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        <span className="font-medium">Notes:</span> {transaction.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Completed Transactions */}
        {activeTab === 'completed' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Completed Transactions</h2>
            {hardcodedTransactions.completed.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500">No completed transactions</p>
              </div>
            ) : (
              <div className="space-y-4">
                {hardcodedTransactions.completed.map(transaction => (
                  <div key={transaction.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <div>
                        <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 mr-2">
                          {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                        </span>
                        <span className="text-gray-600 text-sm">
                          Completed on: {formatDate(transaction.date)}
                        </span>
                      </div>
                      <div>
                        <span className="inline-block px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                          Completed
                        </span>
                      </div>
                    </div>
                    
                    {transaction.type === 'purchase' && (
                      <div>
                        <div className="mb-3">
                          <p className="font-medium">{transaction.book.title}</p>
                          <p className="text-sm text-gray-600">by {transaction.book.author}</p>
                          <p className="text-sm font-medium text-green-600">Price: ${transaction.book.price.toFixed(2)}</p>
                        </div>
                        
                        <div className="flex items-center mb-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                            {transaction.buyer.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">
                              Transaction between you and {' '}
                              {transaction.buyer.profileLink ? (
                                <Link to={transaction.buyer.profileLink} className="text-blue-600 hover:underline">
                                  {transaction.buyer.username}
                                </Link>
                              ) : (
                                transaction.buyer.username
                              )}
                            </p>
                            <p className="text-xs text-gray-500">
                              Met at {transaction.meetupLocation} on {new Date(transaction.meetupDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {transaction.type === 'swap' && (
                      <div>
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          {transaction.participants.map((participant) => (
                            <div key={participant.id} className="border border-gray-200 p-3 rounded bg-gray-50">
                              <div className="flex items-center mb-2">
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                                  {participant.username.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  {participant.profileLink ? (
                                    <Link to={participant.profileLink} className="text-blue-600 hover:underline">
                                      {participant.username}
                                    </Link>
                                  ) : (
                                    participant.username
                                  )}
                                </div>
                              </div>
                              <div className="bg-white p-2 rounded border border-gray-200">
                                <p className="font-medium">{participant.providedBook.title}</p>
                                <p className="text-sm text-gray-600">by {participant.providedBook.author}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500">
                          Swapped at {transaction.meetupLocation} on {new Date(transaction.meetupDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    
                    {transaction.notes && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Notes:</span> {transaction.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Cancelled Transactions */}
        {activeTab === 'cancelled' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Cancelled Transactions</h2>
            {hardcodedTransactions.cancelled.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <p className="text-gray-500">No cancelled transactions</p>
              </div>
            ) : (
              <div className="space-y-4">
                {hardcodedTransactions.cancelled.map(transaction => (
                  <div key={transaction.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <div>
                        <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 mr-2">
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </span>
                        <span className="text-gray-600 text-sm">
                          {transaction.status === 'cancelled' ? 'Cancelled' : 'Declined'} on: {formatDate(transaction.cancelledOn || transaction.declinedOn)}
                        </span>
                      </div>
                    </div>
                    
                    {transaction.type === 'purchase' && (
                      <div className="mb-3">
                        <p className="font-medium">{transaction.book.title}</p>
                        <p className="text-sm text-gray-600">by {transaction.book.author}</p>
                        <p className="text-sm font-medium text-gray-600">Price: ${transaction.book.price.toFixed(2)}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {transaction.buyer.id === user.id ? 
                            `Seller: ${transaction.seller.username}` : 
                            `Buyer: ${transaction.buyer.username}`}
                        </p>
                      </div>
                    )}
                    
                    {transaction.type === 'swap' && (
                      <div className="mb-3">
                        <div className="flex gap-4 mb-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium">Requested:</p>
                            <div className="bg-white p-2 rounded border border-gray-200 mt-1">
                              <p className="font-medium">{transaction.participants[0].requestedBook.title}</p>
                              <p className="text-sm text-gray-600">by {transaction.participants[0].requestedBook.author}</p>
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Offered:</p>
                            <div className="bg-white p-2 rounded border border-gray-200 mt-1">
                              <p className="font-medium">{transaction.participants[1].offeredBook.title}</p>
                              <p className="text-sm text-gray-600">by {transaction.participants[1].offeredBook.author}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-red-50 border-l-4 border-red-400 p-3">
                      <p className="text-red-700 text-sm">
                        <span className="font-medium">Reason:</span> {transaction.cancellationReason || transaction.declineReason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsPage;
