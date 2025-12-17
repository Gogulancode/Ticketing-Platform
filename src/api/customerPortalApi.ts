import { API_CONFIG } from '../config/api';

// Helper function for API calls with auth
const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_CONFIG.BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }
  
  return response;
};

// Helper for public (non-auth) API calls
const fetchPublic = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_CONFIG.BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      // Include auth if available for personalization
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }
  
  return response;
};

// ==================== Types ====================

// Customer Profile
export interface CustomerProfileDto {
  id: number;
  userId: string;
  userName?: string;
  userEmail?: string;
  companyName?: string;
  jobTitle?: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
  preferredLanguage?: string;
  timezone?: string;
  emailNotifications: boolean;
  ticketUpdateNotifications: boolean;
  marketingEmails: boolean;
  createdAt: string;
}

export interface UpdateCustomerProfileDto {
  companyName?: string;
  jobTitle?: string;
  phone?: string;
  address?: string;
  preferredLanguage?: string;
  timezone?: string;
  emailNotifications?: boolean;
  ticketUpdateNotifications?: boolean;
  marketingEmails?: boolean;
}

// Customer Tickets
export interface CustomerTicketDto {
  id: number;
  title: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  commentCount: number;
  hasUnreadUpdates: boolean;
}

export interface CustomerTicketSummaryDto {
  totalTickets: number;
  openTickets: number;
  pendingTickets: number;
  resolvedTickets: number;
  recentTickets: CustomerTicketDto[];
}

// Knowledge Base
export interface KnowledgeBaseCategoryDto {
  id: number;
  name: string;
  slug: string;
  description?: string;
  iconName?: string;
  parentCategoryId?: number;
  parentCategoryName?: string;
  sortOrder: number;
  articleCount: number;
  subCategories: KnowledgeBaseCategoryDto[];
}

export interface CreateKnowledgeBaseCategoryDto {
  name: string;
  description?: string;
  iconName?: string;
  parentCategoryId?: number;
  sortOrder: number;
}

export interface KnowledgeBaseArticleDto {
  id: number;
  title: string;
  slug: string;
  summary?: string;
  content: string;
  categoryId: number;
  categoryName?: string;
  authorId: string;
  authorName?: string;
  tags?: string;
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  isPublished: boolean;
  isFeatured: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeBaseArticleListDto {
  id: number;
  title: string;
  slug: string;
  summary?: string;
  categoryName?: string;
  viewCount: number;
  isFeatured: boolean;
  publishedAt?: string;
}

export interface CreateKnowledgeBaseArticleDto {
  title: string;
  summary?: string;
  content: string;
  categoryId: number;
  tags?: string;
  isPublished: boolean;
  isFeatured: boolean;
  metaDescription?: string;
  metaKeywords?: string;
}

export interface UpdateKnowledgeBaseArticleDto {
  title: string;
  summary?: string;
  content: string;
  categoryId: number;
  tags?: string;
  isPublished: boolean;
  isFeatured: boolean;
  metaDescription?: string;
  metaKeywords?: string;
}

export interface ArticleFeedbackDto {
  articleId: number;
  isHelpful: boolean;
  comment?: string;
}

// FAQs
export interface FAQDto {
  id: number;
  question: string;
  answer: string;
  categoryId?: number;
  categoryName?: string;
  sortOrder: number;
  isFeatured: boolean;
  viewCount: number;
}

export interface CreateFAQDto {
  question: string;
  answer: string;
  categoryId?: number;
  sortOrder: number;
  isFeatured: boolean;
  isActive: boolean;
}

// Announcements
export interface PortalAnnouncementDto {
  id: number;
  title: string;
  content: string;
  type: number;
  typeDisplay: string;
  isPinned: boolean;
  startsAt?: string;
  expiresAt?: string;
  createdByName?: string;
  createdAt: string;
}

export interface CreatePortalAnnouncementDto {
  title: string;
  content: string;
  type: number;
  isPinned: boolean;
  startsAt?: string;
  expiresAt?: string;
}

// Service Status
export interface ServiceStatusDto {
  id: number;
  serviceName: string;
  description?: string;
  status: number;
  statusDisplay: string;
  statusMessage?: string;
  lastCheckedAt: string;
  updatedAt: string;
}

export interface ServiceIncidentUpdateDto {
  id: number;
  message: string;
  status: number;
  statusDisplay: string;
  createdByName?: string;
  createdAt: string;
}

export interface ServiceIncidentDto {
  id: number;
  title: string;
  description: string;
  severity: number;
  severityDisplay: string;
  status: number;
  statusDisplay: string;
  affectedServiceName?: string;
  startedAt: string;
  resolvedAt?: string;
  createdByName?: string;
  createdAt: string;
  updates: ServiceIncidentUpdateDto[];
}

export interface SystemStatusSummaryDto {
  overallStatus: string;
  services: ServiceStatusDto[];
  activeIncidents: ServiceIncidentDto[];
  recentIncidents: ServiceIncidentDto[];
  lastCheckedAt: string;
}

export interface CreateServiceIncidentDto {
  title: string;
  description: string;
  severity: number;
  affectedServiceId?: number;
}

export interface AddIncidentUpdateDto {
  message: string;
  status: number;
}

// Contact Submission
export interface ContactSubmissionDto {
  id: number;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  type: number;
  typeDisplay: string;
  isProcessed: boolean;
  convertedToTicketId?: number;
  createdAt: string;
  processedAt?: string;
}

export interface CreateContactSubmissionDto {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  type: number;
}

// Search
export interface PortalSearchResultDto {
  articles: KnowledgeBaseArticleListDto[];
  faqs: FAQDto[];
  totalArticles: number;
  totalFaqs: number;
}

// Dashboard
export interface CustomerDashboardDto {
  profile?: CustomerProfileDto;
  ticketSummary: CustomerTicketSummaryDto;
  announcements: PortalAnnouncementDto[];
  featuredArticles: KnowledgeBaseArticleListDto[];
  featuredFaqs: FAQDto[];
  systemStatus: SystemStatusSummaryDto;
}

// ==================== API Functions ====================

// Dashboard
export const getCustomerDashboard = async (): Promise<CustomerDashboardDto> => {
  const response = await fetchWithAuth('/portal/dashboard');
  return response.json();
};

// Profile
export const getCustomerProfile = async (): Promise<CustomerProfileDto> => {
  const response = await fetchWithAuth('/portal/profile');
  return response.json();
};

export const updateCustomerProfile = async (data: UpdateCustomerProfileDto): Promise<CustomerProfileDto> => {
  const response = await fetchWithAuth('/portal/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.json();
};

// Tickets
export const getCustomerTicketSummary = async (): Promise<CustomerTicketSummaryDto> => {
  const response = await fetchWithAuth('/portal/tickets/summary');
  return response.json();
};

export const getCustomerTickets = async (
  page = 1,
  pageSize = 10,
  status?: string
): Promise<CustomerTicketDto[]> => {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    ...(status && { status }),
  });
  const response = await fetchWithAuth(`/portal/tickets?${params}`);
  return response.json();
};

// Knowledge Base - Categories
export const getKnowledgeBaseCategories = async (): Promise<KnowledgeBaseCategoryDto[]> => {
  const response = await fetchPublic('/portal/kb/categories');
  return response.json();
};

export const getKnowledgeBaseCategoryBySlug = async (slug: string): Promise<KnowledgeBaseCategoryDto> => {
  const response = await fetchPublic(`/portal/kb/categories/${slug}`);
  return response.json();
};

export const createKnowledgeBaseCategory = async (data: CreateKnowledgeBaseCategoryDto): Promise<KnowledgeBaseCategoryDto> => {
  const response = await fetchWithAuth('/portal/kb/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
};

export const updateKnowledgeBaseCategory = async (id: number, data: CreateKnowledgeBaseCategoryDto): Promise<KnowledgeBaseCategoryDto> => {
  const response = await fetchWithAuth(`/portal/kb/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.json();
};

export const deleteKnowledgeBaseCategory = async (id: number): Promise<void> => {
  await fetchWithAuth(`/portal/kb/categories/${id}`, {
    method: 'DELETE',
  });
};

// Knowledge Base - Articles
export const getKnowledgeBaseArticles = async (
  categoryId?: number,
  page = 1,
  pageSize = 20
): Promise<KnowledgeBaseArticleListDto[]> => {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    ...(categoryId !== undefined && { categoryId: categoryId.toString() }),
  });
  const response = await fetchPublic(`/portal/kb/articles?${params}`);
  return response.json();
};

export const getFeaturedArticles = async (limit = 5): Promise<KnowledgeBaseArticleListDto[]> => {
  const response = await fetchPublic(`/portal/kb/articles/featured?limit=${limit}`);
  return response.json();
};

export const getArticleBySlug = async (slug: string): Promise<KnowledgeBaseArticleDto> => {
  const response = await fetchPublic(`/portal/kb/articles/${slug}`);
  return response.json();
};

export const createKnowledgeBaseArticle = async (data: CreateKnowledgeBaseArticleDto): Promise<KnowledgeBaseArticleDto> => {
  const response = await fetchWithAuth('/portal/kb/articles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
};

export const updateKnowledgeBaseArticle = async (id: number, data: UpdateKnowledgeBaseArticleDto): Promise<KnowledgeBaseArticleDto> => {
  const response = await fetchWithAuth(`/portal/kb/articles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.json();
};

export const deleteKnowledgeBaseArticle = async (id: number): Promise<void> => {
  await fetchWithAuth(`/portal/kb/articles/${id}`, {
    method: 'DELETE',
  });
};

export const submitArticleFeedback = async (articleId: number, data: Omit<ArticleFeedbackDto, 'articleId'>): Promise<void> => {
  await fetchPublic(`/portal/kb/articles/${articleId}/feedback`, {
    method: 'POST',
    body: JSON.stringify({ ...data, articleId }),
  });
};

// FAQs
export const getActiveFAQs = async (categoryId?: number): Promise<FAQDto[]> => {
  const params = categoryId !== undefined ? `?categoryId=${categoryId}` : '';
  const response = await fetchPublic(`/portal/faqs${params}`);
  return response.json();
};

export const getFeaturedFAQs = async (limit = 5): Promise<FAQDto[]> => {
  const response = await fetchPublic(`/portal/faqs/featured?limit=${limit}`);
  return response.json();
};

export const getFAQById = async (id: number): Promise<FAQDto> => {
  const response = await fetchPublic(`/portal/faqs/${id}`);
  return response.json();
};

export const createFAQ = async (data: CreateFAQDto): Promise<FAQDto> => {
  const response = await fetchWithAuth('/portal/faqs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
};

export const updateFAQ = async (id: number, data: CreateFAQDto): Promise<FAQDto> => {
  const response = await fetchWithAuth(`/portal/faqs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.json();
};

export const deleteFAQ = async (id: number): Promise<void> => {
  await fetchWithAuth(`/portal/faqs/${id}`, {
    method: 'DELETE',
  });
};

// Announcements
export const getActiveAnnouncements = async (): Promise<PortalAnnouncementDto[]> => {
  const response = await fetchPublic('/portal/announcements');
  return response.json();
};

export const createAnnouncement = async (data: CreatePortalAnnouncementDto): Promise<PortalAnnouncementDto> => {
  const response = await fetchWithAuth('/portal/announcements', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
};

export const updateAnnouncement = async (id: number, data: CreatePortalAnnouncementDto): Promise<PortalAnnouncementDto> => {
  const response = await fetchWithAuth(`/portal/announcements/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.json();
};

export const deleteAnnouncement = async (id: number): Promise<void> => {
  await fetchWithAuth(`/portal/announcements/${id}`, {
    method: 'DELETE',
  });
};

// System Status
export const getSystemStatus = async (): Promise<SystemStatusSummaryDto> => {
  const response = await fetchPublic('/portal/status');
  return response.json();
};

export const getServiceStatuses = async (): Promise<ServiceStatusDto[]> => {
  const response = await fetchPublic('/portal/status/services');
  return response.json();
};

export const updateServiceStatus = async (
  id: number,
  status: number,
  message?: string
): Promise<ServiceStatusDto> => {
  const response = await fetchWithAuth(`/portal/status/services/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status, message }),
  });
  return response.json();
};

export const createService = async (name: string, description?: string): Promise<ServiceStatusDto> => {
  const response = await fetchWithAuth('/portal/status/services', {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  });
  return response.json();
};

// Service Incidents
export const getActiveIncidents = async (): Promise<ServiceIncidentDto[]> => {
  const response = await fetchPublic('/portal/status/incidents/active');
  return response.json();
};

export const getRecentIncidents = async (days = 7): Promise<ServiceIncidentDto[]> => {
  const response = await fetchPublic(`/portal/status/incidents/recent?days=${days}`);
  return response.json();
};

export const getIncidentById = async (id: number): Promise<ServiceIncidentDto> => {
  const response = await fetchPublic(`/portal/status/incidents/${id}`);
  return response.json();
};

export const createIncident = async (data: CreateServiceIncidentDto): Promise<ServiceIncidentDto> => {
  const response = await fetchWithAuth('/portal/status/incidents', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
};

export const addIncidentUpdate = async (incidentId: number, data: AddIncidentUpdateDto): Promise<ServiceIncidentDto> => {
  const response = await fetchWithAuth(`/portal/status/incidents/${incidentId}/updates`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
};

export const resolveIncident = async (incidentId: number, message?: string): Promise<void> => {
  await fetchWithAuth(`/portal/status/incidents/${incidentId}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
};

// Contact Form
export const submitContactForm = async (data: CreateContactSubmissionDto): Promise<ContactSubmissionDto> => {
  const response = await fetchPublic('/portal/contact', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
};

export const getContactSubmissions = async (
  processed?: boolean,
  page = 1,
  pageSize = 20
): Promise<ContactSubmissionDto[]> => {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    ...(processed !== undefined && { processed: processed.toString() }),
  });
  const response = await fetchWithAuth(`/portal/contact/submissions?${params}`);
  return response.json();
};

export const convertContactToTicket = async (submissionId: number): Promise<number | null> => {
  const response = await fetchWithAuth(`/portal/contact/submissions/${submissionId}/convert`, {
    method: 'POST',
  });
  const data = await response.json();
  return data.ticketId;
};

// Search
export const searchPortal = async (query: string, maxResults = 10): Promise<PortalSearchResultDto> => {
  const params = new URLSearchParams({
    query,
    maxResults: maxResults.toString(),
  });
  const response = await fetchPublic(`/portal/search?${params}`);
  return response.json();
};

// ==================== React Query Hooks ====================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Query Keys
export const portalQueryKeys = {
  dashboard: ['portal', 'dashboard'] as const,
  profile: ['portal', 'profile'] as const,
  ticketSummary: ['portal', 'tickets', 'summary'] as const,
  tickets: (page: number, pageSize: number, status?: string) => 
    ['portal', 'tickets', { page, pageSize, status }] as const,
  kbCategories: ['portal', 'kb', 'categories'] as const,
  kbCategory: (slug: string) => ['portal', 'kb', 'categories', slug] as const,
  kbArticles: (categoryId?: number, page?: number, pageSize?: number) => 
    ['portal', 'kb', 'articles', { categoryId, page, pageSize }] as const,
  kbFeaturedArticles: (limit: number) => ['portal', 'kb', 'articles', 'featured', limit] as const,
  kbArticle: (slug: string) => ['portal', 'kb', 'articles', slug] as const,
  faqs: (categoryId?: number) => ['portal', 'faqs', { categoryId }] as const,
  featuredFaqs: (limit: number) => ['portal', 'faqs', 'featured', limit] as const,
  faq: (id: number) => ['portal', 'faqs', id] as const,
  announcements: ['portal', 'announcements'] as const,
  systemStatus: ['portal', 'status'] as const,
  services: ['portal', 'status', 'services'] as const,
  activeIncidents: ['portal', 'status', 'incidents', 'active'] as const,
  recentIncidents: (days: number) => ['portal', 'status', 'incidents', 'recent', days] as const,
  incident: (id: number) => ['portal', 'status', 'incidents', id] as const,
  contactSubmissions: (processed?: boolean, page?: number, pageSize?: number) => 
    ['portal', 'contact', 'submissions', { processed, page, pageSize }] as const,
  search: (query: string, maxResults: number) => ['portal', 'search', { query, maxResults }] as const,
};

// Dashboard Hook
export const useCustomerDashboard = () => {
  return useQuery({
    queryKey: portalQueryKeys.dashboard,
    queryFn: getCustomerDashboard,
  });
};

// Profile Hooks
export const useCustomerProfile = () => {
  return useQuery({
    queryKey: portalQueryKeys.profile,
    queryFn: getCustomerProfile,
  });
};

export const useUpdateCustomerProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCustomerProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portalQueryKeys.profile });
      queryClient.invalidateQueries({ queryKey: portalQueryKeys.dashboard });
    },
  });
};

// Ticket Hooks
export const useCustomerTicketSummary = () => {
  return useQuery({
    queryKey: portalQueryKeys.ticketSummary,
    queryFn: getCustomerTicketSummary,
  });
};

export const useCustomerTickets = (page = 1, pageSize = 10, status?: string) => {
  return useQuery({
    queryKey: portalQueryKeys.tickets(page, pageSize, status),
    queryFn: () => getCustomerTickets(page, pageSize, status),
  });
};

// Knowledge Base Hooks
export const useKnowledgeBaseCategories = () => {
  return useQuery({
    queryKey: portalQueryKeys.kbCategories,
    queryFn: getKnowledgeBaseCategories,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

export const useKnowledgeBaseCategoryBySlug = (slug: string) => {
  return useQuery({
    queryKey: portalQueryKeys.kbCategory(slug),
    queryFn: () => getKnowledgeBaseCategoryBySlug(slug),
    enabled: !!slug,
  });
};

export const useKnowledgeBaseArticles = (categoryId?: number, page = 1, pageSize = 20) => {
  return useQuery({
    queryKey: portalQueryKeys.kbArticles(categoryId, page, pageSize),
    queryFn: () => getKnowledgeBaseArticles(categoryId, page, pageSize),
    staleTime: 2 * 60 * 1000,
  });
};

export const useFeaturedArticles = (limit = 5) => {
  return useQuery({
    queryKey: portalQueryKeys.kbFeaturedArticles(limit),
    queryFn: () => getFeaturedArticles(limit),
    staleTime: 5 * 60 * 1000,
  });
};

export const useArticleBySlug = (slug: string) => {
  return useQuery({
    queryKey: portalQueryKeys.kbArticle(slug),
    queryFn: () => getArticleBySlug(slug),
    enabled: !!slug,
  });
};

export const useCreateKnowledgeBaseArticle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createKnowledgeBaseArticle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'kb', 'articles'] });
    },
  });
};

export const useUpdateKnowledgeBaseArticle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateKnowledgeBaseArticleDto }) =>
      updateKnowledgeBaseArticle(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'kb', 'articles'] });
    },
  });
};

export const useSubmitArticleFeedback = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ articleId, data }: { articleId: number; data: Omit<ArticleFeedbackDto, 'articleId'> }) =>
      submitArticleFeedback(articleId, data),
    onSuccess: (_, { articleId }) => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'kb', 'articles'] });
    },
  });
};

// FAQ Hooks
export const useActiveFAQs = (categoryId?: number) => {
  return useQuery({
    queryKey: portalQueryKeys.faqs(categoryId),
    queryFn: () => getActiveFAQs(categoryId),
    staleTime: 5 * 60 * 1000,
  });
};

export const useFeaturedFAQs = (limit = 5) => {
  return useQuery({
    queryKey: portalQueryKeys.featuredFaqs(limit),
    queryFn: () => getFeaturedFAQs(limit),
    staleTime: 5 * 60 * 1000,
  });
};

export const useFAQById = (id: number) => {
  return useQuery({
    queryKey: portalQueryKeys.faq(id),
    queryFn: () => getFAQById(id),
    enabled: id > 0,
  });
};

export const useCreateFAQ = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFAQ,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'faqs'] });
    },
  });
};

export const useUpdateFAQ = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateFAQDto }) => updateFAQ(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'faqs'] });
    },
  });
};

export const useDeleteFAQ = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteFAQ,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'faqs'] });
    },
  });
};

// Announcement Hooks
export const useActiveAnnouncements = () => {
  return useQuery({
    queryKey: portalQueryKeys.announcements,
    queryFn: getActiveAnnouncements,
    staleTime: 1 * 60 * 1000, // Cache for 1 minute
  });
};

export const useCreateAnnouncement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portalQueryKeys.announcements });
    },
  });
};

export const useUpdateAnnouncement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreatePortalAnnouncementDto }) =>
      updateAnnouncement(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portalQueryKeys.announcements });
    },
  });
};

export const useDeleteAnnouncement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portalQueryKeys.announcements });
    },
  });
};

// System Status Hooks
export const useSystemStatus = () => {
  return useQuery({
    queryKey: portalQueryKeys.systemStatus,
    queryFn: getSystemStatus,
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });
};

export const useServiceStatuses = () => {
  return useQuery({
    queryKey: portalQueryKeys.services,
    queryFn: getServiceStatuses,
  });
};

export const useActiveIncidents = () => {
  return useQuery({
    queryKey: portalQueryKeys.activeIncidents,
    queryFn: getActiveIncidents,
    refetchInterval: 60 * 1000,
  });
};

export const useRecentIncidents = (days = 7) => {
  return useQuery({
    queryKey: portalQueryKeys.recentIncidents(days),
    queryFn: () => getRecentIncidents(days),
  });
};

export const useIncidentById = (id: number) => {
  return useQuery({
    queryKey: portalQueryKeys.incident(id),
    queryFn: () => getIncidentById(id),
    enabled: id > 0,
  });
};

export const useCreateIncident = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createIncident,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'status'] });
    },
  });
};

export const useAddIncidentUpdate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ incidentId, data }: { incidentId: number; data: AddIncidentUpdateDto }) =>
      addIncidentUpdate(incidentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'status'] });
    },
  });
};

export const useResolveIncident = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ incidentId, message }: { incidentId: number; message?: string }) =>
      resolveIncident(incidentId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'status'] });
    },
  });
};

// Contact Form Hooks
export const useSubmitContactForm = () => {
  return useMutation({
    mutationFn: submitContactForm,
  });
};

export const useContactSubmissions = (processed?: boolean, page = 1, pageSize = 20) => {
  return useQuery({
    queryKey: portalQueryKeys.contactSubmissions(processed, page, pageSize),
    queryFn: () => getContactSubmissions(processed, page, pageSize),
  });
};

export const useConvertContactToTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: convertContactToTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'contact'] });
    },
  });
};

// Search Hook
export const usePortalSearch = (query: string, maxResults = 10) => {
  return useQuery({
    queryKey: portalQueryKeys.search(query, maxResults),
    queryFn: () => searchPortal(query, maxResults),
    enabled: query.length >= 2,
    staleTime: 30 * 1000, // Cache for 30 seconds
  });
};
