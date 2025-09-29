import { useState, useEffect } from 'react';

// Configuration interfaces
export interface Configuration {
  id: number;
  name: string;
  isActive: boolean;
  order: number;
}

export interface SubCategoryConfiguration {
  id: number;
  name: string;
  isActive: boolean;
  order: number;
  parentCategoryId: number;
}

export interface CategoryConfiguration {
  id: number;
  name: string;
  isActive: boolean;
  order: number;
  subcategories: SubCategoryConfiguration[];
}

export interface TicketSettings {
  departments: Configuration[];
  categories: CategoryConfiguration[];
  issueTypes: Configuration[];
  priorities: Configuration[];
  statuses: Configuration[];
}

// Hook to manage ticket settings
export const useTicketSettings = () => {
  const [settings, setSettings] = useState<TicketSettings>({
    departments: [],
    categories: [],
    issueTypes: [],
    priorities: [],
    statuses: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // In a real app, this would fetch from an API endpoint
        // For now, we'll use the same data as the TicketSettingsPage
        
        const mockSettings: TicketSettings = {
          departments: [
            { id: 1, name: 'IT Support', isActive: true, order: 1 },
            { id: 2, name: 'HR', isActive: true, order: 2 },
            { id: 3, name: 'Finance', isActive: true, order: 3 },
            { id: 4, name: 'Operations', isActive: true, order: 4 },
            { id: 5, name: 'Sales', isActive: true, order: 5 },
            { id: 6, name: 'Training', isActive: true, order: 6 },
          ],
          
          categories: [
            { 
              id: 1, 
              name: 'Software', 
              isActive: true, 
              order: 1,
              subcategories: [
                { id: 101, name: 'LT', isActive: true, order: 1, parentCategoryId: 1 },
                { id: 102, name: 'Office', isActive: true, order: 2, parentCategoryId: 1 },
                { id: 103, name: 'Database', isActive: true, order: 3, parentCategoryId: 1 },
              ]
            },
            { 
              id: 2, 
              name: 'Hardware', 
              isActive: true, 
              order: 2,
              subcategories: [
                { id: 201, name: 'Laptop', isActive: true, order: 1, parentCategoryId: 2 },
                { id: 202, name: 'Desktop', isActive: true, order: 2, parentCategoryId: 2 },
                { id: 203, name: 'Printer', isActive: true, order: 3, parentCategoryId: 2 },
                { id: 204, name: 'Monitor', isActive: true, order: 4, parentCategoryId: 2 },
              ]
            },
            { 
              id: 3, 
              name: 'Network', 
              isActive: true, 
              order: 3,
              subcategories: [
                { id: 301, name: 'WiFi', isActive: true, order: 1, parentCategoryId: 3 },
                { id: 302, name: 'Ethernet', isActive: true, order: 2, parentCategoryId: 3 },
                { id: 303, name: 'VPN', isActive: true, order: 3, parentCategoryId: 3 },
              ]
            },
            {
              id: 4,
              name: 'Training',
              isActive: true,
              order: 4,
              subcategories: [
                { id: 401, name: 'LMS Access', isActive: true, order: 1, parentCategoryId: 4 },
                { id: 402, name: 'Content Issues', isActive: true, order: 2, parentCategoryId: 4 },
                { id: 403, name: 'Assessment Problems', isActive: true, order: 3, parentCategoryId: 4 },
              ]
            },
            {
              id: 5,
              name: 'HR & People',
              isActive: true,
              order: 5,
              subcategories: [
                { id: 501, name: 'Payroll', isActive: true, order: 1, parentCategoryId: 5 },
                { id: 502, name: 'Benefits', isActive: true, order: 2, parentCategoryId: 5 },
                { id: 503, name: 'Leave Management', isActive: true, order: 3, parentCategoryId: 5 },
              ]
            },
            {
              id: 6,
              name: 'Finance & Accounting',
              isActive: true,
              order: 6,
              subcategories: [
                { id: 601, name: 'Expense Claims', isActive: true, order: 1, parentCategoryId: 6 },
                { id: 602, name: 'Budget Planning', isActive: true, order: 2, parentCategoryId: 6 },
                { id: 603, name: 'Invoice Issues', isActive: true, order: 3, parentCategoryId: 6 },
              ]
            },
          ],
          
          issueTypes: [
            { id: 1, name: 'Bug', isActive: true, order: 1 },
            { id: 2, name: 'User Issue', isActive: true, order: 2 },
            { id: 3, name: 'System Failure', isActive: true, order: 3 },
            { id: 4, name: 'Performance Issue', isActive: true, order: 4 },
            { id: 5, name: 'Feature Request', isActive: true, order: 5 },
            { id: 6, name: 'Access Request', isActive: true, order: 6 },
            { id: 7, name: 'Training Request', isActive: true, order: 7 },
            { id: 8, name: 'Data Request', isActive: true, order: 8 },
          ],
          
          priorities: [
            { id: 1, name: 'Low', isActive: true, order: 1 },
            { id: 2, name: 'Medium', isActive: true, order: 2 },
            { id: 3, name: 'High', isActive: true, order: 3 },
            { id: 4, name: 'Critical', isActive: true, order: 4 },
            { id: 5, name: 'Urgent', isActive: true, order: 5 },
          ],
          
          statuses: [
            { id: 1, name: 'Open', isActive: true, order: 1 },
            { id: 2, name: 'In Progress', isActive: true, order: 2 },
            { id: 3, name: 'Pending', isActive: true, order: 3 },
            { id: 4, name: 'Resolved', isActive: true, order: 4 },
            { id: 5, name: 'Closed', isActive: true, order: 5 },
            { id: 6, name: 'Cancelled', isActive: true, order: 6 },
          ]
        };

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setSettings(mockSettings);
        setError(null);
      } catch (err) {
        setError('Failed to load ticket settings');
        console.error('Error fetching ticket settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Helper functions
  const getActiveItems = (items: Configuration[]) => {
    return items.filter(item => item.isActive).sort((a, b) => a.order - b.order);
  };

  const getActiveCategories = () => {
    return settings.categories.filter(cat => cat.isActive).sort((a, b) => a.order - b.order);
  };

  const getActiveSubcategories = (categoryId: number) => {
    const category = settings.categories.find(cat => cat.id === categoryId);
    return category ? category.subcategories.filter(sub => sub.isActive).sort((a, b) => a.order - b.order) : [];
  };

  const getCategoryById = (id: number) => {
    return settings.categories.find(cat => cat.id === id);
  };

  const getSubcategoryById = (id: number) => {
    for (const category of settings.categories) {
      const subcategory = category.subcategories.find(sub => sub.id === id);
      if (subcategory) return subcategory;
    }
    return null;
  };

  return {
    settings,
    loading,
    error,
    
    // Helper functions
    getActiveItems,
    getActiveCategories,
    getActiveSubcategories,
    getCategoryById,
    getSubcategoryById,
    
    // Quick access to active items
    activeDepartments: getActiveItems(settings.departments),
    activeCategories: getActiveCategories(),
    activeIssueTypes: getActiveItems(settings.issueTypes),
    activePriorities: getActiveItems(settings.priorities),
    activeStatuses: getActiveItems(settings.statuses),
  };
};
