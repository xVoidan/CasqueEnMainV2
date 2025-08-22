import { supabase } from '@/src/lib/supabase';

interface IUsernameValidation {
  isValid: boolean;
  isAvailable: boolean;
  suggestions?: string[];
  error?: string;
}

const FORBIDDEN_USERNAMES = [
  'admin',
  'administrator',
  'moderator',
  'mod',
  'root',
  'casqueenmain',
  'support',
  'help',
  'test',
  'demo',
  'user',
];

const MIN_LENGTH = 3;
const MAX_LENGTH = 20;
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

export class UsernameValidator {
  private static debounceTimer: NodeJS.Timeout | null = null;

  /**
   * Validate username format
   */
  static validateFormat(username: string): { isValid: boolean; error?: string } {
    if (!username) {
      return { isValid: false, error: "Le nom d'utilisateur est requis" };
    }

    if (username.length < MIN_LENGTH) {
      return { isValid: false, error: `Minimum ${MIN_LENGTH} caractères` };
    }

    if (username.length > MAX_LENGTH) {
      return { isValid: false, error: `Maximum ${MAX_LENGTH} caractères` };
    }

    if (!USERNAME_REGEX.test(username)) {
      return {
        isValid: false,
        error: 'Lettres, chiffres et underscore uniquement',
      };
    }

    if (FORBIDDEN_USERNAMES.includes(username.toLowerCase())) {
      return {
        isValid: false,
        error: "Ce nom d'utilisateur est réservé",
      };
    }

    return { isValid: true };
  }

  /**
   * Check if username is available in database
   */
  static async checkAvailability(username: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (error && error.code === 'PGRST116') {
        // No rows returned, username is available
        return true;
      }

      return !data;
    } catch {
      return false;
    }
  }

  /**
   * Validate username with debounce
   */
  static async validateWithDebounce(
    username: string,
    delay: number = 500,
  ): Promise<IUsernameValidation> {
    return new Promise((resolve) => {
      // Clear existing timer
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      // Set new timer
      this.debounceTimer = setTimeout(() => {
        void this.validate(username).then(resolve);
      }, delay);
    });
  }

  /**
   * Full validation with availability check
   */
  static async validate(username: string): Promise<IUsernameValidation> {
    // First check format
    const formatValidation = this.validateFormat(username);
    if (!formatValidation.isValid) {
      return {
        isValid: false,
        isAvailable: false,
        error: formatValidation.error,
      };
    }

    // Then check availability
    const isAvailable = await this.checkAvailability(username);

    if (!isAvailable) {
      const suggestions = await this.generateSuggestions(username);
      return {
        isValid: true,
        isAvailable: false,
        suggestions,
        error: "Ce nom d'utilisateur est déjà pris",
      };
    }

    return {
      isValid: true,
      isAvailable: true,
    };
  }

  /**
   * Generate username suggestions
   */
  static async generateSuggestions(baseUsername: string): Promise<string[]> {
    const suggestions: string[] = [];
    const cleanBase = baseUsername.replace(/[^a-zA-Z0-9]/g, '');

    // Try adding numbers
    for (let i = 1; i <= 3; i++) {
      const suggestion = `${cleanBase}${Math.floor(Math.random() * 1000)}`;
      if (await this.checkAvailability(suggestion)) {
        suggestions.push(suggestion);
      }
    }

    // Try adding year
    const year = new Date().getFullYear();
    const withYear = `${cleanBase}${year}`;
    if (await this.checkAvailability(withYear)) {
      suggestions.push(withYear);
    }

    // Try adding underscore variations
    const variations = [
      `${cleanBase}_spp`,
      `spp_${cleanBase}`,
      `${cleanBase}_pompier`,
    ];

    for (const variation of variations) {
      if (variation.length <= MAX_LENGTH && await this.checkAvailability(variation)) {
        suggestions.push(variation);
        if (suggestions.length >= 3) {break;}
      }
    }

    return suggestions.slice(0, 3);
  }

  /**
   * Get random available username
   */
  static async getRandomUsername(): Promise<string> {
    const adjectives = ['brave', 'rapide', 'fort', 'agile', 'expert'];
    const nouns = ['pompier', 'sapeur', 'soldat', 'heros', 'sauveteur'];

    for (let i = 0; i < 10; i++) {
      const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
      const noun = nouns[Math.floor(Math.random() * nouns.length)];
      const num = Math.floor(Math.random() * 999);

      const username = `${adj}_${noun}_${num}`;

      if (await this.checkAvailability(username)) {
        return username;
      }
    }

    // Fallback with timestamp
    return `pompier_${Date.now().toString(36)}`;
  }
}
