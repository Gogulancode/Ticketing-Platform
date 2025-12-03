import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_CONFIG } from '../../../config/api';

/**
 * Component that redirects from a public ticket ID to the actual ticket detail page.
 * Route: /tickets/by-public-id/:publicId
 * Redirects to: /tickets/:ticketGuid
 */
const TicketPublicIdRedirect: React.FC = () => {
  const { publicId } = useParams<{ publicId: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const lookupTicket = async () => {
      if (!publicId) {
        setError('No ticket ID provided');
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${API_CONFIG.BASE_URL}/tickets-v2/by-public-id/${publicId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            setError(`Ticket #${publicId} not found`);
          } else {
            setError('Failed to lookup ticket');
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        
        if (data.id) {
          // Redirect to the actual ticket detail page
          navigate(`/tickets/${data.id}`, { replace: true });
        } else {
          setError('Ticket ID not found in response');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error looking up ticket:', err);
        setError('Error looking up ticket');
        setLoading(false);
      }
    };

    lookupTicket();
  }, [publicId, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Looking up ticket #{publicId}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/tickets/my')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Back to Tickets
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default TicketPublicIdRedirect;
