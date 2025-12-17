import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../constants/theme';
import { ticketsApi } from '../services/api';

interface Comment {
  id: string;
  body: string;
  authorName: string;
  isInternal: boolean;
  createdAt: string;
}

export default function TicketDetailScreen({ route }: any) {
  const { ticketId } = route.params;
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');

  const { data: ticket, isLoading, refetch } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => ticketsApi.getTicketById(ticketId),
  });

  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ['ticket-comments', ticketId],
    queryFn: () => ticketsApi.getComments(ticketId),
  });

  const addCommentMutation = useMutation({
    mutationFn: (content: string) => ticketsApi.addComment(ticketId, content),
    onSuccess: () => {
      setNewComment('');
      refetchComments();
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
    },
  });

  const handleAddComment = () => {
    if (newComment.trim()) {
      addCommentMutation.mutate(newComment.trim());
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return Colors.priorityUrgent;
      case 'high': return Colors.priorityHigh;
      case 'medium': return Colors.priorityMedium;
      case 'low': return Colors.priorityLow;
      default: return Colors.gray400;
    }
  };

  const getStatusColor = (status: string | number) => {
    if (status === 'Open' || status === 1) return Colors.statusOpen;
    if (status === 'InProgress' || status === 2) return Colors.statusInProgress;
    if (status === 'Resolved' || status === 3) return Colors.statusResolved;
    if (status === 'Closed' || status === 4) return Colors.statusClosed;
    return Colors.gray400;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.ticketMeta}>
            <Text style={styles.ticketId}>#{ticket?.publicId || ticketId.slice(0, 8)}</Text>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(ticket?.priority) + '20' }]}>
              <Text style={[styles.priorityText, { color: getPriorityColor(ticket?.priority) }]}>
                {ticket?.priority || 'Medium'}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket?.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(ticket?.status) }]}>
                {ticket?.statusName || ticket?.status}
              </Text>
            </View>
          </View>
          <Text style={styles.title}>{ticket?.title}</Text>
          <Text style={styles.description}>{ticket?.description}</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="person-outline" size={16} color={Colors.gray500} />
              <Text style={styles.infoText}>{ticket?.createdByName || 'Unknown'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={16} color={Colors.gray500} />
              <Text style={styles.infoText}>{formatDate(ticket?.createdAt)}</Text>
            </View>
          </View>
          
          {ticket?.categoryName && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{ticket.categoryName}</Text>
            </View>
          )}
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.sectionTitle}>Comments ({comments.length})</Text>
          
          {comments.map((comment: Comment) => (
            <View key={comment.id} style={[styles.commentCard, comment.isInternal && styles.internalComment]}>
              <View style={styles.commentHeader}>
                <View style={styles.commentAuthor}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {comment.authorName?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                  <Text style={styles.authorName}>{comment.authorName}</Text>
                </View>
                <Text style={styles.commentDate}>{formatDate(comment.createdAt)}</Text>
              </View>
              <Text style={styles.commentBody}>{comment.body}</Text>
              {comment.isInternal && (
                <View style={styles.internalBadge}>
                  <Ionicons name="lock-closed" size={12} color={Colors.warning} />
                  <Text style={styles.internalText}>Internal</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Add Comment Input */}
      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="Write a comment..."
          placeholderTextColor={Colors.gray400}
          value={newComment}
          onChangeText={setNewComment}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, !newComment.trim() && styles.sendButtonDisabled]}
          onPress={handleAddComment}
          disabled={!newComment.trim() || addCommentMutation.isPending}
        >
          {addCommentMutation.isPending ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Ionicons name="send" size={20} color={Colors.white} />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  header: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  ticketMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  ticketId: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.gray500,
    fontFamily: 'monospace',
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  priorityText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginBottom: Spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  infoText: {
    fontSize: FontSizes.sm,
    color: Colors.gray500,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  categoryText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  commentsSection: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  commentCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.soft,
  },
  internalComment: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  commentAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.white,
  },
  authorName: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  commentDate: {
    fontSize: FontSizes.xs,
    color: Colors.gray400,
  },
  commentBody: {
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  internalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
  },
  internalText: {
    fontSize: FontSizes.xs,
    color: Colors.warning,
    fontWeight: '600',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.md,
  },
  commentInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.primary,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.gray300,
    shadowOpacity: 0,
  },
});
