import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useMessage } from '../../contexts/useMessage';

const RequestActions = ({ message, onStatusChange }) => {
  const { user } = useAuth();
  const { updateRequestStatus, getTransactionID } = useMessage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transactionRef, setTransactionRef] = useState(null);

  // Only show actions to the seller (receiver) and only for pending requests
  const isUserReceiver = message.receiverId === user?.id;
  const isPending = message.requestStatus === 'pending';
  const shouldShowActions = isUserReceiver && isPending;

  // Find the corresponding transaction ID based on message properties
  useEffect(() => {
    if (message) {
      const transactionId = getTransactionID(message.messageType, message.chatId);
      setTransactionRef(transactionId);
      
      // Log for debugging
      if (transactionId) {
        console.log(`RequestActions: Message ${message.id} (${message.messageType}) mapped to transaction ${transactionId}`);
      } else {
        console.error(`RequestActions: No transaction mapping found for message ${message.id} (chatId: ${message.chatId}, type: ${message.messageType})`);
      }
    }
  }, [message, getTransactionID]);

  if (!shouldShowActions) return null;

  const handleAction = async (newStatus) => {
    try {
      setLoading(true);
      setError(null);

      // Update request status in messaging system
      const success = await updateRequestStatus(message.id, newStatus);
      
      if (success) {
        // Call the callback to update the message in the UI
        if (onStatusChange) {
          onStatusChange(message.id, newStatus);
        }
        
        // Also update the transaction status if we have a reference
        if (transactionRef) {
          // In a real app, this would be an API call
          // For demonstration, we'll log it with detailed information
          console.log(`RequestActions: Updating transaction ${transactionRef} to ${newStatus === 'accepted' ? 'scheduled' : 'cancelled'}`);
          console.log(`RequestActions: Details - messageType: ${message.messageType}, chatId: ${message.chatId}`);
          
          // Here we would typically call a transaction service or API
          // For example:
          // await transactionAPI.updateTransactionStatus(transactionRef, newStatus === 'accepted' ? 'scheduled' : 'cancelled');
          
          // Create and dispatch a custom event to notify the TransactionsPage with enhanced details
          const transactionEvent = new CustomEvent('transaction-update', {
            detail: {
              transactionId: transactionRef,
              action: newStatus === 'accepted' ? 'accept' : 'decline',
              messageId: message.id,
              chatId: message.chatId,
              senderId: message.senderId,
              receiverId: message.receiverId,
              bookId: message.bookId,
              price: message.price,
              text: message.text,
              swapOfferId: message.swapOfferId,
              timestamp: new Date().toISOString(),
              transactionType: message.messageType === 'swap_offer' ? 'swap' : 'purchase'
            },
            bubbles: true
          });
          document.dispatchEvent(transactionEvent);
          
          console.log(`RequestActions: Event dispatched for transaction ${transactionRef} with action ${newStatus}`);
        } else {
          console.error('RequestActions: No transaction reference found for this message', message);
        }
      }
    } catch (err) {
      console.error('Error updating request status:', err);
      setError('Failed to update request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 pt-2 border-t border-gray-200">
      <div className="flex flex-col space-y-2">
        {error && (
          <div className="text-red-500 text-xs mb-2">
            {error}
          </div>
        )}

        <div className="flex justify-between space-x-2">
          <button
            onClick={() => handleAction('accepted')}
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-1 px-4 rounded text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Accept Request'}
          </button>
          
          <button
            onClick={() => handleAction('declined')}
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1 px-4 rounded text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Decline Request'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestActions;
