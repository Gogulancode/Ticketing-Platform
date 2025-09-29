import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  AlertCircle,
  Send,
  X,
  Reply,
  Forward,
  StickyNote,
  XCircle,
  GitMerge,
  Trash2
} from 'lucide-react';

// Import components
import TicketProperties from '../components/tickets/detail/TicketProperties';
import TicketComments from '../components/tickets/detail/TicketComments';
import AddNote from '../components/tickets/detail/AddNote';
import AssignmentModal from '../components/tickets/detail/AssignmentModal';
import MergeModal from '../components/tickets/detail/MergeModal';
import ForwardHistory from '../components/tickets/detail/ForwardHistory';
import CustomFieldsForTicket from '../components/CustomFieldsForTicket';

// Import APIs and types
import { ticketsApi } from '../services/ticketsApi';
import { settingsApi } from "../../../shared/services/api/settingsApi";
import { settingsApi as apiSettingsApi } from "../../../api/settingsApi";
import { mockSettingsApi } from '../../../services/mockSettingsApi';


const TicketDetailPage: React.FC = () => {
  // Add note modal state
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    toast.loading('Adding note...');
    try {
      const response = await fetch(`/api/tickets-v2/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Content: noteContent, IsInternal: true })  // Changed to PascalCase
      });
      if (!response.ok) throw new Error('Failed to add note');
      toast.success('Note added');
      setShowNoteModal(false);
      setNoteContent('');
      refetchTicket();
    } catch (err: any) {
      toast.error('Failed to add note: ' + err.message);
    } finally {
      toast.dismiss();
    }
  };
  // Reopen ticket handler
  const handleReopenTicket = async () => {
    toast.loading('Reopening ticket...');
    try {
      const response = await fetch(`/api/tickets-v2/${id}/reopen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to reopen ticket');
      toast.success('Ticket reopened');
      refetchTicket();
    } catch (err: any) {
      toast.error('Failed to reopen ticket: ' + err.message);
    } finally {
      toast.dismiss();
    }
  };
  // Close ticket handler
  const handleCloseTicket = async () => {
    toast.loading('Closing ticket...');
    try {
      const response = await fetch(`/api/tickets-v2/${id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to close ticket');
      toast.success('Ticket closed');
      refetchTicket();
    } catch (err: any) {
      toast.error('Failed to close ticket: ' + err.message);
    } finally {
      toast.dismiss();
    }
  };

  // Delete ticket handler
  const handleDeleteTicket = async () => {
    if (!window.confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) return;
    toast.loading('Deleting ticket...');
    try {
      console.log('🗑️ Attempting to delete ticket:', id);
      const response = await fetch(`/api/tickets-v2/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('🗑️ Delete response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🗑️ Delete failed with response:', errorText);
        throw new Error(`Failed to delete ticket (${response.status}): ${errorText}`);
      }
      
      toast.success('Ticket deleted');
      console.log('🗑️ Ticket deleted successfully, redirecting...');
      window.location.href = '/tickets';
    } catch (err: any) {
      console.error('🗑️ Delete error:', err);
      toast.error('Failed to delete ticket: ' + err.message);
    } finally {
      toast.dismiss();
    }
  };

  // Merge tickets handler - opens modal
  const handleMergeTickets = () => {
    setShowMergeModal(true);
  };
  // Reply/Forward modal send handler
  const handleSendEmail = async () => {
    if (!emailContent.trim()) return;
    
    // For forward emails, we need a recipient email
    if (emailType === 'forward' && !emailTo.trim()) {
      toast.error('Please enter recipient email address');
      return;
    }
    
    toast.loading('Sending email...');
    try {
      let response;
      
      if (emailType === 'reply') {
        // Use reply-email endpoint
        response = await fetch(`/api/tickets-v2/${id}/reply-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ReplyMessage: emailContent
          })
        });
      } else if (emailType === 'forward') {
        // Use forward-email endpoint
        response = await fetch(`/api/tickets-v2/${id}/forward-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            RecipientEmail: emailTo,
            ForwardMessage: emailContent
          })
        });
      } else {
        throw new Error('Invalid email type');
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send email: ${errorText}`);
      }
      
      toast.success(`Email ${emailType === 'reply' ? 'reply' : 'forwarded'} sent successfully`);
      setShowEmailModal(false);
      setEmailContent('');
      setEmailTo('');
      refetchTicket();
    } catch (err: any) {
      toast.error('Failed to send email: ' + err.message);
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
  const [emailType, setEmailType] = useState<'reply' | 'forward'>('reply');
  // Generate public ticket ID
  const getPublicTicketId = (ticket: any) => {
    if (!ticket) return '000000';
    const hash = ticket.id.toString().split('').reduce((a: number, b: string) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return Math.abs(hash).toString().slice(-6).padStart(6, '0');
  };

  // Fetch ticket data with fallback
  const { data: ticket, isLoading: ticketLoading, error: ticketError, refetch: refetchTicket } = useQuery({
    queryKey: ['ticket', id],
    queryFn: async () => {
      console.log('🔍 Fetching ticket with ID:', id);
      try {
        // Try to get specific ticket first
        const result = await ticketsApi.getTicket(id!);
          console.log('✅ Ticket fetched successfully:', {
    ticket,
    ticketFields: {
      category: ticket?.category,
      categoryId: ticket?.categoryId,
      subCategory: ticket?.subCategory,
      subcategoryId: ticket?.subcategoryId,
      priority: ticket?.priority,
      status: ticket?.status
    }
  });
        return result;
      } catch (error) {
        console.error('❌ Error fetching specific ticket, trying fallback:', error);
        
        // Fallback: Get all tickets and find the matching one
        try {
          const allTickets = await ticketsApi.getTickets();
          const foundTicket = allTickets.find(t => t.id === id);
          
          if (foundTicket) {
            console.log('✅ Ticket found via fallback:', foundTicket);
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

  // Fetch all settings data with fallback to mock API
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        return await settingsApi.getTicketCategories();
      } catch {
        console.warn('API unavailable, using mock data for categories');
        return await mockSettingsApi.getTicketCategories();
      }
    }
  });

  const { data: subcategories } = useQuery({
    queryKey: ['subcategories'],
    queryFn: async () => {
      try {
        return await settingsApi.getSubCategories();
      } catch {
        console.warn('API unavailable, using mock data for subcategories');
        return await mockSettingsApi.getSubCategories();
      }
    }
  });

  const { data: priorityLevels } = useQuery({
    queryKey: ['priority-levels'],
    queryFn: async () => {
      try {
        return await settingsApi.getPriorityLevels();
      } catch {
        console.warn('API unavailable, using mock data for priority levels');
        return await mockSettingsApi.getPriorityLevels();
      }
    }
  });

  const { data: statusConfigs } = useQuery({
    queryKey: ['status-configs'],
    queryFn: async () => {
      try {
        return await settingsApi.getTicketStatuses();
      } catch {
        console.warn('API unavailable, using mock data for status configs');
        return await mockSettingsApi.getTicketStatuses();
      }
    }
  });

  const { data: issueTypes } = useQuery({
    queryKey: ['issue-types'],
    queryFn: async () => {
      try {
        return await settingsApi.getIssueTypes();
      } catch {
        console.warn('API unavailable, using mock data for issue types');
        return await mockSettingsApi.getIssueTypes();
      }
    }
  });

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
    queryKey: ['agent-groups'],
    queryFn: async () => {
      try {
        return await apiSettingsApi.getAdvancedTicketGroups();
      } catch (error) {
        console.warn('Agent groups API unavailable:', error);
        return [];
      }
    }
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
    if (!ticket || !agentGroups || agentGroups.length === 0) {
      // If no ticket, no agent groups, or groups not loaded yet, show all agents
      console.log('🔍 No agent groups loaded, showing all agents:', {
        hasTicket: !!ticket,
        agentGroupsCount: agentGroups?.length || 0,
        totalAgents: agents.length
      });
      return agents;
    }

    // Find matching agent groups based on ticket's category and subcategory
    const matchingGroups = agentGroups.filter(group => {
      // Check if group matches ticket's category
      const categoryMatch = group.categoryId === ticket.categoryId || 
                           group.categoryId === ticket.category;
      
      // More flexible subcategory matching:
      // 1. If ticket has no subcategory, match groups for that category regardless of group subcategory
      // 2. If ticket has subcategory, must match exactly
      // 3. If group has no subcategory restriction, it applies to all subcategories in that category
      const ticketSubcategoryId = ticket.subcategoryId || ticket.subCategory;
      const subcategoryMatch = !ticketSubcategoryId || // Ticket has no subcategory 
                              !group.subcategoryId || // Group applies to all subcategories
                              group.subcategoryId === ticketSubcategoryId; // Exact match
      
      const isMatch = categoryMatch && subcategoryMatch && group.isActive;
      
      console.log('🔍 Group matching check:', {
        groupId: group.id,
        groupName: group.name,
        groupCategory: group.categoryId,
        groupSubcategory: group.subcategoryId,
        ticketCategory: ticket.categoryId || ticket.category,
        ticketSubcategory: ticketSubcategoryId,
        categoryMatch,
        subcategoryMatch,
        isActive: group.isActive,
        finalMatch: isMatch
      });
      
      return isMatch;
    });

    if (matchingGroups.length === 0) {
      // If no matching groups found, show all agents
      console.log('🔍 No matching agent groups found for ticket', {
        ticketCategory: ticket.categoryId || ticket.category,
        ticketSubcategory: ticket.subcategoryId || ticket.subCategory,
        availableGroups: agentGroups.map(g => ({
          id: g.id,
          name: g.name,
          categoryId: g.categoryId,
          subcategoryId: g.subcategoryId
        }))
      });
      return agents;
    }

    // Get all agent IDs from matching groups
    const allowedAgentIds = new Set<number>();
    matchingGroups.forEach(group => {
      group.assignedAgentIds?.forEach(agentId => allowedAgentIds.add(agentId));
    });

    console.log('🔍 Agent group assignment details:', {
      matchingGroups: matchingGroups.map(g => ({
        id: g.id,
        name: g.name,
        assignedAgentIds: g.assignedAgentIds
      })),
      allowedAgentIds: Array.from(allowedAgentIds),
      availableAgentIds: agents.map(a => ({ id: a.id, name: a.name }))
    });

    // Filter agents to only show those in matching groups
    const filteredAgents = agents.filter(agent => {
      const agentIdNumber = parseInt(agent.id);
      return allowedAgentIds.has(agentIdNumber);
    });

    // If no agents match the group restrictions, fall back to showing all agents
    // This handles cases where agent group assignments are outdated
    if (filteredAgents.length === 0 && matchingGroups.length > 0) {
      console.warn('⚠️ No agents found matching group restrictions, showing all agents. This may indicate outdated group assignments.', {
        groupAgentIds: Array.from(allowedAgentIds),
        actualAgentIds: agents.map(a => parseInt(a.id))
      });
      return agents;
    }

    console.log('🎯 Filtered agents based on ticket category/subcategory', {
      ticketCategory: ticket.categoryId || ticket.category,
      ticketSubcategory: ticket.subcategoryId || ticket.subCategory,
      matchingGroups: matchingGroups.map(g => g.name),
      totalAgents: agents.length,
      filteredAgents: filteredAgents.length,
      agentNames: filteredAgents.map(a => a.name)
    });

    return filteredAgents;
  };

  const filteredAgents = getFilteredAgents();



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Loading state
  if (ticketLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Use mock data as fallback if API fails
  const finalTicket = ticket || null;

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
            ? `Error: ${(ticketError as any)?.message || 'Unknown error'}` 
            : "The ticket you're looking for doesn't exist."
          }
        </p>
        <div className="text-sm text-gray-500 mb-4">
          <p>Ticket ID: {id}</p>
          <button
            onClick={async () => {
              try {
                console.log('🧪 Direct API test for ticket:', id);
                const result = await fetch(`http://localhost:5015/api/tickets/${id}`);
                const data = await result.json();
                console.log('🧪 Direct API result:', data);
                alert(`Direct API test: ${result.ok ? 'Success' : 'Failed'} - Check console for details`);
              } catch (error) {
                console.error('🧪 Direct API error:', error);
                alert(`Direct API error: ${(error as any)?.message || 'Unknown error'}`);
              }
            }}
            className="px-3 py-1 bg-blue-500 text-white rounded text-xs mr-2"
          >
            Test API Direct
          </button>
          <button
            onClick={async () => {
              try {
                console.log('🧪 TicketsApi test for ticket:', id);
                const result = await ticketsApi.getTicket(id!);
                console.log('🧪 TicketsApi result:', result);
                alert('TicketsApi test: Success - Check console for details');
              } catch (error) {
                console.error('🧪 TicketsApi error:', error);
                alert(`TicketsApi error: ${(error as any)?.message || 'Unknown error'}`);
              }
            }}
            className="px-3 py-1 bg-green-500 text-white rounded text-xs"
          >
            Test TicketsApi
          </button>
        </div>
        <Link
          to="/tickets"
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
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/tickets" className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500 font-medium">Ticket</span>
              <span className="text-lg font-semibold text-gray-900">#{getPublicTicketId(finalTicket)}</span>
              {finalTicket?.isOverdue && (
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                  Overdue
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded border border-gray-200 hover:border-gray-300 transition-colors" onClick={() => { setEmailType('reply'); setShowEmailModal(true); }}>
              <Reply className="h-4 w-4 mr-2" />
              Reply
            </button>
            {finalTicket && (finalTicket.status === 3 || finalTicket.status === 4) && (
              <button onClick={handleReopenTicket} className="flex items-center px-3 py-2 text-sm text-green-700 hover:bg-green-100 rounded border border-green-200 hover:border-green-300 transition-colors">
                <XCircle className="h-4 w-4 mr-2" />
                Reopen
              </button>
            )}
            <button className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded border border-gray-200 hover:border-gray-300 transition-colors" onClick={() => setShowNoteModal(true)}>
              <StickyNote className="h-4 w-4 mr-2" />
              Add note
            </button>
            <button className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded border border-gray-200 hover:border-gray-300 transition-colors" onClick={() => { setEmailType('forward'); setShowEmailModal(true); }}>
              <Forward className="h-4 w-4 mr-2" />
              Forward
            </button>
            <button onClick={handleCloseTicket} className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded border border-gray-200 hover:border-gray-300 transition-colors">
              <XCircle className="h-4 w-4 mr-2" />
              Close
            </button>
            <button 
              onClick={handleMergeTickets} 
              className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <GitMerge className="h-4 w-4 mr-2" />
              Merge
            </button>
            <button onClick={handleDeleteTicket} className="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded border border-red-200 hover:border-red-300 transition-colors">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
          </div>
        </div>
        {/* Attachments Section */}
        {finalTicket?.attachments && finalTicket.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {finalTicket.attachments.map((att: any, idx: number) => (
              <a 
                key={idx} 
                href={`http://localhost:5015/api/tickets-v2/attachments/${att.id}/download`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center px-2 py-1 bg-gray-100 text-xs rounded hover:bg-gray-200"
              >
                📎 {att.fileName || att.name || `Attachment ${idx + 1}`}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
  <div className="flex-1 flex overflow-hidden">
        {/* Left Content - Email Thread */}
  <div className="flex-1 flex flex-col bg-white">
          {/* Ticket Subject */}
          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
            <h1 className="text-lg font-semibold text-gray-900 leading-tight">{finalTicket.title}</h1>
            <div className="mt-1 text-xs text-gray-600">
              <span>by </span>
              <span className="font-medium">
                {finalTicket.createdByUser ? 
                  `${finalTicket.createdByUser.firstName} ${finalTicket.createdByUser.lastName}` : 
                  'Unknown User'
                }
              </span>
              <span className="text-gray-400 mx-2">•</span>
              <span>{formatDate(finalTicket.createdAt)}</span>
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
                        `${finalTicket.createdByUser.firstName} ${finalTicket.createdByUser.lastName}` : 
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
                <div className="whitespace-pre-wrap text-sm text-gray-800">
                  {finalTicket.description}
                </div>
              </div>
            </div>

            {/* Add Note Section - Only for Agents */}
            <AddNote 
              ticketId={finalTicket.id} 
              isAgent={true} // TODO: Replace with actual user role check
            />

            {/* Comments Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <TicketComments 
                ticketId={finalTicket.id} 
                ticketTitle={finalTicket.title}
                isAgent={true} // TODO: Replace with actual user role check
              />
            </div>

            {/* Forward History Section */}
            <ForwardHistory ticketId={finalTicket.id} />
          </div>
        </div>

        {/* Right Sidebar - Properties */}
  <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
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
          
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            <TicketProperties
              ticket={finalTicket}
              agents={filteredAgents}
            />
          </div>
        </div>
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

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Send Email</h3>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setEmailType('reply')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    emailType === 'reply'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Reply className="h-4 w-4 inline mr-1" />
                  Reply
                </button>
                <button
                  onClick={() => setEmailType('forward')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    emailType === 'forward'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Forward className="h-4 w-4 inline mr-1" />
                  Forward
                </button>
              </div>
              
              {/* To Field - Show for Forward only */}
              {emailType === 'forward' && (
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
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject (Auto-generated)
                </label>
                <input
                  type="text"
                  value={emailType === 'reply' 
                    ? `Re: [Ticket #${finalTicket.publicId || getPublicTicketId(finalTicket)}] ${finalTicket.title}`
                    : `Fwd: [Ticket #${finalTicket.publicId || getPublicTicketId(finalTicket)}] ${finalTicket.title}`
                  }
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
            </div>
            <div className="flex items-center justify-end space-x-3 p-4 border-t bg-gray-50">
              <button
                onClick={() => { setShowEmailModal(false); setEmailTo(''); setEmailContent(''); }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={!emailContent.trim() || (emailType === 'forward' && !emailTo.trim())}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Email
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
    </div>
  );
};

export default TicketDetailPage;