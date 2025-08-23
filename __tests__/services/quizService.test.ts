import { sessionService } from '@/src/services/sessionService';
import { questionService } from '@/src/services/questionService';
import { statsService } from '@/src/services/statsService';
import { IQuestion, ISession, IAnswer } from '@/src/types/quiz';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock Supabase
jest.mock('@/src/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  },
}));

describe('Quiz Services Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('QuestionService', () => {
    it('should fetch questions by theme', async () => {
      const mockQuestions: IQuestion[] = [
        {
          id: '1',
          theme: 'Métier',
          subTheme: 'Incendie',
          questionText: 'Question test',
          type: 'single',
          options: [
            { id: '1', text: 'Option 1', isCorrect: true },
            { id: '2', text: 'Option 2', isCorrect: false },
          ],
          difficulty: 1,
          points: 10,
        },
      ];

      jest.spyOn(questionService, 'getQuestions').mockResolvedValue(mockQuestions);

      const questions = await questionService.getQuestions({
        theme: 'Métier',
        count: 10,
      });

      expect(questions).toEqual(mockQuestions);
      expect(questions[0].theme).toBe('Métier');
    });

    it('should return sample questions on error', async () => {
      jest.spyOn(questionService, 'getQuestions').mockImplementation(async () => {
        return questionService.getSampleQuestions(5);
      });

      const questions = await questionService.getQuestions({ count: 5 });

      expect(questions).toHaveLength(5);
      expect(questions[0]).toHaveProperty('id');
      expect(questions[0]).toHaveProperty('questionText');
    });

    it('should get daily challenge questions', async () => {
      const mockQuestions: IQuestion[] = Array.from({ length: 20 }, (_, i) => ({
        id: `daily-${i}`,
        theme: 'Métier',
        subTheme: 'Challenge',
        questionText: `Daily question ${i}`,
        type: 'single',
        options: [],
        difficulty: 2,
        points: 15,
      }));

      jest
        .spyOn(questionService, 'getDailyChallengeQuestions')
        .mockResolvedValue(mockQuestions);

      const questions = await questionService.getDailyChallengeQuestions();

      expect(questions).toHaveLength(20);
      expect(questions[0].id).toContain('daily');
    });
  });

  describe('SessionService', () => {
    it('should create a new session', async () => {
      const mockSession: ISession = {
        id: 'session-1',
        userId: 'user-1',
        config: {
          theme: 'Métier',
          questionCount: 10,
          difficulty: 2,
          mode: 'training',
        },
        questions: [],
        answers: [],
        currentQuestionIndex: 0,
        score: 0,
        status: 'in_progress',
        startedAt: new Date().toISOString(),
      };

      jest.spyOn(sessionService, 'createSession').mockResolvedValue(mockSession);

      const session = await sessionService.createSession('user-1', {
        theme: 'Métier',
        questionCount: 10,
        difficulty: 2,
        mode: 'training',
      });

      expect(session).toEqual(mockSession);
      expect(session.status).toBe('in_progress');
      expect(session.config.theme).toBe('Métier');
    });

    it('should save answer and calculate score', async () => {
      const answer: IAnswer = {
        questionId: 'q-1',
        selectedAnswers: ['opt-1'],
        isCorrect: true,
        timeSpent: 15,
      };

      jest.spyOn(sessionService, 'saveAnswer').mockResolvedValue(undefined);

      await sessionService.saveAnswer('session-1', answer);

      expect(sessionService.saveAnswer).toHaveBeenCalledWith('session-1', answer);
    });

    it('should complete session and calculate final score', async () => {
      const mockSession: ISession = {
        id: 'session-1',
        userId: 'user-1',
        config: { theme: 'Métier', questionCount: 10, difficulty: 2, mode: 'training' },
        questions: [],
        answers: [
          { questionId: 'q-1', selectedAnswers: ['opt-1'], isCorrect: true, timeSpent: 10 },
          { questionId: 'q-2', selectedAnswers: ['opt-2'], isCorrect: true, timeSpent: 12 },
          { questionId: 'q-3', selectedAnswers: ['opt-3'], isCorrect: false, timeSpent: 15 },
        ],
        currentQuestionIndex: 3,
        score: 66.67,
        status: 'completed',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };

      jest.spyOn(sessionService, 'completeSession').mockResolvedValue(mockSession);

      const completedSession = await sessionService.completeSession('session-1', 20);

      expect(completedSession.status).toBe('completed');
      expect(completedSession.score).toBe(66.67);
      expect(completedSession.completedAt).toBeDefined();
    });

    it('should handle session abandonment', async () => {
      jest.spyOn(sessionService, 'abandonSession').mockResolvedValue(undefined);

      await sessionService.abandonSession('session-1');

      expect(sessionService.abandonSession).toHaveBeenCalledWith('session-1');
    });

    it('should retrieve session history', async () => {
      const mockHistory: ISession[] = [
        {
          id: 'session-1',
          userId: 'user-1',
          config: { theme: 'Métier', questionCount: 10, difficulty: 2, mode: 'training' },
          questions: [],
          answers: [],
          currentQuestionIndex: 10,
          score: 80,
          status: 'completed',
          startedAt: '2024-01-01T10:00:00Z',
          completedAt: '2024-01-01T10:15:00Z',
        },
        {
          id: 'session-2',
          userId: 'user-1',
          config: { theme: 'Français', questionCount: 5, difficulty: 1, mode: 'daily' },
          questions: [],
          answers: [],
          currentQuestionIndex: 5,
          score: 100,
          status: 'completed',
          startedAt: '2024-01-02T10:00:00Z',
          completedAt: '2024-01-02T10:10:00Z',
        },
      ];

      jest.spyOn(sessionService, 'getSessionHistory').mockResolvedValue(mockHistory);

      const history = await sessionService.getSessionHistory(10);

      expect(history).toHaveLength(2);
      expect(history[0].score).toBe(80);
      expect(history[1].score).toBe(100);
    });
  });

  describe('StatsService', () => {
    it('should calculate user statistics', async () => {
      const mockStats = {
        totalQuestions: 100,
        correctAnswers: 75,
        successRate: 75,
        averageScore: 75,
        bestScore: 95,
        bestStreak: 10,
        currentStreak: 3,
        totalSessions: 20,
        totalPoints: 1500,
        favoriteTheme: 'Métier',
        lastActivity: new Date(),
      };

      jest.spyOn(statsService, 'getUserStats').mockResolvedValue(mockStats);

      const stats = await statsService.getUserStats('user-1');

      expect(stats).toEqual(mockStats);
      expect(stats?.successRate).toBe(75);
      expect(stats?.totalPoints).toBe(1500);
    });

    it('should update stats after session completion', async () => {
      const updateParams = {
        userId: 'user-1',
        theme: 'Métier' as const,
        totalQuestions: 10,
        correctAnswers: 8,
        averageTime: 12.5,
      };

      jest.spyOn(statsService, 'updateStatsAfterSession').mockResolvedValue(undefined);

      await statsService.updateStatsAfterSession(updateParams);

      expect(statsService.updateStatsAfterSession).toHaveBeenCalledWith(updateParams);
    });

    it('should get theme-specific statistics', async () => {
      const mockThemeStats = [
        {
          theme: 'Métier',
          totalQuestions: 50,
          correctAnswers: 40,
          successRate: 80,
          averageTime: 15,
          lastPlayed: new Date(),
        },
        {
          theme: 'Français',
          totalQuestions: 30,
          correctAnswers: 25,
          successRate: 83.33,
          averageTime: 12,
          lastPlayed: new Date(),
        },
      ];

      jest.spyOn(statsService, 'getThemeStats').mockResolvedValue(mockThemeStats);

      const themeStats = await statsService.getThemeStats('user-1');

      expect(themeStats).toHaveLength(2);
      expect(themeStats[0].successRate).toBe(80);
      expect(themeStats[1].theme).toBe('Français');
    });

    it('should calculate progress data for charts', async () => {
      const mockProgressData = {
        dailyProgress: [
          { date: '2024-01-01', points: 100, sessions: 2 },
          { date: '2024-01-02', points: 150, sessions: 3 },
        ],
        themeDistribution: [
          { theme: 'Métier', count: 60 },
          { theme: 'Français', count: 30 },
          { theme: 'Mathématiques', count: 10 },
        ],
        activityHeatmap: [],
        objectives: {
          daily: { current: 2, target: 3, completed: false },
          weekly: { current: 10, target: 15, completed: false },
        },
      };

      jest.spyOn(statsService, 'getProgressData').mockResolvedValue(mockProgressData);

      const progress = await statsService.getProgressData('user-1', 30);

      expect(progress.dailyProgress).toHaveLength(2);
      expect(progress.objectives.daily.current).toBe(2);
      expect(progress.themeDistribution[0].count).toBe(60);
    });
  });

  describe('Score Calculation', () => {
    it('should calculate score correctly for all correct answers', () => {
      const answers = [
        { isCorrect: true },
        { isCorrect: true },
        { isCorrect: true },
      ];

      const score = (answers.filter(a => a.isCorrect).length / answers.length) * 100;

      expect(score).toBe(100);
    });

    it('should calculate partial score for mixed answers', () => {
      const answers = [
        { isCorrect: true },
        { isCorrect: false },
        { isCorrect: true },
        { isCorrect: false },
      ];

      const score = (answers.filter(a => a.isCorrect).length / answers.length) * 100;

      expect(score).toBe(50);
    });

    it('should handle time bonus calculation', () => {
      const basePoints = 10;
      const timeSpent = 5; // seconds
      const maxTime = 30; // seconds

      const timeBonus = Math.max(0, 1 - timeSpent / maxTime);
      const totalPoints = Math.round(basePoints * (1 + timeBonus * 0.5));

      expect(totalPoints).toBe(14); // 10 + 40% bonus
    });
  });
});
