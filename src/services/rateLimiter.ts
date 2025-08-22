import AsyncStorage from '@react-native-async-storage/async-storage';

interface IRateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

interface IRateLimitData {
  attempts: number;
  firstAttemptTime: number;
  blockedUntil?: number;
}

class RateLimiter {
  private readonly MAX_ATTEMPTS = 5;
  private readonly WINDOW_MINUTES = 15;
  private readonly BLOCK_MINUTES = 30;
  private readonly MS_PER_MINUTE = 60000;
  private readonly SECONDS_PER_MINUTE = 60;
  private config: IRateLimitConfig = {
    maxAttempts: this.MAX_ATTEMPTS,
    windowMs: this.WINDOW_MINUTES * this.MS_PER_MINUTE,
    blockDurationMs: this.BLOCK_MINUTES * this.MS_PER_MINUTE,
  };

  private readonly STORAGE_PREFIX = '@RateLimit:';

  async checkLimit(key: string): Promise<{ allowed: boolean; remainingTime?: number }> {
    const storageKey = `${this.STORAGE_PREFIX}${key}`;
    const now = Date.now();

    try {
      const dataStr = await AsyncStorage.getItem(storageKey);

      if (!dataStr) {
        // First attempt
        await this.recordAttempt(key);
        return { allowed: true };
      }

      const data: IRateLimitData = JSON.parse(dataStr);

      // Check if blocked
      if (typeof data.blockedUntil === 'number' && data.blockedUntil > now) {
        const MS_TO_SECONDS = 1000;
        const remainingTime = Math.ceil((data.blockedUntil - now) / MS_TO_SECONDS);
        return { allowed: false, remainingTime };
      }

      // Check if window has expired
      if (now - data.firstAttemptTime > this.config.windowMs) {
        // Reset counter
        await this.recordAttempt(key);
        return { allowed: true };
      }

      // Check attempts within window
      if (data.attempts >= this.config.maxAttempts) {
        // Block the user
        data.blockedUntil = now + this.config.blockDurationMs;
        await AsyncStorage.setItem(storageKey, JSON.stringify(data));

        const MS_TO_SECONDS = 1000;
        const remainingTime = Math.ceil(this.config.blockDurationMs / MS_TO_SECONDS);
        return { allowed: false, remainingTime };
      }

      // Record new attempt
      data.attempts += 1;
      await AsyncStorage.setItem(storageKey, JSON.stringify(data));

      return { allowed: true };
    } catch (error) {

      // On error, allow the attempt (fail open)
      return { allowed: true };
    }
  }

  private async recordAttempt(key: string): Promise<void> {
    const storageKey = `${this.STORAGE_PREFIX}${key}`;
    const data: IRateLimitData = {
      attempts: 1,
      firstAttemptTime: Date.now(),
    };

    await AsyncStorage.setItem(storageKey, JSON.stringify(data));
  }

  async reset(key: string): Promise<void> {
    const storageKey = `${this.STORAGE_PREFIX}${key}`;
    await AsyncStorage.removeItem(storageKey);
  }

  async clearAll(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const rateLimitKeys = keys.filter((k) => k.startsWith(this.STORAGE_PREFIX));

      if (rateLimitKeys.length > 0) {
        await AsyncStorage.multiRemove(rateLimitKeys);
      }
    } catch (error) {

    }
  }

  formatRemainingTime(seconds: number): string {
    if (seconds < this.SECONDS_PER_MINUTE) {
      return `${seconds} secondes`;
    }

    const minutes = Math.floor(seconds / this.SECONDS_PER_MINUTE);
    const remainingSeconds = seconds % this.SECONDS_PER_MINUTE;

    if (remainingSeconds === 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }

    return `${minutes} minute${minutes > 1 ? 's' : ''} et ${remainingSeconds} seconde${remainingSeconds > 1 ? 's' : ''}`;
  }
}

export const rateLimiter = new RateLimiter();
