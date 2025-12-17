import React, { useState } from 'react';
import { X, Forward, Send, Mail, Plus, Trash2 } from 'lucide-react';

interface ForwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
  ticketTitle: string;
  ticketDescription: string;
  customerName: string;
  customerEmail: string;
  priority: string;
  status: string;
}

const ForwardModal: React.FC<ForwardModalProps> = ({
  isOpen,
  onClose,
  ticketId,
  ticketTitle,
  ticketDescription,
  customerName,
  customerEmail,
  priority,
  status
}) => {
  const [emailAddresses, setEmailAddresses] = useState<string[]>(['']);
  const [subject, setSubject] = useState(`Fw: ${ticketTitle} [Ticket #${ticketId}]`);
  const [message, setMessage] = useState('');
  const [includeTicketDetails, setIncludeTicketDetails] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const addEmailField = () => {
    setEmailAddresses([...emailAddresses, '']);
  };

  const removeEmailField = (index: number) => {
    if (emailAddresses.length > 1) {
      setEmailAddresses(emailAddresses.filter((_, i) => i !== index));
    }
  };

  const updateEmailAddress = (index: number, value: string) => {
    const updatedEmails = [...emailAddresses];
    updatedEmails[index] = value;
    setEmailAddresses(updatedEmails);
  };

  const getTicketDetailsText = () => {
    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TICKET DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ticket ID: #${ticketId}
Title: ${ticketTitle}
Status: ${status}
Priority: ${priority}
Customer: ${customerName} (${customerEmail})

Description:
${ticketDescription}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validEmails = emailAddresses.filter(email => email.trim() && email.includes('@'));
    
    if (validEmails.length === 0) {
      alert('Please enter at least one valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      const emailContent = includeTicketDetails 
        ? `${message}\n\n${getTicketDetailsText()}`
        : message;

      // Here you would call your email API
      const forwardData = {
        ticketId,
        recipients: validEmails,
        subject,
        message: emailContent,
        includeTicketDetails
      };

      // Mock API call - replace with actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Forwarding ticket:', forwardData);
      
      // Show success message
      alert(`Ticket forwarded successfully to ${validEmails.length} recipient(s)!`);
      
      onClose();
    } catch (error) {
      console.error('Failed to forward ticket:', error);
      alert('Failed to forward ticket. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Forward className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Forward Ticket</h2>
              <p className="text-sm text-gray-600">Share ticket details via email</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Email Recipients */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Recipients <span className="text-gray-500">*</span>
              </label>
              <div className="space-y-2">
                {emailAddresses.map((email, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="flex-1 relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => updateEmailAddress(index, e.target.value)}
                        placeholder="Enter email address"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    {emailAddresses.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEmailField(index)}
                        className="p-2 text-gray-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addEmailField}
                  className="flex items-center px-3 py-2 text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Email
                </button>
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject <span className="text-gray-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add your message here (optional)..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Include Ticket Details Option */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="includeDetails"
                checked={includeTicketDetails}
                onChange={(e) => setIncludeTicketDetails(e.target.checked)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="includeDetails" className="text-sm font-medium text-gray-700">
                Include ticket details in email
              </label>
            </div>

            {/* Preview */}
            {includeTicketDetails && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Email Preview</h4>
                <div className="bg-gray-50 rounded-lg p-4 border text-sm">
                  <div className="space-y-2 mb-4">
                    <div><strong>To:</strong> {emailAddresses.filter(e => e.trim()).join(', ')}</div>
                    <div><strong>Subject:</strong> {subject}</div>
                  </div>
                  <div className="border-t pt-4">
                    {message && (
                      <div className="mb-4">
                        <div className="whitespace-pre-wrap">{message}</div>
                      </div>
                    )}
                    <div className="text-xs bg-white p-3 rounded border font-mono whitespace-pre-line">
                      {getTicketDetailsText()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Warning Box */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <Forward className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-green-800">Forward Ticket</h4>
                  <p className="text-xs text-green-700">
                    This will send the ticket details to the specified email addresses. 
                    The recipients will receive a copy of the ticket information but will not have access to the ticketing system.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4 mr-2" />
              {isLoading ? 'Forwarding...' : 'Forward Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForwardModal;
