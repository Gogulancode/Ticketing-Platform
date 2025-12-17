import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import { dashboardApi, ticketsApi } from '../services/api';

interface StatCardProps {
  title: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  percentage?: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, percentage }) => (
  <View style={[styles.statCard, { borderColor: `${color}30` }]}>
    <View style={styles.statHeader}>
      <Text style={styles.statTitle}>{title}</Text>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <View style={styles.progressBar}>
      <View style={[styles.progressFill, { backgroundColor: color, width: `${percentage || 50}%` }]} />
    </View>
  </View>
);

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const isAgent = user?.role === 'Admin' || user?.role === 'Agent' || user?.role === 'CategoryAdmin';

  const { data: ticketsData, isLoading, refetch } = useQuery({
    queryKey: ['my-tickets'],
    queryFn: () => ticketsApi.getMyTickets(1, 10),
  });

  const tickets = ticketsData?.data || [];
  const openTickets = tickets.filter((t: any) => t.status === 'Open' || t.status === 1).length;
  const inProgressTickets = tickets.filter((t: any) => t.status === 'InProgress' || t.status === 2).length;
  const resolvedTickets = tickets.filter((t: any) => t.status === 'Resolved' || t.status === 3).length;
  const closedTickets = tickets.filter((t: any) => t.status === 'Closed' || t.status === 4).length;
  const totalTickets = tickets.length;

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Text>
            </View>
            <View>
              <Text style={styles.greeting}>Hello, {user?.firstName} 👋</Text>
              <Text style={styles.role}>{user?.role}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={Colors.gray600} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        {/* SLA Alert - Only for Agents */}
        {isAgent && openTickets > 0 && (
          <TouchableOpacity style={styles.alertCard}>
            <View style={styles.alertIcon}>
              <Ionicons name="warning" size={24} color={Colors.error} />
            </View>
            <View style={styles.alertContent}>
              <View style={styles.alertHeader}>
                <Text style={styles.alertTitle}>SLA Breach Warning</Text>
                <View style={styles.alertBadge}>
                  <Text style={styles.alertBadgeText}>Critical</Text>
                </View>
              </View>
              <Text style={styles.alertDescription}>
                {openTickets} open tickets require attention.
              </Text>
              <View style={styles.alertAction}>
                <Text style={styles.alertActionText}>View Tickets</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.error} />
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Ticket Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ticket Overview</Text>
            <View style={styles.todayBadge}>
              <Text style={styles.todayBadgeText}>Today</Text>
            </View>
          </View>
          <View style={styles.statsGrid}>
            <StatCard
              title="Open"
              value={openTickets}
              icon="mail-open-outline"
              color={Colors.statusOpen}
              percentage={(openTickets / Math.max(totalTickets, 1)) * 100}
            />
            <StatCard
              title="In Progress"
              value={inProgressTickets}
              icon="time-outline"
              color={Colors.statusInProgress}
              percentage={(inProgressTickets / Math.max(totalTickets, 1)) * 100}
            />
            <StatCard
              title="Resolved"
              value={resolvedTickets}
              icon="checkmark-circle-outline"
              color={Colors.statusResolved}
              percentage={(resolvedTickets / Math.max(totalTickets, 1)) * 100}
            />
            <StatCard
              title="Closed"
              value={closedTickets}
              icon="archive-outline"
              color={Colors.statusClosed}
              percentage={(closedTickets / Math.max(totalTickets, 1)) * 100}
            />
          </View>
        </View>

        {/* My Queue Card */}
        <TouchableOpacity 
          style={styles.queueCard}
          onPress={() => navigation.navigate('Tickets')}
        >
          <View style={styles.queueHeader}>
            <View style={styles.queueIconContainer}>
              <Ionicons name="person" size={20} color={Colors.white} />
            </View>
            <Text style={styles.queueTitle}>My Queue</Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveIndicator} />
              <Text style={styles.liveBadgeText}>Live</Text>
            </View>
          </View>
          <Text style={styles.queueDescription}>
            You have <Text style={styles.queueCount}>{tickets.length}</Text> active tickets currently assigned to you.
          </Text>
          <TouchableOpacity 
            style={styles.viewTicketsButton}
            onPress={() => navigation.navigate('Tickets')}
          >
            <Text style={styles.viewTicketsText}>View My Tickets</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Performance Section - Only for Agents */}
        {isAgent && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance</Text>
            <View style={styles.performanceGrid}>
              <View style={styles.performanceCard}>
                <Text style={styles.performanceLabel}>AVG RESPONSE</Text>
                <Text style={styles.performanceValue}>1h 20m</Text>
                <View style={styles.performanceTrend}>
                  <Ionicons name="trending-down" size={16} color={Colors.success} />
                  <Text style={styles.performanceTrendText}>10%</Text>
                </View>
              </View>
              <View style={styles.performanceCard}>
                <Text style={styles.performanceLabel}>RESOLUTION</Text>
                <Text style={styles.performanceValue}>92%</Text>
                <View style={styles.performanceTrend}>
                  <Ionicons name="trending-up" size={16} color={Colors.success} />
                  <Text style={styles.performanceTrendText}>2.4%</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.soft,
  },
  avatarText: {
    color: Colors.white,
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  greeting: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  role: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.soft,
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: `${Colors.error}20`,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.soft,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.error}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  alertTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.gray900,
  },
  alertBadge: {
    backgroundColor: `${Colors.error}15`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  alertBadgeText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.error,
  },
  alertDescription: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  alertAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  alertActionText: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.error,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  todayBadge: {
    backgroundColor: Colors.gray100,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  todayBadgeText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    ...Shadows.soft,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  statTitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.gray100,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  queueCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    ...Shadows.soft,
  },
  queueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  queueIconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.primary,
  },
  queueTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${Colors.success}15`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: `${Colors.success}30`,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  liveBadgeText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.success,
  },
  queueDescription: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  queueCount: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  viewTicketsButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    ...Shadows.primary,
  },
  viewTicketsText: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  performanceGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  performanceCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    ...Shadows.soft,
  },
  performanceLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  performanceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  performanceTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${Colors.success}15`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: `${Colors.success}30`,
  },
  performanceTrendText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.success,
  },
});
