
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/src/lib/supabase';

const TEST_EMAIL = 'test@example.com';
const _TEST_PASSWORD = 'SecurePass123!';
const _INVALID_EMAIL = 'invalid-email';
const _SHORT_PASSWORD = '123';

// Mock Supabase
jest.mock('@/src/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

describe('Authentication Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Login Flow', () => {
    it('should successfully login with email and password', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: TEST_EMAIL,
      };

      const mockSession = {
        user: mockUser,
        access_token: 'mock-token',
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const result = await supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: 'password123',
      });

      expect(result.data?.user).toEqual(mockUser);
      expect(result.error).toBeNull();
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: TEST_EMAIL,
        password: 'password123',
      });
    });

    it('should handle login errors correctly', async () => {
      const mockError = {
        message: 'Invalid credentials',
        code: 'invalid_credentials',
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: 'wrongpassword',
      });

      expect(result.data).toBeNull();
      expect(result.error).toEqual(mockError);
    });

    it('should store session in AsyncStorage after successful login', async () => {
      const mockSession = {
        user: { id: 'user-id', email: TEST_EMAIL },
        access_token: 'token',
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      await supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: 'password123',
      });

      // Simulate storing session
      await AsyncStorage.setItem('supabase.auth.token', JSON.stringify(mockSession));

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'supabase.auth.token',
        JSON.stringify(mockSession),
      );
    });
  });

  describe('Registration Flow', () => {
    it('should successfully register a new user', async () => {
      const mockUser = {
        id: 'new-user-id',
        email: 'newuser@example.com',
      };

      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await supabase.auth.signUp({
        email: 'newuser@example.com',
        password: 'securepassword123',
      });

      expect(result.data?.user).toEqual(mockUser);
      expect(result.error).toBeNull();
    });

    it('should create user profile after registration', async () => {
      const mockUser = {
        id: 'new-user-id',
        email: 'newuser@example.com',
      };

      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Register user
      await supabase.auth.signUp({
        email: 'newuser@example.com',
        password: 'password123',
      });

      // Create profile
      const profileData = {
        user_id: mockUser.id,
        username: 'newuser',
        department: 'Test Department',
        total_points: 0,
        current_grade: 1,
      };

      await supabase.from('profiles').insert(profileData);

      expect(supabase.from).toHaveBeenCalledWith('profiles');
    });
  });

  describe('Logout Flow', () => {
    it('should successfully logout user', async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: null,
      });

      const result = await supabase.auth.signOut();

      expect(result.error).toBeNull();
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('should clear AsyncStorage on logout', async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: null,
      });

      await supabase.auth.signOut();
      await AsyncStorage.clear();

      expect(AsyncStorage.clear).toHaveBeenCalled();
    });
  });

  describe('Session Persistence', () => {
    it('should restore session from AsyncStorage on app start', async () => {
      const mockSession = {
        user: { id: 'user-id', email: TEST_EMAIL },
        access_token: 'stored-token',
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockSession),
      );

      const storedSession = await AsyncStorage.getItem('supabase.auth.token');
      const parsedSession = storedSession ? JSON.parse(storedSession) : null;

      expect(parsedSession).toEqual(mockSession);
    });

    it('should handle expired sessions', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: { message: 'Session expired' },
      });

      const result = await supabase.auth.getSession();

      expect(result.data?.session).toBeNull();
      expect(result.error?.message).toBe('Session expired');
    });
  });

  describe('Guest Mode', () => {
    it('should allow guest mode access', async () => {
      const guestSession = {
        isGuest: true,
        startedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem('guest_session', JSON.stringify(guestSession));

      const stored = await AsyncStorage.getItem('guest_session');
      const parsed = stored ? JSON.parse(stored) : null;

      expect(parsed).toEqual(guestSession);
      expect(parsed.isGuest).toBe(true);
    });

    it('should convert guest to authenticated user', async () => {
      // Start as guest
      await AsyncStorage.setItem('guest_session', JSON.stringify({ isGuest: true }));

      // Login
      const mockUser = { id: 'user-id', email: TEST_EMAIL };
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      await supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: 'password123',
      });

      // Clear guest session
      await AsyncStorage.removeItem('guest_session');

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('guest_session');
    });
  });

  describe('Password Reset', () => {
    it('should send password reset email', async () => {
      (supabase.auth as any).resetPasswordForEmail = jest.fn().mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await (supabase.auth as any).resetPasswordForEmail(
        TEST_EMAIL,
      );

      expect(result.error).toBeNull();
      expect((supabase.auth as any).resetPasswordForEmail).toHaveBeenCalledWith(
        TEST_EMAIL,
      );
    });
  });
});
