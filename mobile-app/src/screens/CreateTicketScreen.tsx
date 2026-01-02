import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../constants/theme';
import { useAuthStore } from '../store/authStore';

interface Category {
  id: number;
  name: string;
  isActive: boolean;
}

interface SubCategory {
  id: number;
  name: string;
  categoryId: number;
  isActive: boolean;
}

interface Department {
  id: number;
  name: string;
  isActive: boolean;
}

interface PriorityLevel {
  id: number;
  name: string;
  level: number;
  isActive: boolean;
  color?: string;
}

interface CustomField {
  id: number;
  label: string;
  type: string;
  isRequired: boolean;
  placeholder?: string;
  options?: string[];
  displayOrder?: number;
  isActive?: boolean;
}

const PRIORITY_COLORS: Record<string, string> = {
  'Low': '#10B981',
  'Medium': '#F59E0B',
  'High': '#EF4444',
  'Urgent': '#DC2626',
  'Critical': '#991B1B',
};

export default function CreateTicketScreen({ navigation }: any) {
  const queryClient = useQueryClient();
  const { serverUrl, token, user } = useAuthStore();

  // Form data
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [subcategoryId, setSubcategoryId] = useState<number | null>(null);
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [priorityId, setPriorityId] = useState<number | null>(null);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<Array<{uri: string, name: string, type: string}>>([]);

  // Settings data
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState<SubCategory[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [priorities, setPriorities] = useState<PriorityLevel[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  // UI state
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Picker modals
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showSubcategoryPicker, setShowSubcategoryPicker] = useState(false);
  const [showDepartmentPicker, setShowDepartmentPicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showCustomFieldPicker, setShowCustomFieldPicker] = useState<CustomField | null>(null);

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  // Filter subcategories when category changes
  useEffect(() => {
    if (categoryId) {
      const filtered = subcategories.filter(s => s.categoryId === categoryId && s.isActive !== false);
      setFilteredSubcategories(filtered);
      // Reset subcategory if not valid for new category
      if (subcategoryId && !filtered.some(s => s.id === subcategoryId)) {
        setSubcategoryId(null);
      }
    } else {
      setFilteredSubcategories([]);
      setSubcategoryId(null);
    }
  }, [categoryId, subcategories]);

  // Load custom fields when category and subcategory are selected
  useEffect(() => {
    if (categoryId && subcategoryId) {
      loadCustomFields(categoryId, subcategoryId);
    } else {
      setCustomFields([]);
      setCustomFieldValues({});
    }
  }, [categoryId, subcategoryId]);

  const loadSettings = async () => {
    try {
      setIsLoadingSettings(true);
      const headers = getHeaders();

      const [catRes, subRes, deptRes, prioRes] = await Promise.all([
        fetch(`${serverUrl}/api/tickets/settings/categories`, { headers }),
        fetch(`${serverUrl}/api/tickets/settings/subcategories`, { headers }),
        fetch(`${serverUrl}/api/tickets/settings/departments`, { headers }),
        fetch(`${serverUrl}/api/tickets/settings/priorities`, { headers }),
      ]);

      if (catRes.ok) {
        const data = await catRes.json();
        setCategories((data || []).filter((c: Category) => c.isActive !== false));
      }

      if (subRes.ok) {
        const data = await subRes.json();
        setSubcategories((data || []).filter((s: SubCategory) => s.isActive !== false));
      }

      if (deptRes.ok) {
        const data = await deptRes.json();
        const deptList = data.value || data || [];
        const activeDepts = (deptList || []).filter((d: Department) => d.isActive !== false);
        setDepartments(activeDepts);

        // Pre-select user's department
        if (user?.department && activeDepts.length > 0) {
          const userDept = activeDepts.find(
            (d: Department) => d.name.toLowerCase() === user.department?.toLowerCase()
          );
          if (userDept) {
            setDepartmentId(userDept.id);
          }
        }
      }

      if (prioRes.ok) {
        const data = await prioRes.json();
        const active = (data || []).filter((p: PriorityLevel) => p.isActive !== false);
        const sorted = active.sort((a: PriorityLevel, b: PriorityLevel) => a.level - b.level);
        setPriorities(sorted);
        
        // Pre-select Medium priority
        const mediumPriority = sorted.find((p: PriorityLevel) => p.name.toLowerCase() === 'medium');
        if (mediumPriority) {
          setPriorityId(mediumPriority.id);
        } else if (sorted.length > 0) {
          setPriorityId(sorted[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      Alert.alert('Error', 'Failed to load form settings');
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const loadCustomFields = async (catId: number, subId: number) => {
    try {
      const response = await fetch(
        `${serverUrl}/api/tickets/settings/custom-fields?categoryId=${catId}&subcategoryId=${subId}`,
        { headers: getHeaders() }
      );
      if (response.ok) {
        const data = await response.json();
        const active = (data || [])
          .filter((f: CustomField) => f.isActive !== false)
          .sort((a: CustomField, b: CustomField) => (a.displayOrder || 0) - (b.displayOrder || 0));
        setCustomFields(active);
      }
    } catch (error) {
      console.error('Failed to load custom fields:', error);
    }
  };

  const handleCustomFieldChange = (fieldId: number, value: string) => {
    setCustomFieldValues(prev => ({ ...prev, [fieldId.toString()]: value }));
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setAttachments(prev => [...prev, { uri: file.uri, name: file.name || 'file', type: file.mimeType || 'application/octet-stream' }]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };

  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow access to photos');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets) {
        const newAttachments = result.assets.map((asset: ImagePicker.ImagePickerAsset) => ({
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          type: asset.mimeType || 'image/jpeg',
        }));
        setAttachments(prev => [...prev, ...newAttachments]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }
    if (!categoryId) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
    if (!subcategoryId) {
      Alert.alert('Error', 'Please select a subcategory');
      return;
    }
    if (!departmentId) {
      Alert.alert('Error', 'Please select a department');
      return;
    }

    // Validate required custom fields
    const requiredFields = customFields.filter(f => f.isRequired);
    const missingFields = requiredFields.filter(f => {
      const value = customFieldValues[f.id.toString()];
      return !value || value.trim() === '';
    });

    if (missingFields.length > 0) {
      Alert.alert('Error', `Please fill in: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedPriority = priorities.find(p => p.id === priorityId);
      
      const requestBody = {
        title: title.trim(),
        description: description.trim(),
        priority: selectedPriority?.level ?? 0,
        category: 0,
        categoryId: categoryId,
        subcategoryId: subcategoryId,
        departmentId: departmentId,
        customFieldValues: Object.keys(customFieldValues).length > 0 ? customFieldValues : undefined,
      };

      const response = await fetch(`${serverUrl}/api/tickets`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
        Alert.alert('Success', 'Ticket created successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        const errorData = await response.json().catch(() => ({}));
        Alert.alert('Error', errorData.message || `Failed to create ticket (${response.status})`);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get display values
  const selectedCategory = categories.find(c => c.id === categoryId);
  const selectedSubcategory = filteredSubcategories.find(s => s.id === subcategoryId);
  const selectedDepartment = departments.find(d => d.id === departmentId);
  const selectedPriority = priorities.find(p => p.id === priorityId);

  const getPriorityColor = (name: string) => PRIORITY_COLORS[name] || Colors.gray400;

  // Get safe area insets for bottom navigation
  const insets = useSafeAreaInsets();

  // Calculate form progress
  const formProgress = (() => {
    const fields = [title, description, categoryId, subcategoryId, departmentId];
    const completed = fields.filter(f => f && (typeof f === 'string' ? f.trim() : true)).length;
    return Math.round((completed / fields.length) * 100);
  })();

  // Picker Modal Component
  const PickerModal = ({ 
    visible, 
    onClose, 
    title: modalTitle, 
    items, 
    selectedId, 
    onSelect,
    renderItem,
  }: {
    visible: boolean;
    onClose: () => void;
    title: string;
    items: any[];
    selectedId: number | null;
    onSelect: (id: number) => void;
    renderItem?: (item: any) => React.ReactNode;
  }) => (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalList}>
            {items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.modalItem,
                  selectedId === item.id && styles.modalItemSelected,
                ]}
                onPress={() => {
                  onSelect(item.id);
                  onClose();
                }}
              >
                {renderItem ? renderItem(item) : (
                  <Text style={[
                    styles.modalItemText,
                    selectedId === item.id && styles.modalItemTextSelected,
                  ]}>
                    {item.name}
                  </Text>
                )}
                {selectedId === item.id && (
                  <Ionicons name="checkmark" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (isLoadingSettings) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading form...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${formProgress}%` }]} />
        </View>
        <Text style={styles.progressText}>{formProgress}% Complete</Text>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Title Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Title <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Brief description of your issue"
            placeholderTextColor={Colors.gray400}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Description Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your issue in detail..."
            placeholderTextColor={Colors.gray400}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        {/* Department Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Department <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity 
            style={styles.pickerButton}
            onPress={() => setShowDepartmentPicker(true)}
          >
            <Text style={[
              styles.pickerButtonText,
              !selectedDepartment && styles.pickerButtonPlaceholder
            ]}>
              {selectedDepartment?.name || 'Select Department'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={Colors.gray400} />
          </TouchableOpacity>
          {selectedDepartment && user?.department && (
            <View style={styles.preselectedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#10B981" />
              <Text style={styles.preselectedText}>Pre-selected from your profile</Text>
            </View>
          )}
        </View>

        {/* Category Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity 
            style={styles.pickerButton}
            onPress={() => setShowCategoryPicker(true)}
          >
            <Text style={[
              styles.pickerButtonText,
              !selectedCategory && styles.pickerButtonPlaceholder
            ]}>
              {selectedCategory?.name || 'Select Category'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={Colors.gray400} />
          </TouchableOpacity>
        </View>

        {/* Subcategory Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Subcategory <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity 
            style={[styles.pickerButton, !categoryId && styles.pickerButtonDisabled]}
            onPress={() => categoryId && setShowSubcategoryPicker(true)}
            disabled={!categoryId}
          >
            <Text style={[
              styles.pickerButtonText,
              !selectedSubcategory && styles.pickerButtonPlaceholder
            ]}>
              {selectedSubcategory?.name || (categoryId ? 'Select Subcategory' : 'Select category first')}
            </Text>
            <Ionicons name="chevron-down" size={20} color={Colors.gray400} />
          </TouchableOpacity>
        </View>

        {/* Custom Fields - Now BEFORE Priority */}
        {customFields.length > 0 && (
          <View style={styles.customFieldsSection}>
            <Text style={styles.sectionTitle}>Additional Information</Text>
            {customFields.map((field) => (
              <View key={field.id} style={styles.inputGroup}>
                <Text style={styles.label}>
                  {field.label} {field.isRequired && <Text style={styles.required}>*</Text>}
                </Text>
                {field.type === 'select' && field.options ? (
                  <TouchableOpacity 
                    style={styles.pickerButton}
                    onPress={() => setShowCustomFieldPicker(field)}
                  >
                    <Text style={[
                      styles.pickerButtonText,
                      !customFieldValues[field.id.toString()] && styles.pickerButtonPlaceholder
                    ]}>
                      {customFieldValues[field.id.toString()] || field.placeholder || 'Select...'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={Colors.gray400} />
                  </TouchableOpacity>
                ) : field.type === 'textarea' ? (
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                    placeholderTextColor={Colors.gray400}
                    value={customFieldValues[field.id.toString()] || ''}
                    onChangeText={(value) => handleCustomFieldChange(field.id, value)}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                ) : (
                  <TextInput
                    style={styles.input}
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                    placeholderTextColor={Colors.gray400}
                    value={customFieldValues[field.id.toString()] || ''}
                    onChangeText={(value) => handleCustomFieldChange(field.id, value)}
                    keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                  />
                )}
              </View>
            ))}
          </View>
        )}

        {/* Priority Selection - Now AFTER Custom Fields */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Priority</Text>
          <View style={styles.priorityContainer}>
            {priorities.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.priorityButton,
                  priorityId === p.id && { 
                    backgroundColor: getPriorityColor(p.name) + '20',
                    borderColor: getPriorityColor(p.name),
                  }
                ]}
                onPress={() => setPriorityId(p.id)}
              >
                <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(p.name) }]} />
                <Text style={[
                  styles.priorityText,
                  priorityId === p.id && { color: getPriorityColor(p.name), fontWeight: '600' }
                ]}>
                  {p.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Attachments Section */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Attachments</Text>
          <View style={styles.attachmentActions}>
            <TouchableOpacity style={styles.attachmentButton} onPress={pickImage}>
              <Ionicons name="image-outline" size={20} color={Colors.primary} />
              <Text style={styles.attachmentButtonText}>Add Image</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachmentButton} onPress={pickDocument}>
              <Ionicons name="document-outline" size={20} color={Colors.primary} />
              <Text style={styles.attachmentButtonText}>Add File</Text>
            </TouchableOpacity>
          </View>
          {attachments.length > 0 && (
            <View style={styles.attachmentList}>
              {attachments.map((att, index) => (
                <View key={index} style={styles.attachmentItem}>
                  {att.type.startsWith('image/') ? (
                    <Image source={{ uri: att.uri }} style={styles.attachmentThumb} />
                  ) : (
                    <View style={styles.attachmentIconContainer}>
                      <Ionicons name="document" size={20} color={Colors.gray500} />
                    </View>
                  )}
                  <Text style={styles.attachmentName} numberOfLines={1}>{att.name}</Text>
                  <TouchableOpacity onPress={() => removeAttachment(index)}>
                    <Ionicons name="close-circle" size={20} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Spacer for footer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Ionicons name="add-circle" size={20} color={Colors.white} />
              <Text style={styles.submitButtonText}>Create Ticket</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Picker Modals */}
      <PickerModal
        visible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        title="Select Category"
        items={categories}
        selectedId={categoryId}
        onSelect={(id) => setCategoryId(id)}
      />

      <PickerModal
        visible={showSubcategoryPicker}
        onClose={() => setShowSubcategoryPicker(false)}
        title="Select Subcategory"
        items={filteredSubcategories}
        selectedId={subcategoryId}
        onSelect={(id) => setSubcategoryId(id)}
      />

      <PickerModal
        visible={showDepartmentPicker}
        onClose={() => setShowDepartmentPicker(false)}
        title="Select Department"
        items={departments}
        selectedId={departmentId}
        onSelect={(id) => setDepartmentId(id)}
      />

      <PickerModal
        visible={showPriorityPicker}
        onClose={() => setShowPriorityPicker(false)}
        title="Select Priority"
        items={priorities}
        selectedId={priorityId}
        onSelect={(id) => setPriorityId(id)}
        renderItem={(item) => (
          <View style={styles.priorityPickerItem}>
            <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(item.name) }]} />
            <Text style={styles.modalItemText}>{item.name}</Text>
          </View>
        )}
      />

      {/* Custom Field Select Modal */}
      {showCustomFieldPicker && (
        <Modal visible={true} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{showCustomFieldPicker.label}</Text>
                <TouchableOpacity onPress={() => setShowCustomFieldPicker(null)}>
                  <Ionicons name="close" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalList}>
                {showCustomFieldPicker.options?.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.modalItem,
                      customFieldValues[showCustomFieldPicker.id.toString()] === option && styles.modalItemSelected,
                    ]}
                    onPress={() => {
                      handleCustomFieldChange(showCustomFieldPicker.id, option);
                      setShowCustomFieldPicker(null);
                    }}
                  >
                    <Text style={[
                      styles.modalItemText,
                      customFieldValues[showCustomFieldPicker.id.toString()] === option && styles.modalItemTextSelected,
                    ]}>
                      {option}
                    </Text>
                    {customFieldValues[showCustomFieldPicker.id.toString()] === option && (
                      <Ionicons name="checkmark" size={20} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.gray100,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    width: 80,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    ...Shadows.soft,
  },
  textArea: {
    minHeight: 120,
    paddingTop: Spacing.md,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    ...Shadows.soft,
  },
  pickerButtonDisabled: {
    backgroundColor: Colors.gray100,
    opacity: 0.7,
  },
  pickerButtonText: {
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  pickerButtonPlaceholder: {
    color: Colors.gray400,
  },
  preselectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  preselectedText: {
    fontSize: FontSizes.xs,
    color: '#10B981',
  },
  priorityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  priorityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 80,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  priorityPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  customFieldsSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 56,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    ...Shadows.primary,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.white,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalList: {
    padding: Spacing.md,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  modalItemSelected: {
    backgroundColor: `${Colors.primary}10`,
  },
  modalItemText: {
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  modalItemTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  // Attachment styles
  attachmentActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.primary + '10',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    borderStyle: 'dashed',
  },
  attachmentButtonText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  attachmentList: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.gray100,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  attachmentThumb: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
  },
  attachmentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentName: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
  },
});
