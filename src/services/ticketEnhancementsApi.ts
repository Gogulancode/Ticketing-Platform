import api from './api';

// ==================== Types ====================

export interface TicketWatcherDto {
  id: number;
  ticketId: number;
  ticketTitle?: string;
  userId: number;
  userName?: string;
  userEmail?: string;
  watchedAt: string;
  notifyOnComment: boolean;
  notifyOnStatusChange: boolean;
  notifyOnAssigneeChange: boolean;
  notifyOnPriorityChange: boolean;
}

export interface CreateTicketWatcherDto {
  ticketId: number;
  userId: number;
  notifyOnComment: boolean;
  notifyOnStatusChange: boolean;
  notifyOnAssigneeChange: boolean;
  notifyOnPriorityChange: boolean;
}

export interface UpdateTicketWatcherDto {
  notifyOnComment: boolean;
  notifyOnStatusChange: boolean;
  notifyOnAssigneeChange: boolean;
  notifyOnPriorityChange: boolean;
}

export interface TicketTemplateDto {
  id: number;
  name: string;
  description?: string;
  category: number;
  priority: number;
  subject: string;
  body: string;
  tags?: string;
  defaultAssigneeId?: number;
  defaultAssigneeName?: string;
  createdById: number;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  isGlobal: boolean;
}

export interface CreateTicketTemplateDto {
  name: string;
  description?: string;
  category: number;
  priority: number;
  subject: string;
  body: string;
  tags?: string;
  defaultAssigneeId?: number;
  isActive: boolean;
  isGlobal: boolean;
}

export interface UpdateTicketTemplateDto {
  name: string;
  description?: string;
  category: number;
  priority: number;
  subject: string;
  body: string;
  tags?: string;
  defaultAssigneeId?: number;
  isActive: boolean;
  isGlobal: boolean;
}

export interface TicketTimeEntryDto {
  id: number;
  ticketId: number;
  ticketTitle?: string;
  userId: number;
  userName?: string;
  description?: string;
  minutes: number;
  isBillable: boolean;
  hourlyRate?: number;
  workDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketTimeEntryDto {
  ticketId: number;
  description?: string;
  minutes: number;
  isBillable: boolean;
  hourlyRate?: number;
  workDate: string;
}

export interface UpdateTicketTimeEntryDto {
  description?: string;
  minutes: number;
  isBillable: boolean;
  hourlyRate?: number;
  workDate: string;
}

export interface TicketTimeSummaryDto {
  ticketId: number;
  totalMinutes: number;
  billableMinutes: number;
  nonBillableMinutes: number;
  totalCost: number;
  entries: TicketTimeEntryDto[];
}

export interface TicketSatisfactionRatingDto {
  id: number;
  ticketId: number;
  ticketTitle?: string;
  userId: number;
  userName?: string;
  rating: number;
  comment?: string;
  ratedAt: string;
}

export interface CreateTicketSatisfactionRatingDto {
  ticketId: number;
  rating: number;
  comment?: string;
}

export interface UpdateTicketSatisfactionRatingDto {
  rating: number;
  comment?: string;
}

export interface TicketMergeDto {
  id: number;
  sourceTicketId: number;
  sourceTicketTitle?: string;
  targetTicketId: number;
  targetTicketTitle?: string;
  mergedById: number;
  mergedByName?: string;
  mergedAt: string;
  reason?: string;
}

export interface MergeTicketsRequestDto {
  sourceTicketId: number;
  targetTicketId: number;
  reason?: string;
}

export interface SplitTicketRequestDto {
  originalTicketId: number;
  newTicketTitle: string;
  newTicketDescription: string;
  reason?: string;
}

export interface TicketSplitDto {
  id: number;
  originalTicketId: number;
  originalTicketTitle?: string;
  newTicketId: number;
  newTicketTitle?: string;
  splitById: number;
  splitByName?: string;
  splitAt: string;
  reason?: string;
}

export enum LinkType {
  RelatedTo = 0,
  DuplicateOf = 1,
  BlockedBy = 2,
  Blocks = 3,
  ParentOf = 4,
  ChildOf = 5
}

export const linkTypeLabels: Record<LinkType, string> = {
  [LinkType.RelatedTo]: 'Related To',
  [LinkType.DuplicateOf]: 'Duplicate Of',
  [LinkType.BlockedBy]: 'Blocked By',
  [LinkType.Blocks]: 'Blocks',
  [LinkType.ParentOf]: 'Parent Of',
  [LinkType.ChildOf]: 'Child Of'
};

export interface LinkedTicketDto {
  id: number;
  sourceTicketId: number;
  sourceTicketTitle?: string;
  targetTicketId: number;
  targetTicketTitle?: string;
  linkType: LinkType;
  linkTypeDisplay?: string;
  linkedById: number;
  linkedByName?: string;
  linkedAt: string;
}

export interface CreateLinkedTicketDto {
  sourceTicketId: number;
  targetTicketId: number;
  linkType: LinkType;
}

// ==================== API Functions ====================

// ----- Watchers -----

export async function getTicketWatchers(ticketId: number): Promise<TicketWatcherDto[]> {
  const response = await api.get<TicketWatcherDto[]>(`/ticket-enhancements/watchers/ticket/${ticketId}`);
  return response.data;
}

export async function getMyWatchedTickets(): Promise<TicketWatcherDto[]> {
  const response = await api.get<TicketWatcherDto[]>('/ticket-enhancements/watchers/my-watched');
  return response.data;
}

export async function addWatcher(data: CreateTicketWatcherDto): Promise<TicketWatcherDto> {
  const response = await api.post<TicketWatcherDto>('/ticket-enhancements/watchers', data);
  return response.data;
}

export async function updateWatcher(id: number, data: UpdateTicketWatcherDto): Promise<TicketWatcherDto> {
  const response = await api.put<TicketWatcherDto>(`/ticket-enhancements/watchers/${id}`, data);
  return response.data;
}

export async function removeWatcher(id: number): Promise<void> {
  await api.delete(`/ticket-enhancements/watchers/${id}`);
}

// ----- Templates -----

export async function getTemplates(): Promise<TicketTemplateDto[]> {
  const response = await api.get<TicketTemplateDto[]>('/ticket-enhancements/templates');
  return response.data;
}

export async function getTemplate(id: number): Promise<TicketTemplateDto> {
  const response = await api.get<TicketTemplateDto>(`/ticket-enhancements/templates/${id}`);
  return response.data;
}

export async function getActiveTemplates(): Promise<TicketTemplateDto[]> {
  const response = await api.get<TicketTemplateDto[]>('/ticket-enhancements/templates/active');
  return response.data;
}

export async function createTemplate(data: CreateTicketTemplateDto): Promise<TicketTemplateDto> {
  const response = await api.post<TicketTemplateDto>('/ticket-enhancements/templates', data);
  return response.data;
}

export async function updateTemplate(id: number, data: UpdateTicketTemplateDto): Promise<TicketTemplateDto> {
  const response = await api.put<TicketTemplateDto>(`/ticket-enhancements/templates/${id}`, data);
  return response.data;
}

export async function deleteTemplate(id: number): Promise<void> {
  await api.delete(`/ticket-enhancements/templates/${id}`);
}

// ----- Time Entries -----

export async function getTicketTimeEntries(ticketId: number): Promise<TicketTimeEntryDto[]> {
  const response = await api.get<TicketTimeEntryDto[]>(`/ticket-enhancements/time-entries/ticket/${ticketId}`);
  return response.data;
}

export async function getTicketTimeSummary(ticketId: number): Promise<TicketTimeSummaryDto> {
  const response = await api.get<TicketTimeSummaryDto>(`/ticket-enhancements/time-entries/ticket/${ticketId}/summary`);
  return response.data;
}

export async function getMyTimeEntries(): Promise<TicketTimeEntryDto[]> {
  const response = await api.get<TicketTimeEntryDto[]>('/ticket-enhancements/time-entries/my-entries');
  return response.data;
}

export async function createTimeEntry(data: CreateTicketTimeEntryDto): Promise<TicketTimeEntryDto> {
  const response = await api.post<TicketTimeEntryDto>('/ticket-enhancements/time-entries', data);
  return response.data;
}

export async function updateTimeEntry(id: number, data: UpdateTicketTimeEntryDto): Promise<TicketTimeEntryDto> {
  const response = await api.put<TicketTimeEntryDto>(`/ticket-enhancements/time-entries/${id}`, data);
  return response.data;
}

export async function deleteTimeEntry(id: number): Promise<void> {
  await api.delete(`/ticket-enhancements/time-entries/${id}`);
}

// ----- Satisfaction Ratings -----

export async function getTicketSatisfactionRating(ticketId: number): Promise<TicketSatisfactionRatingDto | null> {
  try {
    const response = await api.get<TicketSatisfactionRatingDto>(`/ticket-enhancements/satisfaction-ratings/ticket/${ticketId}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function createSatisfactionRating(data: CreateTicketSatisfactionRatingDto): Promise<TicketSatisfactionRatingDto> {
  const response = await api.post<TicketSatisfactionRatingDto>('/ticket-enhancements/satisfaction-ratings', data);
  return response.data;
}

export async function updateSatisfactionRating(id: number, data: UpdateTicketSatisfactionRatingDto): Promise<TicketSatisfactionRatingDto> {
  const response = await api.put<TicketSatisfactionRatingDto>(`/ticket-enhancements/satisfaction-ratings/${id}`, data);
  return response.data;
}

export async function deleteSatisfactionRating(id: number): Promise<void> {
  await api.delete(`/ticket-enhancements/satisfaction-ratings/${id}`);
}

// ----- Merge/Split -----

export async function mergeTickets(data: MergeTicketsRequestDto): Promise<TicketMergeDto> {
  const response = await api.post<TicketMergeDto>('/ticket-enhancements/merge', data);
  return response.data;
}

export async function getTicketMergeHistory(ticketId: number): Promise<TicketMergeDto[]> {
  const response = await api.get<TicketMergeDto[]>(`/ticket-enhancements/merge/history/${ticketId}`);
  return response.data;
}

export async function splitTicket(data: SplitTicketRequestDto): Promise<TicketSplitDto> {
  const response = await api.post<TicketSplitDto>('/ticket-enhancements/split', data);
  return response.data;
}

export async function getTicketSplitHistory(ticketId: number): Promise<TicketSplitDto[]> {
  const response = await api.get<TicketSplitDto[]>(`/ticket-enhancements/split/history/${ticketId}`);
  return response.data;
}

// ----- Linked Tickets -----

export async function getLinkedTickets(ticketId: number): Promise<LinkedTicketDto[]> {
  const response = await api.get<LinkedTicketDto[]>(`/ticket-enhancements/linked-tickets/${ticketId}`);
  return response.data;
}

export async function linkTickets(data: CreateLinkedTicketDto): Promise<LinkedTicketDto> {
  const response = await api.post<LinkedTicketDto>('/ticket-enhancements/linked-tickets', data);
  return response.data;
}

export async function unlinkTickets(id: number): Promise<void> {
  await api.delete(`/ticket-enhancements/linked-tickets/${id}`);
}

// ==================== React Query Hooks ====================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Watchers hooks
export function useTicketWatchers(ticketId: number) {
  return useQuery({
    queryKey: ['ticketWatchers', ticketId],
    queryFn: () => getTicketWatchers(ticketId),
    enabled: !!ticketId,
  });
}

export function useMyWatchedTickets() {
  return useQuery({
    queryKey: ['myWatchedTickets'],
    queryFn: getMyWatchedTickets,
  });
}

export function useAddWatcher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addWatcher,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ticketWatchers', data.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['myWatchedTickets'] });
    },
  });
}

export function useUpdateWatcher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTicketWatcherDto }) => updateWatcher(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticketWatchers'] });
      queryClient.invalidateQueries({ queryKey: ['myWatchedTickets'] });
    },
  });
}

export function useRemoveWatcher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeWatcher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticketWatchers'] });
      queryClient.invalidateQueries({ queryKey: ['myWatchedTickets'] });
    },
  });
}

// Templates hooks
export function useTemplates() {
  return useQuery({
    queryKey: ['ticketTemplates'],
    queryFn: getTemplates,
  });
}

export function useActiveTemplates() {
  return useQuery({
    queryKey: ['ticketTemplates', 'active'],
    queryFn: getActiveTemplates,
  });
}

export function useTemplate(id: number) {
  return useQuery({
    queryKey: ['ticketTemplate', id],
    queryFn: () => getTemplate(id),
    enabled: !!id,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticketTemplates'] });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTicketTemplateDto }) => updateTemplate(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ticketTemplates'] });
      queryClient.invalidateQueries({ queryKey: ['ticketTemplate', data.id] });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticketTemplates'] });
    },
  });
}

// Time Entries hooks
export function useTicketTimeEntries(ticketId: number) {
  return useQuery({
    queryKey: ['ticketTimeEntries', ticketId],
    queryFn: () => getTicketTimeEntries(ticketId),
    enabled: !!ticketId,
  });
}

export function useTicketTimeSummary(ticketId: number) {
  return useQuery({
    queryKey: ['ticketTimeSummary', ticketId],
    queryFn: () => getTicketTimeSummary(ticketId),
    enabled: !!ticketId,
  });
}

export function useMyTimeEntries() {
  return useQuery({
    queryKey: ['myTimeEntries'],
    queryFn: getMyTimeEntries,
  });
}

export function useCreateTimeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTimeEntry,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ticketTimeEntries', data.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['ticketTimeSummary', data.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['myTimeEntries'] });
    },
  });
}

export function useUpdateTimeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTicketTimeEntryDto }) => updateTimeEntry(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ticketTimeEntries', data.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['ticketTimeSummary', data.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['myTimeEntries'] });
    },
  });
}

export function useDeleteTimeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTimeEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticketTimeEntries'] });
      queryClient.invalidateQueries({ queryKey: ['ticketTimeSummary'] });
      queryClient.invalidateQueries({ queryKey: ['myTimeEntries'] });
    },
  });
}

// Satisfaction Rating hooks
export function useTicketSatisfactionRating(ticketId: number) {
  return useQuery({
    queryKey: ['ticketSatisfactionRating', ticketId],
    queryFn: () => getTicketSatisfactionRating(ticketId),
    enabled: !!ticketId,
  });
}

export function useCreateSatisfactionRating() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSatisfactionRating,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ticketSatisfactionRating', data.ticketId] });
    },
  });
}

export function useUpdateSatisfactionRating() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTicketSatisfactionRatingDto }) => updateSatisfactionRating(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ticketSatisfactionRating', data.ticketId] });
    },
  });
}

export function useDeleteSatisfactionRating() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSatisfactionRating,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticketSatisfactionRating'] });
    },
  });
}

// Merge/Split hooks
export function useMergeTickets() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mergeTickets,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', data.sourceTicketId] });
      queryClient.invalidateQueries({ queryKey: ['ticket', data.targetTicketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticketMergeHistory'] });
    },
  });
}

export function useTicketMergeHistory(ticketId: number) {
  return useQuery({
    queryKey: ['ticketMergeHistory', ticketId],
    queryFn: () => getTicketMergeHistory(ticketId),
    enabled: !!ticketId,
  });
}

export function useSplitTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: splitTicket,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', data.originalTicketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticketSplitHistory'] });
    },
  });
}

export function useTicketSplitHistory(ticketId: number) {
  return useQuery({
    queryKey: ['ticketSplitHistory', ticketId],
    queryFn: () => getTicketSplitHistory(ticketId),
    enabled: !!ticketId,
  });
}

// Linked Tickets hooks
export function useLinkedTickets(ticketId: number) {
  return useQuery({
    queryKey: ['linkedTickets', ticketId],
    queryFn: () => getLinkedTickets(ticketId),
    enabled: !!ticketId,
  });
}

export function useLinkTickets() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: linkTickets,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['linkedTickets', data.sourceTicketId] });
      queryClient.invalidateQueries({ queryKey: ['linkedTickets', data.targetTicketId] });
    },
  });
}

export function useUnlinkTickets() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unlinkTickets,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkedTickets'] });
    },
  });
}
