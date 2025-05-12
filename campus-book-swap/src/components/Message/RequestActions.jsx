import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useMessage } from '../../contexts/useMessage';

const RequestActions = ({ message, onStatusChange }) => {
  const { user } = useAuth();
  const { updateRequestStatus } = useMessage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Only show actions to the seller (receiver) and only for pending requests
  const isUserReceiver = message.receiverId === user?.id;
  const isPending = message.requestStatus === 'pending';
  const shouldShowActions = isUserReceiver && isPending;

  if (!shouldShowActions) return null;

  const handleAction = async (newStatus) => {
    try {
      setLoading(true);
      setError(null);

      const success = await updateRequestStatus(message.id, newStatus);
      
      if (success && onStatusChange) {
        onStatusChange(message.id, newStatus);
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
