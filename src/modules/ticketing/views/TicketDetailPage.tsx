import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { apiFetch } from '../../../utils/apiFetch';
import { getCurrentUser } from '../../../shared/services/api/auth';
import {
  ArrowLeft,
  AlertCircle,
  Send,
  X,
  Forward,
  StickyNote,
  XCircle,
  GitMerge,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Paperclip
} from 'lucide-react';

// Import components
import TicketProperties from '../components/tickets/detail/TicketProperties';
import TicketComments from '../components/tickets/detail/TicketComments';
import AddNote from '../components/tickets/detail/AddNote';
import AssignmentModal from '../components/tickets/detail/AssignmentModal';
import MergeModal from '../components/tickets/detail/MergeModal';
import ForwardHistory from '../components/tickets/detail/ForwardHistory';
import { getDisplayTicketNumber, type TicketWithPublicId } from '../utils/ticketNumber';

// Import APIs and types
import {
  ticketsApi,
  type TicketCollaborator,
  type TicketAttachment
} from '../services/ticketsApi';
import { ticketsV2Api } from '../services/ticketsV2Api';
import { settingsApi } from "../../../shared/services/api/settingsApi";
import { settingsApi as apiSettingsApi } from "../../../api/settingsApi";
import { mockSettingsApi } from '../../../services/mockSettingsApi';
import { API_CONFIG } from '../../../config/api';
import { formatTicketDateTime } from '../../../shared/utils/dateUtils';

// Use IST Date formatting utility
const formatDate = formatTicketDateTime;

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unexpected error';
};


const TicketDetailPage: React.FC = () => {
  // React hooks
  const navigate = useNavigate();
  const location = useLocation();
  
  // Parse URL query parameters for actions like reopen
  const searchParams = new URLSearchParams(location.search);
  const actionParam = searchParams.get('action');
  
  // Determine where to navigate back - default to /tickets/my (ticket list)
  // If coming from dashboard (/tickets), use that instead
  const backUrl = location.state?.from || '/tickets/my';
  
  // User role state - determines what features are visible
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAgent, setIsAgent] = useState(false);
  
  // Sidebar state - open by default
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Add note modal state
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  
  // Collaborators state
  const [showCollaboratorsModal, setShowCollaboratorsModal] = useState(false);
  const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>([]);

  // Load user role on mount
  useEffect(() => {
    const loadUserRole = async () => {
      try {
        const currentUser = await getCurrentUser();
        const adminRoles = ['Admin', 'SuperAdmin', 'Administrator'];
        const singleRole = (currentUser.role || '').toString().toLowerCase();
        const roles = Array.isArray(currentUser.roles)
          ? currentUser.roles
              .map((role: unknown) => {
                if (!role) return '';
                if (typeof role === 'string') return role;
                if (typeof role === 'object' && role !== null && 'name' in role && typeof (role as { name: unknown }).name === 'string') {
                  return (role as { name: string }).name;
                }
                return String(role);
              })
              .filter(Boolean)
          : [];
        const normalizedRoles = roles.map((role: string) => role.toLowerCase());
        
        const userIsAdmin = adminRoles.some(role => 
          singleRole.includes(role.toLowerCase()) || normalizedRoles.some((r: string) => r.includes(role.toLowerCase()))
        );
        setIsAdmin(userIsAdmin);

        const userIsAgent = Boolean(
          currentUser.isAgent ||
          singleRole.includes('agent') ||
          normalizedRoles.some((role: string) => role.includes('agent'))
        );
        setIsAgent(userIsAgent);
      } catch {
        console.warn('⚠️ Could not fetch user info for role check');
        // Default to non-admin/non-agent for safety
        setIsAdmin(false);
        setIsAgent(false);
      }
    };
    loadUserRole();
  }, []);

  // Check if user has admin/agent privileges
  const hasAdminPrivileges = isAdmin || isAgent;

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    toast.loading('Adding note...');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/tickets-v2/${id}/comments`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ Content: noteContent, IsInternal: true })  // Changed to PascalCase
      });
      if (!response.ok) throw new Error('Failed to add note');
      toast.success('Note added');
      setShowNoteModal(false);
      setNoteContent('');
      refetchTicket();
    } catch (err: unknown) {
      toast.error(`Failed to add note: ${getErrorMessage(err)}`);
    } finally {
      toast.dismiss();
    }
  };
  // Reopen ticket handler
  const handleReopenTicket = async () => {
    toast.loading('Reopening ticket...');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/tickets-v2/${id}/reopen`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔄 Reopen failed:', errorText);
        throw new Error(errorText || 'Failed to reopen ticket');
      }
      toast.success('Ticket reopened');
      refetchTicket();
    } catch (err: unknown) {
      console.error('🔄 Reopen error:', err);
      toast.error(`Failed to reopen ticket: ${getErrorMessage(err)}`);
    } finally {
      toast.dismiss();
    }
  };
  // Close ticket handler
  const handleCloseTicket = async () => {
    toast.loading('Closing ticket...');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/tickets-v2/${id}/close`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Close failed:', errorText);
        throw new Error(errorText || 'Failed to close ticket');
      }
      toast.success('Ticket closed');
      refetchTicket();
    } catch (err: unknown) {
      console.error('❌ Close error:', err);
      toast.error(`Failed to close ticket: ${getErrorMessage(err)}`);
    } finally {
      toast.dismiss();
    }
  };

  // Delete ticket handler
  const handleDeleteTicket = async () => {
    const reason = window.prompt('Please provide a reason for deleting this ticket:');
    if (reason === null) return; // User cancelled
    
    if (!reason.trim()) {
      toast.error('Please provide a reason for deletion');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) return;
    
    toast.loading('Deleting ticket...');
    try {
      const token = localStorage.getItem('token');
      const response = await apiFetch(`${API_CONFIG.BASE_URL}/tickets-v2/${id}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ Reason: reason.trim() })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🗑️ Delete failed with response:', errorText);
        throw new Error(`Failed to delete ticket (${response.status}): ${errorText}`);
      }
      
      toast.success('Ticket deleted');
      navigate('/tickets');
    } catch (err: unknown) {
      console.error('🗑️ Delete error:', err);
      toast.error(`Failed to delete ticket: ${getErrorMessage(err)}`);
    } finally {
      toast.dismiss();
    }
  };

  // Merge tickets handler - opens modal
  const handleMergeTickets = () => {
    setShowMergeModal(true);
  };

  // Collaborator handlers
  const handleAddCollaborators = async () => {
    if (selectedCollaborators.length === 0) {
      toast.error('Please select at least one collaborator');
      return;
    }

    toast.loading('Adding collaborators...');
    try {
      // Add each selected collaborator
      for (const userId of selectedCollaborators) {
        await ticketsApi.addCollaborator(id!, userId);
      }
      
      toast.success(`Added ${selectedCollaborators.length} collaborator(s)`);
      setSelectedCollaborators([]);
      setShowCollaboratorsModal(false);
      refetchCollaborators();
    } catch (err: unknown) {
      console.error('Error adding collaborators:', err);
      toast.error(`Failed to add collaborators: ${getErrorMessage(err)}`);
    } finally {
      toast.dismiss();
    }
  };

  const handleRemoveCollaborator = async (userId: string) => {
    if (!confirm('Remove this collaborator from the ticket?')) return;

    toast.loading('Removing collaborator...');
    try {
      await ticketsApi.removeCollaborator(id!, userId);
      toast.success('Collaborator removed');
      refetchCollaborators();
    } catch (err: unknown) {
      console.error('Error removing collaborator:', err);
      toast.error(`Failed to remove collaborator: ${getErrorMessage(err)}`);
    } finally {
      toast.dismiss();
    }
  };

  // Handle file attachment for email
  const handleEmailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const newFiles = Array.from(e.target.files);
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    // Validate file types and sizes
    const validFiles = newFiles.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name}: File type not allowed. Only images, PDF, Word, and text files are supported.`);
        return false;
      }
      if (file.size > maxSize) {
        toast.error(`${file.name}: File size exceeds 5MB limit.`);
        return false;
      }
      return true;
    });

    // Check total attachments limit (max 5 files)
    if (emailAttachments.length + validFiles.length > 5) {
      toast.error('Maximum 5 attachments allowed');
      return;
    }

    setEmailAttachments(prev => [...prev, ...validFiles]);
  };

  const removeEmailAttachment = (index: number) => {
    setEmailAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Reply/Forward modal send handler
  const handleSendEmail = async () => {
    if (!emailContent.trim()) {
      toast.error('Please enter email content');
      return;
    }
    
    // For forward emails, we need a recipient email
    if (emailType === 'forward' && !emailTo.trim()) {
      toast.error('Please enter recipient email address');
      return;
    }
    
    toast.loading('Sending email...');
    try {
      const token = localStorage.getItem('token');
      let response;
      
      // Create FormData for multipart request if there are attachments
      if (emailAttachments.length > 0) {
        const formData = new FormData();
        
        if (emailType === 'reply') {
          formData.append('replyMessage', emailContent);
          emailAttachments.forEach((file) => {
            formData.append('attachments', file);
          });
          
          response = await fetch(`${API_CONFIG.BASE_URL}/tickets-v2/${id}/reply-email`, {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });
        } else {
          formData.append('recipientEmail', emailTo);
          formData.append('forwardMessage', emailContent);
          emailAttachments.forEach((file) => {
            formData.append('attachments', file);
          });
          
          response = await fetch(`${API_CONFIG.BASE_URL}/tickets-v2/${id}/forward-email`, {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });
        }
      } else {
        // No attachments - use JSON
        if (emailType === 'reply') {
          response = await fetch(`${API_CONFIG.BASE_URL}/tickets-v2/${id}/reply-email`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              replyMessage: emailContent
            })
          });
        } else if (emailType === 'forward') {
          response = await fetch(`${API_CONFIG.BASE_URL}/tickets-v2/${id}/forward-email`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              recipientEmail: emailTo,
              forwardMessage: emailContent
            })
          });
        } else {
          throw new Error('Invalid email type');
        }
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('📧 Email send failed:', errorText);
        throw new Error(`Failed to send email: ${errorText}`);
      }
      
      toast.success(`Email ${emailType === 'reply' ? 'reply' : 'forwarded'} sent successfully`);
      setShowEmailModal(false);
      setEmailContent('');
      setEmailTo('');
      setEmailAttachments([]);
      refetchTicket();
    } catch (err: unknown) {
      toast.error(`Failed to send email: ${getErrorMessage(err)}`);
    } finally {
      toast.dismiss();
    }
  };
  const { ticketId } = useParams<{ ticketId: string }>();
  const queryClient = useQueryClient();
  const id = ticketId;

  // No mock ticket, only real backend data
  
  // State for modals and UI
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailContent, setEmailContent] = useState('');
  const [emailTo, setEmailTo] = useState('');
  const [emailType, setEmailType] = useState<'reply' | 'forward'>('forward'); // Default to forward (Reply is disabled)
  const [emailAttachments, setEmailAttachments] = useState<File[]>([]);

  // Fetch ticket data with fallback
  const { data: ticket, isLoading: ticketLoading, error: ticketError, refetch: refetchTicket } = useQuery({
    queryKey: ['ticket', id],
    queryFn: async () => {
      try {
        // Try to get specific ticket first - use V2 API for custom fields support
        const result = await ticketsV2Api.getTicket(id!);
        return result;
      } catch (error) {
        console.error('❌ Error fetching specific ticket, trying fallback:', error);
        
        // Fallback: Get all tickets and find the matching one
        try {
          const allTickets = await ticketsApi.getTickets();
          const foundTicket = allTickets.find(t => t.id === id);
          
          if (foundTicket) {
            return foundTicket;
          }
          
          console.error('❌ Ticket not found in tickets list');
          throw new Error(`Ticket with ID ${id} not found`);
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError);
          throw error; // Re-throw original error
        }
      }
    },
    enabled: !!id,
    retry: 1,
    retryDelay: 1000
  });

  // Handle URL action parameter (e.g., ?action=reopen from email link)
  useEffect(() => {
    if (actionParam === 'reopen' && ticket && !ticketLoading) {
      // Check if ticket is in a resolved state (status 4) before auto-reopening
      const ticketStatus = ticket.status ?? ticket.statusId;
      if (ticketStatus === 4) {
        handleReopenTicket();
        // Clear the URL parameter after triggering
        navigate(location.pathname, { replace: true, state: location.state });
      }
    }
  }, [actionParam, ticket, ticketLoading]);

  const { data: agentsData } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      try {
        return await settingsApi.getAgents();
      } catch {
        console.warn('API unavailable, using mock data for agents');
        return await mockSettingsApi.getAgents();
      }
    }
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      try {
        return await settingsApi.getDepartments();
      } catch {
        console.warn('API unavailable, using mock data for departments');
        return await mockSettingsApi.getDepartments();
      }
    }
  });

  // Fetch agent groups to determine which agents can be assigned to this ticket
  const { data: agentGroups } = useQuery({
    queryKey: ['advanced-ticket-groups'],
    queryFn: async () => {
      try {
        return await apiSettingsApi.getAdvancedTicketGroups();
      } catch (error) {
        console.warn('Agent groups API unavailable:', error);
        return [];
      }
    }
  });

  // Fetch ticket collaborators
  const { data: collaborators = [], refetch: refetchCollaborators } = useQuery<TicketCollaborator[]>({
    queryKey: ['collaborators', id],
    queryFn: async () => {
      if (!id) return [];
      try {
        return await ticketsApi.getCollaborators(id);
      } catch (error) {
        console.warn('Collaborators API unavailable:', error);
        return [];
      }
    },
    enabled: !!id
  });

  // Map agents to expected format
  const agents = agentsData?.map(agent => ({
    id: agent.id?.toString() || '',
    userId: agent.userId?.toString() || '',
    name: agent.name || agent.email || agent.userId || agent.id?.toString() || 'Unknown Agent',
    email: agent.email,
    isActive: agent.isActive
  })) || [];

  // Filter agents based on ticket category and subcategory using agent groups
  const getFilteredAgents = () => {
    // If no ticket loaded yet, return empty
    if (!ticket) {
      return [];
    }
    
    // If agent groups haven't loaded yet, return empty (loading state)
    if (!agentGroups) {
      return [];
    }

    // Extract ticket category - handle multiple possible field structures
    const ticketCategoryId = ticket.categoryId || (ticket.category as any)?.id || ticket.category;
    const categoryIdNum = typeof ticketCategoryId === 'number' ? ticketCategoryId : parseInt(ticketCategoryId as string);
    
    // If no category on ticket, return empty
    if (!categoryIdNum || isNaN(categoryIdNum)) {
      return [];
    }

    // Find matching agent groups based on ticket's category and subcategory
    const matchingGroups = agentGroups.filter(group => {
      // Check if group matches ticket's category
      const categoryMatch = group.categoryId === ticketCategoryId || 
                           group.categoryId === categoryIdNum;
      
      // Extract ticket subcategory - handle multiple possible field structures
      const ticketSubcategoryId = ticket.subcategoryId || (ticket.subCategory as any)?.id || ticket.subCategory;
      const subcategoryIdNum = ticketSubcategoryId ? 
        (typeof ticketSubcategoryId === 'number' ? ticketSubcategoryId : parseInt(ticketSubcategoryId as string)) : 
        null;
      
      // More flexible subcategory matching:
      // 1. If ticket has no subcategory, match groups for that category regardless of group subcategory
      // 2. If ticket has subcategory, must match exactly
      // 3. If group has no subcategory restriction, it applies to all subcategories in that category
      const subcategoryMatch = !ticketSubcategoryId || // Ticket has no subcategory 
                              !group.subcategoryId || // Group applies to all subcategories
                              group.subcategoryId === ticketSubcategoryId ||
                              group.subcategoryId === subcategoryIdNum; // Exact match with type conversion
      
      const isMatch = categoryMatch && subcategoryMatch && group.isActive;
      
      return isMatch;
    });

    if (matchingGroups.length === 0) {
      // No matching groups for this category - return empty list
      return [];
    }

    // Get all agent IDs from matching groups
    const allowedAgentIds = new Set<number>();
    matchingGroups.forEach(group => {
      group.assignedAgentIds?.forEach(agentId => allowedAgentIds.add(agentId));
    });

    // Filter agents to only show those in matching groups
    const filteredAgents = agents.filter(agent => {
      // Try multiple ID formats to ensure we match correctly
      const agentIdNumber = parseInt(agent.id);
      const agentUserIdNumber = agent.userId ? parseInt(agent.userId) : null;
      
      return allowedAgentIds.has(agentIdNumber) || 
             (agentUserIdNumber !== null && allowedAgentIds.has(agentUserIdNumber));
    });

    // If matching groups exist but have no agents assigned, return empty
    if (filteredAgents.length === 0 && matchingGroups.length > 0) {
      return [];
    }

    return filteredAgents;
  };

  const filteredAgents = getFilteredAgents();

  // Loading state
  if (ticketLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Use mock data as fallback if API fails
  const finalTicket = (ticket as any) || null;
  const ticketForNumbers = finalTicket as TicketWithPublicId | null;
  const ticketDisplayNumber = getDisplayTicketNumber(ticketForNumbers);
  const ticketNumberForEmails = ticketForNumbers?.publicId && ticketForNumbers.publicId > 0
    ? ticketForNumbers.publicId.toString()
    : ticketDisplayNumber;
  const attachments: TicketAttachment[] = Array.isArray(finalTicket?.attachments)
    ? (finalTicket.attachments as TicketAttachment[])
    : [];

  // Error state - only show if no ticket and no fallback
  if (!finalTicket) {
    console.error('❌ Ticket error details:', {
      ticketError,
      ticket,
      id,
      errorMessage: ticketError?.message
    });

    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Ticket Not Found</h1>
        <p className="text-gray-600 mb-4">
          {ticketError 
            ? `Error: ${getErrorMessage(ticketError)}`
            : "The ticket you're looking for doesn't exist."
          }
        </p>
        <div className="text-sm text-gray-500 mb-4">
          <p>Ticket ID: {id}</p>
          <button
            onClick={async () => {
              try {
                const result = await fetch(`${API_CONFIG.BASE_URL}/tickets/${id}`);
                const data = await result.json();
                alert(`Direct API test: ${result.ok ? 'Success' : 'Failed'} - Check console for details`);
              } catch (error) {
                console.error('Direct API error:', error);
                alert(`Direct API error: ${getErrorMessage(error)}`);
              }
            }}
            className="px-3 py-1 bg-blue-500 text-white rounded text-xs mr-2"
          >
            Test API Direct
          </button>
          <button
            onClick={async () => {
              try {
                const result = await ticketsApi.getTicket(id!);
                alert('TicketsApi test: Success - Check console for details');
              } catch (error) {
                console.error('TicketsApi error:', error);
                alert(`TicketsApi error: ${getErrorMessage(error)}`);
              }
            }}
            className="px-3 py-1 bg-green-500 text-white rounded text-xs"
          >
            Test TicketsApi
          </button>
        </div>
        <Link
          to={backUrl}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tickets
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Freshdesk-style Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Link to={backUrl} className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500 font-medium">Ticket</span>
              <span className="text-lg font-semibold text-gray-900">#{ticketDisplayNumber || '------'}</span>
              {finalTicket?.isOverdue && (
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                  Overdue
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 justify-end">
            {/* Reply button removed - users should reply via Comments section */}
            {/* Reopen - visible to all users when ticket is resolved (not closed - closed is final) */}
            {finalTicket && finalTicket.status === 4 && (
              <button onClick={handleReopenTicket} className="flex items-center px-3 py-2 text-sm text-green-700 hover:bg-green-100 rounded border border-green-200 hover:border-green-300 transition-colors whitespace-nowrap">
                <XCircle className="h-4 w-4 mr-2" />
                Reopen
              </button>
            )}
            {/* Add Note - Admin/Agent only */}
            {hasAdminPrivileges && (
              <button className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded border border-gray-200 hover:border-gray-300 transition-colors whitespace-nowrap" onClick={() => setShowNoteModal(true)}>
                <StickyNote className="h-4 w-4 mr-2" />
                Add note
              </button>
            )}
            {/* Forward - Admin/Agent only */}
            {hasAdminPrivileges && (
              <button className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded border border-gray-200 hover:border-gray-300 transition-colors whitespace-nowrap" onClick={() => { setEmailType('forward'); setShowEmailModal(true); }}>
                <Forward className="h-4 w-4 mr-2" />
                Forward
              </button>
            )}
            {/* Close - Admin/Agent only */}
            {hasAdminPrivileges && (
              <button onClick={handleCloseTicket} className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded border border-gray-200 hover:border-gray-300 transition-colors whitespace-nowrap">
                <XCircle className="h-4 w-4 mr-2" />
                Close
              </button>
            )}
            {/* Merge - Admin/Agent only */}
            {hasAdminPrivileges && (
              <button 
                onClick={handleMergeTickets} 
                className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded border border-gray-200 hover:border-gray-300 transition-colors whitespace-nowrap"
              >
                <GitMerge className="h-4 w-4 mr-2" />
                Merge
              </button>
            )}
            {/* Delete - Admin/Agent only */}
            {hasAdminPrivileges && (
              <button onClick={handleDeleteTicket} className="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded border border-red-200 hover:border-red-300 transition-colors whitespace-nowrap">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            )}
          </div>
        </div>
        {/* Attachments Section */}
        {attachments.length > 0 && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Paperclip className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Attachments ({attachments.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {attachments.map((att, idx) => (
                <a 
                  key={idx} 
                  href={`${API_CONFIG.BASE_URL}/tickets-v2/attachments/${att.id}/download`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center px-3 py-1.5 bg-white border border-blue-300 text-blue-700 text-sm rounded-md hover:bg-blue-100 hover:border-blue-400 transition-colors shadow-sm"
                >
                  <Paperclip className="h-3.5 w-3.5 mr-1.5" />
                  {att.fileName || att.name || `Attachment ${idx + 1}`}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
  <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-4 right-4 z-20 p-2 bg-white border border-gray-300 rounded-full shadow-md hover:bg-gray-50 transition-colors"
          title={isSidebarOpen ? "Hide Properties" : "Show Properties"}
        >
          {isSidebarOpen ? (
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-600" />
          )}
        </button>

        {/* Left Content - Email Thread */}
  <div className="flex-1 flex flex-col bg-white">
          {/* Ticket Subject */}
          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
            <h1 className="text-lg font-semibold text-gray-900 leading-tight">{finalTicket.title}</h1>
            <div className="mt-1 text-xs text-gray-600">
              <span>by </span>
              <span className="font-medium">
                {finalTicket.createdByUser ? 
                  `${finalTicket.createdByUser.firstName || ''} ${finalTicket.createdByUser.lastName || ''}`.trim() || finalTicket.createdByUser.email || 'Unknown User' : 
                  'Unknown User'
                }
              </span>
              <span className="text-gray-400 mx-2">•</span>
              <span>{(() => {
                if (!finalTicket.createdAt) {
                  return 'Date not available';
                }
                return formatDate(finalTicket.createdAt);
              })()}</span>
            </div>
          </div>

          {/* Email Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                    {finalTicket.createdByUser?.firstName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {finalTicket.createdByUser ? 
                        `${finalTicket.createdByUser.firstName || ''} ${finalTicket.createdByUser.lastName || ''}`.trim() || finalTicket.createdByUser.email || 'Unknown User' : 
                        'Unknown User'
                      }
                    </div>
                    <div className="text-xs text-gray-500">
                      {finalTicket.createdByUser?.email || 'no-email@example.com'}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {formatDate(finalTicket.createdAt)}
                </div>
              </div>
              
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-sm text-gray-800 min-h-[200px] p-4 bg-gray-50 rounded-md border border-gray-200">
                  {finalTicket.description}
                </div>
              </div>
            </div>

            {/* Merge Details Section */}
            {(finalTicket.hasMergedTickets || finalTicket.wasMergedInto) && (
              <div className="bg-indigo-50 rounded-lg border border-indigo-200 p-4 mb-4">
                <div className="flex items-center space-x-2 mb-3">
                  <GitMerge className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-sm font-semibold text-indigo-800">Merge Details</h3>
                </div>
                
                {/* This is a Primary Ticket (has merged tickets) */}
                {finalTicket.hasMergedTickets && finalTicket.mergedTickets && finalTicket.mergedTickets.length > 0 && (
                  <div className="space-y-3">
                    <div className="bg-white rounded-md border border-indigo-100 p-3">
                      <div className="text-sm font-medium text-indigo-800 mb-2">
                        This is a Primary Ticket
                      </div>
                      <p className="text-xs text-gray-600 mb-3">
                        The following tickets have been merged into this ticket:
                      </p>
                      
                      {finalTicket.mergedTickets.map((merge: { mergeId: string; mergedTicketIds: string[]; mergeReason: string; mergedAt: string; mergedByName?: string }, index: number) => (
                        <div key={merge.mergeId || index} className="bg-gray-50 rounded p-3 mb-2 last:mb-0">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                            <div>
                              <span className="font-medium text-gray-700">Merged Tickets:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {/* Use mergedTicketDetails for clickable links with public IDs */}
                                {finalTicket.mergedTicketDetails?.map((detail: { id: string; publicId: number; title: string }) => (
                                  <Link
                                    key={detail.id}
                                    to={`/tickets/${detail.id}`}
                                    className="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors font-medium"
                                  >
                                    #{detail.publicId} - {detail.title?.substring(0, 30)}{detail.title?.length > 30 ? '...' : ''}
                                  </Link>
                                )) || merge.mergedTicketIds?.map((ticketId: string) => (
                                  <Link
                                    key={ticketId}
                                    to={`/tickets/${ticketId}`}
                                    className="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors"
                                  >
                                    View Ticket
                                  </Link>
                                ))}
                              </div>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Merged By:</span>
                              <div className="mt-1 text-gray-600">
                                {merge.mergedByName || 'System'}
                              </div>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Merged On:</span>
                              <div className="mt-1 text-gray-600">
                                {merge.mergedAt ? formatDate(merge.mergedAt) : 'Unknown date'}
                              </div>
                            </div>
                          </div>
                          {merge.mergeReason && (
                            <div className="mt-2">
                              <span className="font-medium text-gray-700 text-xs">Reason:</span>
                              <p className="text-xs text-gray-600 mt-1">{merge.mergeReason}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* This Ticket Was Merged Into Another */}
                {finalTicket.wasMergedInto && (
                  <div className="bg-orange-50 rounded-md border border-orange-200 p-3">
                    <div className="text-sm font-medium text-orange-800 mb-2">
                      ⚠️ This Ticket Was Merged
                    </div>
                    <p className="text-xs text-gray-600 mb-3">
                      This ticket has been merged into another ticket. All new updates should be made on the primary ticket.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="font-medium text-gray-700">Primary Ticket:</span>
                        <div className="mt-1">
                          <Link
                            to={`/tickets/${finalTicket.wasMergedInto.primaryTicketId}`}
                            className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium"
                          >
                            #{finalTicket.wasMergedInto.primaryTicketPublicId} - View Primary Ticket
                          </Link>
                          {finalTicket.wasMergedInto.primaryTicketTitle && (
                            <p className="text-gray-600 mt-1">{finalTicket.wasMergedInto.primaryTicketTitle}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Merged By:</span>
                        <div className="mt-1 text-gray-600">
                          {finalTicket.wasMergedInto.mergedByName || 'System'}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Merged On:</span>
                        <div className="mt-1 text-gray-600">
                          {finalTicket.wasMergedInto.mergedAt ? formatDate(finalTicket.wasMergedInto.mergedAt) : 'Unknown date'}
                        </div>
                      </div>
                    </div>
                    
                    {finalTicket.wasMergedInto.mergeReason && (
                      <div className="mt-2">
                        <span className="font-medium text-gray-700 text-xs">Reason:</span>
                        <p className="text-xs text-gray-600 mt-1">{finalTicket.wasMergedInto.mergeReason}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Add Note Section - Only for Agents/Admins */}
            {hasAdminPrivileges && (
              <AddNote 
                ticketId={finalTicket.id} 
                isAgent={hasAdminPrivileges}
              />
            )}

            {/* Comments Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <TicketComments 
                ticketId={finalTicket.id} 
                ticketTitle={finalTicket.title}
                ticketNumber={ticketNumberForEmails || ticketDisplayNumber}
                isAgent={hasAdminPrivileges}
              />
            </div>

            {/* Forward History Section */}
            <ForwardHistory ticketId={finalTicket.id} />
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        {isSidebarOpen && (
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
            <TicketProperties
              ticket={finalTicket}
              agents={filteredAgents}
              isAgent={hasAdminPrivileges}
            />
            
            {/* Collaborators Section - Admin/Agent only */}
            {hasAdminPrivileges && (
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Collaborators</h3>
                  <button
                    onClick={() => setShowCollaboratorsModal(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Add
                  </button>
                </div>
                
                {collaborators.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">No collaborators yet</p>
                ) : (
                  <div className="space-y-2">
                    {collaborators.map((collab) => (
                      <div key={collab.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">{collab.userName}</p>
                          <p className="text-xs text-gray-500 truncate">{collab.userEmail}</p>
                          <p className="text-xs text-gray-400">{collab.role}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveCollaborator(collab.userId)}
                          className="ml-2 text-red-600 hover:text-red-700"
                          title="Remove collaborator"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        )}
      </div>

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <AssignmentModal
          ticket={finalTicket}
          agents={agents.map(agent => ({
            id: agent.userId || agent.id,
            firstName: agent.name?.split(' ')[0] || '',
            lastName: agent.name?.split(' ').slice(1).join(' ') || '',
            email: agent.email,
            department: 'Unknown', // Default department since API doesn't provide it
            workload: 0 // Default workload since API doesn't provide it
          }))}
          departments={departments || []}
          onClose={() => setShowAssignmentModal(false)}
          queryClient={queryClient}
        />
      )}

      {/* Email Modal - Forward Only */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">Forward Email</h3>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* To Field - Required for Forward */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To
                </label>
                <input
                  type="email"
                  value={emailTo || ''}
                  onChange={(e) => setEmailTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter recipient email address"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject (Auto-generated)
                </label>
                <input
                  type="text"
                  value={`Fwd: [Ticket #${ticketNumberForEmails}] ${finalTicket.title}`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                  disabled
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">
                  The subject line will be generated automatically by the system.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Type your message..."
                />
              </div>

              {/* Attachments Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attachments (Optional)
                </label>
                
                {/* File Input */}
                <div className={`border-2 border-dashed rounded-lg p-4 text-center ${
                  emailAttachments.length >= 5 ? 'border-gray-200 bg-gray-50 cursor-not-allowed' : 'border-gray-300 hover:border-indigo-400 cursor-pointer'
                }`}>
                  <label className={emailAttachments.length >= 5 ? 'cursor-not-allowed' : 'cursor-pointer'}>
                    <Paperclip className={`w-5 h-5 mx-auto mb-1 ${emailAttachments.length >= 5 ? 'text-gray-300' : 'text-gray-500'}`} />
                    <p className={`text-xs ${emailAttachments.length >= 5 ? 'text-gray-400' : 'text-gray-600'}`}>
                      {emailAttachments.length >= 5 ? (
                        <span>Maximum files reached ({emailAttachments.length}/5)</span>
                      ) : (
                        <>Click to upload or drag and drop</>
                      )}
                    </p>
                    <p className={`text-xs ${emailAttachments.length >= 5 ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                      PNG, JPG, PDF, DOC, TXT (max 5MB each, up to 5 files)
                    </p>
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.txt"
                      onChange={handleEmailFileChange}
                      disabled={emailAttachments.length >= 5}
                    />
                  </label>
                </div>

                {/* Attached Files List */}
                {emailAttachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {emailAttachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md border border-gray-200">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <Paperclip className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          <span className="text-sm text-gray-700 truncate">{file.name}</span>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeEmailAttachment(index)}
                          className="ml-2 text-red-500 hover:text-red-700 flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 p-4 border-t bg-gray-50 flex-shrink-0">
              <button
                onClick={() => { 
                  setShowEmailModal(false); 
                  setEmailTo(''); 
                  setEmailContent(''); 
                  setEmailAttachments([]);
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={!emailContent.trim() || !emailTo.trim()}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4 mr-2" />
                Forward Email
                {emailAttachments.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-indigo-500 text-xs rounded-full">
                    {emailAttachments.length} file{emailAttachments.length !== 1 ? 's' : ''}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Merge Modal */}
      {showMergeModal && (
        <MergeModal
          ticket={ticket}
          isOpen={showMergeModal}
          onClose={() => setShowMergeModal(false)}
        />
      )}

      {/* Collaborators Modal */}
      {showCollaboratorsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">Add Collaborators</h3>
              <button
                onClick={() => {
                  setShowCollaboratorsModal(false);
                  setSelectedCollaborators([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Agents
              </label>
              <div className="space-y-2 max-h-[400px] overflow-y-auto border border-gray-300 rounded-md p-2">
                {filteredAgents
                  .filter(agent => 
                    !collaborators.some((c) => c.userId === agent.userId) &&
                    agent.userId !== finalTicket?.assignedToUserId
                  )
                  .map(agent => (
                    <label
                      key={agent.userId}
                      className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCollaborators.includes(agent.userId)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCollaborators(prev => [...prev, agent.userId]);
                          } else {
                            setSelectedCollaborators(prev => prev.filter(id => id !== agent.userId));
                          }
                        }}
                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{agent.name}</p>
                        <p className="text-xs text-gray-500 truncate">{agent.email}</p>
                      </div>
                    </label>
                  ))}
                {filteredAgents.filter(agent => 
                  !collaborators.some((c) => c.userId === agent.userId) &&
                  agent.userId !== finalTicket?.assignedToUserId
                ).length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No available agents to add
                  </p>
                )}
              </div>
              
              {selectedCollaborators.length > 0 && (
                <p className="text-xs text-gray-600 mt-2">
                  {selectedCollaborators.length} agent(s) selected
                </p>
              )}
            </div>
            
            <div className="flex items-center justify-end space-x-3 p-4 border-t bg-gray-50 flex-shrink-0">
              <button
                onClick={() => {
                  setShowCollaboratorsModal(false);
                  setSelectedCollaborators([]);
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCollaborators}
                disabled={selectedCollaborators.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add {selectedCollaborators.length > 0 && `(${selectedCollaborators.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Add Note</h3>
              <button
                onClick={() => setShowNoteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Type your note..."
              />
            </div>
            <div className="flex items-center justify-end space-x-3 p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowNoteModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                disabled={!noteContent.trim()}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                <StickyNote className="h-4 w-4 mr-2" />
                Add Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketDetailPage;