import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import { dashboardApi, ticketsApi } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Status card configuration matching web design
const STATUS_CONFIG = [
  { key: 'open', label: 'New / Open', color: '#3B82F6', bgColor: '#EFF6FF', icon: 'alert-circle-outline', description: 'Awaiting triage' },
  { key: 'inProgress', label: 'In Progress', color: '#F59E0B', bgColor: '#FFFBEB', icon: 'time-outline', description: 'Being worked on' },
  { key: 'waiting', label: 'Waiting', color: '#8B5CF6', bgColor: '#F5F3FF', icon: 'pause-circle-outline', description: 'On hold / blocked' },
  { key: 'resolved', label: 'Resolved', color: '#10B981', bgColor: '#ECFDF5', icon: 'checkmark-circle-outline', description: 'Completed but open' },
  { key: 'closed', label: 'Closed', color: '#64748B', bgColor: '#F8FAFC', icon: 'close-circle-outline', description: 'Fully completed' },
  { key: 'merged', label: 'Merged', color: '#6366F1', bgColor: '#EEF2FF', icon: 'git-merge-outline', description: 'Combined tickets' },
];

// Priority configuration
const PRIORITY_CONFIG = [
  { key: 'urgent', label: 'Urgent', color: '#DC2626', bgColor: '#FEF2F2' },
  { key: 'high', label: 'High', color: '#EA580C', bgColor: '#FFF7ED' },
  { key: 'medium', label: 'Medium', color: '#F59E0B', bgColor: '#FFFBEB' },
  { key: 'low', label: 'Low', color: '#10B981', bgColor: '#ECFDF5' },
];

// Dashboard Analytics interface - matches web frontend
interface DashboardAnalytics {
  weeklyIssueTypes: { issueType: string; count: number; department: string }[];
  weeklyDepartments: { department: string; count: number; percentage: number }[];
  agentStats: { agentId: string; agentName: string; email: string; ticketsReceived: number; averageResolutionTime: number; department: string }[];
  subcategoryCounts: { subcategoryId: number; subcategoryName: string; categoryName: string; count: number; percentage: number }[];
  totalTickets: number;
  averageResolutionTime: number;
}

// Agent Performance interface - matches web frontend
interface AgentPerformance {
  agentName: string;
  agentEmail: string;
  department: string;
  totalTickets: number;
  openCount: number;
  inProgressCount: number;
  resolvedCount: number;
  closedCount: number;
  avgResolutionTime: string;
  resolutionRate: number;
}

// Department Analytics interface - matches web frontend
interface DepartmentData {
  departmentName: string;
  totalTickets: number;
  openCount: number;
  resolvedCount: number;
  inProgressCount: number;
}

// Custom Field Analytics interface - matches web frontend
interface CustomFieldAnalytics {
  dateRange?: {
    startDate: string;
    endDate: string;
    days: number;
  };
  summary: {
    totalCategories: number;
    totalTickets: number;
    totalRecords: number;
  };
  data: Array<{
    categoryName: string;
    totalTickets: number;
    subcategories: Array<{
      subcategoryName: string;
      totalTickets: number;
      customFields: Array<{
        fieldName: string;
        totalTickets: number;
        values: Array<{
          value: string;
          totalTickets: number;
          openCount: number;
          inProgressCount: number;
          resolvedCount: number;
          closedCount: number;
          resolutionRate: number;
        }>;
      }>;
    }>;
  }>;
}

export default function HomeScreen({ navigation }: any) {
  const { user, serverUrl, token } = useAuthStore();
  
  // Role-based flags matching web and desktop apps EXACTLY
  // Use strict checks to prevent CategoryAdmin being treated as Admin
  // Admin roles are: 'Admin', 'SuperAdmin', 'Administrator' - NOT 'CategoryAdmin'
  const userRole = (user?.role || '').toLowerCase();
  const userRoles = (user?.roles || []).map((r: string) => r.toLowerCase());
  const adminRoles = ['admin', 'superadmin', 'administrator'];
  
  // isAdmin is TRUE only if user has a full admin role (not CategoryAdmin)
  // Check both: user.isAdmin flag AND role names, but exclude CategoryAdmin
  const isAdmin = (user?.isAdmin === true && !user?.isCategoryAdmin) || 
    adminRoles.some(adminRole => userRole === adminRole) ||
    userRoles.some((r: string) => adminRoles.includes(r) && r !== 'categoryadmin');
  
  const isAgent = user?.isAgent === true || userRole === 'agent';
  
  // Initialize isCategoryAdmin from user object (set during login) - this ensures immediate recognition
  const [isCategoryAdmin, setIsCategoryAdmin] = useState(user?.isCategoryAdmin || false);
  const [categoryAdminIds, setCategoryAdminIds] = useState<number[]>([]);
  const [categoryNames, setCategoryNames] = useState<string[]>([]);
  const showAnalytics = isAdmin || isAgent || isCategoryAdmin;

  // Dashboard analytics - same as web frontend
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  
  // Additional analytics matching web frontend widgets
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);
  const [departmentData, setDepartmentData] = useState<DepartmentData[]>([]);
  const [customFieldAnalytics, setCustomFieldAnalytics] = useState<CustomFieldAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // My tickets for personal summary
  const { data: ticketsData, isLoading, refetch } = useQuery({
    queryKey: ['my-tickets'],
    queryFn: () => ticketsApi.getMyTickets(1, 500),
  });

  const myTickets = ticketsData?.data || ticketsData || [];
  
  // Calculate my status counts (for personal view)
  const myStatusCounts = {
    open: myTickets.filter((t: any) => 
      t.status === 'Open' || t.status === 'New' || t.status === 1
    ).length,
    inProgress: myTickets.filter((t: any) => 
      t.status === 'InProgress' || t.status === 'In Progress' || t.status === 2
    ).length,
    waiting: myTickets.filter((t: any) => 
      t.status === 'Pending' || t.status === 'Waiting' || t.status === 'On Hold' || t.status === 3
    ).length,
    resolved: myTickets.filter((t: any) => 
      t.status === 'Resolved' || t.status === 4
    ).length,
    closed: myTickets.filter((t: any) => 
      t.status === 'Closed' || t.status === 5
    ).length,
    merged: myTickets.filter((t: any) => 
      t.status === 'Merged' || t.status === 1009
    ).length,
  };
  const myTotalTickets = myTickets.length;

  // Sync isCategoryAdmin state when user object changes (e.g., on initial load from storage)
  useEffect(() => {
    if (user?.isCategoryAdmin && !isCategoryAdmin) {
      setIsCategoryAdmin(true);
    }
  }, [user?.isCategoryAdmin]);

  // Check category admin status and load analytics
  useEffect(() => {
    const checkRoleAndLoadAnalytics = async () => {
      try {
        // Check category admin status
        let catAdminIds: number[] = [];
        let isUserCategoryAdmin = user?.isCategoryAdmin || false;
        
        console.log('=== MOBILE DASHBOARD DEBUG ===');
        console.log('User:', user?.email);
        console.log('isAdmin:', isAdmin);
        console.log('isAgent:', isAgent);
        console.log('user.isCategoryAdmin:', user?.isCategoryAdmin);
        
        if (user?.id) {
          const response = await fetch(
            `${serverUrl}/api/tickets/settings/category-admins/check/${user.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (response.ok) {
            const data = await response.json();
            console.log('Category Admin API response:', JSON.stringify(data));
            isUserCategoryAdmin = data.isCategoryAdmin;
            setIsCategoryAdmin(data.isCategoryAdmin);
            catAdminIds = data.categoryIds || [];
            setCategoryAdminIds(catAdminIds);
            console.log('catAdminIds:', catAdminIds);
            
            if (data.isCategoryAdmin && catAdminIds.length > 0) {
              // Get category names
              const catResponse = await fetch(
                `${serverUrl}/api/tickets/settings/categories`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              if (catResponse.ok) {
                const categories = await catResponse.json();
                const names = categories
                  .filter((c: any) => catAdminIds.includes(c.id))
                  .map((c: any) => c.name);
                setCategoryNames(names);
                console.log('Category names for this admin:', names);
              }
            }
          }
        }

        // Load analytics for Admin/Agent/Category Admin (same APIs as web frontend)
        // Use local variable isUserCategoryAdmin instead of state (which may not be updated yet)
        if (isAdmin || isAgent || isUserCategoryAdmin) {
          setAnalyticsLoading(true);
          try {
            // For Category Admin, ALWAYS filter by their categoryIds (not undefined)
            // For Admin, no filter (undefined = all categories)
            // For Agent, no filter
            const categoryIdsForApi = isUserCategoryAdmin && !isAdmin ? catAdminIds : undefined;
            console.log('categoryIdsForApi being sent to APIs:', categoryIdsForApi);
            console.log('Condition check - isUserCategoryAdmin:', isUserCategoryAdmin, '!isAdmin:', !isAdmin);
            
            // Load main dashboard analytics
            const analyticsData = await dashboardApi.getDashboardAnalytics(categoryIdsForApi);
            setAnalytics(analyticsData);

            // Load V2 analytics - same as web frontend widgets
            // Agent Performance
            try {
              const agentPerfData = await dashboardApi.getAgentPerformance(7, categoryIdsForApi);
              setAgentPerformance(agentPerfData.data || []);
            } catch (e) {
              console.warn('Failed to load agent performance:', e);
            }

            // Department Analytics
            try {
              const deptData = await dashboardApi.getDepartmentAnalytics(7, categoryIdsForApi);
              setDepartmentData(deptData.data || []);
            } catch (e) {
              console.warn('Failed to load department analytics:', e);
            }

            // Custom Field Analytics
            try {
              const cfData = await dashboardApi.getCustomFieldAnalytics(7, categoryIdsForApi);
              setCustomFieldAnalytics(cfData);
            } catch (e) {
              console.warn('Failed to load custom field analytics:', e);
            }
          } catch (err) {
            console.warn('Failed to load analytics:', err);
          } finally {
            setAnalyticsLoading(false);
          }
        }
      } catch (error) {
        console.warn('Error checking role:', error);
      }
    };

    checkRoleAndLoadAnalytics();
  }, [user, serverUrl, token, isAdmin, isAgent]);

  // Refresh function to reload all data
  const loadAnalyticsData = useCallback(async () => {
    if (showAnalytics) {
      setAnalyticsLoading(true);
      try {
        // For Category Admin, ALWAYS filter by their categoryIds (same as web frontend)
        // For Admin, no filter (undefined = all categories)
        const categoryIdsToUse = isCategoryAdmin && !isAdmin ? categoryAdminIds : undefined;
        
        // Load all analytics in parallel
        const [analyticsData, agentPerfData, deptData, cfData] = await Promise.all([
          dashboardApi.getDashboardAnalytics(categoryIdsToUse),
          dashboardApi.getAgentPerformance(7, categoryIdsToUse).catch(() => ({ data: [] })),
          dashboardApi.getDepartmentAnalytics(7, categoryIdsToUse).catch(() => ({ data: [] })),
          dashboardApi.getCustomFieldAnalytics(7, categoryIdsToUse).catch(() => null),
        ]);
        
        setAnalytics(analyticsData);
        setAgentPerformance(agentPerfData.data || []);
        setDepartmentData(deptData.data || []);
        setCustomFieldAnalytics(cfData);
      } catch (err) {
        console.warn('Failed to load analytics:', err);
      } finally {
        setAnalyticsLoading(false);
      }
    }
  }, [showAnalytics, isCategoryAdmin, isAdmin, categoryAdminIds]);

  const onRefresh = useCallback(async () => {
    await Promise.all([
      refetch(),
      loadAnalyticsData(),
    ]);
  }, [refetch, loadAnalyticsData]);

  // Get role banner text and colors
  const getRoleBanner = () => {
    if (isAdmin) {
      return { text: 'Admin View - All Departments', bg: '#F3E8FF', color: '#7C3AED', icon: 'shield' };
    }
    if (isCategoryAdmin) {
      return { 
        text: `Category Admin - ${categoryNames.length > 0 ? categoryNames.join(', ') : 'Your Categories'}`, 
        bg: '#E0E7FF', 
        color: '#4F46E5', 
        icon: 'shield-checkmark' 
      };
    }
    if (isAgent) {
      return { text: 'Agent Dashboard', bg: '#DBEAFE', color: '#2563EB', icon: 'business' };
    }
    return null;
  };

  const roleBanner = getRoleBanner();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
      >
        {/* Role Banner - Admin/Agent/Category Admin */}
        {roleBanner && (
          <View style={[styles.roleBanner, { backgroundColor: roleBanner.bg }]}>
            <Ionicons name={roleBanner.icon as any} size={16} color={roleBanner.color} />
            <Text style={[styles.roleBannerText, { color: roleBanner.color }]}>
              {roleBanner.text}
            </Text>
          </View>
        )}

        {/* Department Header - For Regular Users */}
        {!showAnalytics && (
          <View style={styles.departmentHeader}>
            <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.departmentText}>
              Viewing {user?.department || 'Your'} Department Dashboard
            </Text>
          </View>
        )}

        {/* Live Data Banner - Matching Web */}
        <View style={styles.liveBanner}>
          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          <Text style={styles.liveBannerText}>
            Live Data Connected - Real-time analytics from database
          </Text>
        </View>

        {showAnalytics ? (
          <>
            {/* Admin/Agent/Category Admin Analytics View */}
            <View style={styles.analyticsCard}>
              <View style={styles.analyticsHeader}>
                <View>
                  <Text style={styles.analyticsTitle}>
                    {isAdmin 
                      ? 'Analytics Dashboard' 
                      : isCategoryAdmin 
                        ? 'Category Admin Dashboard'
                        : 'Agent Dashboard'
                    }
                  </Text>
                  <Text style={styles.analyticsSubtitle}>
                    {isAdmin 
                      ? 'All departments overview' 
                      : isCategoryAdmin
                        ? `Managing: ${categoryNames.join(', ')}`
                        : 'Your assigned tickets and performance'
                    }
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.newTicketButtonSmall}
                  onPress={() => navigation.navigate('CreateTicket')}
                >
                  <Ionicons name="add" size={16} color="#FFF" />
                  <Text style={styles.newTicketButtonSmallText}>New Ticket</Text>
                </TouchableOpacity>
              </View>

              {/* Key Stats Row - Same as Web Frontend */}
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="ticket-outline" size={20} color="#2563EB" />
                  <Text style={styles.statLabel}>Total Tickets</Text>
                  <Text style={[styles.statValue, { color: '#2563EB' }]}>
                    {analytics?.totalTickets || 0}
                  </Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="time-outline" size={20} color="#059669" />
                  <Text style={styles.statLabel}>Avg Resolution</Text>
                  <Text style={[styles.statValue, { color: '#059669' }]}>
                    {analytics?.averageResolutionTime ? `${Math.round(analytics.averageResolutionTime)}h` : '—'}
                  </Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#F3E8FF' }]}>
                  <Ionicons name="people-outline" size={20} color="#7C3AED" />
                  <Text style={styles.statLabel}>Active Agents</Text>
                  <Text style={[styles.statValue, { color: '#7C3AED' }]}>
                    {agentPerformance?.length || analytics?.agentStats?.length || 0}
                  </Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#FFFBEB' }]}>
                  <Ionicons name="layers-outline" size={20} color="#D97706" />
                  <Text style={styles.statLabel}>Issue Categories</Text>
                  <Text style={[styles.statValue, { color: '#D97706' }]}>
                    {analytics?.subcategoryCounts?.length || 0}
                  </Text>
                </View>
              </View>
            </View>

            {/* Custom Field Analytics - Same as Web Frontend (shown first) */}
            {customFieldAnalytics && customFieldAnalytics.data && customFieldAnalytics.data.length > 0 && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Custom Field Insights</Text>
                <Text style={styles.sectionSubtitle}>Ticket distribution by category & fields</Text>
                
                {customFieldAnalytics.data.slice(0, 3).map((category, catIndex) => (
                  <View key={catIndex} style={styles.customFieldSection}>
                    <Text style={styles.customFieldName}>{category.categoryName} ({category.totalTickets})</Text>
                    {category.subcategories?.slice(0, 2).map((subcat, subIndex) => (
                      <View key={subIndex} style={styles.customFieldValues}>
                        <Text style={[styles.customFieldValueName, { fontWeight: '500', marginBottom: 4 }]}>{subcat.subcategoryName}</Text>
                        {subcat.customFields?.slice(0, 2).map((field, fieldIndex) => (
                          <View key={fieldIndex}>
                            {field.values?.slice(0, 3).map((val, valIndex) => {
                              const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];
                              const color = colors[valIndex % colors.length];
                              return (
                                <View key={valIndex} style={styles.customFieldValueItem}>
                                  <View style={[styles.customFieldDot, { backgroundColor: color }]} />
                                  <Text style={styles.customFieldValueName} numberOfLines={1}>{val.value || 'N/A'}</Text>
                                  <Text style={[styles.customFieldValueCount, { color }]}>{val.totalTickets}</Text>
                                </View>
                              );
                            })}
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            )}

            {/* Department Analytics Widget - Same as Web Frontend */}
            {departmentData.length > 0 && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Weekly Department Tickets</Text>
                <Text style={styles.sectionSubtitle}>Ticket distribution by department</Text>
                
                <View style={styles.departmentList}>
                  {departmentData.map((dept, index) => {
                    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#6366F1'];
                    const color = colors[index % colors.length];
                    const total = departmentData.reduce((sum, d) => sum + d.totalTickets, 0);
                    const percentage = total > 0 ? Math.round((dept.totalTickets / total) * 100) : 0;
                    return (
                      <View key={index} style={styles.departmentItem}>
                        <View style={styles.departmentInfo}>
                          <View style={[styles.departmentDot, { backgroundColor: color }]} />
                          <Text style={styles.departmentName} numberOfLines={1}>{dept.departmentName || 'Unassigned'}</Text>
                        </View>
                        <View style={styles.departmentStats}>
                          <View style={styles.departmentBar}>
                            <View style={[styles.departmentBarFill, { width: `${percentage}%`, backgroundColor: color }]} />
                          </View>
                          <View style={styles.departmentNumbers}>
                            <Text style={[styles.departmentCount, { color }]}>{dept.totalTickets}</Text>
                            <Text style={styles.departmentPercentage}>{percentage}%</Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Agent Performance Widget - Same as Web Frontend */}
            {agentPerformance.length > 0 && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Agent Performance</Text>
                <Text style={styles.sectionSubtitle}>Last 7 days agent metrics</Text>
                
                <View style={styles.agentPerformanceList}>
                  {agentPerformance.slice(0, 5).map((agent, index) => (
                    <View key={index} style={styles.agentPerformanceItem}>
                      <View style={styles.agentInfo}>
                        <View style={[styles.agentAvatar, { backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'][index % 5] }]}>
                          <Text style={styles.agentAvatarText}>
                            {agent.agentName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </Text>
                        </View>
                        <View style={styles.agentDetails}>
                          <Text style={styles.agentName} numberOfLines={1}>{agent.agentName}</Text>
                          <Text style={styles.agentDepartment} numberOfLines={1}>{agent.department || 'N/A'}</Text>
                        </View>
                      </View>
                      <View style={styles.agentMetrics}>
                        <View style={styles.agentMetric}>
                          <Text style={styles.agentMetricValue}>{agent.totalTickets}</Text>
                          <Text style={styles.agentMetricLabel}>Assigned</Text>
                        </View>
                        <View style={styles.agentMetric}>
                          <Text style={[styles.agentMetricValue, { color: '#10B981' }]}>{agent.resolvedCount}</Text>
                          <Text style={styles.agentMetricLabel}>Resolved</Text>
                        </View>
                        <View style={styles.agentMetric}>
                          <Text style={styles.agentMetricValue}>{agent.avgResolutionTime || '—'}</Text>
                          <Text style={styles.agentMetricLabel}>Avg Time</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* My Ticket Summary - Also shown for Admin/Agent */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <View>
                  <Text style={styles.summaryTitle}>My Ticket Summary</Text>
                  <Text style={styles.summarySubtitle}>Your personal ticket counts</Text>
                </View>
                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>{myTotalTickets}</Text>
                </View>
              </View>

              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.statusCardsContainer}
              >
                {STATUS_CONFIG.map((status) => (
                  <TouchableOpacity
                    key={status.key}
                    style={[styles.statusCard, { backgroundColor: status.bgColor }]}
                    onPress={() => navigation.navigate('Tickets')}
                  >
                    <View style={styles.statusCardHeader}>
                      <Ionicons name={status.icon as any} size={20} color={status.color} />
                    </View>
                    <Text style={styles.statusLabel}>{status.label}</Text>
                    <Text style={[styles.statusValue, { color: status.color }]}>
                      {myStatusCounts[status.key as keyof typeof myStatusCounts] || 0}
                    </Text>
                    <Text style={styles.statusDescription}>{status.description}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </>
        ) : (
          <>
            {/* Regular User View - My Ticket Summary */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <View>
                  <Text style={styles.summaryTitle}>My Ticket Summary</Text>
                  <Text style={styles.summarySubtitle}>Only your ticket counts are displayed here.</Text>
                </View>
                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Total tickets</Text>
                  <Text style={styles.totalValue}>{myTotalTickets}</Text>
                </View>
              </View>

              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.statusCardsContainer}
              >
                {STATUS_CONFIG.map((status) => (
                  <TouchableOpacity
                    key={status.key}
                    style={[styles.statusCard, { backgroundColor: status.bgColor }]}
                    onPress={() => navigation.navigate('Tickets')}
                  >
                    <View style={styles.statusCardHeader}>
                      <Ionicons name={status.icon as any} size={20} color={status.color} />
                    </View>
                    <Text style={styles.statusLabel}>{status.label}</Text>
                    <Text style={[styles.statusValue, { color: status.color }]}>
                      {myStatusCounts[status.key as keyof typeof myStatusCounts] || 0}
                    </Text>
                    <Text style={styles.statusDescription}>{status.description}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </>
        )}

        {/* Quick Actions - Matching Web */}
        <View style={styles.quickActionsCard}>
          <View style={styles.quickActionsHeader}>
            <View style={styles.quickActionsIcon} />
            <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          </View>
          <Text style={styles.quickActionsSubtitle}>Quick access to common tasks</Text>

          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.newTicketButton}
              onPress={() => navigation.navigate('CreateTicket')}
            >
              <Ionicons name="add" size={24} color={Colors.white} />
              <Text style={styles.newTicketText}>New Ticket</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => navigation.navigate('Tickets')}
            >
              <Ionicons name="search" size={24} color={Colors.white} />
              <Text style={styles.searchButtonText}>Search Tickets</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* System Status - Matching Web */}
        <View style={styles.systemStatus}>
          <View style={styles.statusIndicator} />
          <Text style={styles.systemStatusText}>All systems operational</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  // Role Banner
  roleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  roleBannerText: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  // Department Header
  departmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  departmentText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  // Live Banner
  liveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#ECFDF5',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  liveBannerText: {
    fontSize: FontSizes.sm,
    color: '#059669',
    fontWeight: '500',
  },
  // Analytics Card (Admin/Agent/Category Admin)
  analyticsCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.soft,
  },
  analyticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  analyticsTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  analyticsSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  newTicketButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1F2937',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  newTicketButtonSmallText: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statCard: {
    width: '48%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  statLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  // Summary Card
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.soft,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  summaryTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  totalContainer: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  // Status Cards
  statusCardsContainer: {
    gap: Spacing.md,
    paddingRight: Spacing.md,
  },
  statusCard: {
    width: 140,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  statusLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  statusValue: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  statusDescription: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  statusCardHeader: {
    marginBottom: Spacing.xs,
  },
  // Section Card (for status distribution, priority, categories)
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.soft,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  // Priority Grid
  priorityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  priorityCard: {
    width: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.sm * 3) / 4,
    minWidth: 70,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  priorityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.xs,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  priorityValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  priorityBarBg: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  priorityBar: {
    height: 4,
    borderRadius: 2,
  },
  // Category List
  categoryList: {
    gap: Spacing.sm,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryName: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    color: Colors.textPrimary,
    flex: 1,
  },
  categoryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  categoryCount: {
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  categoryPercentage: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    minWidth: 35,
    textAlign: 'right',
  },
  // Quick Actions
  quickActionsCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.soft,
  },
  quickActionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  quickActionsIcon: {
    width: 16,
    height: 16,
    backgroundColor: Colors.textPrimary,
    borderRadius: 4,
  },
  quickActionsTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  quickActionsSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  newTicketButton: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  newTicketText: {
    color: Colors.white,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  searchButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  searchButtonText: {
    color: Colors.white,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  // System Status
  systemStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  systemStatusText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  // Agent Performance Widget Styles
  agentPerformanceList: {
    gap: Spacing.sm,
  },
  agentPerformanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  agentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  agentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentAvatarText: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  agentDetails: {
    flex: 1,
  },
  agentName: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  agentDepartment: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  agentMetrics: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  agentMetric: {
    alignItems: 'center',
    minWidth: 45,
  },
  agentMetricValue: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  agentMetricLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  // Department Analytics Widget Styles
  departmentList: {
    gap: Spacing.sm,
  },
  departmentItem: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  departmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  departmentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  departmentName: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    color: Colors.textPrimary,
    flex: 1,
  },
  departmentStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  departmentBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  departmentBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  departmentNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minWidth: 70,
    justifyContent: 'flex-end',
  },
  departmentCount: {
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  departmentPercentage: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    minWidth: 30,
    textAlign: 'right',
  },
  // Custom Field Analytics Widget Styles
  customFieldSection: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  customFieldName: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  customFieldValues: {
    gap: Spacing.xs,
  },
  customFieldValueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  customFieldDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  customFieldValueName: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  customFieldValueCount: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
});
