// Types partagés pour l'entraînement

export interface ISubTheme {
  id: string;
  name: string;
  selected: boolean;
  questionCount: number;
}

export interface ITheme {
  id: string;
  name: string;
  icon: string;
  color: string;
  selected: boolean;
  subThemes: ISubTheme[];
}

export interface IScoring {
  correct: number;
  incorrect: number;
  skipped: number;
  partial: number;
}

export type QuestionTypeFilter = 'all' | 'single' | 'multiple';

export interface ISessionConfig {
  themes: ITheme[];
  questionCount: number;
  timerEnabled: boolean;
  timerDuration: number | null;
  scoring: IScoring;
  questionTypeFilter?: QuestionTypeFilter;
}

export interface ISessionAnswer {
  questionId: string;
  selectedAnswers: string[];
  timeSpent: number;
  isCorrect: boolean;
  isPartial?: boolean;
  isSkipped: boolean;
}

