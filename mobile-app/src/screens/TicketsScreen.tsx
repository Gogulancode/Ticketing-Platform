import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../constants/theme';
import { ticketsApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

const getPriorityColor = (priority: string | number | undefined | null) => {
  if (priority === undefined || priority === null) return Colors.priorityLow;
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

const getPriorityLabel = (priority: string | number | undefined | null) => {
  if (priority === undefined || priority === null) return 'Low';
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

const TicketItem = React.memo<TicketItemProps>(({ ticket, onPress, isClosed }) => {
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
});

export default function TicketsScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<number | null>(null);
  
  // Role detection - use exact matching to avoid "categoryadmin".includes("admin") = true issue
  const isAdmin = user?.role === 'Admin' || user?.roles?.includes('Admin');
  const isCategoryAdmin = user?.isCategoryAdmin || user?.role === 'CategoryAdmin';
  const isAgent = user?.role === 'Agent' || user?.roles?.includes('Agent');
  
  // Only Admin uses getAllTickets. CategoryAdmin and Agent use getMyTickets (backend handles filtering)
  // Backend /api/tickets/my returns:
  // - Admin: All tickets
  // - CategoryAdmin: Own tickets + tickets from managed categories
  // - Agent: Own tickets + assigned tickets
  // - User: Own tickets only
  const useAllTickets = isAdmin;

  const { data, isLoading, refetch, error } = useQuery({
    queryKey: ['tickets', useAllTickets ? 'all' : 'my'],
    queryFn: async () => {
      console.log('Fetching tickets, isAdmin:', isAdmin, 'isCategoryAdmin:', isCategoryAdmin, 'isAgent:', isAgent);
      // Use getMyTickets for everyone except pure Admin
      // The backend properly filters based on role
      const result = useAllTickets 
        ? await ticketsApi.getAllTickets(1, 500) 
        : await ticketsApi.getMyTickets(1, 500);
      console.log('Tickets result:', result);
      return result;
    },
  });

  const tickets = data?.data || data || [];
  console.log('Tickets count:', tickets.length, 'isAgent:', isAgent, 'error:', error);
  
  // Calculate stats
  const totalCount = tickets.length;
  const openCount = tickets.filter((t: any) => t.status === 1 || t.status === 'Open').length;
  const inProgressCount = tickets.filter((t: any) => t.status === 2 || t.status === 'InProgress').length;
  const resolvedCount = tickets.filter((t: any) => t.status === 4 || t.status === 'Resolved' || t.status === 5 || t.status === 'Closed').length;
  const mergedCount = tickets.filter((t: any) => t.status === 1009 || t.status === 'Merged').length;
  
  const stats = [
    { key: null, label: 'Total', count: totalCount, color: '#64748B' },
    { key: 1, label: 'Open', count: openCount, color: '#3B82F6' },
    { key: 2, label: 'In Progress', count: inProgressCount, color: '#F59E0B' },
    { key: 4, label: 'Resolved', count: resolvedCount, color: '#10B981' },
    { key: 1009, label: 'Merged', count: mergedCount, color: '#9333EA' },
  ];
  
  const filteredTickets = tickets.filter((ticket: any) => {
    // Filter by status
    const status = typeof ticket.status === 'string' ? ticket.status.toLowerCase() : ticket.status;
    if (activeFilter !== null) {
      if (activeFilter === 1 && status !== 'open' && status !== 1) return false;
      if (activeFilter === 2 && status !== 'inprogress' && status !== 2) return false;
      if (activeFilter === 4 && status !== 'resolved' && status !== 4 && status !== 'closed' && status !== 5) return false;
      if (activeFilter === 1009 && status !== 'merged' && status !== 1009) return false;
    }
    
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

  const renderTicket = useCallback(({ item }: { item: any }) => (
    <TicketItem
      ticket={item}
      onPress={() => navigation.navigate('TicketDetail', { ticketId: item.id })}
      isClosed={item.status === 'Closed' || item.status === 4}
    />
  ), [navigation]);

  // Dynamic header title based on role
  const getHeaderTitle = () => {
    if (isAdmin) return 'All Tickets';
    if (isCategoryAdmin) return 'Category Tickets';
    if (isAgent) return 'My Assigned Tickets';
    return 'My Tickets';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={onRefresh}
          >
            <Ionicons name="refresh" size={22} color={Colors.gray600} />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.statsRow}
          contentContainerStyle={styles.statsRowContent}
        >
          {stats.map((stat) => (
            <TouchableOpacity
              key={stat.key ?? 'total'}
              style={[
                styles.statCard,
                activeFilter === stat.key && { borderColor: stat.color, borderWidth: 2 }
              ]}
              onPress={() => setActiveFilter(activeFilter === stat.key ? null : stat.key)}
            >
              <Text style={[styles.statCount, { color: stat.color }]}>{stat.count}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.gray400} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by ID, title, or description..."
              placeholderTextColor={Colors.gray500}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={Colors.gray400} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Active Filter Badge */}
        {activeFilter !== null && (
          <View style={styles.activeFilterRow}>
            <View style={styles.activeFilterBadge}>
              <Text style={styles.activeFilterText}>
                Filtered: {stats.find(s => s.key === activeFilter)?.label}
              </Text>
              <TouchableOpacity onPress={() => setActiveFilter(null)}>
                <Ionicons name="close" size={16} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        )}
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
        // Performance optimizations for smooth scrolling
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
        getItemLayout={(data, index) => ({
          length: 130, // Approximate height of each ticket card
          offset: 130 * index,
          index,
        })}
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
  refreshButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100,
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
  statsRow: {
    marginBottom: Spacing.md,
    marginHorizontal: -Spacing.lg,
  },
  statsRowContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  statCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minWidth: 80,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  statCount: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: FontSizes.xs,
    color: Colors.gray500,
    marginTop: 2,
  },
  activeFilterRow: {
    marginBottom: Spacing.sm,
  },
  activeFilterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  activeFilterText: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    color: Colors.white,
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
    marginRight: Spacing.sm,
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
