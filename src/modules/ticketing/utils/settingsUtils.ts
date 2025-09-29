// Utility functions for ticket settings CRUD operations

export interface Configuration {
  id: number;
  name: string;
  isActive: boolean;
  order: number;
}

export interface CategoryConfiguration extends Configuration {
  subcategories: SubCategoryConfiguration[];
}

export interface SubCategoryConfiguration {
  id: number;
  name: string;
  isActive: boolean;
  order: number;
  parentCategoryId: number;
}

export type SettingsData = {
  departments: Configuration[];
  categories: CategoryConfiguration[];
  issueTypes: Configuration[];
  priorities: Configuration[];
  statuses: Configuration[];
};

// Generic CRUD utilities
export function updateItem<T extends { id: number }>(
  data: T[],
  id: number,
  updater: (item: T) => T
): T[] {
  return data.map(item => item.id === id ? updater(item) : item);
}

export function deleteItem<T extends { id: number }>(
  data: T[],
  id: number
): T[] {
  return data.filter(item => item.id !== id);
}

export function toggleActive<T extends { id: number; isActive: boolean }>(
  data: T[],
  id: number
): T[] {
  return updateItem(data, id, item => ({ ...item, isActive: !item.isActive }));
}

export function addItem<T extends { id: number; order: number }>(
  data: T[],
  newItem: Omit<T, 'id' | 'order'>
): T[] {
  const maxId = Math.max(0, ...data.map(item => item.id));
  const maxOrder = Math.max(0, ...data.map(item => item.order));
  const item = {
    ...newItem,
    id: maxId + 1,
    order: maxOrder + 1,
  } as T;
  
  return [...data, item].sort((a, b) => a.order - b.order);
}

export function reorderItem<T extends { id: number; order: number }>(
  data: T[],
  id: number,
  direction: 'up' | 'down'
): T[] {
  const sortedData = [...data].sort((a, b) => a.order - b.order);
  const currentIndex = sortedData.findIndex(item => item.id === id);
  
  if (currentIndex === -1) return data;
  
  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  
  if (targetIndex < 0 || targetIndex >= sortedData.length) return data;
  
  const currentItem = sortedData[currentIndex];
  const targetItem = sortedData[targetIndex];
  
  return data.map(item => {
    if (item.id === currentItem.id) {
      return { ...item, order: targetItem.order };
    }
    if (item.id === targetItem.id) {
      return { ...item, order: currentItem.order };
    }
    return item;
  });
}

export function addSubcategory(
  categories: CategoryConfiguration[],
  parentId: number,
  name: string
): CategoryConfiguration[] {
  return categories.map(category => {
    if (category.id === parentId) {
      const maxId = Math.max(0, ...category.subcategories.map(sub => sub.id));
      const maxOrder = Math.max(0, ...category.subcategories.map(sub => sub.order));
      
      const newSubcategory: SubCategoryConfiguration = {
        id: maxId + 1,
        name,
        isActive: true,
        order: maxOrder + 1,
        parentCategoryId: parentId,
      };
      
      return {
        ...category,
        subcategories: [...category.subcategories, newSubcategory].sort((a, b) => a.order - b.order),
      };
    }
    return category;
  });
}

export function updateSubcategory(
  categories: CategoryConfiguration[],
  parentId: number,
  subcategoryId: number,
  updater: (item: SubCategoryConfiguration) => SubCategoryConfiguration
): CategoryConfiguration[] {
  return categories.map(category => {
    if (category.id === parentId) {
      return {
        ...category,
        subcategories: category.subcategories.map(sub =>
          sub.id === subcategoryId ? updater(sub) : sub
        ),
      };
    }
    return category;
  });
}

export function deleteSubcategory(
  categories: CategoryConfiguration[],
  parentId: number,
  subcategoryId: number
): CategoryConfiguration[] {
  return categories.map(category => {
    if (category.id === parentId) {
      return {
        ...category,
        subcategories: category.subcategories.filter(sub => sub.id !== subcategoryId),
      };
    }
    return category;
  });
}
