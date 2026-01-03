import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, FontSizes, BorderRadius } from '../constants/theme';
import { ticketsApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface Comment {
  id: string;
  body: string;
  authorName: string;
  authorId?: string;
  isInternal: boolean;
  createdAt: string;
  attachments?: Array<{id: string, fileName: string, fileSize?: number, sizeBytes?: number}>;
}

interface Category {
  id: number;
  name: string;
  isActive: boolean;
}

interface SubCategory {
  id: number;
  name: string;
  categoryId: number;
  isActive: boolean;
}

interface PriorityLevel {
  id: number;
  name: string;
  level: number;
  isActive: boolean;
}

interface StatusConfig {
  id: number;
  name: string;
  isActive: boolean;
}

interface Agent {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface CustomField {
  id: number;
  label: string;
  type: string;
  isRequired: boolean;
  options?: string[];
  isActive?: boolean;
}

interface Attachment {
  id: string;
  fileName: string;
  fileSize?: number;
  sizeBytes?: number; // API returns sizeBytes, mobile app used fileSize
  contentType: string;
}

export default function TicketDetailScreen({ route, navigation }: any) {
  const { ticketId } = route.params;
  const queryClient = useQueryClient();
  const { serverUrl, token, user } = useAuthStore();
  const [newComment, setNewComment] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [commentAttachments, setCommentAttachments] = useState<Array<{uri: string, name: string, type: string}>>([]);
  
  // Role detection - use exact matching for consistency with web/desktop
  const isAdmin = user?.role === 'Admin' || user?.roles?.includes('Admin');
  const isCategoryAdmin = user?.isCategoryAdmin || user?.role === 'CategoryAdmin' || user?.roles?.includes('CategoryAdmin');
  const isAgentRole = user?.role === 'Agent' || user?.roles?.includes('Agent');
  
  // Can edit ticket: Admin, CategoryAdmin, or Agent
  const canEditTicket = isAdmin || isCategoryAdmin || isAgentRole;
  
  // Debug logging
  console.log('TicketDetail - User:', JSON.stringify(user, null, 2));
  console.log('TicketDetail - canEditTicket:', canEditTicket, { isAdmin, isCategoryAdmin, isAgentRole });

  // Collapsible sections
  const [showActionsDetails, setShowActionsDetails] = useState(true);
  const [showAttachments, setShowAttachments] = useState(false);

  // Property editing state
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [priorities, setPriorities] = useState<PriorityLevel[]>([]);
  const [statuses, setStatuses] = useState<StatusConfig[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  
  const [editedStatus, setEditedStatus] = useState<number | null>(null);
  const [editedPriority, setEditedPriority] = useState<number | null>(null);
  const [editedCategory, setEditedCategory] = useState<number | null>(null);
  const [editedSubcategory, setEditedSubcategory] = useState<number | null>(null);
  const [editedAgent, setEditedAgent] = useState<string | null>(null);
  const [editedCustomFields, setEditedCustomFields] = useState<Record<string, string>>({});
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: ticket, isLoading, refetch } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => ticketsApi.getTicketById(ticketId),
  });

  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ['ticket-comments', ticketId],
    queryFn: () => ticketsApi.getComments(ticketId),
  });

  const addCommentMutation = useMutation({
    mutationFn: (content: string) => ticketsApi.addComment(ticketId, content, isInternalNote),
    onSuccess: () => {
      setNewComment('');
      setCommentAttachments([]);
      refetchComments();
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
    },
  });

  // Load settings for property editing
  const loadSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const [catRes, subRes, prioRes, statusRes, agentsRes] = await Promise.all([
        fetch(`${serverUrl}/api/tickets/settings/categories`, { headers }),
        fetch(`${serverUrl}/api/tickets/settings/subcategories`, { headers }),
        fetch(`${serverUrl}/api/tickets/settings/priorities`, { headers }),
        fetch(`${serverUrl}/api/tickets/settings/statuses`, { headers }),
        fetch(`${serverUrl}/api/tickets/settings/agents`, { headers }),
      ]);

      if (catRes.ok) {
        const data = await catRes.json();
        setCategories((data || []).filter((c: Category) => c.isActive !== false));
      }
      if (subRes.ok) {
        const data = await subRes.json();
        setSubcategories((data || []).filter((s: SubCategory) => s.isActive !== false));
      }
      if (prioRes.ok) {
        const data = await prioRes.json();
        setPriorities((data || []).filter((p: PriorityLevel) => p.isActive !== false).sort((a: PriorityLevel, b: PriorityLevel) => a.level - b.level));
      }
      if (statusRes.ok) {
        const data = await statusRes.json();
        setStatuses((data || []).filter((s: StatusConfig) => s.isActive !== false));
      }
      if (agentsRes.ok) {
        const data = await agentsRes.json();
        setAgents(data || []);
      }

      // Load custom fields if category and subcategory exist
      if (ticket?.categoryId && ticket?.subcategoryId) {
        const cfRes = await fetch(
          `${serverUrl}/api/tickets/settings/custom-fields?categoryId=${ticket.categoryId}&subcategoryId=${ticket.subcategoryId}`,
          { headers }
        );
        if (cfRes.ok) {
          const data = await cfRes.json();
          setCustomFields((data || []).filter((f: CustomField) => f.isActive !== false));
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  // Initialize edit values from ticket
  useEffect(() => {
    if (ticket && canEditTicket) {
      setEditedStatus(ticket.status);
      setEditedPriority(ticket.priority);
      setEditedCategory(ticket.categoryId);
      setEditedSubcategory(ticket.subcategoryId);
      setEditedAgent(ticket.assignedToUserId || ticket.assignedToUser?.id || null);
      setEditedCustomFields(ticket.customFieldValues || {});
      loadSettings();
    }
  }, [ticket, canEditTicket]);

  // Track changes
  useEffect(() => {
    if (!ticket) return;
    const changed = 
      editedStatus !== ticket.status ||
      editedPriority !== ticket.priority ||
      editedCategory !== ticket.categoryId ||
      editedSubcategory !== ticket.subcategoryId ||
      editedAgent !== (ticket.assignedToUserId || ticket.assignedToUser?.id || null);
    setHasChanges(changed);
  }, [editedStatus, editedPriority, editedCategory, editedSubcategory, editedAgent, ticket]);

  // Save properties
  const saveProperties = async () => {
    setIsSaving(true);
    try {
      const selectedPriority = priorities.find(p => p.id === editedPriority || p.level === editedPriority);
      
      const updateData: any = {
        categoryId: editedCategory,
        subcategoryId: editedSubcategory,
        priority: selectedPriority?.level ?? editedPriority,
        status: editedStatus,
        assignedToUserId: editedAgent || null,
        customFieldValues: editedCustomFields,
      };

      const response = await fetch(`${serverUrl}/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        Alert.alert('Success', 'Ticket updated successfully');
        refetch();
        queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
        setHasChanges(false);
      } else {
        const errorData = await response.json().catch(() => ({}));
        Alert.alert('Error', errorData.message || 'Failed to update ticket');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Reopen ticket (for resolved tickets)
  const canReopen = useCallback(() => {
    if (!ticket || ticket.status !== 4) return false;
    const resolvedDate = ticket.resolvedAt ? new Date(ticket.resolvedAt) : 
                         ticket.updatedAt ? new Date(ticket.updatedAt) : null;
    if (!resolvedDate) return false;
    const hoursSinceResolved = (Date.now() - resolvedDate.getTime()) / (1000 * 60 * 60);
    return hoursSinceResolved < 48;
  }, [ticket]);

  const handleReopen = async () => {
    Alert.alert(
      'Reopen Ticket',
      'Are you sure you want to reopen this ticket?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reopen',
          onPress: async () => {
            try {
              const response = await fetch(`${serverUrl}/api/tickets/${ticketId}/reopen`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ reason: 'Reopened from mobile app' }),
              });

              if (response.ok) {
                Alert.alert('Success', 'Ticket reopened successfully');
                refetch();
                queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
              } else {
                const errorText = await response.text();
                Alert.alert('Error', errorText || 'Failed to reopen ticket');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to reopen ticket');
            }
          },
        },
      ]
    );
  };

  // Get filtered subcategories
  const filteredSubcategories = editedCategory 
    ? subcategories.filter(s => s.categoryId === editedCategory)
    : [];

  // Comment attachment handling
  const pickCommentImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow access to photos');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (!result.canceled && result.assets) {
        const asset = result.assets[0];
        setCommentAttachments(prev => [...prev, {
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          type: asset.mimeType || 'image/jpeg',
        }]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const pickCommentDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setCommentAttachments(prev => [...prev, {
          uri: file.uri,
          name: file.name || 'file',
          type: file.mimeType || 'application/octet-stream',
        }]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      addCommentMutation.mutate(newComment.trim());
    }
  };

  const getPriorityColor = (priority: string | number | undefined) => {
    if (priority === undefined || priority === null) return Colors.gray400;
    const p = typeof priority === 'string' ? priority.toLowerCase() : priority;
    switch (p) {
      case 'urgent':
      case 4:
        return '#DC2626';
      case 'high':
      case 3:
        return '#EF4444';
      case 'medium':
      case 2:
        return '#F59E0B';
      case 'low':
      case 1:
      default:
        return '#10B981';
    }
  };

  const getPriorityLabel = (priority: string | number | undefined) => {
    if (priority === undefined || priority === null) return 'Medium';
    const p = typeof priority === 'string' ? priority.toLowerCase() : priority;
    switch (p) {
      case 'urgent':
      case 4:
        return 'Urgent';
      case 'high':
      case 3:
        return 'High';
      case 'medium':
      case 2:
        return 'Medium';
      case 'low':
      case 1:
      default:
        return 'Low';
    }
  };

  const getStatusColor = (status: string | number) => {
    if (status === 'Open' || status === 1) return '#2563EB';
    if (status === 'InProgress' || status === 2) return '#F59E0B';
    if (status === 'Pending' || status === 3) return '#8B5CF6';
    if (status === 'Resolved' || status === 4) return '#10B981';
    if (status === 'Closed' || status === 5) return '#6B7280';
    if (status === 'Merged' || status === 1009) return '#9333EA';
    return Colors.gray400;
  };

  const getStatusName = (status: string | number) => {
    if (typeof status === 'string') return status;
    switch (status) {
      case 1: return 'Open';
      case 2: return 'In Progress';
      case 3: return 'Pending';
      case 4: return 'Resolved';
      case 5: return 'Closed';
      case 1009: return 'Merged';
      default: return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isMyComment = (comment: Comment) => {
    return comment.authorId === user?.id || comment.authorId === (user as any)?.userId;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        {/* Customer Info Header */}
        <View style={styles.customerSection}>
          <TouchableOpacity style={styles.customerHeader}>
            <View style={styles.customerInfo}>
              <View style={styles.customerAvatar}>
                <Text style={styles.customerAvatarText}>
                  {(ticket?.createdByName?.charAt(0) || '?').toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.customerName}>{ticket?.createdByName || 'Unknown'}</Text>
                <Text style={styles.customerMeta}>
                  #{ticket?.publicId || ticketId.slice(0, 8)} • {formatDate(ticket?.createdAt)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
          
          {/* Ticket Title & Description */}
          <Text style={styles.ticketTitle}>{ticket?.title}</Text>
          <Text style={styles.ticketDescription}>{ticket?.description}</Text>
          
          {/* Status & Priority Badges */}
          <View style={styles.badgesRow}>
            <View style={[styles.badge, { backgroundColor: getStatusColor(ticket?.status) + '20' }]}>
              <Text style={[styles.badgeText, { color: getStatusColor(ticket?.status) }]}>
                {getStatusName(ticket?.status)}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: getPriorityColor(ticket?.priority) + '20' }]}>
              <Text style={[styles.badgeText, { color: getPriorityColor(ticket?.priority) }]}>
                {getPriorityLabel(ticket?.priority)}
              </Text>
            </View>
            {ticket?.categoryName && (
              <View style={[styles.badge, { backgroundColor: '#6366F120' }]}>
                <Text style={[styles.badgeText, { color: '#6366F1' }]}>
                  {ticket.categoryName}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Actions & Details Section (Collapsible) - For Admin/CategoryAdmin/Agent */}
        {canEditTicket && (
          <View style={styles.collapsibleSection}>
            <TouchableOpacity 
              style={styles.collapsibleHeader}
              onPress={() => setShowActionsDetails(!showActionsDetails)}
            >
              <View style={styles.collapsibleHeaderLeft}>
                <View style={[styles.collapsibleIcon, { backgroundColor: '#818CF820' }]}>
                  <Ionicons name="settings-outline" size={16} color="#6366F1" />
                </View>
                <Text style={styles.collapsibleTitle}>Actions & Details</Text>
              </View>
              <Ionicons 
                name={showActionsDetails ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color={Colors.gray400} 
              />
            </TouchableOpacity>
            
            {showActionsDetails && (
              <View style={styles.collapsibleContent}>
                {isLoadingSettings ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <>
                    {/* Status & Priority Row */}
                    <View style={styles.formRow}>
                      <View style={styles.formField}>
                        <Text style={styles.formLabel}>STATUS</Text>
                        <View style={styles.chipContainer}>
                          {(statuses.length > 0 ? statuses : [
                            { id: 1, name: 'Open' },
                            { id: 2, name: 'In Progress' },
                            { id: 3, name: 'Pending' },
                            { id: 4, name: 'Resolved' },
                            { id: 5, name: 'Closed' },
                          ]).map(s => (
                            <TouchableOpacity
                              key={s.id}
                              style={[styles.chip, editedStatus === s.id && styles.chipSelected]}
                              onPress={() => setEditedStatus(s.id)}
                            >
                              <Text style={[styles.chipText, editedStatus === s.id && styles.chipTextSelected]}>
                                {s.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    </View>

                    <View style={styles.formRow}>
                      <View style={styles.formField}>
                        <Text style={styles.formLabel}>PRIORITY</Text>
                        <View style={styles.chipContainer}>
                          {(priorities.length > 0 ? priorities : [
                            { id: 1, name: 'Low', level: 1 },
                            { id: 2, name: 'Medium', level: 2 },
                            { id: 3, name: 'High', level: 3 },
                            { id: 4, name: 'Urgent', level: 4 },
                          ]).map(p => (
                            <TouchableOpacity
                              key={p.id}
                              style={[
                                styles.chip, 
                                (editedPriority === p.id || editedPriority === p.level) && {
                                  backgroundColor: getPriorityColor(p.level) + '20',
                                  borderColor: getPriorityColor(p.level),
                                }
                              ]}
                              onPress={() => setEditedPriority(p.level)}
                            >
                              <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(p.level) }]} />
                              <Text style={[
                                styles.chipText, 
                                (editedPriority === p.id || editedPriority === p.level) && { color: getPriorityColor(p.level) }
                              ]}>
                                {p.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    </View>

                    {/* Category */}
                    <View style={styles.formRow}>
                      <View style={styles.formField}>
                        <Text style={styles.formLabel}>CATEGORY</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          <View style={styles.chipContainer}>
                            {categories.map(c => (
                              <TouchableOpacity
                                key={c.id}
                                style={[styles.chip, editedCategory === c.id && styles.chipSelected]}
                                onPress={() => {
                                  setEditedCategory(c.id);
                                  setEditedSubcategory(null);
                                }}
                              >
                                <Text style={[styles.chipText, editedCategory === c.id && styles.chipTextSelected]}>
                                  {c.name}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </ScrollView>
                      </View>
                    </View>

                    {/* Subcategory */}
                    {filteredSubcategories.length > 0 && (
                      <View style={styles.formRow}>
                        <View style={styles.formField}>
                          <Text style={styles.formLabel}>SUBCATEGORY</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.chipContainer}>
                              {filteredSubcategories.map(s => (
                                <TouchableOpacity
                                  key={s.id}
                                  style={[styles.chip, editedSubcategory === s.id && styles.chipSelected]}
                                  onPress={() => setEditedSubcategory(s.id)}
                                >
                                  <Text style={[styles.chipText, editedSubcategory === s.id && styles.chipTextSelected]}>
                                    {s.name}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </ScrollView>
                        </View>
                      </View>
                    )}

                    {/* Custom Fields - Below Subcategory */}
                    {customFields.length > 0 && (
                      <View style={styles.customFieldsContainer}>
                        <Text style={[styles.formLabel, { marginBottom: Spacing.sm }]}>CUSTOM FIELDS</Text>
                        {customFields.map(field => (
                          <View key={field.id} style={styles.customFieldRow}>
                            <Text style={styles.customFieldLabel}>{field.label}</Text>
                            {field.type === 'select' && field.options ? (
                              <View style={styles.chipContainer}>
                                {field.options.map((opt, i) => (
                                  <TouchableOpacity
                                    key={i}
                                    style={[
                                      styles.chipSmall,
                                      editedCustomFields[field.id.toString()] === opt && styles.chipSelected
                                    ]}
                                    onPress={() => setEditedCustomFields(prev => ({
                                      ...prev,
                                      [field.id.toString()]: opt
                                    }))}
                                  >
                                    <Text style={[
                                      styles.chipTextSmall,
                                      editedCustomFields[field.id.toString()] === opt && styles.chipTextSelected
                                    ]}>
                                      {opt}
                                    </Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            ) : (
                              <TextInput
                                style={styles.customFieldInput}
                                value={editedCustomFields[field.id.toString()] || ''}
                                onChangeText={(value) => setEditedCustomFields(prev => ({
                                  ...prev,
                                  [field.id.toString()]: value
                                }))}
                                placeholder={`Enter ${field.label.toLowerCase()}`}
                                placeholderTextColor={Colors.gray400}
                              />
                            )}
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Assigned Agent */}
                    <View style={styles.formRow}>
                      <View style={styles.formField}>
                        <Text style={styles.formLabel}>ASSIGNED TO</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          <View style={styles.chipContainer}>
                            <TouchableOpacity
                              style={[styles.chip, editedAgent === null && styles.chipSelected]}
                              onPress={() => setEditedAgent(null)}
                            >
                              <Text style={[styles.chipText, editedAgent === null && styles.chipTextSelected]}>
                                Unassigned
                              </Text>
                            </TouchableOpacity>
                            {agents.map(a => (
                              <TouchableOpacity
                                key={a.id}
                                style={[styles.chip, editedAgent === a.id && styles.chipSelected]}
                                onPress={() => setEditedAgent(a.id)}
                              >
                                <View style={styles.agentAvatar}>
                                  <Text style={styles.agentAvatarText}>
                                    {a.firstName?.charAt(0)}{a.lastName?.charAt(0)}
                                  </Text>
                                </View>
                                <Text style={[styles.chipText, editedAgent === a.id && styles.chipTextSelected]}>
                                  {a.firstName} {a.lastName}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </ScrollView>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtonsRow}>
                      {canReopen() && (
                        <TouchableOpacity style={styles.escalateButton} onPress={handleReopen}>
                          <Ionicons name="refresh" size={16} color="#EA580C" />
                          <Text style={styles.escalateButtonText}>Reopen</Text>
                        </TouchableOpacity>
                      )}
                      {hasChanges && (
                        <TouchableOpacity 
                          style={styles.saveButton} 
                          onPress={saveProperties}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <>
                              <Ionicons name="checkmark-circle" size={16} color="#fff" />
                              <Text style={styles.saveButtonText}>Save Changes</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  </>
                )}
              </View>
            )}
          </View>
        )}

        {/* Attachments Section (Collapsible) */}
        {ticket?.attachments && ticket.attachments.length > 0 && (
          <View style={styles.collapsibleSection}>
            <TouchableOpacity 
              style={styles.collapsibleHeader}
              onPress={() => setShowAttachments(!showAttachments)}
            >
              <View style={styles.collapsibleHeaderLeft}>
                <View style={[styles.collapsibleIcon, { backgroundColor: '#A855F720' }]}>
                  <Ionicons name="attach" size={16} color="#9333EA" />
                </View>
                <Text style={styles.collapsibleTitle}>Attachments</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{ticket.attachments.length}</Text>
                </View>
              </View>
              <Ionicons 
                name={showAttachments ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color={Colors.gray400} 
              />
            </TouchableOpacity>
            
            {showAttachments && (
              <View style={styles.attachmentsContent}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {ticket.attachments.map((att: Attachment) => (
                    <TouchableOpacity 
                      key={att.id} 
                      style={styles.attachmentCard}
                      onPress={() => {
                        const downloadUrl = `${serverUrl}/api/tickets-v2/attachments/${att.id}/download`;
                        Linking.openURL(downloadUrl).catch(() => {
                          Alert.alert('Error', 'Could not open attachment');
                        });
                      }}
                    >
                      <View style={styles.attachmentPreview}>
                        {att.contentType?.startsWith('image/') ? (
                          <Ionicons name="image" size={28} color={Colors.gray400} />
                        ) : (
                          <Ionicons name="document" size={28} color={Colors.gray400} />
                        )}
                      </View>
                      <View style={styles.attachmentInfo}>
                        <Text style={styles.attachmentName} numberOfLines={1}>{att.fileName}</Text>
                        <Text style={styles.attachmentSize}>
                          {((att.sizeBytes || att.fileSize || 0) / 1024).toFixed(0)} KB
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* Conversation History */}
        <View style={styles.conversationSection}>
          <View style={styles.conversationHeader}>
            <Text style={styles.conversationTitle}>CONVERSATION HISTORY</Text>
          </View>
          
          {/* Date Separator */}
          <View style={styles.dateSeparator}>
            <View style={styles.dateLine} />
            <Text style={styles.dateText}>Today</Text>
            <View style={styles.dateLine} />
          </View>

          {/* Comments */}
          {comments.map((comment: Comment) => {
            const isMine = isMyComment(comment);
            const isInternal = comment.isInternal;

            if (isInternal) {
              // Internal Note Style
              return (
                <View key={comment.id} style={styles.internalNoteContainer}>
                  <View style={styles.internalNoteBorder} />
                  <View style={styles.internalNoteCard}>
                    <View style={styles.internalNoteHeader}>
                      <View style={styles.internalNoteBadge}>
                        <Ionicons name="lock-closed" size={12} color="#B45309" />
                        <Text style={styles.internalNoteLabel}>INTERNAL NOTE</Text>
                      </View>
                      <Text style={styles.internalNoteTime}>{formatDate(comment.createdAt)}</Text>
                    </View>
                    <Text style={styles.internalNoteBody}>{comment.body}</Text>
                    <View style={styles.internalNoteAuthor}>
                      <View style={styles.authorAvatarSmall}>
                        <Text style={styles.authorAvatarSmallText}>
                          {comment.authorName?.charAt(0)?.toUpperCase() || '?'}
                        </Text>
                      </View>
                      <Text style={styles.internalNoteAuthorName}>{comment.authorName}</Text>
                    </View>
                  </View>
                </View>
              );
            }

            // Regular Comment - Chat Bubble Style
            return (
              <View 
                key={comment.id} 
                style={[styles.messageBubbleContainer, isMine && styles.messageBubbleContainerRight]}
              >
                {!isMine && (
                  <View style={styles.messageAvatar}>
                    <Text style={styles.messageAvatarText}>
                      {comment.authorName?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                )}
                <View style={styles.messageContent}>
                  <View style={styles.messageHeader}>
                    <Text style={styles.messageAuthor}>{isMine ? 'You' : comment.authorName}</Text>
                    <Text style={styles.messageTime}>{formatDate(comment.createdAt)}</Text>
                  </View>
                  <View style={[styles.messageBubble, isMine && styles.messageBubbleMine]}>
                    <Text style={[styles.messageText, isMine && styles.messageTextMine]}>
                      {comment.body}
                    </Text>
                  </View>
                </View>
                {isMine && (
                  <View style={styles.messageAvatarMine}>
                    <Text style={styles.messageAvatarMineText}>
                      {user?.firstName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'Y'}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Spacer for input */}
        <View style={{ height: 180 }} />
      </ScrollView>

      {/* Reply Input Area */}
      <View style={styles.replyContainer}>
        {/* Reply Type Toggle - Show internal note option for Admin/CategoryAdmin/Agent */}
        {canEditTicket && (
          <View style={styles.replyTypeRow}>
            <TouchableOpacity 
              style={styles.replyTypeOption}
              onPress={() => setIsInternalNote(false)}
            >
              <View style={[styles.radioCircle, !isInternalNote && styles.radioCircleSelected]} />
              <Text style={[styles.replyTypeText, !isInternalNote && styles.replyTypeTextSelected]}>
                Public Reply
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.replyTypeOption}
              onPress={() => setIsInternalNote(true)}
            >
              <View style={[styles.radioCircle, styles.radioCircleInternal, isInternalNote && styles.radioCircleInternalSelected]} />
              <Text style={[styles.replyTypeText, isInternalNote && { color: '#B45309' }]}>
                Internal Note
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Comment Attachments Preview */}
        {commentAttachments.length > 0 && (
          <ScrollView horizontal style={styles.commentAttachmentPreview}>
            {commentAttachments.map((att, idx) => (
              <View key={idx} style={styles.commentAttachmentItem}>
                <Text style={styles.commentAttachmentName} numberOfLines={1}>{att.name}</Text>
                <TouchableOpacity onPress={() => setCommentAttachments(prev => prev.filter((_, i) => i !== idx))}>
                  <Ionicons name="close-circle" size={16} color={Colors.gray400} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Input Box */}
        <View style={[styles.replyInputContainer, isInternalNote && styles.replyInputContainerInternal]}>
          <TextInput
            style={styles.replyInput}
            placeholder={isInternalNote ? "Write an internal note..." : "Type your reply here..."}
            placeholderTextColor={Colors.gray400}
            value={newComment}
            onChangeText={setNewComment}
            multiline
          />
          <View style={styles.replyActions}>
            <TouchableOpacity style={styles.replyActionButton} onPress={pickCommentImage}>
              <Ionicons name="image-outline" size={20} color={Colors.gray500} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.replyActionButton} onPress={pickCommentDocument}>
              <Ionicons name="attach" size={20} color={Colors.gray500} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sendButton, !newComment.trim() && styles.sendButtonDisabled]}
              onPress={handleAddComment}
              disabled={!newComment.trim() || addCommentMutation.isPending}
            >
              {addCommentMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  
  // Customer Section
  customerSection: {
    backgroundColor: '#fff',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  customerHeader: {
    marginBottom: Spacing.md,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  customerMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  ticketTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: Spacing.sm,
  },
  ticketDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 21,
    marginBottom: Spacing.md,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  
  // Collapsible Sections
  collapsibleSection: {
    marginHorizontal: 12,
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  collapsibleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  collapsibleIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapsibleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  collapsibleContent: {
    padding: 14,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  countBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
  },
  
  // Form Fields
  formRow: {
    marginBottom: 16,
  },
  formField: {},
  formLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: '#374151',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  chipSmall: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipTextSmall: {
    fontSize: 12,
    color: '#374151',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  agentAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentAvatarText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#fff',
  },
  
  // Custom Fields
  customFieldsContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginBottom: 16,
  },
  customFieldRow: {
    marginBottom: 12,
  },
  customFieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 6,
  },
  customFieldInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#111827',
  },
  
  // Action Buttons
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  escalateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FDBA74',
    borderRadius: 10,
  },
  escalateButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EA580C',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: '#111827',
    borderRadius: 10,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Attachments
  attachmentsContent: {
    padding: 12,
    paddingTop: 0,
  },
  attachmentCard: {
    width: 110,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  attachmentPreview: {
    height: 70,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentInfo: {
    padding: 8,
  },
  attachmentName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#111827',
  },
  attachmentSize: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  
  // Conversation
  conversationSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  conversationTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dateText: {
    marginHorizontal: 12,
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  
  // Message Bubbles
  messageBubbleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
    gap: 10,
  },
  messageBubbleContainerRight: {
    flexDirection: 'row-reverse',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  messageAvatarMine: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageAvatarMineText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  messageContent: {
    flex: 1,
    maxWidth: '80%',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    marginLeft: 4,
  },
  messageAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  messageTime: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  messageBubble: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageBubbleMine: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
  messageTextMine: {
    color: '#fff',
  },
  
  // Internal Note
  internalNoteContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  internalNoteBorder: {
    width: 3,
    backgroundColor: '#FCD34D',
    borderRadius: 2,
    marginRight: 12,
  },
  internalNoteCard: {
    flex: 1,
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  internalNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  internalNoteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  internalNoteLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  internalNoteTime: {
    fontSize: 10,
    color: '#D97706',
  },
  internalNoteBody: {
    fontSize: 13,
    color: '#1F2937',
    lineHeight: 19,
  },
  internalNoteAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#FDE68A50',
  },
  authorAvatarSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorAvatarSmallText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#fff',
  },
  internalNoteAuthorName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
  },
  
  // Reply Container
  replyContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 12,
    paddingBottom: 24,
  },
  replyTypeRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 10,
    paddingLeft: 4,
  },
  replyTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  radioCircleInternal: {
    borderColor: '#D1D5DB',
  },
  radioCircleInternalSelected: {
    borderColor: '#F59E0B',
    backgroundColor: '#F59E0B',
  },
  replyTypeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  replyTypeTextSelected: {
    color: '#111827',
  },
  commentAttachmentPreview: {
    marginBottom: 8,
  },
  commentAttachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  commentAttachmentName: {
    fontSize: 11,
    color: '#374151',
    maxWidth: 100,
  },
  replyInputContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  replyInputContainerInternal: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  replyInput: {
    padding: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 50,
    maxHeight: 100,
  },
  replyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  replyActionButton: {
    padding: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
});
