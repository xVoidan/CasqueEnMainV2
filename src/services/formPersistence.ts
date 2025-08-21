import AsyncStorage from '@react-native-async-storage/async-storage';

interface IFormData {
  [key: string]: any;
}

interface ISavedForm {
  data: IFormData;
  timestamp: number;
  step?: number;
  completed?: boolean;
}

const FORM_STORAGE_PREFIX = '@CasqueEnMain:form:';
const FORM_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

export class FormPersistenceService {
  /**
   * Save form data to AsyncStorage
   */
  static async saveForm(
    formId: string,
    data: IFormData,
    currentStep?: number,
  ): Promise<void> {
    try {
      const savedForm: ISavedForm = {
        data,
        timestamp: Date.now(),
        step: currentStep,
        completed: false,
      };

      await AsyncStorage.setItem(
        `${FORM_STORAGE_PREFIX}${formId}`,
        JSON.stringify(savedForm),
      );
    } catch (error) {
      console.error('Error saving form:', error);
    }
  }

  /**
   * Auto-save form data with debounce
   */
  private static autoSaveTimers: Map<string, NodeJS.Timeout> = new Map();

  static autoSave(
    formId: string,
    data: IFormData,
    currentStep?: number,
    delay: number = 1000,
  ): void {
    // Clear existing timer
    const existingTimer = this.autoSaveTimers.get(formId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      void this.saveForm(formId, data, currentStep);
      this.autoSaveTimers.delete(formId);
    }, delay);

    this.autoSaveTimers.set(formId, timer);
  }

  /**
   * Load saved form data
   */
  static async loadForm(formId: string): Promise<ISavedForm | null> {
    try {
      const savedData = await AsyncStorage.getItem(`${FORM_STORAGE_PREFIX}${formId}`);

      if (!savedData) {
        return null;
      }

      const savedForm: ISavedForm = JSON.parse(savedData);

      // Check if form has expired
      if (Date.now() - savedForm.timestamp > FORM_EXPIRY) {
        await this.deleteForm(formId);
        return null;
      }

      return savedForm;
    } catch (error) {
      console.error('Error loading form:', error);
      return null;
    }
  }

  /**
   * Delete saved form
   */
  static async deleteForm(formId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${FORM_STORAGE_PREFIX}${formId}`);
    } catch (error) {
      console.error('Error deleting form:', error);
    }
  }

  /**
   * Mark form as completed
   */
  static async markFormCompleted(formId: string): Promise<void> {
    try {
      const savedForm = await this.loadForm(formId);
      if (savedForm) {
        savedForm.completed = true;
        await AsyncStorage.setItem(
          `${FORM_STORAGE_PREFIX}${formId}`,
          JSON.stringify(savedForm),
        );
      }
    } catch (error) {
      console.error('Error marking form as completed:', error);
    }
  }

  /**
   * Get all saved forms
   */
  static async getAllSavedForms(): Promise<Record<string, ISavedForm>> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const formKeys = keys.filter((key) => key.startsWith(FORM_STORAGE_PREFIX));

      const forms: Record<string, ISavedForm> = {};

      for (const key of formKeys) {
        const formId = key.replace(FORM_STORAGE_PREFIX, '');
        const form = await this.loadForm(formId);
        if (form) {
          forms[formId] = form;
        }
      }

      return forms;
    } catch (error) {
      console.error('Error getting all forms:', error);
      return {};
    }
  }

  /**
   * Check if there are any incomplete forms
   */
  static async hasIncompleteForms(): Promise<boolean> {
    try {
      const forms = await this.getAllSavedForms();
      return Object.values(forms).some((form) => !form.completed);
    } catch {
      return false;
    }
  }

  /**
   * Get the most recent incomplete form
   */
  static async getMostRecentIncompleteForm(): Promise<{
    formId: string;
    form: ISavedForm;
  } | null> {
    try {
      const forms = await this.getAllSavedForms();

      let mostRecent: { formId: string; form: ISavedForm } | null = null;
      let mostRecentTime = 0;

      for (const [formId, form] of Object.entries(forms)) {
        if (!form.completed && form.timestamp > mostRecentTime) {
          mostRecentTime = form.timestamp;
          mostRecent = { formId, form };
        }
      }

      return mostRecent;
    } catch {
      return null;
    }
  }

  /**
   * Clean up old or completed forms
   */
  static async cleanup(): Promise<void> {
    try {
      const forms = await this.getAllSavedForms();

      for (const [formId, form] of Object.entries(forms)) {
        const shouldDelete =
          Date.now() - form.timestamp > FORM_EXPIRY ||
          (form.completed && Date.now() - form.timestamp > 86400000);
        if (shouldDelete) {
          await this.deleteForm(formId);
        }
      }
    } catch (error) {
      console.error('Error cleaning up forms:', error);
    }
  }
}
