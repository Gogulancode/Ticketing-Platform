import { apiFetch } from '../../../utils/apiFetch';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5015/api'}/tickets-v2`;

export interface CustomFieldValue {
  value: string;
  totalTickets: number;
  openCount: number;
  inProgressCount: number;
  resolvedCount: number;
  closedCount: number;
  resolutionRate: number;
}

export interface CustomField {
  customFieldId: number;
  customFieldName: string;
  customFieldLabel: string;
  totalTickets: number;
  values: CustomFieldValue[];
}

export interface Subcategory {
  subcategoryId: number | null;
  subcategoryName: string;
  totalTickets: number;
  customFields: CustomField[];
}

export interface Category {
  categoryId: number | null;
  categoryName: string;
  totalTickets: number;
  subcategories: Subcategory[];
}

export interface CustomFieldAnalytics {
  dateRange: {
    startDate: string;
    endDate: string;
    days: number;
  };
  summary: {
    totalCategories: number;
    totalCustomFields: number;
    totalUniqueValues: number;
    totalTicketsWithCustomFields: number;
  };
  categorizedResults: Category[];
  rawData: any[];
}

export const customFieldAnalyticsApi = {
  /**
   * Get custom field analytics for the specified number of days
   * @param days - Number of days to include in the analysis (default: 7)
   * @returns Promise<CustomFieldAnalytics>
   */
  async getCustomFieldAnalytics(days: number = 7): Promise<CustomFieldAnalytics> {
    const response = await apiFetch(`${API_BASE}/custom-fields/analytics?days=${days}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch custom field analytics: ${response.statusText}`);
    }
    
    return response.json();
  },

  /**
   * Get weekly custom field analytics (last 7 days)
   * @returns Promise<CustomFieldAnalytics>
   */
  async getWeeklyAnalytics(): Promise<CustomFieldAnalytics> {
    return this.getCustomFieldAnalytics(7);
  },

  /**
   * Get monthly custom field analytics (last 30 days)
   * @returns Promise<CustomFieldAnalytics>
   */
  async getMonthlyAnalytics(): Promise<CustomFieldAnalytics> {
    return this.getCustomFieldAnalytics(30);
  }
};