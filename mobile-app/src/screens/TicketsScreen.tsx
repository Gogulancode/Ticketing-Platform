import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../constants/theme';
import { ticketsApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

const getPriorityColor = (priority: string | number) => {
  const p = typeof priority === 'string' ? priority.toLowerCase() : priority;
  switch (p) {
    case 'urgent':
    case 4:
      return Colors.priorityUrgent;
    case 'high':
    case 3:
      return Colors.priorityHigh;
    case 'medium':
    case 2:
      return Colors.priorityMedium;
    case 'low':
    case 1:
    default:
      return Colors.priorityLow;
  }
};

const getPriorityLabel = (priority: string | number) => {
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
      return 'Med';
    case 'low':
    case 1:
    default:
      return 'Low';
  }
};

const getStatusColor = (status: string | number) => {
  const s = typeof status === 'string' ? status.toLowerCase() : status;
  switch (s) {
    case 'open':
    case 1:
      return Colors.statusOpen;
    case 'inprogress':
    case 2:
      return Colors.statusInProgress;
    case 'resolved':
    case 3:
      return Colors.statusResolved;
    case 'closed':
    case 4:
      return Colors.statusClosed;
    default:
      return Colors.gray400;
  }
};

const formatTimeAgo = (date: string) => {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString();
};

interface TicketItemProps {
  ticket: any;
  onPress: () => void;
  isClosed?: boolean;
}

const TicketItem: React.FC<TicketItemProps> = ({ ticket, onPress, isClosed }) => {
  const priorityColor = getPriorityColor(ticket.priority);
  const priorityLabel = getPriorityLabel(ticket.priority);

  return (
    <TouchableOpacity
      style={[styles.ticketCard, isClosed && styles.ticketCardClosed]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.priorityIndicator, { backgroundColor: priorityColor }]} />
      <View style={styles.ticketContent}>
        <View style={styles.ticketHeader}>
          <View style={styles.ticketMeta}>
            <Text style={styles.ticketId}>#{ticket.publicId || ticket.id?.slice(0, 4)}</Text>
            <View style={[styles.priorityBadge, { backgroundColor: `${priorityColor}15`, borderColor: `${priorityColor}30` }]}>
              <Text style={[styles.priorityText, { color: priorityColor }]}>{priorityLabel}</Text>
            </View>
          </View>
          <Text style={styles.ticketTime}>{formatTimeAgo(ticket.createdAt)}</Text>
        </View>

        <Text style={[styles.ticketTitle, isClosed && styles.ticketTitleClosed]} numberOfLines={1}>
          {ticket.title}
        </Text>
        <Text style={[styles.ticketDescription, isClosed && styles.ticketDescriptionClosed]} numberOfLines={1}>
          {ticket.description || 'No description provided'}
        </Text>

        <View style={styles.ticketFooter}>
          <View style={styles.createdBy}>
            <View style={styles.createdByAvatar}>
              <Text style={styles.createdByAvatarText}>
                {ticket.createdByUser?.firstName?.[0] || 'U'}
              </Text>
            </View>
            <Text style={styles.createdByName}>
              {ticket.createdByUser?.firstName || 'Unknown'} {ticket.createdByUser?.lastName?.[0] || ''}
            </Text>
          </View>
          <View style={[styles.categoryBadge, { backgroundColor: `${Colors.primary}10` }]}>
            <Text style={[styles.categoryText, { color: Colors.primary }]}>
              {ticket.categoryName || 'General'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function TicketsScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('open');
  const isAgent = user?.role === 'Admin' || user?.role === 'Agent' || user?.role === 'CategoryAdmin';

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['tickets', isAgent ? 'all' : 'my'],
    queryFn: () => isAgent ? ticketsApi.getAllTickets(1, 50) : ticketsApi.getMyTickets(1, 50),
  });

  const tickets = data?.data || [];
  
  const filteredTickets = tickets.filter((ticket: any) => {
    // Filter by status
    const status = typeof ticket.status === 'string' ? ticket.status.toLowerCase() : ticket.status;
    if (activeFilter === 'open' && status !== 'open' && status !== 1) return false;
    if (activeFilter === 'inprogress' && status !== 'inprogress' && status !== 2) return false;
    if (activeFilter === 'closed' && status !== 'closed' && status !== 4) return false;
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        ticket.title?.toLowerCase().includes(query) ||
        ticket.publicId?.toString().includes(query) ||
        ticket.description?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const renderTicket = ({ item }: { item: any }) => (
    <TicketItem
      ticket={item}
      onPress={() => navigation.navigate('TicketDetail', { ticketId: item.id })}
      isClosed={item.status === 'Closed' || item.status === 4}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>My Tickets</Text>
          <TouchableOpacity style={styles.selectButton}>
            <Text style={styles.selectButtonText}>Select</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.gray400} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by ID, subject, or name..."
              placeholderTextColor={Colors.gray500}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options" size={24} color={Colors.gray500} />
          </TouchableOpacity>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterChips}>
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'open' && styles.filterChipActive]}
            onPress={() => setActiveFilter('open')}
          >
            <Text style={[styles.filterChipText, activeFilter === 'open' && styles.filterChipTextActive]}>
              Status: Open
            </Text>
            {activeFilter === 'open' && (
              <Ionicons name="close" size={16} color={Colors.white} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'inprogress' && styles.filterChipActive]}
            onPress={() => setActiveFilter('inprogress')}
          >
            <Text style={[styles.filterChipText, activeFilter === 'inprogress' && styles.filterChipTextActive]}>
              In Progress
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'closed' && styles.filterChipActive]}
            onPress={() => setActiveFilter('closed')}
          >
            <Text style={[styles.filterChipText, activeFilter === 'closed' && styles.filterChipTextActive]}>
              Closed
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Ticket List */}
      <FlatList
        data={filteredTickets}
        renderItem={renderTicket}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="ticket-outline" size={64} color={Colors.gray300} />
            <Text style={styles.emptyTitle}>No tickets found</Text>
            <Text style={styles.emptyDescription}>
              {searchQuery ? 'Try adjusting your search' : 'Create a new ticket to get started'}
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateTicket')}
      >
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  selectButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  selectButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.primary,
  },
  searchRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
  },
  filterButton: {
    width: 44,
    height: 44,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChips: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.gray300,
    ...Shadows.soft,
  },
  filterChipActive: {
    backgroundColor: Colors.gray800,
    borderColor: Colors.gray800,
  },
  filterChipText: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    color: Colors.gray700,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  ticketCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.gray100,
    overflow: 'hidden',
    ...Shadows.soft,
  },
  ticketCardClosed: {
    backgroundColor: Colors.gray100,
    opacity: 0.75,
  },
  priorityIndicator: {
    width: 4,
    marginVertical: Spacing.lg,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  ticketContent: {
    flex: 1,
    padding: Spacing.md,
    paddingLeft: Spacing.md,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  ticketMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  ticketId: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.gray400,
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ticketTime: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.gray400,
  },
  ticketTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  ticketTitleClosed: {
    color: Colors.gray600,
    textDecorationLine: 'line-through',
  },
  ticketDescription: {
    fontSize: 13,
    color: Colors.gray500,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  ticketDescriptionClosed: {
    color: Colors.gray400,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
  },
  createdBy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  createdByAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createdByAvatarText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
  },
  createdByName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gray700,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.gray600,
    marginTop: Spacing.lg,
  },
  emptyDescription: {
    fontSize: FontSizes.sm,
    color: Colors.gray400,
    marginTop: Spacing.xs,
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.primary,
  },
});
