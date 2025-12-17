import React, { useState } from 'react';
import { LifeBuoy, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NewTicketModal from './NewTicketModal';

export interface TicketContext {
  objectType: 'Module' | 'Section' | 'Lesson' | 'Assessment';
  objectId: string;
  moduleId?: string;
  sectionId?: string;
  title?: string;
}

interface TicketButtonProps {
  context: TicketContext;
  className?: string;
  variant?: 'button' | 'floating' | 'inline';
  useNavigation?: boolean; // New prop to control navigation vs modal
}

const TicketButton: React.FC<TicketButtonProps> = ({ 
  context, 
  className = '', 
  variant = 'button',
  useNavigation = false
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleClick = () => {
    if (useNavigation) {
      navigate('/tickets/new');
    } else {
      setIsModalOpen(true);
    }
  };

  const getButtonStyles = () => {
    switch (variant) {
      case 'floating':
        return 'fixed bottom-6 right-6 bg-red-600 hover:bg-red-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl z-50';
      case 'inline':
        return 'inline-flex items-center gap-2 text-gray-600 hover:text-gray-700 font-medium';
      default:
        return 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium inline-flex items-center gap-2';
    }
  };

  const getContent = () => {
    switch (variant) {
      case 'floating':
        return <LifeBuoy className="w-6 h-6" />;
      case 'inline':
        return (
          <>
            <LifeBuoy className="w-4 h-4" />
            Need Help?
          </>
        );
      default:
        return (
          <>
            <Plus className="w-4 h-4" />
            {useNavigation ? 'New' : 'Report Issue'}
          </>
        );
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`${getButtonStyles()} transition-all duration-200 ${className}`}
        title="Report an issue or get help"
      >
        {getContent()}
      </button>

      {!useNavigation && (
        <NewTicketModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          context={context}
        />
      )}
    </>
  );
};

export default TicketButton;
